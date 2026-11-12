'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Video, HelpCircle, Award, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between selection:bg-purple-500 selection:text-white font-sans">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 px-6 py-4 bg-[#0c1322] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">Smart Tuition LMS</h1>
            <span className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Teacher Custom Build</span>
          </div>
        </div>

        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
          Live Interactive Demo
        </span>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center space-y-8">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Attendance • Timed Exams • Tutes • Progress Reports</span>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Manage Your Tuition Classes <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              All in One Place with Smart Technology
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            A modern LMS platform featuring automated attendance tracking, online exams with countdown timers, PDF tute distribution, and 1-click official progress reports.
          </p>
        </div>

        {/* 2 Quick Demo Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4 text-left">
          
          {/* Card 1: Teacher Control Panel */}
          <Link
            href="/teacher"
            className="group p-6 rounded-3xl bg-[#0c1322] border border-slate-800 hover:border-purple-500/50 hover:bg-gradient-to-br hover:from-purple-950/20 hover:to-[#0c1322] transition-all duration-300 space-y-4 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Teacher Admin Panel</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition text-purple-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Track attendance, publish new tutes & quizzes, and view detailed student progress reports.
              </p>
            </div>
            <span className="inline-block text-[11px] font-bold text-purple-400 group-hover:underline">
              Enter Control Panel →
            </span>
          </Link>

          {/* Card 2: Student Portal */}
          <Link
            href="/student"
            className="group p-6 rounded-3xl bg-[#0c1322] border border-slate-800 hover:border-indigo-500/50 hover:bg-gradient-to-br hover:from-indigo-950/20 hover:to-[#0c1322] transition-all duration-300 space-y-4 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Demo Student Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition text-indigo-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Access 1-click Zoom classes, download study tutes, and take timed live online quizzes.
              </p>
            </div>
            <span className="inline-block text-[11px] font-bold text-indigo-400 group-hover:underline">
              Enter Student Portal →
            </span>
          </Link>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 bg-[#0c1322]">
        Smart Tuition LMS Platform • Powered by Next.js & Supabase
      </footer>

    </div>
  );
}