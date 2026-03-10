"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";
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
  Crown,
  Pencil,
  VolumeX,
  Paperclip,
  FileIcon,
  Download,
  ExternalLink,
  ChevronRight,
  Lock,
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
    disableUserVideo,
    makeHost,
    removeHost,
    raiseHand,
    lowerHand,
    raisedHands,
    whiteboardEvents,
    whiteboardActive,
    sendUserMessage,
    ownId,
    inClassNotification,
    clearNotification,
  } = useGalene();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classData, setClassData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [sidebarMode, setSidebarMode] = useState<
    "chat" | "participants" | null
  >(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("galene-sidebar-mode");
      if (saved) return saved as any;
    }
    return "chat";
  });

  useEffect(() => {
    if (sidebarMode) {
      sessionStorage.setItem("galene-sidebar-mode", sidebarMode);
    } else {
      sessionStorage.removeItem("galene-sidebar-mode");
    }
  }, [sidebarMode]);
  const [chatInput, setChatInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [joinTime, setJoinTime] = useState<Date | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("galene-wb-active") === "true";
    }
    return false;
  });
  const [handRaised, setHandRaised] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const autoJoinAttempted = useRef(false);

  // Custom Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isEndingClass, setIsEndingClass] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Fetch user avatars
        const allUsers = await pb.collection("users").getFullList();
        const avatarMap: Record<string, string> = {};
        allUsers.forEach((u) => {
          if (u.avatar) {
            avatarMap[u.username] = pb.files.getURL(u, u.avatar);
          }
        });
        setUserAvatars(avatarMap);

        if (classId) {
          const record = await pb
            .collection("classes")
            .getOne(classId as string, {
              expand:
                "course_subject.subject,course_subject.course_intake.course,lecturer",
            });
          setClassData(record);

          // If student, fetch enrollments to personalize the title
          if (user?.role === "student") {
            try {
              const token = pb.authStore.token;
              const resp = await fetch("/api/student/enrollments", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (resp.ok) {
                const { enrollments } = await resp.json();
                const intakeIds = enrollments.map((e: any) => e.course_intake);

                const subjectsArr = Array.isArray(record.expand?.course_subject)
                  ? record.expand.course_subject
                  : [record.expand?.course_subject].filter(Boolean);

                const mySubjectRecords = subjectsArr.filter((cs: any) => {
                  const csIntakeId =
                    typeof cs.course_intake === "string"
                      ? cs.course_intake
                      : cs.course_intake?.id;
                  return intakeIds.includes(csIntakeId);
                });

                if (mySubjectRecords.length > 0) {
                  const mySubjectName = Array.from(
                    new Set(
                      mySubjectRecords
                        .map(
                          (cs: any) =>
                            cs.expand?.subject?.[0]?.name ||
                            cs.expand?.subject?.name,
                        )
                        .filter(Boolean),
                    ),
                  ).join(" & ");

                  // Override title for student view only
                  record.personalizedTitle = mySubjectName;
                }
              }
            } catch (error) {
              console.error(
                "Error fetching student enrollments for personalization:",
                error,
              );
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch class data:", err);
      }
    };

    fetchInitialData();
  }, [classId]);

  // Determine host mode
  const lecturerData = classData?.lecturer;
  const isOwner = lecturerData === currentUser?.id;
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "superuser";
  const hostMode = (isAdmin && requestedRole === "host") || isOwner;
  const isOriginalHost = hostMode;
  const isStudentHost = !hostMode && permissions.includes("op");

  // Use a ref to hold mutable state values to prevent rapid re-subscription 404s in PocketBase
  const autoJoinRefs = useRef({ hostMode, connected, connecting });
  useEffect(() => {
    autoJoinRefs.current = { hostMode, connected, connecting };
  }, [hostMode, connected, connecting]);

  // Real-time subscription to class updates (e.g., status changes)
  useEffect(() => {
    if (!classId) return;

    pb.collection("classes").subscribe(classId as string, function (e) {
      setClassData((prev: any) => {
        const refs = autoJoinRefs.current;

        // Auto-join for students if the status changes to in_progress while they are waiting
        if (
          !refs.hostMode &&
          !refs.connected &&
          !refs.connecting &&
          prev?.status !== "in_progress" &&
          e.record.status === "in_progress"
        ) {
          setTimeout(() => {
            const joinBtn = document.getElementById("auto-join-btn");
            if (joinBtn) joinBtn.click();
          }, 500);
        }

        // Auto-eject students if the class ends
        if (
          !refs.hostMode &&
          refs.connected &&
          e.record.status === "completed"
        ) {
          setTimeout(() => {
            const leaveBtn = document.getElementById("auto-leave-btn");
            if (leaveBtn) leaveBtn.click();
          }, 500);
        }

        return {
          ...prev,
          ...e.record,
        };
      });
    });

    return () => {
      pb.collection("classes").unsubscribe(classId as string);
    };
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
    if (connected && !isHost) {
      setTimeout(() => {
        sendUserMessage("REQUEST_WHITEBOARD_SYNC");
      }, 1500);
    }
    return () =>
      console.log("[VirtualClassroom] Unmounted. Connected:", connected);
  }, [connected, isHost, sendUserMessage]);

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

          if (sessionStorage.getItem("galene-is-screensharing") === "true") {
            toast.info(
              "Screen share stopped due to page reload. Click to share again.",
              { duration: 6000 },
            );
            sessionStorage.removeItem("galene-is-screensharing");
          }
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

    setIsHost(hostMode);
    const password = hostMode ? "lecturer123" : "student123";

    if (hostMode) {
      username =
        currentUser.role === "admin" || currentUser.role === "superuser"
          ? "admin"
          : "lecturer";
    }

    try {
      // If host is joining and class isn't in progress, start it FIRST
      // This is crucial for JIT (Just-In-Time) Galene group recreation
      if (hostMode && classData.status !== "in_progress") {
        await fetch("/api/classroom/start-class", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ classId }),
        });
      }

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

    // Revoke host privileges if a student host leaves
    const activeUsername =
      currentUser?.name || currentUser?.username || "Guest";
    if (isStudentHost && activeUsername) {
      try {
        await fetch("/api/classroom/promote-host", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId,
            username: activeUsername,
            demote: true,
          }),
        });
      } catch (err) {
        console.error(
          "Failed to revoke student host privileges on leave:",
          err,
        );
      }
    }

    // Clear saved session so we don't auto-rejoin
    sessionStorage.removeItem(`galene-session-${classId}`);
    disconnect();
    router.back();
  };

  const handleEndClassForEveryone = async () => {
    setIsEndingClass(true);
    try {
      if (hostMode) {
        // Securely bypass PocketBase rules to set status to 'completed'
        await fetch("/api/classroom/end-class", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ classId }),
        });
      }
      handleLeave();
    } catch (err) {
      console.error("Error ending class", err);
      setIsEndingClass(false);
    }
  };

  // Cleanup on unmount/unload
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

    const revokeHostPrivilegesOnUnmount = () => {
      const activeUsername =
        currentUser?.name || currentUser?.username || "Guest";
      if (isStudentHost && activeUsername) {
        const payload = JSON.stringify({
          classId,
          username: activeUsername,
          demote: true,
        });
        navigator.sendBeacon(
          "/api/classroom/promote-host",
          new Blob([payload], { type: "application/json" }),
        );
      }
    };

    const handleBeforeUnload = () => {
      revokeHostPrivilegesOnUnmount();
      updateAttendanceOnUnmount(); // Async may cancel, but we initiate it anyway
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      revokeHostPrivilegesOnUnmount();
      updateAttendanceOnUnmount();
    };
  }, [attendanceId, joinTime, isStudentHost, currentUser, classId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChat(chatInput);
      setChatInput("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/classroom/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Send a custom formatted message so clients know it's a file
        sendChat(
          `[FILE_ATTACHMENT]:${JSON.stringify({ url: data.url, name: data.name, size: data.size })}`,
        );
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Determine the actual lecturer from Pocketbase data
  const actualLecturerName = classData?.expand?.lecturer?.username;

  const lecturerStream = remoteStreams.find(
    (s) =>
      s.username === actualLecturerName ||
      (s.label === "camera" && s.username === "lecturer"),
  );

  const adminStream = remoteStreams.find((s) => s.username === "admin");

  const screenShareRemote = remoteStreams.find(
    (s) => s.label === "screenshare" && !(isHost && isScreenSharing),
  );

  const spotlightStream = isHost
    ? screenShareRemote
    : screenShareRemote || lecturerStream || adminStream;

  // Filter out the spotlighted stream from the filmstrip
  const filmstripStreams = remoteStreams.filter(
    (s) => s.id !== spotlightStream?.id,
  );

  const subjectName = Array.isArray(classData?.expand?.course_subject)
    ? classData.expand.course_subject
        .map(
          (cs: any) =>
            cs.expand?.subject?.[0]?.name || cs.expand?.subject?.name,
        )
        .filter(Boolean)
        .join(" & ")
    : classData?.expand?.course_subject?.expand?.subject?.[0]?.name ||
      classData?.expand?.course_subject?.expand?.subject?.name;

  const courseName = Array.isArray(classData?.expand?.course_subject)
    ? Array.from(
        new Set(
          classData.expand.course_subject.map(
            (cs: any) => cs.expand?.course_intake?.expand?.course?.name,
          ),
        ),
      )
        .filter(Boolean)
        .join(" & ")
    : classData?.expand?.course_subject?.expand?.course_intake?.expand?.course
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
                {classData.personalizedTitle || classData.title}
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
            <div className="h-full flex items-center justify-center p-4">
              {!hostMode && classData?.status !== "in_progress" ? (
                // Waiting Room UI
                <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 z-0" />
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-gray-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/10 ring-8 ring-white/5 relative">
                      <Lock size={40} className="text-gray-400" />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-black mb-3 uppercase tracking-tight text-white">
                      Waiting Room
                    </h2>
                    <p className="text-gray-400 text-sm mb-6 font-medium leading-relaxed">
                      Waiting for the lecturer to start the meeting...
                      <br className="my-2" />
                      The room will automatically unlock when the session
                      begins.
                    </p>

                    <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                        Stand by
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Normal Join Card UI
                <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 text-center shadow-2xl">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 ring-8 ring-indigo-500/10">
                    <Video size={36} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black mb-2 uppercase tracking-tight text-white">
                    Ready to join?
                  </h2>
                  <p className="text-gray-400 text-sm mb-6 font-medium">
                    Join as{" "}
                    <span className="text-white font-bold">
                      {currentUser?.name || "Attendee"}
                    </span>
                  </p>
                  <button
                    id="auto-join-btn"
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="w-full bg-white text-black font-black text-xs tracking-widest py-4 rounded-xl hover:scale-105 transition-all shadow-xl active:scale-95 disabled:opacity-50 uppercase"
                  >
                    {isJoining ? "Joining Session..." : "Join Class Now"}
                  </button>
                </div>
              )}
            </div>
          )}

          {(localError || error || inClassNotification) && (
            <div
              className={`absolute top-20 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md px-5 py-3 rounded-xl flex items-center gap-3 border shadow-2xl transition-all ${
                localError || error || inClassNotification?.type === "error"
                  ? "bg-red-500/10 border-red-500/20 shadow-red-500/10"
                  : inClassNotification?.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10"
                    : inClassNotification?.type === "info"
                      ? "bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10"
                      : "bg-amber-500/10 border-amber-500/20 shadow-amber-500/10"
              }`}
            >
              <Badge
                className={`${
                  localError || error || inClassNotification?.type === "error"
                    ? "bg-red-500 text-white"
                    : inClassNotification?.type === "success"
                      ? "bg-emerald-500 text-white"
                      : inClassNotification?.type === "info"
                        ? "bg-indigo-500 text-white"
                        : "bg-amber-500 text-black"
                } text-[10px] flex items-center gap-1.5 px-2.5 py-0.5 border-none`}
              >
                {inClassNotification?.icon && (
                  <span className="text-sm">{inClassNotification.icon}</span>
                )}
                {localError || error
                  ? "ERROR"
                  : inClassNotification?.type.toUpperCase()}
              </Badge>
              <p
                className={`text-xs font-bold tracking-wide ${
                  localError || error || inClassNotification?.type === "error"
                    ? "text-red-200"
                    : inClassNotification?.type === "success"
                      ? "text-emerald-200"
                      : inClassNotification?.type === "info"
                        ? "text-indigo-200"
                        : "text-amber-200"
                }`}
              >
                {localError || error || inClassNotification?.message}
              </p>
              {inClassNotification && (
                <button
                  onClick={clearNotification}
                  className="ml-2 hover:bg-white/10 p-1 rounded-lg transition-colors block"
                >
                  <X size={12} className="text-white/70" />
                </button>
              )}
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
                      videoMuted={spotlightStream.videoMuted}
                      avatarUrl={
                        spotlightStream.username
                          ? userAvatars[spotlightStream.username]
                          : undefined
                      }
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
                          : spotlightStream.username ||
                            actualLecturerName ||
                            "Host"}
                      </span>
                    </div>
                  </div>
                ) : !spotlightStream && isHost ? (
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
                        audioMuted={audioMuted}
                        username="You (Host)"
                        isHost={true}
                      />
                    ) : (
                      <LocalVideoTile
                        ref={!isHost ? localVideoRef : undefined}
                        stream={localStream}
                        videoMuted={videoMuted}
                        audioMuted={audioMuted}
                        username="You"
                        isHost={false}
                      />
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 bg-black/60 backdrop-blur px-2 py-0.5 rounded-md flex items-center gap-1.5">
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
                    className="relative flex-shrink-0 w-40 h-full bg-gray-900 rounded-xl overflow-hidden border border-white/5 group"
                  >
                    <RemoteVideo
                      remote={remote}
                      avatarUrl={
                        remote.username
                          ? userAvatars[remote.username]
                          : undefined
                      }
                    />

                    {/* Hover controls for Host */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {isHost && (
                        <>
                          <button
                            onClick={() => muteUser(remote.id)}
                            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors shadow-lg"
                            title="Mute user"
                          >
                            <MicOff size={16} />
                          </button>
                          <button
                            onClick={() => kickUser(remote.id)}
                            className="p-2 bg-red-900/80 hover:bg-red-800 text-white rounded-lg backdrop-blur-sm transition-colors shadow-lg"
                            title="Remove user"
                          >
                            <PhoneOff size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Native Hand Raise Overlay */}
                    {raisedHands.has(remote.id) && (
                      <div className="absolute top-2 right-2 z-20 bg-amber-500/90 backdrop-blur-md px-2 py-1 rounded-md border border-amber-400/50 flex items-center gap-1 shadow-lg animate-bounce">
                        <Hand size={12} className="text-white" />
                        <span className="text-[9px] font-black tracking-widest text-white uppercase">
                          Raised
                        </span>
                      </div>
                    )}

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
            {(isOriginalHost || isStudentHost) && (
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

            {/* Whiteboard toggle (Original Host only) */}
            {isOriginalHost && (
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

            {/* Hand Raise (non-original host) */}
            {!isOriginalHost && (
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

            {/* Invisible auto-leave button for realtime subscriptions acting on student */}
            <button
              id="auto-leave-btn"
              style={{ display: "none" }}
              onClick={handleLeave}
            />

            <button
              onClick={() => {
                if (isOriginalHost) {
                  setShowLeaveModal(true);
                } else {
                  handleLeave();
                }
              }}
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

                  const isFile = msg.value.startsWith("[FILE_ATTACHMENT]:");
                  let fileData = null;
                  if (isFile) {
                    try {
                      fileData = JSON.parse(
                        msg.value.replace("[FILE_ATTACHMENT]:", ""),
                      );
                    } catch (e) {
                      console.error("Failed to parse file attachment data", e);
                    }
                  }

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
                        {isFile && fileData ? (
                          <a
                            href={fileData.url}
                            download={fileData.name}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 bg-black/20 hover:bg-black/30 p-2 -mx-1 -my-0.5 rounded-lg transition-colors border border-white/5"
                          >
                            <div className="p-2 bg-indigo-500/20 rounded-md text-indigo-300">
                              <FileIcon size={16} />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-xs font-bold truncate">
                                {fileData.name}
                              </span>
                              <span className="text-[10px] opacity-70">
                                {(fileData.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <Download size={14} className="opacity-70 mx-1" />
                          </a>
                        ) : (
                          msg.value
                        )}
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
                <div className="relative flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className={`p-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10 ${uploadingFile ? "opacity-50 cursor-not-allowed" : ""}`}
                    title="Upload file (temporary)"
                  >
                    {uploadingFile ? (
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip size={20} />
                    )}
                  </button>
                  <div className="relative flex-1">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/50 transition-all placeholder:text-gray-600"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    >
                      <Send size={16} />
                    </button>
                  </div>
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
                        {isOriginalHost
                          ? "Host"
                          : isStudentHost
                            ? "Student (Presenter)"
                            : "Student"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other participants */}
                {participants.map((p) => {
                  const isParticipantLecturerOrAdmin = [
                    "lecturer",
                    "admin",
                  ].includes(p.username.toLowerCase());
                  const isParticipantStudentHost =
                    p.permissions?.includes("op") &&
                    !isParticipantLecturerOrAdmin;
                  const isParticipantHost = p.permissions?.includes("op");

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isParticipantLecturerOrAdmin ? "bg-amber-500" : isParticipantStudentHost ? "bg-emerald-500" : "bg-gray-700"}`}
                        >
                          {(p.username || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none">
                            {p.username}
                          </p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                            {isParticipantLecturerOrAdmin
                              ? "Host"
                              : isParticipantStudentHost
                                ? "Student (Presenter)"
                                : "Student"}
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
                      {isOriginalHost && !isParticipantLecturerOrAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => muteUser(p.id)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            title="Mute participant audio"
                          >
                            <VolumeX size={14} />
                          </button>
                          <button
                            onClick={() => disableUserVideo(p.id)}
                            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                            title="Stop participant camera"
                          >
                            <VideoOff size={14} />
                          </button>
                          {isParticipantStudentHost ? (
                            <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    `Remove Host priviledges from ${p.username}?`,
                                  )
                                ) {
                                  try {
                                    await fetch("/api/classroom/promote-host", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        classId,
                                        username: p.username,
                                        demote: true,
                                      }),
                                    });
                                  } catch (e) {
                                    console.error(
                                      "Failed to persist host demotion",
                                      e,
                                    );
                                  }
                                  removeHost(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Remove Host"
                            >
                              <X size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    `Promote ${p.username} to Host?`,
                                  )
                                ) {
                                  try {
                                    await fetch("/api/classroom/promote-host", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        classId,
                                        username: p.username,
                                      }),
                                    });
                                  } catch (e) {
                                    console.error(
                                      "Failed to persist host promotion",
                                      e,
                                    );
                                  }
                                  makeHost(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Make Host"
                            >
                              <Crown size={14} />
                            </button>
                          )}
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

      {/* Custom Leave Modal (Original Host Only) */}
      {showLeaveModal && isOriginalHost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isEndingClass && setShowLeaveModal(false)}
          />
          <div className="relative bg-gray-900 border border-white/10 p-8 rounded-[2rem] max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-8 ring-red-500/5">
              <PhoneOff className="text-red-500" size={32} />
            </div>

            <h2 className="text-2xl font-black text-center text-white mb-3 tracking-tight">
              Leave or End Session?
            </h2>

            <p className="text-gray-400 text-center text-sm font-medium mb-8 leading-relaxed">
              Do you want to leave the room open for students, or end the
              session for everyone?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleEndClassForEveryone}
                disabled={isEndingClass}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-widest uppercase py-4 rounded-xl transition-all shadow-xl shadow-red-900/20 active:scale-95 flex items-center justify-center"
              >
                {isEndingClass ? "Ending Session..." : "End Class For All"}
              </button>
              <button
                onClick={handleLeave}
                disabled={isEndingClass}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs tracking-widest uppercase py-4 rounded-xl transition-all shadow-xl shadow-amber-900/20 active:scale-95 flex items-center justify-center"
              >
                Leave Session (Keep Open)
              </button>
              <button
                onClick={() => setShowLeaveModal(false)}
                disabled={isEndingClass}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs tracking-widest uppercase py-4 rounded-xl transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function SpotlightVideo({
  stream,
  label,
  username,
  videoMuted,
  avatarUrl,
}: {
  stream: MediaStream;
  label?: string;
  username?: string;
  videoMuted?: boolean;
  avatarUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-contain bg-black ${label !== "screenshare" ? "mirror" : ""} ${videoMuted ? "hidden" : ""}`}
      />
      {videoMuted && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 gap-4">
          <UserAvatar size={80} url={avatarUrl} />
          <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">
            {username || "User"} (Video Off)
          </span>
        </div>
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LocalVideoTile = ({ stream, videoMuted, avatarUrl, ref }: any) => {
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
          <UserAvatar size={32} url={avatarUrl} />
        </div>
      )}
    </>
  );
};

function RemoteVideo({
  remote,
  avatarUrl,
}: {
  remote: RemoteStream;
  avatarUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && remote.stream) {
      videoRef.current.srcObject = remote.stream;
    }
  }, [remote.stream]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${remote.label === "screenshare" ? "" : ""} ${remote.videoMuted ? "hidden" : ""}`}
      />
      {remote.videoMuted && (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 absolute inset-0">
          <UserAvatar size={32} url={avatarUrl} />
        </div>
      )}
    </>
  );
}

function UserAvatar({ size = 48, url }: { size?: number; url?: string }) {
  return (
    <div
      className="bg-gray-800 rounded-full flex items-center justify-center border border-white/5 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img
          src={url}
          alt="User Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
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
      )}
    </div>
  );
}
