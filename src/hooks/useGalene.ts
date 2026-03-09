"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GaleneClient, createGaleneClient } from "@/lib/galene";

export interface RemoteStream {
  id: string;
  stream: MediaStream;
  label?: string;
  username?: string;
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

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });
        setLocalStream(stream);

        const client = createGaleneClient();
        clientRef.current = client;

        // Connection events
        client.on("connected", (perms: string[]) => {
          setConnected(true);
          setConnecting(false);
          setPermissions(perms || []);
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
            setRemoteStreams((prev) => {
              const existing = prev.findIndex((s) => s.id === data.id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = data;
                return updated;
              }
              return [...prev, data];
            });
          },
        );

        client.on("remoteStreamRemoved", (data: { id: string }) => {
          setRemoteStreams((prev) => prev.filter((s) => s.id !== data.id));
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
            if (user.kind === "delete") {
              return prev.filter((p) => p.id !== user.id);
            }
            const existing = prev.findIndex((p) => p.id === user.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = user;
              return updated;
            }
            return [...prev, user];
          });
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
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
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

  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setAudioMuted((prev) => !prev);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setVideoMuted((prev) => !prev);
    }
  }, [localStream]);

  const shareScreen = useCallback(async () => {
    if (clientRef.current) {
      try {
        await clientRef.current.publishScreen();
      } catch (err) {
        console.error("[useGalene] Screen share error:", err);
        // User cancelled the screen picker, not a real error
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
  };
}
