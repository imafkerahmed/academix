"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { useGalene, RemoteStream } from "@/hooks/useGalene";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Send, Users, MessageSquare, Monitor, 
  Settings, Maximize2, Shield, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VirtualClassroom() {
  const { classId } = useParams();
  const router = useRouter();
  const { 
    connected, localStream, remoteStreams, error, 
    connecting, chatMessages, connect, disconnect, 
    sendChat, toggleAudio, toggleVideo, 
    audioMuted, videoMuted 
  } = useGalene();

  const [classData, setClassData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showChat, setShowChat] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [joinTime, setJoinTime] = useState<Date | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch class and user data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const user = pb.authStore.model;
        setCurrentUser(user);

        if (classId) {
          const record = await pb.collection("classes").getOne(classId as string, {
            expand: "course_subject.subject,course_subject.course_intake.course",
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

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleJoin = async () => {
    if (!classData || !currentUser) return;
    
    setIsJoining(true);
    
    const groupName = classData.galene_group || "test-classroom"; 
    const username = currentUser.name || currentUser.username || "Guest";
    
    // Role detection refinement
    const searchParams = new URLSearchParams(window.location.search);
    const requestedRole = searchParams.get("role");
    
    // Determine if user SHOULD be a host
    const isOwner = classData.expand?.course_subject?.lecturer === currentUser.id;
    const isAdmin = currentUser.role === "admin" || currentUser.role === "superuser";
    
    const shouldBeHost = (isAdmin && requestedRole === "host") || isOwner;
    const password = shouldBeHost ? "lecturer123" : "student123";

    try {
      await connect(groupName, username, password);
      
      // Create attendance record
      const now = new Date();
      setJoinTime(now);
      
      const attendance = await pb.collection("attendance").create({
        class: classId,
        user: currentUser.id,
        join_time: now.toISOString(),
        status: "active"
      });
      setAttendanceId(attendance.id);
      
    } catch (err: any) {
      console.error("Join failed:", err);
      if (err?.response?.data?.message) {
        console.error("PB Validation Error:", err.response.data);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (attendanceId && joinTime) {
      const leaveTime = new Date();
      const duration = Math.round((leaveTime.getTime() - joinTime.getTime()) / 60000);
      
      try {
        await pb.collection("attendance").update(attendanceId, {
          leave_time: leaveTime.toISOString(),
          duration: duration,
          status: "completed"
        });
      } catch (err) {
        console.error("Failed to update attendance on leave:", err);
      }
    }
    disconnect();
    router.back();
  };

  // Update attendance on window close or navigation
  useEffect(() => {
    const updateAttendanceOnUnmount = async () => {
      if (attendanceId && joinTime) {
        const leaveTime = new Date();
        const duration = Math.round((leaveTime.getTime() - joinTime.getTime()) / 60000);
        try {
          // Use fetch for beacons/unmount if needed, but PB update is fine for component unmount
          await pb.collection("attendance").update(attendanceId, {
            leave_time: leaveTime.toISOString(),
            duration: duration,
            status: "completed"
          });
        } catch (e) {}
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

  if (!classData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center animate-pulse">
          <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold tracking-widest text-xs uppercase opacity-50">Initializing Classroom Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden font-sans text-white">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-2xl">
              <Monitor size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase leading-none">{classData.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-green-500/20 text-green-400 border-none text-[8px] font-black tracking-widest px-1.5 py-0 h-4">LIVE</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                    {classData.expand?.course_subject?.expand?.subject?.[0]?.name || classData.expand?.course_subject?.expand?.subject?.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">•</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {classData.expand?.course_subject?.expand?.course_intake?.expand?.course?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
              <Users size={14} className="text-indigo-400" />
              <span className="text-xs font-black tracking-widest">{remoteStreams.length + (connected ? 1 : 0)} PARTICIPANTS</span>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-6 pt-24 pb-32 overflow-hidden">
          {!connected && !connecting && (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl">
                <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/20 ring-8 ring-indigo-500/10">
                  <Video size={40} />
                </div>
                <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Ready to join?</h2>
                <p className="text-gray-400 text-sm mb-8 font-medium">Join the virtual session as <span className="text-white font-bold">{currentUser?.name || "Attendee"}</span></p>
                <button 
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full bg-white text-black font-black text-xs tracking-widest py-5 rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95 disabled:opacity-50 uppercase"
                >
                  {isJoining ? "Joining Session..." : "Join Class Now"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center gap-4">
              <Badge className="bg-red-500 text-white">ERROR</Badge>
              <p className="text-xs font-bold text-red-200">{error}</p>
            </div>
          )}

          {(connected || connecting) && (
            <div className={`grid gap-6 h-full ${
              remoteStreams.length === 0 ? "grid-cols-1" : 
              remoteStreams.length === 1 ? "grid-cols-2" : 
              "grid-cols-2 lg:grid-cols-3"
            }`}>
              {/* Local Video */}
              <div className="relative group bg-gray-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`w-full h-full object-cover mirror ${videoMuted ? 'hidden' : ''}`} 
                />
                {videoMuted && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border border-white/5">
                      <User size={48} className="text-gray-600" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 z-10 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-widest uppercase">You (Teacher)</span>
                  {audioMuted && <MicOff size={12} className="text-red-500" />}
                </div>
              </div>

              {/* Remote Videos */}
              {remoteStreams.map((remote) => (
                <RemoteVideo key={remote.id} remote={remote} />
              ))}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-black/40 backdrop-blur-2xl border border-white/10 p-3 rounded-[2rem] flex items-center gap-3 shadow-2xl">
            <button 
              onClick={toggleAudio}
              className={`p-5 rounded-2xl transition-all active:scale-90 ${audioMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
            >
              {audioMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button 
              onClick={toggleVideo}
              className={`p-5 rounded-2xl transition-all active:scale-90 ${videoMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
            >
              {videoMuted ? <VideoOff size={22} /> : <Video size={22} />}
            </button>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <button className="p-5 rounded-2xl bg-white/5 text-gray-300 hover:bg-white/10 transition-all active:scale-90">
              <Monitor size={22} />
            </button>
            <button 
              onClick={() => setShowChat(!showChat)}
              className={`p-5 rounded-2xl transition-all active:scale-90 ${showChat ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}
            >
              <MessageSquare size={22} />
            </button>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <button 
              onClick={handleLeave}
              className="p-5 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-500/30 hover:bg-red-700 transition-all active:scale-90 hover:-translate-y-1"
            >
              <PhoneOff size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-96 bg-gray-900/50 backdrop-blur-3xl border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="text-indigo-400" />
              <h2 className="text-xs font-black tracking-widest uppercase">Class Chat</h2>
            </div>
            <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white transition-colors">
              <Settings size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.username === (currentUser?.name || currentUser?.username) ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{msg.username}</span>
                  <span className="text-[9px] text-white/20 font-bold">{msg.time ? new Date(msg.time * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                </div>
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm font-medium leading-relaxed ${
                  msg.username === (currentUser?.name || currentUser?.username) 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                    : 'bg-white/5 text-gray-200 rounded-tl-none ring-1 ring-white/5'
                }`}>
                  {msg.value}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6 bg-black/20 backdrop-blur-2xl border-t border-white/5">
            <div className="relative">
              <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Share a message with the class..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/50 transition-all placeholder:text-gray-600"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function RemoteVideo({ remote }: { remote: RemoteStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && remote.stream) {
      videoRef.current.srcObject = remote.stream;
    }
  }, [remote.stream]);

  return (
    <div className="relative group bg-gray-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-6 left-6 z-10 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10">
        <span className="text-[10px] font-black tracking-widest uppercase">{remote.username || "Participant"}</span>
      </div>
    </div>
  );
}

function User(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
