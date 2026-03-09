/**
 * Galene WebRTC SFU Client
 *
 * Wraps the Galene WebSocket signaling protocol for connecting to
 * Galene groups (rooms) and managing WebRTC media streams.
 *
 * Protocol reference: https://galene.org/protocol.html
 */

const GALENE_URL = process.env.NEXT_PUBLIC_GALENE_URL || "http://localhost:8443";

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

type GaleneEventCallback = (...args: any[]) => void;

export class GaleneClient {
  private ws: WebSocket | null = null;
  private group: string = "";
  private username: string = "";
  private password: string = "";
  private localStream: MediaStream | null = null;
  private upStreams: Map<string, { pc: RTCPeerConnection; id: string }> =
    new Map();
  private downStreams: Map<
    string,
    { pc: RTCPeerConnection; stream: MediaStream; id: string; label?: string; username?: string }
  > = new Map();
  private listeners: Map<string, GaleneEventCallback[]> = new Map();
  private _connected: boolean = false;
  private _permissions: GalenePermission[] = [];

  get connected(): boolean {
    return this._connected;
  }

  get permissions(): GalenePermission[] {
    return this._permissions;
  }

  /**
   * Get the WebSocket URL for a given group
   */
  private getWsUrl(): string {
    const base = GALENE_URL.replace(/^http/, "ws");
    return `${base}/ws`;
  }

  /**
   * Register an event listener
   */
  on(event: string, callback: GaleneEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove an event listener
   */
  off(event: string, callback: GaleneEventCallback): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      this.listeners.set(
        event,
        cbs.filter((cb) => cb !== callback)
      );
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  private emit(event: string, ...args: any[]): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.forEach((cb) => cb(...args));
    }
  }

  /**
   * Connect to a Galene group (room)
   */
  async connect(
    group: string,
    username: string,
    password: string
  ): Promise<void> {
    this.group = group;
    this.username = username;
    this.password = password;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWsUrl();
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          // Send handshake
          this.send({
            type: "handshake",
            version: ["2"],
            id: this.generateId(),
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

        this.ws.onerror = (error: any) => {
          const wsMsg = error?.message || "Check if Galene server is running at " + wsUrl;
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
   * Handle incoming Galene protocol messages
   */
  private handleMessage(
    msg: any,
    connectResolve?: (value: void) => void,
    connectReject?: (reason: any) => void
  ): void {
    switch (msg.type) {
      case "handshake": {
        // Server accepted handshake, now join the group
        this.send({
          type: "join",
          kind: "join",
          group: this.group,
          username: this.username,
          password: this.password,
        });
        break;
      }

      case "joined": {
        this._connected = true;
        this._permissions = msg.permissions || [];
        this.emit("connected", msg.permissions);
        if (connectResolve) connectResolve();
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

      case "ice": {
        this.handleIce(msg);
        break;
      }

      case "close": {
        this.handleStreamClose(msg);
        break;
      }

      case "abort": {
        this._connected = false;
        const error = new Error(msg.value || "Connection aborted by server");
        this.emit("error", error);
        if (connectReject) connectReject(error);
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

      case "chat": {
        this.emit("chat", {
          id: msg.id,
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
        console.log("[Galene] Unhandled message type:", msg.type, msg);
    }
  }

  /**
   * Publish local media to the group
   */
  async publishStream(stream: MediaStream, label?: string): Promise<string> {
    this.localStream = stream;
    const id = this.generateId();
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add all tracks from the local stream
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: "ice",
          id: id,
          candidate: event.candidate,
        });
      }
    };

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer to Galene
    this.send({
      type: "offer",
      id: id,
      kind: "up",
      labels: {
        [id]: label || "video",
      },
      source: id,
      sdp: offer.sdp,
    });

    this.upStreams.set(id, { pc, id });
    this.emit("localStreamPublished", { id, stream });
    return id;
  }

  /**
   * Handle answer from Galene for our published stream
   */
  private async handleAnswer(msg: any): Promise<void> {
    const up = this.upStreams.get(msg.id);
    if (up) {
      await up.pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: msg.sdp })
      );
    }
  }

  /**
   * Handle incoming stream offer from Galene (remote participant)
   */
  private async handleOffer(msg: any): Promise<void> {
    const id = msg.id;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const stream = new MediaStream();

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        stream.addTrack(track);
      });
      // Update downstream entry with tracks
      const down = this.downStreams.get(id);
      if (down) {
        this.emit("remoteStream", {
          id,
          stream: down.stream,
          label: down.label,
          username: msg.username || down.username,
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: "ice",
          id: id,
          candidate: event.candidate,
        });
      }
    };

    this.downStreams.set(id, {
      pc,
      stream,
      id,
      label: msg.labels?.[id] || msg.label,
      username: msg.username,
    });

    await pc.setRemoteDescription(
      new RTCSessionDescription({ type: "offer", sdp: msg.sdp })
    );

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.send({
      type: "answer",
      id: id,
      sdp: answer.sdp,
    });

    this.emit("remoteStream", {
      id,
      stream,
      label: msg.labels?.[id] || msg.label,
      username: msg.username,
    });
  }

  /**
   * Handle ICE candidates from Galene
   */
  private async handleIce(msg: any): Promise<void> {
    const up = this.upStreams.get(msg.id);
    const down = this.downStreams.get(msg.id);
    const pc = up?.pc || down?.pc;

    if (pc && msg.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) {
        console.warn("[Galene] Failed to add ICE candidate:", e);
      }
    }
  }

  /**
   * Handle remote stream closing
   */
  private handleStreamClose(msg: any): void {
    const down = this.downStreams.get(msg.id);
    if (down) {
      down.pc.close();
      this.downStreams.delete(msg.id);
      this.emit("remoteStreamRemoved", { id: msg.id });
    }
  }

  /**
   * Send a chat message to the group
   */
  sendChat(message: string, dest?: string): void {
    this.send({
      type: "chat",
      source: this.username,
      dest: dest || "",
      value: message,
    });
  }

  /**
   * Disconnect from the Galene server
   */
  disconnect(): void {
    // Close all upstream connections
    this.upStreams.forEach(({ pc }) => pc.close());
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
   * Send a message over WebSocket
   */
  private send(msg: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Cleanup resources
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
 * Get the public Galene URL for a given group
 */
export function getGaleneGroupUrl(groupName: string): string {
  return `${GALENE_URL}/group/${groupName}/`;
}

/**
 * Create a new GaleneClient instance
 */
export function createGaleneClient(): GaleneClient {
  return new GaleneClient();
}
