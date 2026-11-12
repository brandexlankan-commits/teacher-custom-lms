'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, Video, BookOpen, Clock, 
  HelpCircle, CheckCircle2, XCircle, Award, 
  ArrowLeft, Download, ShieldCheck, PlaySquare, 
  Lock, X, CreditCard, AlertCircle, LogOut, KeyRound, Smartphone, Upload, Loader2
} from 'lucide-react';

export default function StudentPortal() {
  const [studentInfo, setStudentInfo] = useState<any | null>(null);
  const [currentCourse, setCurrentCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Index No or Phone
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Course Dynamic Data
  const [activeMeeting, setActiveMeeting] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Bank Slip File Upload States
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipStatus, setSlipStatus] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  // Quiz States
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Access Control Flag (Unlocked only when teacher approves bank slip)
  const isUnlocked = slipStatus === 'Approved';

  useEffect(() => {
    // Check local session
    const savedStudent = localStorage.getItem('lms_student_session');
    if (savedStudent) {
      const parsed = JSON.parse(savedStudent);
      verifyAndLoadStudent(parsed.id);
    } else {
      setLoading(false);
    }
  }, []);

  // Browser Device Token
  const getDeviceFingerprint = () => {
    let dId = localStorage.getItem('lms_device_token');
    if (!dId) {
      dId = 'DEV-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem('lms_device_token', dId);
    }
    return dId;
  };

  // Student Login Handler with 1-Device Lock
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      // Search student by Index No or Phone Number
      const { data: stu, error } = await supabase
        .from('students')
        .select('*')
        .or(`index_number.eq.${loginIdentifier.trim()},whatsapp_number.eq.${loginIdentifier.trim()}`)
        .limit(1)
        .maybeSingle();

      if (error || !stu) {
        setLoginError('Invalid Index Number or WhatsApp Number.');
        setIsLoggingIn(false);
        return;
      }

      // Password Verification (default '123456' or student phone)
      const validPassword = stu.password || stu.whatsapp_number || '123456';
      if (loginPassword.trim() !== validPassword) {
        setLoginError('Incorrect Password.');
        setIsLoggingIn(false);
        return;
      }

      // 1-Device Lock Verification
      const currentDeviceId = getDeviceFingerprint();

      if (!stu.device_id) {
        // Lock account to the first device used to log in
        await supabase.from('students').update({ device_id: currentDeviceId }).eq('id', stu.id);
      } else if (stu.device_id !== currentDeviceId) {
        setLoginError('⚠️ Your account is already linked to another phone or computer. Please contact your teacher to unlock your device before logging in from a new device.');
        setIsLoggingIn(false);
        return;
      }

      // Save Session
      localStorage.setItem('lms_student_session', JSON.stringify(stu));
      await verifyAndLoadStudent(stu.id);
    } catch (err: any) {
      setLoginError('Login Error: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lms_student_session');
    setStudentInfo(null);
    setCurrentCourse(null);
  };

  const verifyAndLoadStudent = async (studentId: string) => {
    setLoading(true);
    const { data: stu } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
    if (!stu) {
      handleLogout();
      setLoading(false);
      return;
    }

    setStudentInfo({
      id: stu.id,
      name: stu.full_name,
      indexNo: stu.index_number,
      phone: stu.whatsapp_number
    });

    // Find Enrolled Class
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id, courses(*)')
      .eq('student_id', stu.id)
      .limit(1)
      .maybeSingle();

    if (enrollments && enrollments.courses) {
      const course = enrollments.courses as any;
      setCurrentCourse(course);

      // Active Zoom Meeting
      const { data: mtg } = await supabase
        .from('zoom_meetings')
        .select('*')
        .eq('course_id', course.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setActiveMeeting(mtg);

      // Materials, Recordings, Quizzes, Slips
      const { data: mat } = await supabase.from('materials').select('*').eq('course_id', course.id);
      const { data: qz } = await supabase.from('quizzes').select('*').eq('course_id', course.id);
      const { data: rec } = await supabase.from('recordings').select('*').eq('course_id', course.id);
      const { data: slp } = await supabase.from('slips').select('*').eq('student_id', stu.id).eq('course_id', course.id).order('submitted_at', { ascending: false }).limit(1);

      if (mat) setMaterials(mat);
      if (qz) setQuizzes(qz);
      if (rec) setRecordings(rec);
      if (slp && slp.length > 0) setSlipStatus(slp[0].status);
    }

    setLoading(false);
  };

  const handleJoinClass = async () => {
    if (!isUnlocked) {
      alert('Access Locked: Please upload your bank slip and wait for teacher approval to join live classes.');
      return;
    }

    const zoomLink = activeMeeting?.join_url || currentCourse?.zoom_link;
    if (!zoomLink) {
      alert('A Zoom meeting has not been started for this class yet.');
      return;
    }

    // Mark Attendance
    if (studentInfo && currentCourse) {
      await supabase.from('attendance').insert([{
        student_id: studentInfo.id,
        course_id: currentCourse.id,
        duration_minutes: activeMeeting?.duration_minutes || 120,
        status: 'Present'
      }]);
      setAttendanceMarked(true);
    }

    window.open(zoomLink, '_blank');
  };

  const handleUploadSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile || !currentCourse || !studentInfo) return;
    setIsUploadingSlip(true);

    try {
      const fileExt = slipFile.name.split('.').pop() || 'jpg';
      const filePath = `slips/${studentInfo.indexNo}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lms-files')
        .upload(filePath, slipFile, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('lms-files')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('slips').insert([
        {
          student_id: studentInfo.id,
          course_id: currentCourse.id,
          slip_url: urlData.publicUrl,
          status: 'Pending'
        }
      ]);

      if (dbError) {
        throw new Error(dbError.message);
      }

      setSlipStatus('Pending');
      setSlipFile(null);
      alert('Your bank slip has been uploaded successfully! Lessons will unlock once approved by your teacher.');
    } catch (err: any) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleStartQuiz = async (quiz: any) => {
    if (!isUnlocked) {
      alert('Access Locked: Please upload your bank slip and wait for teacher approval to take online exams.');
      return;
    }

    const { data: qData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
    if (qData && qData.length > 0) {
      setQuestions(qData);
      setActiveQuiz(quiz);
      setTimeLeft(quiz.duration_minutes * 60);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setScore(0);
    } else {
      alert('Questions have not been added to this quiz yet.');
    }
  };

  useEffect(() => {
    if (!activeQuiz || quizSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, quizSubmitted, timeLeft]);

  const handleSubmitQuiz = async () => {
    let earnedMarks = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_option) earnedMarks += q.marks || 10;
    });
    setScore(earnedMarks);
    setQuizSubmitted(true);
    if (activeQuiz && studentInfo) {
      await supabase.from('quiz_submissions').insert([{
        quiz_id: activeQuiz.id,
        student_id: studentInfo.id,
        score: earnedMarks,
        total_questions: questions.length,
        answers: selectedAnswers
      }]);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // ================= VIEW 1: LOGIN SCREEN =================
  if (!studentInfo && !loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-6 text-white font-sans selection:bg-purple-500 selection:text-white">
        <div className="w-full max-w-md bg-[#0c1322] border border-slate-800/90 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Student Portal Login</h2>
            <p className="text-xs text-slate-400">Sign in to access your class lessons and study materials</p>
          </div>

          {loginError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Index Number or WhatsApp Number</label>
              <input
                type="text"
                placeholder="e.g. ST-001 or 0771234567"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">* If you don&apos;t know your password, please enter your WhatsApp phone number.</span>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoggingIn ? 'Verifying...' : 'Login to Student Hub'}</span>
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Single Device Security Active
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ================= VIEW 2: LOADING SCREEN =================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono">Verifying student account...</p>
      </div>
    );
  }

  // ================= VIEW 3: STUDENT DASHBOARD =================
  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-purple-500 selection:text-white pb-12">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 bg-[#0c1322] sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm">{studentInfo?.name}</h1>
            <span className="text-[11px] font-mono text-purple-400">ID: {studentInfo?.indexNo}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
            <Lock className="w-3.5 h-3.5" /> 1 Device Verified
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">

        {!currentCourse ? (
          <div className="p-8 text-center bg-[#0c1322] border border-slate-800 rounded-3xl space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-base text-white">You are not enrolled in any class yet.</h3>
            <p className="text-xs text-slate-400">Please contact your teacher to get your Index Number registered for the class.</p>
          </div>
        ) : (
          <>
            {/* PAYMENT STATUS & SLIP BANNER */}
            <div className={`p-1 rounded-2xl border bg-gradient-to-r ${
              slipStatus === 'Approved' ? 'from-emerald-900/40 to-teal-900/20 border-emerald-500/30' : 
              slipStatus === 'Pending' ? 'from-amber-900/40 to-yellow-900/20 border-amber-500/30' : 
              slipStatus === 'Rejected' ? 'from-red-900/40 to-rose-900/20 border-red-500/30' :
              'from-purple-900/40 to-pink-900/20 border-purple-500/30'
            }`}>
              <div className="bg-[#0c1322] rounded-xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className={`w-5 h-5 ${
                      slipStatus === 'Approved' ? 'text-emerald-400' : 
                      slipStatus === 'Rejected' ? 'text-red-400' : 'text-purple-400'
                    }`} />
                    <h3 className="font-bold text-sm text-white">{currentCourse.title} - Class Fees</h3>
                  </div>
                  
                  {slipStatus === 'Approved' ? (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Payment verified. You now have full access to all lessons.
                    </div>
                  ) : slipStatus === 'Pending' ? (
                    <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Bank slip uploaded (Pending). Lessons will unlock once your teacher approves it.
                    </div>
                  ) : slipStatus === 'Rejected' ? (
                    <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 inline-flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Previous bank slip was rejected. Please upload a valid bank slip (Rs. {currentCourse.monthly_fee}/-) to unlock lessons.
                    </div>
                  ) : (
                    <div className="text-xs text-slate-300">
                      Monthly Fee: <strong className="text-emerald-400 font-mono text-sm">Rs. {currentCourse.monthly_fee}/-</strong>. Upload your bank slip photo or PDF below to unlock lessons.
                    </div>
                  )}
                </div>

                {slipStatus !== 'Approved' && (
                  <form onSubmit={handleUploadSlip} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={isUploadingSlip || slipStatus === 'Pending'}
                      onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                      className="flex-1 min-w-[240px] bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600/20 file:text-purple-400 hover:file:bg-purple-600/30 cursor-pointer"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isUploadingSlip || slipStatus === 'Pending' || !slipFile}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isUploadingSlip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{isUploadingSlip ? 'Uploading...' : 'Submit Slip'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* LIVE ZOOM CLASS SECTION */}
            <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    {currentCourse.grade} • {currentCourse.class_type}
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    {activeMeeting ? activeMeeting.topic : currentCourse.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {activeMeeting 
                      ? `Scheduled Duration: ${activeMeeting.duration_minutes} minutes. Click Join Class to connect live and mark your attendance.`
                      : 'Once the Zoom session is ready, click Join Class to connect.'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
              </div>

              {activeMeeting && isUnlocked && (
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-[#070b14] p-3 rounded-xl border border-slate-800/60 w-fit">
                  <span>Meeting ID: <strong className="text-white">{activeMeeting.meeting_id || 'Direct'}</strong></span>
                  <span>Passcode: <strong className="text-emerald-400">{activeMeeting.password || 'None'}</strong></span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isUnlocked ? (
                  <button
                    disabled
                    className="px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 bg-slate-800/80 border border-slate-700 text-slate-400 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Locked • Payment Approval Required</span>
                  </button>
                ) : (
                  <button
                    onClick={handleJoinClass}
                    disabled={!activeMeeting?.join_url && !currentCourse.zoom_link}
                    className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition ${
                      activeMeeting?.join_url || currentCourse.zoom_link 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Live Class (Marks Attendance)</span>
                  </button>
                )}

                {attendanceMarked && isUnlocked && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Attendance Marked!
                  </span>
                )}
              </div>
            </div>

            {/* RECORDINGS, TUTES, QUIZZES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Recordings */}
              <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <PlaySquare className="w-4 h-4 text-red-400" /> Past Recordings ({recordings.length})
                </h3>
                {recordings.length === 0 ? (
                  <p className="text-xs text-slate-500">No recordings available.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {recordings.map((rec) => (
                      <div key={rec.id} className="p-3.5 rounded-2xl bg-[#131c31] border border-slate-700/50">
                        <h4 className="font-bold text-xs text-white line-clamp-1 mb-2">{rec.title}</h4>
                        {isUnlocked ? (
                          <button
                            onClick={() => setActiveVideoId(rec.youtube_video_id)}
                            className="w-full py-2 rounded-xl bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 text-xs font-semibold transition cursor-pointer"
                          >
                            Watch Lesson
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400" /> Locked (Approval Required)
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tutes */}
              <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> Tutes & Handouts ({materials.length})
                </h3>
                {materials.length === 0 ? (
                  <p className="text-xs text-slate-500">No tutes uploaded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {materials.map((m) => (
                      <div key={m.id} className="p-3.5 rounded-2xl bg-[#131c31] border border-slate-700/50 flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white line-clamp-1 pr-2">{m.title}</h4>
                        {isUnlocked ? (
                          <a href={m.file_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition">
                            <Download className="w-4 h-4" />
                          </a>
                        ) : (
                          <span title="Payment approval required to download" className="p-2 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed">
                            <Lock className="w-4 h-4 text-amber-400" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quizzes */}
              <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" /> Quizzes & Papers
                </h3>
                {quizzes.length === 0 ? (
                  <p className="text-xs text-slate-500">No quizzes available.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {quizzes.map((q) => (
                      <div key={q.id} className="p-3.5 rounded-2xl bg-[#131c31] border border-slate-700/50 space-y-2">
                        <h4 className="font-bold text-xs text-white line-clamp-1">{q.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">{q.duration_minutes} Mins</span>
                          {isUnlocked ? (
                            <button
                              onClick={() => handleStartQuiz(q)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-900 text-[11px] font-bold transition cursor-pointer"
                            >
                              Start Exam
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-[11px] font-bold flex items-center gap-1 cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3 text-amber-400" /> Locked
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* VIDEO MODAL */}
      {activeVideoId && isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#0c1322] border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl p-4">
            <div className="flex items-center justify-between px-2 mb-4">
              <span className="font-bold text-sm text-red-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Protected Lesson Stream
              </span>
              <button onClick={() => setActiveVideoId(null)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative pt-[56.25%] rounded-2xl overflow-hidden bg-black border border-slate-800">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?rel=0&modestbranding=1`}
                className="absolute inset-0 w-full h-full border-none"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* QUIZ MODAL */}
      {activeQuiz && isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#0c1322] border border-slate-800 text-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
            {activeQuiz.enable_watermark && (
              <div className="pointer-events-none select-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden opacity-[0.06] rotate-[-25deg]">
                <div className="text-center font-mono font-black text-xl text-white space-y-6">
                  <p>{studentInfo?.name} • {studentInfo?.phone}</p>
                  <p>{studentInfo?.indexNo} • {currentCourse?.title}</p>
                </div>
              </div>
            )}

            <div className="sticky top-0 bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-30">
              <div>
                <h3 className="font-bold text-sm text-white">{activeQuiz.title}</h3>
                <span className="text-[10px] text-slate-400">{questions.length} Questions</span>
              </div>

              {!quizSubmitted && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono font-bold text-sm">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}

              {quizSubmitted && (
                <button onClick={() => setActiveQuiz(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">
                  Close Exam
                </button>
              )}
            </div>

            <div className="p-6 space-y-6 relative z-10">
              {quizSubmitted && (
                <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/40 p-6 rounded-2xl text-center space-y-2">
                  <Award className="w-12 h-12 text-yellow-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Quiz Completed!</h4>
                  <p className="text-3xl font-black text-purple-300">
                    Score: {score} / {questions.reduce((a, b) => a + (b.marks || 10), 0)}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {questions.map((q, qIdx) => {
                  const studentAns = selectedAnswers[qIdx];
                  const isCorrect = studentAns === q.correct_option;

                  return (
                    <div key={q.id} className="bg-[#070b14] border border-slate-800/80 p-5 rounded-2xl space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="font-semibold text-sm text-slate-200">{qIdx + 1}. {q.question_text}</h5>
                        {quizSubmitted && (
                          isCorrect ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                              <XCircle className="w-3 h-3" /> Incorrect
                            </span>
                          )
                        )}
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt: string, optIdx: number) => {
                          let optStyle = "border-slate-700 bg-[#0c1322] text-slate-300 hover:border-purple-500/50 cursor-pointer";
                          if (!quizSubmitted) {
                            if (studentAns === optIdx) optStyle = "border-purple-500 bg-purple-500/20 text-white font-bold";
                          } else {
                            if (optIdx === q.correct_option) optStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold";
                            else if (studentAns === optIdx && !isCorrect) optStyle = "border-red-500 bg-red-500/20 text-red-300 line-through";
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs transition ${optStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!quizSubmitted && (
                <button
                  onClick={handleSubmitQuiz}
                  className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Submit Answers
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}