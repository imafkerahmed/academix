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

export interface UseGaleneReturn {
  /** Whether we are currently connected to the Galene group */
  connected: boolean;
  /** The local media stream (camera + mic) */
  localStream: MediaStream | null;
  /** Map of remote participant streams */
  remoteStreams: RemoteStream[];
  /** Connection/stream error */
  error: string | null;
  /** Whether we are currently connecting */
  connecting: boolean;
  /** Chat messages received */
  chatMessages: ChatMessage[];
  /** User's permissions in the group */
  permissions: string[];
  /** Connect to a Galene group and start publishing media */
  connect: (
    group: string,
    username: string,
    password: string
  ) => Promise<void>;
  /** Disconnect from the group */
  disconnect: () => void;
  /** Send a chat message */
  sendChat: (message: string) => void;
  /** Toggle audio mute */
  toggleAudio: () => void;
  /** Toggle video mute */
  toggleVideo: () => void;
  /** Whether audio is muted */
  audioMuted: boolean;
  /** Whether video is muted */
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
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

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
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });
        setLocalStream(stream);

        // Create client
        const client = createGaleneClient();
        clientRef.current = client;

        // Set up event handlers
        client.on("connected", (perms: string[]) => {
          setConnected(true);
          setConnecting(false);
          setPermissions(perms || []);
        });

        client.on("disconnected", () => {
          setConnected(false);
          setConnecting(false);
        });

        client.on("error", (err: any) => {
          setError(err?.message || "Connection error");
          setConnecting(false);
        });

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
          }
        );

        client.on("remoteStreamRemoved", (data: { id: string }) => {
          setRemoteStreams((prev) => prev.filter((s) => s.id !== data.id));
        });

        client.on("chat", (msg: ChatMessage) => {
          setChatMessages((prev) => [...prev, msg]);
        });

        // Connect to Galene
        await client.connect(group, username, password);

        // Publish local stream once connected
        await client.publishStream(stream, "camera");
      } catch (err: any) {
        let message = err?.message || "Failed to connect to virtual classroom";
        if (err?.response?.data?.message) {
          message += ": " + err.response.data.message;
        }
        setError(message);
        setConnecting(false);
        console.error("[useGalene] Connection error:", err, message);
      }
    },
    []
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
    setAudioMuted(false);
    setVideoMuted(false);
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

  return {
    connected,
    localStream,
    remoteStreams,
    error,
    connecting,
    chatMessages,
    permissions,
    connect,
    disconnect,
    sendChat,
    toggleAudio,
    toggleVideo,
    audioMuted,
    videoMuted,
  };
}
