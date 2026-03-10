"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GaleneClient, createGaleneClient } from "@/lib/galene";
import { toast } from "sonner";

export interface RemoteStream {
  id: string;
  stream: MediaStream;
  label?: string;
  username?: string;
  videoMuted?: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  value: string;
  time?: number;
}

export interface Participant {
  id: string;
  username: string;
  permissions: string[];
  kind: string;
}

export interface UseGaleneReturn {
  connected: boolean;
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  error: string | null;
  connecting: boolean;
  chatMessages: ChatMessage[];
  permissions: string[];
  participants: Participant[];
  isScreenSharing: boolean;
  screenShareStream: MediaStream | null;
  connect: (group: string, username: string, password: string) => Promise<void>;
  disconnect: () => void;
  sendChat: (message: string) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  shareScreen: () => Promise<void>;
  stopScreenShare: () => void;
  kickUser: (userId: string) => void;
  audioMuted: boolean;
  videoMuted: boolean;
  // New capabilities
  muteUser: (userId: string) => void;
  raiseHand: () => void;
  lowerHand: () => void;
  raisedHands: Set<string>;
  whiteboardEvents: any[];
  whiteboardActive: boolean;
  sendUserMessage: (kind: string, dest?: string, value?: string) => void;
  ownId: string;
}

