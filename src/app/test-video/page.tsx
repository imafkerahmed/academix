"use client";

import { useState } from "react";
import VideoClassroom from "@/components/classroom/VideoClassroom";
import { Monitor, User, Video, LogIn, X } from "lucide-react";

export default function TestVideoPage() {
  const [inRoom, setInRoom] = useState(false);
  const [roomName, setRoomName] = useState("test-room");
  const [username, setUsername] = useState(() => "test-user-" + Math.floor(Math.random() * 100));

  if (inRoom) {
    return (
      <div className="h-screen bg-black relative">
        <button 
          onClick={() => setInRoom(false)}
          className="absolute top-4 right-4 z-[100] bg-red-500/20 hover:bg-red-500 text-white p-2 rounded-xl border border-red-500/30 transition-all backdrop-blur-md"
          title="Exit Classroom"
        >
          <X size={20} />
        </button>
        <VideoClassroom room={roomName} username={username} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full">
        {/* Header Decor */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20 ring-8 ring-indigo-500/5 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Video size={36} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg -rotate-12 border-4 border-gray-950">
              <Monitor size={18} className="text-white" />
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-900/50 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 z-0" />
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">LiveKit Test Bench</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Academix Infrastructure</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest absolute -top-2 left-4 bg-gray-950 px-2 rounded-full border border-white/5">Room Identifier</label>
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all group-hover:bg-white/[0.07]">
                    <Monitor size={18} className="text-gray-500" />
                    <input 
                      type="text" 
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full bg-transparent border-none py-4 px-3 text-sm font-bold focus:outline-none placeholder:text-gray-600"
                      placeholder="e.g. physics-101"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest absolute -top-2 left-4 bg-gray-950 px-2 rounded-full border border-white/5">Display Name</label>
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all group-hover:bg-white/[0.07]">
                    <User size={18} className="text-gray-500" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent border-none py-4 px-3 text-sm font-bold focus:outline-none placeholder:text-gray-600"
                      placeholder="e.g. Professor Smith"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setInRoom(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs tracking-[0.2em] py-5 rounded-[1.25rem] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn uppercase"
              >
                Join Global Session
                <LogIn size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-tighter">SDP Ready</span>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-tighter">JWT Active</span>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-40">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-tighter">Bridge Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
