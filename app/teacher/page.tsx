'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Users, BookOpen, Video, HelpCircle, Plus, 
  Settings, CheckCircle2, XCircle, ExternalLink, 
  GraduationCap, ArrowLeft, Loader2, KeyRound, 
  Radio, Share2, Layers, AlertCircle, Smartphone, 
  Unlock, CreditCard, PlaySquare, FileText, Trash2,
  Copy, Key, BarChart3, Award, Calendar, X, Lock, LogOut, Upload
} from 'lucide-react';

export default function TeacherMasterDashboard() {
  // Teacher Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [teacherUser, setTeacherUser] = useState('');
  const [teacherPass, setTeacherPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [mainView, setMainView] = useState<'classes' | 'zoom_config'>('classes');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Zoom Credentials State
  const [zoomAccountId, setZoomAccountId] = useState('');
  const [zoomClientId, setZoomClientId] = useState('');
  const [zoomClientSecret, setZoomClientSecret] = useState('');
  const [isZoomConfigured, setIsZoomConfigured] = useState(false);
  const [isSavingZoom, setIsSavingZoom] = useState(false);

  // Create Course Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newType, setNewType] = useState('Theory');
  const [newFee, setNewFee] = useState('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Selected Course Management State
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'zoom' | 'students' | 'recordings' | 'content' | 'quizzes'>('zoom');

  // Student Performance Report Modal States
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any | null>(null);
  const [studentQuizResults, setStudentQuizResults] = useState<any[]>([]);
  const [studentAttendanceLogs, setStudentAttendanceLogs] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Zoom Meeting Creator inside Course Hub
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('120');
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<any | null>(null);

  // Course Specific Data
  const [students, setStudents] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [slips, setSlips] = useState<any[]>([]);

  // Sub Forms
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentIndex, setStudentIndex] = useState('');
  const [studentCustomPass, setStudentCustomPass] = useState('');

  const [materialTitle, setMaterialTitle] = useState('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingId, setRecordingId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState('20');
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [correctOpt, setCorrectOpt] = useState('0');

  useEffect(() => {
    const savedAuth = localStorage.getItem('lms_teacher_session');
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true);
      fetchCourses();
      fetchZoomSettings();
    }
    setAuthChecking(false);
  }, []);

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/teacher-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: teacherUser,
          password: teacherPass
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
        setIsLoggingIn(false);
        return;
      }

      localStorage.setItem('lms_teacher_session', 'authenticated');
      setIsAuthenticated(true);
      setTeacherUser('');
      setTeacherPass('');
      fetchCourses();
      fetchZoomSettings();
    } catch (err: any) {
      setAuthError('Login Error: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTeacherLogout = () => {
    localStorage.removeItem('lms_teacher_session');
    setIsAuthenticated(false);
    setSelectedCourse(null);
  };

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data);
    setLoading(false);
  };

  const fetchZoomSettings = async () => {
    const { data } = await supabase.from('zoom_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (data && data.account_id && data.client_id) {
      setZoomAccountId(data.account_id);
      setZoomClientId(data.client_id);
      setZoomClientSecret(data.client_secret);
      setIsZoomConfigured(true);
    }
  };

  const handleSaveZoomSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingZoom(true);

    const { data: existing } = await supabase.from('zoom_settings').select('id').limit(1).maybeSingle();

    let err;
    if (existing) {
      const res = await supabase.from('zoom_settings').update({
        account_id: zoomAccountId.trim(),
        client_id: zoomClientId.trim(),
        client_secret: zoomClientSecret.trim(),
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
      err = res.error;
    } else {
      const res = await supabase.from('zoom_settings').insert([{
        account_id: zoomAccountId.trim(),
        client_id: zoomClientId.trim(),
        client_secret: zoomClientSecret.trim()
      }]);
      err = res.error;
    }

    if (!err) {
      setIsZoomConfigured(true);
      alert('Zoom API Credentials saved successfully!');
      setMainView('classes');
    } else {
      alert('Error: ' + err.message);
    }
    setIsSavingZoom(false);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmittingCourse(true);
    const { error } = await supabase.from('courses').insert([{
      title: newTitle.trim(),
      grade: newGrade.trim() || 'Grade 10',
      class_type: newType.trim() || 'Theory',
      monthly_fee: Number(newFee) || 2500
    }]);

    if (!error) {
      alert('Class created successfully!');
      setShowCreateModal(false);
      setNewTitle('');
      fetchCourses();
    }
    setIsSubmittingCourse(false);
  };

  const openCourseManager = async (course: any) => {
    setSelectedCourse(course);
    setMeetingTopic(course.title + ' - Live Class');
    await loadCourseDetails(course.id);
  };

  const loadCourseDetails = async (courseId: string) => {
    const { data: mtg } = await supabase.from('zoom_meetings').select('*').eq('course_id', courseId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    setActiveMeeting(mtg || null);

    const { data: enr } = await supabase.from('enrollments').select('student_id, is_active, students(*)').eq('course_id', courseId);
    if (enr) setStudents(enr.map(e => ({ ...e.students, is_active: e.is_active })));

    const { data: mat } = await supabase.from('materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    if (mat) setMaterials(mat);

    const { data: rec } = await supabase.from('recordings').select('*').eq('course_id', courseId).order('uploaded_at', { ascending: false });
    if (rec) setRecordings(rec);

    const { data: qz } = await supabase.from('quizzes').select('*').eq('course_id', courseId);
    if (qz) setQuizzes(qz);

    const { data: slp } = await supabase.from('slips').select('*, students(full_name, index_number, whatsapp_number)').eq('course_id', courseId).order('submitted_at', { ascending: false });
    if (slp) setSlips(slp);
  };

  // Student Performance Report Viewer Logic
  const handleOpenStudentReport = async (student: any) => {
    setSelectedStudentForReport(student);
    setLoadingReport(true);

    try {
      // 1. Fetch Quiz Submissions with Quiz Details
      const { data: qSubs } = await supabase
        .from('quiz_submissions')
        .select('*, quizzes(title, duration_minutes, total_marks)')
        .eq('student_id', student.id)
        .order('submitted_at', { ascending: false });

      if (qSubs) setStudentQuizResults(qSubs);

      // 2. Fetch Attendance Logs for this student
      const { data: attLogs } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.id)
        .order('marked_at', { ascending: false });

      if (attLogs) setStudentAttendanceLogs(attLogs);
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCreateZoomMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    if (!isZoomConfigured) {
      alert('Please go to the Zoom Account tab first, enter your Zoom Credentials, and click Save.');
      setMainView('zoom_config');
      return;
    }

    setIsCreatingMeeting(true);
    try {
      const res = await fetch('/api/zoom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: meetingTopic || selectedCourse.title,
          duration: Number(meetingDuration) || 120,
          courseId: selectedCourse.id
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create meeting');

      await loadCourseDetails(selectedCourse.id);
      alert('Zoom Live Meeting created successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const handleCopyWhatsAppText = () => {
    if (!activeMeeting || !selectedCourse) return;
    const msg = `📢 *${selectedCourse.title} - Live Zoom Class*\n\n` +
      `📌 Topic: ${activeMeeting.topic}\n` +
      `⏱️ Duration: ${activeMeeting.duration_minutes} Minutes\n\n` +
      `🔗 Join Class Link:\n${activeMeeting.join_url}\n\n` +
      `🆔 Meeting ID: ${activeMeeting.meeting_id || 'Direct'}\n` +
      `🔑 Passcode: ${activeMeeting.password || 'None'}\n\n` +
      `Please join the class on time!`;

    navigator.clipboard.writeText(msg);
    alert('WhatsApp student invite message copied successfully!');
  };

  // Student Actions: Auto Generate Username & Password
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !selectedCourse) return;

    const autoIndex = studentIndex.trim() || `ST-${Math.floor(1000 + Math.random() * 9000)}`;
    const autoPassword = studentCustomPass.trim() || Math.floor(100000 + Math.random() * 900000).toString();

    const { data: newStu, error: err } = await supabase.from('students').insert([{
      index_number: autoIndex,
      full_name: studentName.trim(),
      whatsapp_number: studentPhone.trim() || '0770000000',
      grade: selectedCourse.grade,
      password: autoPassword
    }]).select().single();

    if (newStu && !err) {
      await supabase.from('enrollments').insert([{ student_id: newStu.id, course_id: selectedCourse.id, is_active: true }]);
      setStudentName('');
      setStudentPhone('');
      setStudentIndex('');
      setStudentCustomPass('');
      await loadCourseDetails(selectedCourse.id);

      const credText = `🎓 *Welcome to ${selectedCourse.title}*\n\n` +
        `Your Student Portal Login Details:\n` +
        `🔗 Student Portal: ${window.location.origin}/student\n` +
        `👤 Username (Index No): *${newStu.index_number}*\n` +
        `🔑 Password: *${newStu.password || autoPassword}*\n\n` +
        `⚠️ Please log in using these details on your phone or computer. (Your account will be locked to the first device you log in from.)`;

      navigator.clipboard.writeText(credText);
      alert(`Student enrolled successfully!\n\nUsername: ${newStu.index_number}\nPassword: ${newStu.password || autoPassword}\n\n(WhatsApp Login Message has been copied to your clipboard)`);
    } else {
      alert('Enrollment Error: ' + (err?.message || 'An error occurred'));
    }
  };

  const handleCopyStudentLogin = (st: any) => {
    if (!selectedCourse) return;
    const credText = `🎓 *Welcome to ${selectedCourse.title}*\n\n` +
      `Your Student Portal Login Details:\n` +
      `🔗 Student Portal: ${window.location.origin}/student\n` +
      `👤 Username (Index No): *${st.index_number}*\n` +
      `🔑 Password: *${st.password || st.whatsapp_number || '123456'}*\n\n` +
      `⚠️ Please log in using these details on your phone or computer. (Your account will be locked to the first device you log in from.)`;

    navigator.clipboard.writeText(credText);
    alert(`Login details (WhatsApp Message) for ${st.full_name} copied to clipboard!`);
  };

  const handleUnlockDevice = async (studentId: string) => {
    const { error } = await supabase.from('students').update({ device_id: null }).eq('id', studentId);
    if (!error) {
      alert('Device unlocked successfully! The student can now log in from a new device.');
      loadCourseDetails(selectedCourse.id);
    } else {
      alert('Unlock Error: ' + error.message);
    }
  };

  const handleAddRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingTitle || !recordingId || !selectedCourse) return;
    
    let cleanId = recordingId.trim();
    if (cleanId.includes('v=')) {
      cleanId = cleanId.split('v=')[1].split('&')[0];
    } else if (cleanId.includes('youtu.be/')) {
      cleanId = cleanId.split('youtu.be/')[1].split('?')[0];
    }

    const { error } = await supabase.from('recordings').insert([{
      course_id: selectedCourse.id,
      title: recordingTitle,
      youtube_video_id: cleanId
    }]);

    if (!error) {
      setRecordingTitle('');
      setRecordingId('');
      loadCourseDetails(selectedCourse.id);
      alert('Recording added successfully!');
    }
  };

  const handleDeleteRecording = async (recId: string) => {
    if (!confirm('Are you sure you want to remove this recording?')) return;
    await supabase.from('recordings').delete().eq('id', recId);
    loadCourseDetails(selectedCourse.id);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle || !materialFile || !selectedCourse) return;
    setIsUploadingMaterial(true);

    try {
      const fileExt = materialFile.name.split('.').pop() || 'pdf';
      const filePath = `tutes/${selectedCourse.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lms-files')
        .upload(filePath, materialFile, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('lms-files')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('materials').insert([{
        course_id: selectedCourse.id,
        title: materialTitle,
        file_url: urlData.publicUrl,
        tute_type: fileExt.toUpperCase()
      }]);

      if (dbError) {
        throw new Error(dbError.message);
      }

      setMaterialTitle('');
      setMaterialFile(null);
      loadCourseDetails(selectedCourse.id);
      alert('Tute uploaded successfully!');
    } catch (err: any) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle || !selectedCourse) return;
    const { data: qz } = await supabase.from('quizzes').insert([{
      course_id: selectedCourse.id,
      title: quizTitle,
      duration_minutes: Number(quizDuration) || 20,
      enable_watermark: true,
      total_marks: 100
    }]).select().single();

    if (qz && qText && opt0 && opt1) {
      await supabase.from('quiz_questions').insert([{
        quiz_id: qz.id,
        question_text: qText,
        options: [opt0, opt1, 'None', 'None'],
        correct_option: Number(correctOpt),
        marks: 100
      }]);
      setQuizTitle('');
      setQText('');
      setOpt0('');
      setOpt1('');
      loadCourseDetails(selectedCourse.id);
      alert('Quiz published successfully!');
    }
  };

  const handleUpdateSlipStatus = async (slipId: string, status: 'Approved' | 'Rejected') => {
    await supabase.from('slips').update({ status }).eq('id', slipId);
    if (selectedCourse) loadCourseDetails(selectedCourse.id);
  };

  // ================= AUTH LOADING =================
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono">Checking admin session...</p>
      </div>
    );
  }

  // ================= TEACHER LOGIN VIEW =================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-6 text-white font-sans selection:bg-purple-500 selection:text-white">
        <div className="w-full max-w-md bg-[#0c1322] border border-slate-800/90 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Admin Access Only
            </span>
          </div>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Teacher Master Login</h2>
            <p className="text-xs text-slate-400">Sign in to manage your classes, students, and Zoom sessions</p>
          </div>

          {authError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{authError}</span>
            </div>
          )}

          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Admin Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={teacherUser}
                onChange={(e) => setTeacherUser(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={teacherPass}
                onChange={(e) => setTeacherPass(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In to Control Panel'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= AUTHENTICATED TEACHER DASHBOARD =================
  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 bg-[#0c1322] sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">Teacher Master Panel</h1>
            <p className="text-[10px] text-slate-400 font-mono">Digimart Control Center</p>
          </div>
        </div>

        {/* Center Main Nav */}
        <div className="flex items-center bg-[#070b14] p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setMainView('classes'); setSelectedCourse(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              mainView === 'classes' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Classes Hub
          </button>
          <button
            onClick={() => setMainView('zoom_config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              mainView === 'zoom_config' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Zoom Account
            {isZoomConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block"></span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/student" target="_blank" className="hidden sm:flex px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition items-center gap-2">
            <span>Student View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleTeacherLogout}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ZOOM CONFIG VIEW */}
        {mainView === 'zoom_config' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-[#0c1322] border border-slate-800/80 p-8 rounded-3xl shadow-xl space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Zoom Account Credentials</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Enter and save your Zoom Server-to-Server OAuth Account ID, Client ID, and Client Secret here.
                  </p>
                </div>
              </div>

              {isZoomConfigured && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Zoom Account connected successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveZoomSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Zoom Account ID</label>
                  <input
                    type="text" value={zoomAccountId} onChange={(e) => setZoomAccountId(e.target.value)}
                    placeholder="kH9bXyZ..." className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white" required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Client ID</label>
                  <input
                    type="text" value={zoomClientId} onChange={(e) => setZoomClientId(e.target.value)}
                    placeholder="7abcDefGhi..." className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white" required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Client Secret</label>
                  <input
                    type="password" value={zoomClientSecret} onChange={(e) => setZoomClientSecret(e.target.value)}
                    placeholder="••••••••••••••••••••••••" className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white" required
                  />
                </div>
                <button
                  type="submit" disabled={isSavingZoom}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  {isSavingZoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Zoom Credentials</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ALL CLASSES LIST */}
        {mainView === 'classes' && !selectedCourse && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Your Classes</h2>
                <p className="text-xs text-slate-400">Select a class to manage Zoom meetings, students, recordings, and tutes.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl transition flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create New Class
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading classes...
              </div>
            ) : courses.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
                No classes created yet. Click &quot;Create New Class&quot; to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c) => (
                  <div key={c.id} className="bg-[#0c1322] border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        {c.grade} • {c.class_type}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">Rs. {c.monthly_fee}/-</span>
                    </div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{c.title}</h3>
                    <button
                      onClick={() => openCourseManager(c)}
                      className="w-full py-2.5 bg-slate-800/80 hover:bg-purple-600 hover:text-white text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" /> Manage Class Hub
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SINGLE CLASS HUB */}
        {mainView === 'classes' && selectedCourse && (
          <div className="space-y-6">
            <div className="bg-[#0c1322] p-6 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button onClick={() => setSelectedCourse(null)} className="text-xs text-purple-400 hover:underline mb-1 flex items-center gap-1 cursor-pointer">
                  ← Back to all classes
                </button>
                <h2 className="text-xl font-black text-white">{selectedCourse.title}</h2>
                <span className="text-xs text-slate-400">{selectedCourse.grade} • {selectedCourse.class_type}</span>
              </div>

              {activeMeeting && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-pulse">
                  <Radio className="w-3.5 h-3.5" /> Live Meeting Active
                </span>
              )}
            </div>

            {/* CLASS TABS */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('zoom')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'zoom' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" /> Live Zoom Class
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'students' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> Student Management ({students.length})
              </button>

              <button
                onClick={() => setActiveTab('recordings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'recordings' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlaySquare className="w-4 h-4" /> Lesson Recordings ({recordings.length})
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'content' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Tutes & Notes
              </button>

              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'quizzes' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Timed Quizzes
              </button>
            </div>

            {/* TAB 1: ZOOM */}
            {activeTab === 'zoom' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={handleCreateZoomMeeting} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Create New Zoom Meeting</h3>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Class Topic</label>
                      <input
                        type="text" value={meetingTopic} onChange={(e) => setMeetingTopic(e.target.value)}
                        placeholder="e.g. Unit 05 Discussion" className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Duration (Minutes)</label>
                      <input
                        type="number" value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)}
                        placeholder="120" className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                      />
                    </div>
                  </div>

                  <button
                    type="submit" disabled={isCreatingMeeting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50"
                  >
                    {isCreatingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>{isCreatingMeeting ? 'Creating Meeting...' : 'Generate Zoom Meeting'}</span>
                  </button>
                </form>

                <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400" /> Active Zoom Details
                    </h3>

                    {activeMeeting ? (
                      <div className="mt-4 space-y-4">
                        <div className="p-4 rounded-2xl bg-[#131c31] border border-slate-700/50 space-y-2">
                          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Topic</span>
                          <h4 className="text-sm font-bold text-white">{activeMeeting.topic}</h4>
                          <div className="flex gap-4 pt-1 font-mono text-xs text-slate-300">
                            <span>ID: <strong className="text-white">{activeMeeting.meeting_id || 'N/A'}</strong></span>
                            <span>Pass: <strong className="text-emerald-400">{activeMeeting.password || 'None'}</strong></span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <a
                            href={activeMeeting.start_url} target="_blank" rel="noreferrer"
                            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" /> Start Class as Host
                          </a>
                          <button
                            onClick={handleCopyWhatsAppText}
                            className="w-full py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" /> Copy WhatsApp Student Invite
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-12 text-center text-slate-500 text-xs">
                        <p>No Zoom meeting has been created for this class yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STUDENT MANAGEMENT WITH REPORTS, CREDENTIALS & 1-CLICK SHARE */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Enroll form */}
                  <form onSubmit={handleAddStudent} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl h-fit">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-purple-400" /> Enroll New Student
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Enter the student&apos;s name and WhatsApp number. Username and password will be auto-generated.
                    </p>

                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Full Name</label>
                      <input
                        type="text" placeholder="e.g. Kasun Madushanka" value={studentName} onChange={(e) => setStudentName(e.target.value)}
                        className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">WhatsApp Number</label>
                      <input
                        type="text" placeholder="0771234567" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)}
                        className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Index Number (Optional)</label>
                      <input
                        type="text" placeholder="Leave blank to auto-generate" value={studentIndex} onChange={(e) => setStudentIndex(e.target.value)}
                        className="w-full bg-[#070b14] border border-slate-700/60 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Custom Password (Optional)</label>
                      <input
                        type="text" placeholder="Leave blank for a 6-digit PIN" value={studentCustomPass} onChange={(e) => setStudentCustomPass(e.target.value)}
                        className="w-full bg-[#070b14] border border-slate-700/60 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600"
                      />
                    </div>

                    <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-purple-600/30">
                      Enroll & Generate Login Credentials
                    </button>
                  </form>

                  {/* Enrolled Students List with Performance Report Button */}
                  <div className="lg:col-span-2 bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" /> Enrolled Students & Reports
                      </h3>
                      <span className="text-xs text-slate-400">{students.length} Total Enrolled</span>
                    </div>

                    {students.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">No students enrolled yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {students.map((st) => (
                          <div key={st.id} className="p-4 bg-[#131c31] border border-slate-700/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                {st.full_name}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                                <span className="bg-[#070b14] px-2.5 py-1 rounded-lg border border-slate-700 text-purple-400">
                                  User: <strong>{st.index_number}</strong>
                                </span>
                                <span className="bg-[#070b14] px-2.5 py-1 rounded-lg border border-slate-700 text-emerald-400 flex items-center gap-1">
                                  <Key className="w-3 h-3" /> Pass: <strong>{st.password || st.whatsapp_number || '123456'}</strong>
                                </span>
                                <span className="text-slate-400 text-[11px]">
                                  📱 {st.whatsapp_number}
                                </span>
                              </div>
                            </div>

                            {/* Actions: View Report + Copy Login + Device Unlock */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* 1. VIEW STUDENT REPORT BUTTON */}
                              <button
                                onClick={() => handleOpenStudentReport(st)}
                                title="View full exam marks and attendance report"
                                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-600/30"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Report</span>
                              </button>

                              <button
                                onClick={() => handleCopyStudentLogin(st)}
                                title="Copy login details WhatsApp message"
                                className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Login</span>
                              </button>

                              <button
                                onClick={() => handleUnlockDevice(st.id)}
                                title="Reset device lock to allow student to log in from a new device"
                                className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-900 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unlock</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Slips & Payment Approvals Section */}
                <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" /> Student Bank Slips & Payment Status
                      </h3>
                      <p className="text-xs text-slate-400">Review student bank slips and approve or reject payments.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">{slips.length} Slips Submitted</span>
                  </div>

                  {slips.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No bank slips submitted yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slips.map((slp) => (
                        <div key={slp.id} className="p-4 bg-[#131c31] border border-slate-700/60 rounded-2xl space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-xs text-white">{slp.students?.full_name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {slp.students?.index_number}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              slp.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {slp.status}
                            </span>
                          </div>

                          <div className="pt-1">
                            <a
                              href={slp.slip_url} target="_blank" rel="noreferrer"
                              className="text-xs text-blue-400 hover:underline flex items-center gap-1.5 p-2 rounded-xl bg-slate-900 border border-slate-800"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="truncate">View Uploaded Slip ➔</span>
                            </a>
                          </div>

                          {slp.status !== 'Approved' && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleUpdateSlipStatus(slp.id, 'Approved')}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateSlipStatus(slp.id, 'Rejected')}
                                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: LESSON RECORDINGS */}
            {activeTab === 'recordings' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleAddRecording} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl h-fit">
                  <div className="flex items-center gap-2">
                    <PlaySquare className="w-5 h-5 text-red-400" />
                    <h3 className="font-bold text-sm text-white">Add Past Lesson Recording</h3>
                  </div>
                  <p className="text-xs text-slate-400">Enter the YouTube video link or video ID for the class lesson recording.</p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Lesson Title</label>
                      <input
                        type="text" placeholder="e.g. Lesson 01 - Theory Revision" value={recordingTitle}
                        onChange={(e) => setRecordingTitle(e.target.value)} className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">YouTube Video ID / URL</label>
                      <input
                        type="text" placeholder="e.g. dQw4w9WgXcQ" value={recordingId}
                        onChange={(e) => setRecordingId(e.target.value)} className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-red-600/30">
                    Add Recording
                  </button>
                </form>

                <div className="lg:col-span-2 bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <PlaySquare className="w-4 h-4 text-red-400" /> Uploaded Recordings ({recordings.length})
                  </h3>

                  {recordings.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">No recordings added yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recordings.map((rec) => (
                        <div key={rec.id} className="p-4 bg-[#131c31] border border-slate-700/60 rounded-2xl space-y-3">
                          <h4 className="font-bold text-xs text-white line-clamp-1">{rec.title}</h4>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {rec.youtube_video_id}</div>
                          <div className="flex items-center justify-between pt-1">
                            <a
                              href={`https://youtube.com/watch?v=${rec.youtube_video_id}`} target="_blank" rel="noreferrer"
                              className="text-xs text-red-400 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Watch on YouTube
                            </a>
                            <button
                              onClick={() => handleDeleteRecording(rec.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: TUTES */}
            {activeTab === 'content' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleAddMaterial} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-white">Upload New Tute / PDF</h3>
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Tute Title</label>
                    <input
                      type="text" placeholder="e.g. Unit 01 Study Notes" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Select PDF / Document File</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600/20 file:text-emerald-400 hover:file:bg-emerald-600/30 cursor-pointer"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUploadingMaterial || !materialFile}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploadingMaterial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{isUploadingMaterial ? 'Uploading Tute...' : 'Upload PDF Material'}</span>
                  </button>
                </form>

                <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-3 shadow-xl">
                  <h3 className="font-bold text-sm text-white">Active Tutes ({materials.length})</h3>
                  {materials.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No tutes uploaded yet.</p>
                  ) : (
                    materials.map(m => (
                      <div key={m.id} className="p-3 bg-[#131c31] border border-slate-700/50 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-white font-medium truncate">{m.title}</span>
                        <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline">Download ➔</a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: QUIZZES */}
            {activeTab === 'quizzes' && (
              <form onSubmit={handleCreateQuiz} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="font-bold text-sm text-white">Create Anti-Cheat Timed Quiz</h3>
                <input
                  type="text" placeholder="Quiz Title" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                />
                <input
                  type="text" placeholder="Question Text" value={qText} onChange={(e) => setQText(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Option 1" value={opt0} onChange={(e) => setOpt0(e.target.value)} className="bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
                  <input type="text" placeholder="Option 2" value={opt1} onChange={(e) => setOpt1(e.target.value)} className="bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                  Save Quiz & Publish
                </button>
              </form>
            )}

          </div>
        )}
      </main>

      {/* ================= MODAL: STUDENT PERFORMANCE & EXAM REPORT ================= */}
      {selectedStudentForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0c1322] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6">
            
            {/* Header with Student Summary */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedStudentForReport.full_name}
                    <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                      ID: {selectedStudentForReport.index_number}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    📱 {selectedStudentForReport.whatsapp_number} • {selectedCourse?.title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForReport(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingReport ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing performance report...
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. Quick Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#131c31] border border-slate-700/50 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Exams Taken</span>
                    <h4 className="text-xl font-black text-white mt-1">{studentQuizResults.length}</h4>
                  </div>
                  <div className="bg-[#131c31] border border-slate-700/50 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Average Score</span>
                    <h4 className="text-xl font-black text-emerald-400 mt-1">
                      {studentQuizResults.length > 0 
                        ? `${Math.round(studentQuizResults.reduce((a, b) => a + Number(b.score || 0), 0) / studentQuizResults.length)}%` 
                        : '0%'}
                    </h4>
                  </div>
                  <div className="bg-[#131c31] border border-slate-700/50 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Live Attendance</span>
                    <h4 className="text-xl font-black text-blue-400 mt-1">{studentAttendanceLogs.length} Days</h4>
                  </div>
                </div>

                {/* 2. Detailed Quiz Results Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> Exam Marks & Results (Quiz Submissions)
                  </h4>

                  {studentQuizResults.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 text-center text-slate-500 text-xs">
                      This student has not taken any quizzes yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {studentQuizResults.map((res) => (
                        <div key={res.id} className="p-3.5 bg-[#070b14] border border-slate-800/80 rounded-2xl flex items-center justify-between">
                          <div>
                            <h5 className="font-bold text-xs text-white">{res.quizzes?.title || 'Online Exam'}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Date: {new Date(res.submitted_at).toLocaleDateString()} • Time: {new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                              Score: {res.score} / {res.quizzes?.total_marks || 100}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Attendance Log */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" /> Zoom Class Attendance History (Attendance Logs)
                  </h4>

                  {studentAttendanceLogs.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 text-center text-slate-500 text-xs">
                      No attendance records found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {studentAttendanceLogs.map((att) => (
                        <div key={att.id} className="p-3 bg-[#070b14] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-mono">
                            {new Date(att.marked_at).toLocaleDateString()} {new Date(att.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Present ({att.duration_minutes}m)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0c1322] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Class</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <input
                type="text" placeholder="Class Name (e.g. 2026 A/L Biology)"
                value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
              />
              <input
                type="text" placeholder="Grade (e.g. Grade 13 / 2026 A/L)"
                value={newGrade} onChange={(e) => setNewGrade(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
              />
              <input
                type="number" placeholder="Monthly Fee (e.g. 2500)"
                value={newFee} onChange={(e) => setNewFee(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingCourse} className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer">
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}