export function useGalene(): UseGaleneReturn {
  const clientRef = useRef<GaleneClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] =
    useState<MediaStream | null>(null);
  // Own client ID (used for identifying self in messages)
  const [ownId, setOwnId] = useState<string>("");
  // New state for hand raise and whiteboard events
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  // Initialize whiteboard state from sessionStorage if it exists
  const [whiteboardEvents, setWhiteboardEvents] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("galene-wb-events");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const [whiteboardActive, setWhiteboardActive] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("galene-wb-active") === "true";
    }
    return false;
  });

  // Save whiteboard changes to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(
      "galene-wb-events",
      JSON.stringify(whiteboardEvents),
    );
  }, [whiteboardEvents]);

  useEffect(() => {
    sessionStorage.setItem("galene-wb-active", String(whiteboardActive));
  }, [whiteboardActive]);

  // Refs for callbacks
  const localStreamRef = useRef<MediaStream | null>(null);
  const participantsRef = useRef<Participant[]>([]);
  const permissionsRef = useRef<string[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(
    async (group: string, username: string, password: string) => {
      setConnecting(true);
      setError(null);
      // Reset ownId before new connection
      setOwnId("");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });

        // Restore muted state from sessionStorage instantly
        const savedAudioMuted =
          sessionStorage.getItem("galene-audio-muted") === "true";
        const savedVideoMuted =
          sessionStorage.getItem("galene-video-muted") === "true";

        stream
          .getAudioTracks()
          .forEach((track) => (track.enabled = !savedAudioMuted));
        stream
          .getVideoTracks()
          .forEach((track) => (track.enabled = !savedVideoMuted));

        setAudioMuted(savedAudioMuted);
        setVideoMuted(savedVideoMuted);

        setLocalStream(stream);

        const client = createGaleneClient();
        clientRef.current = client;
        // Store our own client ID for reference (used for mute, hand raise, etc.)
        setOwnId(client.id);
        localStreamRef.current = stream;

        // Connection events
        client.on("connected", (perms: string[]) => {
          setConnected(true);
          setConnecting(false);
          setPermissions(perms || []);
          permissionsRef.current = perms || [];
        });

        client.on("disconnected", (code: number, reason: string) => {
          console.warn(
            `[useGalene] Disconnected. Code: ${code}, Reason: ${reason}`,
          );
          setConnected(false);
          setConnecting(false);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.on("error", (err: any) => {
          console.error("[useGalene] Error:", err);
          setError(err?.message || "Connection error");
          setConnecting(false);
        });

        // Remote streams
        client.on(
          "remoteStream",
          (data: {
            id: string;
            stream: MediaStream;
            label?: string;
            username?: string;
          }) => {
            const hasVideo = data.stream
              .getVideoTracks()
              .some((t) => t.enabled);

            setRemoteStreams((prev) => {
              const existing = prev.findIndex((s) => s.id === data.id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { ...data, videoMuted: !hasVideo };
                return updated;
              }
              return [...prev, { ...data, videoMuted: !hasVideo }];
            });
          },
        );

        client.on("remoteStreamRemoved", (data: { id: string }) => {
          setRemoteStreams((prev) => prev.filter((s) => s.id !== data.id));
        });

        // Listen for stream state changes (e.g. video muted/unmuted)
        client.on("streamState", (id: string, stream: MediaStream) => {
          const hasVideo = stream.getVideoTracks().some((t) => t.enabled);
          setRemoteStreams((prev) => {
            const existing = prev.findIndex((s) => s.id === id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = {
                ...updated[existing],
                videoMuted: !hasVideo,
              };
              return updated;
            }
            return prev;
          });
        });

        // Chat
        client.on("chat", (msg: ChatMessage) => {
          setChatMessages((prev) => [...prev, msg]);
        });

        // Participants — filter out self
        client.on("user", (user: Participant) => {
          // Skip self — Galene sends user events for the current user too
          if (user.id === client.id) return;

          setParticipants((prev) => {
            let next;
            if (user.kind === "delete") {
              next = prev.filter((p) => p.id !== user.id);
            } else {
              const existing = prev.findIndex((p) => p.id === user.id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = user;
                next = updated;
              } else {
                next = [...prev, user];
              }
            }
            participantsRef.current = next;
            return next;
          });
        });

        // Listen for generic user messages (whiteboard, mute, hand raise)
        client.on("usermessage", (msg: any) => {
          const { kind, dest, value } = msg;
          // Remote mute
          if (kind === "remote-mute" && dest === client.id) {
            // Host requested mute of this client
            const ls = localStreamRef.current;
            if (ls) {
              ls.getAudioTracks().forEach((track) => {
                track.enabled = false;
              });
              setAudioMuted(true);
              toast.error("The host has muted your microphone.", {
                icon: "🔇",
              });
            }
          }
          // Hand raise
          if (kind === "hand-raise") {
            const userId = msg.source; // source is the user who raised hand
            setRaisedHands((prev) => {
              const newSet = new Set(prev);
              if (value === "up") {
                newSet.add(userId);
              } else if (value === "down") {
                newSet.delete(userId);
              }
              return newSet;
            });
          }
          // Whiteboard events
          if (kind === "whiteboard") {
            try {
              const data = JSON.parse(value);
              setWhiteboardEvents((prev) => [...prev, data]);
            } catch (e) {
              console.warn("Failed to parse whiteboard event", e);
            }
          }
          if (kind === "whiteboard-toggle") {
            setWhiteboardActive(value === "true");
          }
          // New: Handle requests for full sync (for late joiners / reloads)
          if (kind === "REQUEST_WHITEBOARD_SYNC") {
            // If we are host, send back our full history
            if (permissionsRef.current.includes("op")) {
              setWhiteboardEvents((currentEvents) => {
                const isActive =
                  sessionStorage.getItem("galene-wb-active") === "true";
                sendUserMessage(
                  "WHITEBOARD_SYNC",
                  msg.source,
                  JSON.stringify({
                    events: currentEvents,
                    active: isActive,
                  }),
                );
                return currentEvents;
              });
            }
          }
          // New: Handle receiving full sync history
          if (kind === "WHITEBOARD_SYNC") {
            try {
              const data = JSON.parse(value || "{}");
              if (data.events) {
                setWhiteboardEvents(data.events);
              }
              if (typeof data.active === "boolean") {
                setWhiteboardActive(data.active);
              }
            } catch (e) {
              console.error("Error parsing whiteboard sync:", e);
            }
          }
        });

        // Screen share events
        client.on(
          "screenShareStarted",
          (data: { id: string; stream: MediaStream }) => {
            setIsScreenSharing(true);
            setScreenShareStream(data.stream);
          },
        );

        client.on("screenShareStopped", () => {
          setIsScreenSharing(false);
          setScreenShareStream(null);
        });

        // Connect and publish
        await client.connect(group, username, password);
        await client.publishStream(stream, "camera");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to connect to virtual classroom";
        setError(message);
        setConnecting(false);
        console.error("[useGalene] Connection error:", err);
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    // Clear transient UI states
    setRaisedHands(new Set());
    setWhiteboardEvents([]);
    setWhiteboardActive(false);
    setOwnId("");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setConnected(false);
    setRemoteStreams([]);
    setPermissions([]);
    setParticipants([]);
    setAudioMuted(false);
    setVideoMuted(false);
    setIsScreenSharing(false);
    setScreenShareStream(null);
  }, [localStream]);

  const sendChat = useCallback((message: string) => {
    if (clientRef.current) {
      clientRef.current.sendChat(message);
    }
  }, []);

  // Generic wrapper to send user messages
  const sendUserMessage = useCallback(
    (kind: string, dest: string = "", value: string = "") => {
      if (clientRef.current) {
        clientRef.current.sendUserMessage(kind, dest, value);
      }
    },
    [],
  );

  // Host-only mute user (remote mute)
  const muteUser = useCallback(
    (userId: string) => {
      // Only send if we have op permission (host)
      if (permissions.includes("op")) {
        sendUserMessage("remote-mute", userId);
      }
    },
    [permissions, sendUserMessage],
  );

  // Hand raise actions for current user
  const raiseHand = useCallback(() => {
    sendUserMessage("hand-raise", "", "up");
  }, [sendUserMessage]);

  const lowerHand = useCallback(() => {
    sendUserMessage("hand-raise", "", "down");
  }, [sendUserMessage]);

  const toggleAudio = useCallback(() => {
    const ls = localStreamRef.current;
    if (ls) {
      ls.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setAudioMuted((prev) => {
        const next = !prev;
        sessionStorage.setItem("galene-audio-muted", String(next));
        return next;
      });
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const ls = localStreamRef.current;
    if (ls) {
      ls.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setVideoMuted((prev) => {
        const next = !prev;
        sessionStorage.setItem("galene-video-muted", String(next));
        return next;
      });
    }
  }, []);

  const shareScreen = useCallback(async () => {
    if (clientRef.current) {
      try {
        await clientRef.current.publishScreen();
      } catch (err) {
        if (err instanceof Error && err.name === "NotAllowedError") {
          console.warn("[useGalene] User cancelled screen share picker.");
        } else {
          console.warn("[useGalene] Screen share error:", err);
        }
      }
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopScreenShare();
    }
  }, []);

  const kickUser = useCallback((userId: string) => {
    if (clientRef.current) {
      clientRef.current.userAction("kick", userId);
    }
  }, []);

  return {
    connected,
    localStream,
    remoteStreams,
    error,
    connecting,
    chatMessages,
    permissions,
    participants,
    isScreenSharing,
    screenShareStream,
    connect,
    disconnect,
    sendChat,
    toggleAudio,
    toggleVideo,
    shareScreen,
    stopScreenShare,
    kickUser,
    audioMuted,
    videoMuted,
    // New capabilities
    muteUser,
    raiseHand,
    lowerHand,
    raisedHands,
    whiteboardEvents,
    whiteboardActive,
    sendUserMessage,
    ownId,
  };
}
