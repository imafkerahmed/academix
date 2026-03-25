"use client";

import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";

interface VideoClassroomProps {
  room: string;
  username: string;
}

// Define stable options outside the component to prevent re-renders
const roomOptions = {
  singlePeerConnection: false, 
  expSignalLatency: 200,      
  disconnectOnPageLeave: true,
  adaptiveStream: false,       
  dynacast: false,
};

const roomConnectOptions = {
  autoSubscribe: true,
  peerConnectionTimeout: 60000, 
  websocketTimeout: 60000,       // Increased to match PC timeout
  maxRetries: 10,
  rtcConfig: {
    iceTransportPolicy: 'relay' as RTCIceTransportPolicy,
  }
};

export default function VideoClassroom({ room, username }: VideoClassroomProps) {
  // ... (token fetching remains the same)
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit/token?room=${room}&username=${username}`
        );
        const data = await resp.json();
        if (data.token && isMounted) setToken(data.token);
      } catch {
        if (isMounted) setError("Failed to fetch token");
      }
    })();
    return () => { isMounted = false; };
  }, [room, username]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-400 bg-red-950/20 rounded-[2rem] border border-red-500/20">
        <p className="font-black text-xs uppercase tracking-widest">{error}</p>
      </div>
    );
  }

  if (token === "") {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-indigo-400 animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-black text-xs uppercase tracking-widest">Preparing Secure Session...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={token}
      video={false}
      audio={false}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connectOptions={roomConnectOptions}
      options={roomOptions}
      data-lk-theme="default"
      style={{ height: '100dvh' }}
    >
      <ConnectionMonitor />
      <MyVideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

function ConnectionMonitor() {
  const room = useRoomContext();
  
  useEffect(() => {
    const onReconnecting = () => {};
    const onReconnected = () => {};
    const onSignalConnected = () => {};
    
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    room.on(RoomEvent.SignalConnected, onSignalConnected);
    
    return () => {
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
      room.off(RoomEvent.SignalConnected, onSignalConnected);
    };
  }, [room]);
  
  return null;
}

function MyVideoConference() {
  // ... (rest remains same)
  // useTracks provides a list of tracks that are available in the room
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: true }
  );

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden">
      <div className="flex-1 min-h-0">
        <GridLayout tracks={tracks}>
          <ParticipantTile />
        </GridLayout>
      </div>
      <div className="p-4 bg-gray-900/80 backdrop-blur-xl border-t border-white/5">
        <ControlBar variation="minimal" controls={{ leave: true, screenShare: true }} />
      </div>
    </div>
  );
}
