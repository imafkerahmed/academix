/**
 * Galene WebRTC SFU Client
 *
 * Implements the Galene WebSocket signaling protocol for connecting to
 * Galene groups (rooms) and managing WebRTC media streams.
 *
 * Based on the official Galene protocol.js reference client:
 * https://github.com/jech/galene/blob/master/static/protocol.js
 */

const GALENE_URL =
  process.env.NEXT_PUBLIC_GALENE_URL || "http://localhost:8443";

export type GalenePermission = "op" | "present" | "observe";

export interface GaleneUser {
  id: string;
  username: string;
  permissions: GalenePermission[];
}

export interface GaleneStream {
  id: string;
  pc: RTCPeerConnection;
  stream: MediaStream;
  label?: string;
  userId?: string;
  username?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GaleneEventCallback = (...args: any[]) => void;

/**
 * Generate a 32-hex-digit random ID (16 bytes), matching official Galene client.
 */
function newRandomId(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class GaleneClient {
  private ws: WebSocket | null = null;
  private group: string = "";
  private username: string = "";
  private password: string = "";
  /** The connection ID sent in the handshake */
  private connectionId: string = "";
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  /** The stream ID of the active screen share upstream */
  private _screenShareStreamId: string | null = null;

  private upStreams: Map<
    string,
    {
      pc: RTCPeerConnection;
      id: string;
      localDescriptionSent: boolean;
      localIceCandidates: RTCIceCandidate[];
    }
  > = new Map();

  private downStreams: Map<
    string,
    {
      pc: RTCPeerConnection;
      stream: MediaStream;
      id: string;
      label?: string;
      username?: string;
      remoteIceCandidates: RTCIceCandidate[];
    }
  > = new Map();

  private listeners: Map<string, GaleneEventCallback[]> = new Map();
  private _connected: boolean = false;
  private _permissions: GalenePermission[] = [];
  private rtcConfiguration: RTCConfiguration | null = null;

  get connected(): boolean {
    return this._connected;
  }

  get permissions(): GalenePermission[] {
    return this._permissions;
  }

  get screenShareStreamId(): string | null {
    return this._screenShareStreamId;
  }

  get id(): string {
    return this.connectionId;
  }

  private getWsUrl(): string {
    let url = process.env.NEXT_PUBLIC_GALENE_URL || "http://localhost:8443";
    
    // Auto-detection logic for production/custom domains
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      // If we are on a production domain but the baked-in URL is localhost, 
      // we need to dynamically target the classroom subdomain.
      if (hostname.endsWith(".codix.site") && !url.includes("academix-classroom.codix.site")) {
        url = `https://academix-classroom.codix.site`;

      }
    }



    // If it's already a WebSocket URL, just ensure the /ws path
    if (url.startsWith("ws://") || url.startsWith("wss://")) {
      return url.endsWith("/ws") ? url : `${url.replace(/\/$/, "")}/ws`;
    }

    const base = url.replace(/^http(s)?:\/\//, (match) => {
      return match.startsWith("https") ? "wss://" : "ws://";
    });
    
    const wsUrl = base.endsWith("/ws") ? base : `${base.replace(/\/$/, "")}/ws`;

    return wsUrl;
  }

