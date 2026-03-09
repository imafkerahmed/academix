"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import pb from "@/lib/pocketbase";
import { useGalene, RemoteStream } from "@/hooks/useGalene";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Send,
  Users,
  MessageSquare,
  Monitor,
  MonitorOff,
  Shield,
  LogOut,
  X,
  Hand,
  Pencil,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Whiteboard from "@/components/classroom/Whiteboard";

export default function VirtualClassroom() {
  const { classId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const {
    connected,
    localStream,
    remoteStreams,
    error,
    connecting,
    chatMessages,
    permissions,
    participants,
    isScreenSharing,
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
    muteUser,
    raiseHand,
    lowerHand,
    raisedHands,
    whiteboardEvents,
    whiteboardActive,
    sendUserMessage,
  } = useGalene();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classData, setClassData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sidebarMode, setSidebarMode] = useState<
    "chat" | "participants" | null
  >("chat");
  const [chatInput, setChatInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [joinTime, setJoinTime] = useState<Date | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const autoJoinAttempted = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-lower hand after 15 seconds
  useEffect(() => {
    if (handRaised) {
      const timer = setTimeout(() => {
        lowerHand();
        setHandRaised(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [handRaised, lowerHand]);

  // Sync whiteboard state from host
  useEffect(() => {
    if (!isHost) {
      setWhiteboardOpen(whiteboardActive);
    }
  }, [whiteboardActive, isHost]);

  // Fetch class and user data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const user = pb.authStore.model;
        setCurrentUser(user);

        if (classId) {
          const record = await pb
            .collection("classes")
            .getOne(classId as string, {
              expand:
                "course_subject.subject,course_subject.course_intake.course",
            });
          setClassData(record);
        }
      } catch (err) {
        console.error("Failed to fetch class data:", err);
      }
    };

    fetchInitialData();
  }, [classId]);

  // Handle local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    console.log(
      "[VirtualClassroom] Mounted or state changed. Connected:",
      connected,
    );
    return () =>
      console.log("[VirtualClassroom] Unmounted. Connected:", connected);
  }, [connected]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-rejoin on page refresh
  useEffect(() => {
    if (autoJoinAttempted.current || connected || connecting) return;
    if (!classData || !currentUser) return;

    const sessionKey = `galene-session-${classId}`;
    const saved = sessionStorage.getItem(sessionKey);
    if (!saved) return;

    autoJoinAttempted.current = true;

    try {
      const session = JSON.parse(saved);
      setIsHost(session.isHost);
      setAttendanceId(session.attendanceId);
      setJoinTime(session.joinTime ? new Date(session.joinTime) : new Date());

      // Auto-rejoin
      setIsJoining(true);
      connect(session.groupName, session.username, session.password)
        .then(() => {
          setIsJoining(false);
          setLocalError(null);
        })
        .catch(() => {
          // If auto-rejoin fails, clear session so user can manually join
          sessionStorage.removeItem(sessionKey);
          setIsJoining(false);
        });
    } catch {
      sessionStorage.removeItem(sessionKey);
    }
  }, [classData, currentUser, classId, connected, connecting, connect]);

  const handleJoin = async () => {
    if (!classData || !currentUser) {
      setLocalError(
        "Class or user data missing. Please refresh and try again.",
      );
      return;
    }

    setIsJoining(true);

    const groupName = classData.galene_group || "test-classroom";
    let username = currentUser.name || currentUser.username || "Guest";

    const lecturerData = classData.expand?.course_subject?.lecturer;
    const isOwner = Array.isArray(lecturerData)
      ? lecturerData.includes(currentUser.id)
      : lecturerData === currentUser.id;
    const isAdmin =
      currentUser.role === "admin" || currentUser.role === "superuser";

    const hostMode = (isAdmin && requestedRole === "host") || isOwner;
    setIsHost(hostMode);
    const password = hostMode ? "lecturer123" : "student123";

    if (hostMode) {
      username = "lecturer";
    }

    try {
      await connect(groupName, username, password);

      const now = new Date();
      setJoinTime(now);

      const attendance = await pb.collection("attendance").create({
        class: classId,
        user: currentUser.id,
        join_time: now.toISOString(),
        status: "active",
      });
      setAttendanceId(attendance.id);

      // Save session for auto-rejoin on refresh
      const sessionKey = `galene-session-${classId}`;
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({
          groupName,
          username,
          password,
          isHost: hostMode,
          attendanceId: attendance.id,
          joinTime: now.toISOString(),
        }),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      let errorMsg = "Join failed. Please check your connection and try again.";
      if (err?.message) errorMsg += `\n${err.message}`;
      setLocalError(errorMsg);
      setIsJoining(false);
      return;
    }
    setIsJoining(false);
    setLocalError(null);
  };

  const handleLeave = async () => {
    if (attendanceId && joinTime) {
      const leaveTime = new Date();
      const duration = Math.round(
        (leaveTime.getTime() - joinTime.getTime()) / 60000,
      );

      try {
        await pb.collection("attendance").update(attendanceId, {
          leave_time: leaveTime.toISOString(),
          duration: duration,
          status: "completed",
        });
      } catch (err) {
        console.error("Failed to update attendance on leave:", err);
      }
    }
    // Clear saved session so we don't auto-rejoin
    sessionStorage.removeItem(`galene-session-${classId}`);
    disconnect();
    router.back();
  };

  // Update attendance on window close
  useEffect(() => {
    const updateAttendanceOnUnmount = async () => {
      if (attendanceId && joinTime) {
        const leaveTime = new Date();
        const duration = Math.round(
          (leaveTime.getTime() - joinTime.getTime()) / 60000,
        );
        try {
          await pb.collection("attendance").update(attendanceId, {
            leave_time: leaveTime.toISOString(),
            duration: duration,
            status: "completed",
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          /* silent */
        }
      }
    };

    return () => {
      updateAttendanceOnUnmount();
    };
  }, [attendanceId, joinTime]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChat(chatInput);
      setChatInput("");
    }
  };

  // Determine spotlight stream
  // Priority: screen share > lecturer stream > first remote stream
  const lecturerStream = remoteStreams.find(
    (s) => s.username === "lecturer" || s.label === "camera",
  );
  // For the host, skip own screenshare from spotlight (it echoes back from Galene)
  const screenShareRemote = remoteStreams.find(
    (s) => s.label === "screenshare" && !(isHost && isScreenSharing),
  );

  // Filter out the spotlighted stream from the filmstrip
  const spotlightStream = screenShareRemote || lecturerStream;
  const filmstripStreams = remoteStreams.filter(
    (s) => s.id !== spotlightStream?.id,
  );

  const subjectName =
    classData?.expand?.course_subject?.expand?.subject?.[0]?.name ||
    classData?.expand?.course_subject?.expand?.subject?.name;
  const courseName =
    classData?.expand?.course_subject?.expand?.course_intake?.expand?.course
      ?.name;

  if (!classData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center animate-pulse">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold tracking-widest text-xs uppercase opacity-50">
            Initializing Classroom Environment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden font-sans text-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-xl">
              <Monitor size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase leading-none">
                {classData.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-green-500/20 text-green-400 border-none text-[8px] font-black tracking-widest px-1.5 py-0 h-4">
                  LIVE
                </Badge>
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                  {subjectName}
                </span>
                {courseName && (
                  <>
                    <span className="text-[10px] text-gray-500 font-bold">
                      •
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {courseName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10">
              <Users size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black tracking-widest">
                {participants.length + 1}
              </span>
            </div>
            {isHost && (
              <Badge className="bg-amber-500/20 text-amber-400 border-none text-[8px] font-black tracking-widest px-2 py-0.5">
                <Shield size={10} className="mr-1" />
                HOST
              </Badge>
            )}
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 flex flex-col p-4 pt-20 pb-28 overflow-hidden">
          {!connected && !connecting && (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 text-center shadow-2xl">
                <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 ring-8 ring-indigo-500/10">
                  <Video size={36} />
                </div>
                <h2 className="text-xl font-black mb-2 uppercase tracking-tight">
                  Ready to join?
                </h2>
                <p className="text-gray-400 text-sm mb-6 font-medium">
                  Join as{" "}
                  <span className="text-white font-bold">
                    {currentUser?.name || "Attendee"}
                  </span>
                </p>
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full bg-white text-black font-black text-xs tracking-widest py-4 rounded-xl hover:scale-105 transition-all shadow-xl active:scale-95 disabled:opacity-50 uppercase"
                >
                  {isJoining ? "Joining Session..." : "Join Class Now"}
                </button>
              </div>
            </div>
          )}

          {(localError || error) && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 backdrop-blur-md px-5 py-3 rounded-xl flex items-center gap-3">
              <Badge className="bg-red-500 text-white text-[8px]">ERROR</Badge>
              <p className="text-xs font-bold text-red-200">
                {localError || error}
              </p>
            </div>
          )}

          {(connected || connecting) && (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Whiteboard Overlay */}
              {whiteboardOpen && (
                <Whiteboard
                  isHost={isHost}
                  incomingDrawEvents={whiteboardEvents}
                  onDraw={(evt) =>
                    sendUserMessage("whiteboard", "", JSON.stringify(evt))
                  }
                  onClose={() => {
                    setWhiteboardOpen(false);
                    if (isHost) {
                      sendUserMessage("whiteboard-toggle", "", "false");
                    }
                  }}
                />
              )}

              {/* Spotlight Area */}
              <div className="flex-1 min-h-0 relative">
                {spotlightStream ? (
                  <div className="h-full bg-gray-900 rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
                    <SpotlightVideo
                      stream={spotlightStream.stream}
                      label={spotlightStream.label}
                      username={spotlightStream.username}
                    />
                    <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                      {spotlightStream.label === "screenshare" ? (
                        <Monitor size={12} className="text-blue-400" />
                      ) : (
                        <Video size={12} className="text-indigo-400" />
                      )}
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        {spotlightStream.label === "screenshare"
                          ? `${spotlightStream.username || "Screen"} — Presenting`
                          : spotlightStream.username || "Lecturer"}
                      </span>
                    </div>
                  </div>
                ) : isHost ? (
                  // Host spotlight: show own camera in spotlight when no remote streams
                  <div className="h-full bg-gray-900 rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover mirror ${videoMuted ? "hidden" : ""}`}
                    />
                    {videoMuted && (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <UserAvatar size={80} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                      <Video size={12} className="text-indigo-400" />
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        You (Teacher)
                      </span>
                    </div>
                    {isScreenSharing && (
                      <div className="absolute top-4 right-4 z-10 bg-blue-500/20 backdrop-blur-md px-3 py-1 rounded-lg border border-blue-500/30 flex items-center gap-2 animate-pulse">
                        <Monitor size={12} className="text-blue-400" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-blue-300">
                          Presenting
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Student waiting for lecturer
                  <div className="h-full bg-gray-900 rounded-2xl overflow-hidden border border-white/5 shadow-2xl flex items-center justify-center">
                    <div className="text-center opacity-40">
                      <Video size={48} className="text-gray-600 mx-auto mb-3" />
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        Waiting for lecturer...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Filmstrip Row */}
              <div className="h-28 flex gap-2 overflow-x-auto no-scrollbar">
                {/* Own camera tile (for non-host OR for host when spotlight has remote) */}
                {(!isHost || spotlightStream) && (
                  <div className="relative flex-shrink-0 w-40 h-full bg-gray-900 rounded-xl overflow-hidden border border-white/5 group">
                    {isHost && spotlightStream ? (
                      // Host local video in filmstrip when spotlight has remote/screen
                      <LocalVideoTile
                        stream={localStream}
                        videoMuted={videoMuted}
                      />
                    ) : (
                      <LocalVideoTile
                        ref={!isHost ? localVideoRef : undefined}
                        stream={localStream}
                        videoMuted={videoMuted}
                      />
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 bg-black/60 backdrop-blur px-2 py-0.5 rounded-md">
                      <span className="text-[8px] font-black tracking-widest uppercase block truncate">
                        You
                      </span>
                    </div>
                    {audioMuted && (
                      <div className="absolute top-2 right-2 bg-red-500 p-1 rounded-md">
                        <MicOff size={10} />
                      </div>
                    )}
                  </div>
                )}

                {/* Remote filmstrip tiles */}
                {filmstripStreams.map((remote) => (
                  <div
                    key={remote.id}
                    className="relative flex-shrink-0 w-40 h-full bg-gray-900 rounded-xl overflow-hidden border border-white/5"
                  >
                    <RemoteVideo remote={remote} />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 bg-black/60 backdrop-blur px-2 py-0.5 rounded-md">
                      <span className="text-[8px] font-black tracking-widest uppercase block truncate">
                        {remote.label === "screenshare"
                          ? `${remote.username || "Screen"}`
                          : remote.username || "Participant"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-black/40 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-xl transition-all active:scale-90 ${audioMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
            >
              {audioMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-xl transition-all active:scale-90 ${videoMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
            >
              {videoMuted ? <VideoOff size={20} /> : <Video size={20} />}
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Screen Share (host only) */}
            {isHost && (
              <button
                onClick={isScreenSharing ? stopScreenShare : shareScreen}
                className={`p-4 rounded-xl transition-all active:scale-90 ${isScreenSharing ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? (
                  <MonitorOff size={20} />
                ) : (
                  <Monitor size={20} />
                )}
              </button>
            )}

            {/* Whiteboard toggle (Host only) */}
            {isHost && (
              <button
                onClick={() => {
                  const newState = !whiteboardOpen;
                  setWhiteboardOpen(newState);
                  sendUserMessage("whiteboard-toggle", "", String(newState));
                }}
                className={`p-4 rounded-xl transition-all active:scale-90 ${whiteboardOpen ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
                title={whiteboardOpen ? "Close whiteboard" : "Open whiteboard"}
              >
                <Pencil size={20} />
              </button>
            )}

            {/* Hand Raise (non-host) */}
            {!isHost && (
              <button
                onClick={() => {
                  if (handRaised) {
                    lowerHand();
                    setHandRaised(false);
                  } else {
                    raiseHand();
                    setHandRaised(true);
                  }
                }}
                className={`p-4 rounded-xl transition-all active:scale-90 ${handRaised ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 animate-pulse" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
                title={handRaised ? "Lower hand" : "Raise hand"}
              >
                <Hand size={20} />
              </button>
            )}

            <button
              onClick={() =>
                setSidebarMode(sidebarMode === "chat" ? null : "chat")
              }
              className={`p-4 rounded-xl transition-all active:scale-90 ${sidebarMode === "chat" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
            >
              <MessageSquare size={20} />
            </button>

            <button
              onClick={() =>
                setSidebarMode(
                  sidebarMode === "participants" ? null : "participants",
                )
              }
              className={`p-4 rounded-xl transition-all active:scale-90 ${sidebarMode === "participants" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
            >
              <Users size={20} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button
              onClick={handleLeave}
              className="p-4 rounded-xl bg-red-600 text-white shadow-xl shadow-red-500/30 hover:bg-red-700 transition-all active:scale-90"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarMode && (
        <div className="w-80 bg-gray-900/50 backdrop-blur-3xl border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
          {sidebarMode === "chat" ? (
            /* Chat Panel */
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-indigo-400" />
                  <h2 className="text-xs font-black tracking-widest uppercase">
                    Class Chat
                  </h2>
                </div>
                <button
                  onClick={() => setSidebarMode(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {chatMessages.map((msg, i) => {
                  const displayUsername = isHost
                    ? "lecturer"
                    : currentUser?.name || currentUser?.username || "Guest";
                  const isMyMessage = msg.username === displayUsername;

                  return (
                    <div
                      key={i}
                      className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                          {msg.username}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-xl max-w-[85%] text-sm font-medium leading-relaxed ${
                          isMyMessage
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10"
                            : "bg-white/5 text-gray-200 rounded-tl-none ring-1 ring-white/5"
                        }`}
                      >
                        {msg.value}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-black/20 backdrop-blur-2xl border-t border-white/5"
              >
                <div className="relative">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/50 transition-all placeholder:text-gray-600"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Participants Panel */
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" />
                  <h2 className="text-xs font-black tracking-widest uppercase">
                    Participants ({participants.length + 1})
                  </h2>
                </div>
                <button
                  onClick={() => setSidebarMode(null)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
                {/* Self */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                      {(currentUser?.name || "Y")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">
                        {currentUser?.name || currentUser?.username} (You)
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                        {isHost ? "Host" : "Student"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other participants */}
                {participants.map((p) => {
                  const isParticipantHost =
                    p.permissions?.includes("op") || p.username === "lecturer";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isParticipantHost ? "bg-amber-500" : "bg-gray-700"}`}
                        >
                          {(p.username || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none">
                            {p.username}
                          </p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                            {isParticipantHost ? "Host" : "Student"}
                          </p>
                        </div>
                      </div>

                      {/* Hand raise badge */}
                      {raisedHands.has(p.id) && (
                        <span
                          className="text-yellow-400 animate-bounce"
                          title="Hand raised"
                        >
                          <Hand size={16} />
                        </span>
                      )}

                      {/* Host controls */}
                      {isHost && !isParticipantHost && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => muteUser(p.id)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            title="Mute participant"
                          >
                            <VolumeX size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Kick ${p.username} from the class?`,
                                )
                              ) {
                                kickUser(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Kick participant"
                          >
                            <LogOut size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function SpotlightVideo({
  stream,
  label,
}: {
  stream: MediaStream;
  label?: string;
  username?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className={`w-full h-full object-contain bg-black ${label !== "screenshare" ? "mirror" : ""}`}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LocalVideoTile = ({ stream, videoMuted, ref }: any) => {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = ref || internalRef;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover mirror ${videoMuted ? "hidden" : ""}`}
      />
      {videoMuted && (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <UserAvatar size={32} />
        </div>
      )}
    </>
  );
};

function RemoteVideo({ remote }: { remote: RemoteStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && remote.stream) {
      videoRef.current.srcObject = remote.stream;
    }
  }, [remote.stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className={`w-full h-full object-cover ${remote.label === "screenshare" ? "" : ""}`}
    />
  );
}

function UserAvatar({ size = 48 }: { size?: number }) {
  return (
    <div
      className="bg-gray-800 rounded-full flex items-center justify-center border border-white/5"
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-600"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}