  on(event: string, callback: GaleneEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: GaleneEventCallback): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      this.listeners.set(
        event,
        cbs.filter((cb) => cb !== callback),
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit(event: string, ...args: any[]): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.forEach((cb) => cb(...args));
    }
  }

  /**
   * Get the RTC configuration, using server-provided config if available.
   */
  private getRTCConfiguration(): RTCConfiguration {
    return (
      this.rtcConfiguration || {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      }
    );
  }

  /**
   * Connect to a Galene group (room).
   */
  async connect(
    group: string,
    username: string,
    password: string,
  ): Promise<void> {
    this.group = group;
    this.username = username;
    this.password = password;
    this.connectionId = newRandomId();

    return new Promise(async (resolve, reject) => {
      try {
        const wsUrl = this.getWsUrl();
        const httpUrl = wsUrl.replace("wss://", "https://").replace("ws://", "http://").replace("/ws", "");


        
        // Quick reachability test to see if the server is even there
        try {
          await fetch(httpUrl, { method: "HEAD", mode: "no-cors" });

        } catch (e) {
          console.warn("[Galene] Server reachability check failed (pre-connection):", e);
        }


        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {

          // Send handshake with protocol version 2 and our connection ID
          this.send({
            type: "handshake",
            version: ["2"],
            id: this.connectionId,
          });
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            this.handleMessage(msg, resolve, reject);
          } catch (e) {
            console.error("[Galene] Failed to parse message:", e);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.ws.onerror = (error: any) => {
          const wsMsg =
            error?.message || 
            `Failed to connect to Galene at ${wsUrl}. \n` +
            `Troubleshooting:\n` +
            `1. Ensure the server is running and accessible at ${this.getWsUrl().replace("wss://", "https://").replace("ws://", "http://").replace("/ws", "")}\n` +
            `2. Check if GALENE_ALLOWED_ORIGINS on your server includes ${typeof window !== "undefined" ? window.location.origin : "your app origin"}\n` +
            `3. Ensure your reverse proxy (Cloudflare) allows WebSocket connections.`;
          
          console.error("[Galene] WebSocket error:", error, wsMsg);
          this.emit("error", new Error(wsMsg));
          reject(new Error(wsMsg));
        };

        this.ws.onclose = (event) => {
          this._connected = false;
          this.emit("disconnected", event.code, event.reason);
          this.cleanup();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming Galene protocol messages.
   */
  private handleMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msg: any,
    connectResolve?: (value: void) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectReject?: (reason: any) => void,
  ): void {
    switch (msg.type) {
      case "handshake": {
        if (Array.isArray(msg.version) && msg.version.includes("2")) {
          // Version 2 confirmed, now join the group
          this.send({
            type: "join",
            kind: "join",
            group: this.group,
            username: this.username,
            password: this.password,
          });
        } else {
          const err = new Error(`Unknown protocol version: ${msg.version}`);
          this.emit("error", err);
          if (connectReject) connectReject(err);
        }
        break;
      }

      case "joined": {
        if (msg.kind === "join") {
          this._connected = true;
          this._permissions = msg.permissions || [];
          this.rtcConfiguration = msg.rtcConfiguration || null;
          this.emit("connected", msg.permissions);

          // Request to receive audio and video from all participants
          this.send({
            type: "request",
            request: { "": ["audio", "video"] },
          });

          if (connectResolve) connectResolve();
        } else if (msg.kind === "leave" || msg.kind === "fail") {
          this._connected = false;
          this._permissions = [];
          const err = new Error(msg.value || msg.error || "Join failed");
          this.emit("error", err);
          if (connectReject) connectReject(err);
        }
        break;
      }

      case "answer": {
        this.handleAnswer(msg);
        break;
      }

      case "offer": {
        this.handleOffer(msg);
        break;
      }

      case "renegotiate": {
        this.handleRenegotiate(msg);
        break;
      }

      case "ice": {
        this.handleIce(msg);
        break;
      }

      case "close": {
        this.handleStreamClose(msg);
        break;
      }

      case "abort": {
        const abortUp = this.upStreams.get(msg.id);
        if (abortUp) {
          abortUp.pc.close();
          this.upStreams.delete(msg.id);
        }
        if (!abortUp) {
          // Connection-level abort
          this._connected = false;
          const error = new Error(msg.value || "Connection aborted by server");
          this.emit("error", error);
          if (connectReject) connectReject(error);
        }
        break;
      }

      case "user": {
        this.emit("user", {
          id: msg.id,
          username: msg.username,
          permissions: msg.permissions,
          kind: msg.kind,
        });
        break;
      }

      case "chat":
      case "chathistory": {
        this.emit("chat", {
          id: msg.id || msg.source,
          username: msg.username,
          dest: msg.dest,
          value: msg.value,
          time: msg.time,
        });
        break;
      }

      case "usermessage": {
        this.emit("usermessage", msg);
        break;
      }

      case "ping": {
        this.send({ type: "pong" });
        break;
      }

      default:
        console.warn("[Galene] Unhandled message type:", msg.type, msg);
    }
  }

  /**
   * Publish local media to the group.
   * Matches the official newUpStream() + negotiate() flow.
   */
  async publishStream(stream: MediaStream, label?: string): Promise<string> {
    this.localStream = stream;
    const id = newRandomId();

    const pc = new RTCPeerConnection(this.getRTCConfiguration());

    const upEntry = {
      pc,
      id,
      localDescriptionSent: false,
      localIceCandidates: [] as RTCIceCandidate[],
    };
    this.upStreams.set(id, upEntry);

    // Buffer ICE candidates until local description is sent
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      if (upEntry.localDescriptionSent) {
        this.send({
          type: "ice",
          id: id,
          candidate: event.candidate,
        });
      } else {
        upEntry.localIceCandidates.push(event.candidate);
      }
    };

    // Add all tracks from the local stream
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.send({
      type: "offer",
      source: this.connectionId,
      username: this.username,
      kind: "",
      id: id,
      label: label || "video",
      sdp: pc.localDescription!.sdp,
    });

    // Mark local description as sent and flush buffered ICE candidates
    upEntry.localDescriptionSent = true;
    for (const candidate of upEntry.localIceCandidates) {
      this.send({
        type: "ice",
        id: id,
        candidate: candidate,
      });
    }
    upEntry.localIceCandidates = [];

    this.emit("localStreamPublished", { id, stream });
    return id;
  }

  /**
   * Handle answer from Galene for our published (upstream) stream.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleAnswer(msg: any): Promise<void> {
    const up = this.upStreams.get(msg.id);
    if (!up) {
      console.warn("[Galene] Got answer for unknown upstream:", msg.id);
      return;
    }
    try {
      await up.pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: msg.sdp }),
      );
    } catch (e) {
      console.error("[Galene] Failed to set remote description:", e);
      up.pc.close();
      this.upStreams.delete(msg.id);
    }
  }

  /**
   * Handle incoming stream offer from Galene (downstream / remote participant).
   * Matches the official gotOffer() flow.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleOffer(msg: any): Promise<void> {
    const id = msg.id;

    // If we already have this upstream, it's a conflict
    if (this.upStreams.has(id)) {
      console.error("[Galene] Duplicate connection id in offer");
      this.send({ type: "abort", id: id });
      return;
    }

    // Handle stream replacement
    if (msg.replace) {
      const old = this.downStreams.get(msg.replace);
      if (old) {
        old.pc.close();
        this.downStreams.delete(msg.replace);
        this.emit("remoteStreamRemoved", { id: msg.replace });
      }
    }

    const pc = new RTCPeerConnection(this.getRTCConfiguration());
    const stream = new MediaStream();

    const downEntry = {
      pc,
      stream,
      id,
      label: msg.label,
      username: msg.username,
      remoteIceCandidates: [] as RTCIceCandidate[],
    };
    this.downStreams.set(id, downEntry);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: "ice",
          id: id,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        // Request renegotiation
        this.send({ type: "renegotiate", id: id });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams.length > 0) {
        downEntry.stream = event.streams[0];
      } else {
        if (event.track) downEntry.stream.addTrack(event.track);
      }
      this.emit("remoteStream", {
        id,
        stream: downEntry.stream,
        label: downEntry.label,
        username: msg.username || downEntry.username,
      });
    };

    try {
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp: msg.sdp }),
      );

      // Flush any buffered remote ICE candidates
      for (const candidate of downEntry.remoteIceCandidates) {
        await pc.addIceCandidate(candidate).catch(console.warn);
      }
      downEntry.remoteIceCandidates = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.send({
        type: "answer",
        id: id,
        sdp: pc.localDescription!.sdp,
      });
    } catch (e) {
      console.error("[Galene] Failed to handle downstream offer:", e);
      pc.close();
      this.downStreams.delete(id);
    }
  }

  /**
   * Handle renegotiation request from the server for an upstream.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleRenegotiate(msg: any): Promise<void> {
    const up = this.upStreams.get(msg.id);
    if (!up) {
      console.warn("[Galene] Renegotiate for unknown upstream:", msg.id);
      return;
    }

    try {
      const offer = await up.pc.createOffer({ iceRestart: true });
      await up.pc.setLocalDescription(offer);

      this.send({
        type: "offer",
        source: this.connectionId,
        username: this.username,
        kind: "renegotiate",
        id: msg.id,
        sdp: up.pc.localDescription!.sdp,
      });

      up.localDescriptionSent = true;
      for (const candidate of up.localIceCandidates) {
        this.send({
          type: "ice",
          id: msg.id,
          candidate: candidate,
        });
      }
      up.localIceCandidates = [];
    } catch (e) {
      console.error("[Galene] Renegotiation failed:", e);
    }
  }

  /**
   * Handle ICE candidates from Galene.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleIce(msg: any): Promise<void> {
    const up = this.upStreams.get(msg.id);
    const down = this.downStreams.get(msg.id);

    if (up && msg.candidate) {
      try {
        if (up.pc.remoteDescription) {
          await up.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
        // No buffering needed for upstream remote ICE — we already
        // have remote description set from the answer.
      } catch (e) {
        console.warn("[Galene] Failed to add ICE candidate:", e);
      }
    } else if (down && msg.candidate) {
      try {
        if (down.pc.remoteDescription) {
          await down.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else {
          down.remoteIceCandidates.push(new RTCIceCandidate(msg.candidate));
        }
      } catch (e) {
        console.warn("[Galene] Failed to add ICE candidate:", e);
      }
    }
  }

  /**
   * Handle remote stream closing.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleStreamClose(msg: any): void {
    const down = this.downStreams.get(msg.id);
    if (down) {
      down.pc.close();
      this.downStreams.delete(msg.id);
      this.emit("remoteStreamRemoved", { id: msg.id });
    }
  }

  /**
   * Publish screen share to the group.
   * Uses getDisplayMedia to capture the screen.
   */
  async publishScreen(): Promise<string> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    this.screenStream = stream;

    const id = newRandomId();
    const pc = new RTCPeerConnection(this.getRTCConfiguration());

    const upEntry = {
      pc,
      id,
      localDescriptionSent: false,
      localIceCandidates: [] as RTCIceCandidate[],
    };
    this.upStreams.set(id, upEntry);
    this._screenShareStreamId = id;

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      if (upEntry.localDescriptionSent) {
        this.send({ type: "ice", id, candidate: event.candidate });
      } else {
        upEntry.localIceCandidates.push(event.candidate);
      }
    };

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
      // Auto-stop when user clicks browser's "Stop sharing" button
      track.onended = () => {
        this.stopScreenShare();
      };
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.send({
      type: "offer",
      source: this.connectionId,
      username: this.username,
      kind: "",
      id,
      label: "screenshare",
      sdp: pc.localDescription!.sdp,
    });

    upEntry.localDescriptionSent = true;
    for (const candidate of upEntry.localIceCandidates) {
      this.send({ type: "ice", id, candidate });
    }
    upEntry.localIceCandidates = [];

    this.emit("screenShareStarted", { id, stream });
    return id;
  }

  /**
   * Stop screen sharing.
   */
  stopScreenShare(): void {
    if (this._screenShareStreamId) {
      const up = this.upStreams.get(this._screenShareStreamId);
      if (up) {
        try {
          this.send({ type: "close", id: this._screenShareStreamId });
        } catch {
          // ignore
        }
        up.pc.close();
        this.upStreams.delete(this._screenShareStreamId);
      }
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    this._screenShareStreamId = null;
    this.emit("screenShareStopped");
  }

  /**
   * Perform a user action (op, unop, kick, present, unpresent).
   * Only works if the user has "op" permission.
   */
  userAction(kind: string, dest: string, value?: string): void {
    this.send({
      type: "useraction",
      source: this.connectionId,
      dest,
      username: this.username,
      kind,
      value: value || "",
    });
  }

  /**
   * Send a generic user message (for whiteboard, remote mute, hand raise, etc.).
   */
  sendUserMessage(kind: string, dest: string = "", value: string = ""): void {
    this.send({
      type: "usermessage",
      source: this.connectionId,
      dest,
      username: this.username,
      kind,
      value,
    });
  }

  /**
   * Send a chat message to the group.
   */
  sendChat(message: string, dest?: string): void {
    this.send({
      type: "chat",
      source: this.connectionId,
      username: this.username,
      dest: dest || "",
      value: message,
    });
  }

  /**
   * Disconnect from the Galene server.
   */
  disconnect(): void {
    // Close all upstream connections
    this.upStreams.forEach(({ pc, id }) => {
      try {
        this.send({ type: "close", id });
      } catch {
        // ignore
      }
      pc.close();
    });
    this.upStreams.clear();

    // Close all downstream connections
    this.downStreams.forEach(({ pc }) => pc.close());
    this.downStreams.clear();

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this._connected = false;
    this.emit("disconnected", 1000, "User disconnected");
  }

  /**
   * Send a message over WebSocket.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private send(msg: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Cleanup resources on disconnect.
   */
  private cleanup(): void {
    this.upStreams.forEach(({ pc }) => pc.close());
    this.upStreams.clear();
    this.downStreams.forEach(({ pc }) => pc.close());
    this.downStreams.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }
}

/**
 * Get the public Galene URL for a given group.
 */
export function getGaleneGroupUrl(groupName: string): string {
  return `${GALENE_URL}/group/${groupName}/`;
}

/**
 * Create a new GaleneClient instance.
 */
export function createGaleneClient(): GaleneClient {
  return new GaleneClient();
}
