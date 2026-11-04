'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Users, BookOpen, Video, HelpCircle, Plus, 
  Settings, CheckCircle2, Copy, ExternalLink, 
  GraduationCap, ArrowLeft, Loader2, KeyRound, 
  Radio, Share2, Layers, AlertCircle
} from 'lucide-react';

export default function TeacherMasterDashboard() {
  // Main Navigation: Classes or Zoom Settings
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
  const [activeTab, setActiveTab] = useState<'zoom' | 'students' | 'content' | 'quizzes' | 'slips'>('zoom');

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
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingId, setRecordingId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState('20');
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctOpt, setCorrectOpt] = useState('0');

  useEffect(() => {
    fetchCourses();
    fetchZoomSettings();
  }, []);

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
      alert('Zoom API තොරතුරු සාර්ථකව සුරැකිණි! දැන් ඔබට ඕනෑම පන්තියක් සඳහා Meeting Generate කළ හැක.');
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
      alert('පන්තිය සාර්ථකව නිර්මාණය විය!');
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

    const { data: mat } = await supabase.from('materials').select('*').eq('course_id', courseId);
    if (mat) setMaterials(mat);

    const { data: rec } = await supabase.from('recordings').select('*').eq('course_id', courseId);
    if (rec) setRecordings(rec);

    const { data: qz } = await supabase.from('quizzes').select('*').eq('course_id', courseId);
    if (qz) setQuizzes(qz);

    const { data: slp } = await supabase.from('slips').select('*, students(full_name, index_number)').eq('course_id', courseId);
    if (slp) setSlips(slp);
  };

  const handleCreateZoomMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    if (!isZoomConfigured) {
      alert('කරුණාකර මුලින්ම "Zoom Account" ටැබ් එක වෙත ගොස් ඔබගේ Zoom Credentials ලබා දී Save කරන්න.');
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

      if (!res.ok) {
        throw new Error(resData.error || 'Meeting creation failed');
      }

      await loadCourseDetails(selectedCourse.id);
      alert('Zoom Live Meeting සාර්ථකව නිර්මාණය විය!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const handleCopyWhatsAppText = () => {
    if (!activeMeeting || !selectedCourse) return;
    const msg = `📢 *${selectedCourse.title} - සජීවී Zoom පන්තිය*\n\n` +
      `📌 මාතෘකාව: ${activeMeeting.topic}\n` +
      `⏱️ කාලය: විනාඩි ${activeMeeting.duration_minutes}\n\n` +
      `🔗 පන්තියට සම්බන්ධ වීමට Link එක:\n${activeMeeting.join_url}\n\n` +
      `🆔 Meeting ID: ${activeMeeting.meeting_id || 'Direct'}\n` +
      `🔑 Passcode: ${activeMeeting.password || 'None'}\n\n` +
      `සියලු සිසුන් නියමිත වේලාවට සම්බන්ධ වන්න!`;

    navigator.clipboard.writeText(msg);
    alert('WhatsApp ආරාධනා පණිවිඩය සාර්ථකව Copy විය!');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !selectedCourse) return;
    const { data: newStu } = await supabase.from('students').insert([{
      index_number: studentIndex || `ST-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: studentName,
      whatsapp_number: studentPhone || '0770000000',
      grade: selectedCourse.grade
    }]).select().single();

    if (newStu) {
      await supabase.from('enrollments').insert([{ student_id: newStu.id, course_id: selectedCourse.id, is_active: true }]);
      setStudentName('');
      setStudentPhone('');
      setStudentIndex('');
      loadCourseDetails(selectedCourse.id);
      alert('ශිෂ්‍යයා ලියාපදිංචි කරන ලදී!');
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle || !materialUrl || !selectedCourse) return;
    await supabase.from('materials').insert([{ course_id: selectedCourse.id, title: materialTitle, file_url: materialUrl, tute_type: 'PDF' }]);
    setMaterialTitle('');
    setMaterialUrl('');
    loadCourseDetails(selectedCourse.id);
    alert('Tute එකතු විය!');
  };

  const handleAddRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingTitle || !recordingId || !selectedCourse) return;
    await supabase.from('recordings').insert([{ course_id: selectedCourse.id, title: recordingTitle, youtube_video_id: recordingId }]);
    setRecordingTitle('');
    setRecordingId('');
    loadCourseDetails(selectedCourse.id);
    alert('Recording එකතු විය!');
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
        options: [opt0, opt1, opt2 || 'None', opt3 || 'None'],
        correct_option: Number(correctOpt),
        marks: 100
      }]);
      setQuizTitle('');
      setQText('');
      setOpt0('');
      setOpt1('');
      loadCourseDetails(selectedCourse.id);
      alert('Quiz එක සාර්ථකව පළ විය!');
    }
  };

  const handleUpdateSlipStatus = async (slipId: string, status: 'Approved' | 'Rejected') => {
    await supabase.from('slips').update({ status }).eq('id', slipId);
    if (selectedCourse) loadCourseDetails(selectedCourse.id);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
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

        {/* Center Main Navigation Buttons */}
        <div className="flex items-center bg-[#070b14] p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => { setMainView('classes'); setSelectedCourse(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mainView === 'classes' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Classes Hub
          </button>
          <button
            onClick={() => setMainView('zoom_config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
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

        <div className="flex items-center gap-3">
          <Link href="/student" target="_blank" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition flex items-center gap-2">
            <span>Student View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ================= VIEW 1: ZOOM CONFIGURATION PAGE ================= */}
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
                    ඔබගේ Zoom App Marketplace ගිණුමෙන් ලබාගත් Server-to-Server OAuth Credentials මෙහි ඇතුළත් කර සුරකින්න. මෙහි එක්වරක් සුරකින ලද තොරතුරු මඟින් සියලුම පන්ති සඳහා ක්ෂණිකව Meetings ජනනය වේ.
                  </p>
                </div>
              </div>

              {isZoomConfigured && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>ඔබගේ Zoom Account එක සාර්ථකව සම්බන්ධ වී ඇත. අවශ්‍ය නම් පහතින් යාවත්කාලීන කළ හැක.</span>
                </div>
              )}

              <form onSubmit={handleSaveZoomSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Zoom Account ID</label>
                  <input
                    type="text"
                    value={zoomAccountId}
                    onChange={(e) => setZoomAccountId(e.target.value)}
                    placeholder="e.g. kH9bXyZ..."
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Client ID</label>
                  <input
                    type="text"
                    value={zoomClientId}
                    onChange={(e) => setZoomClientId(e.target.value)}
                    placeholder="e.g. 7abcDefGhi..."
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Client Secret</label>
                  <input
                    type="password"
                    value={zoomClientSecret}
                    onChange={(e) => setZoomClientSecret(e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingZoom}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingZoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isSavingZoom ? 'Saving Settings...' : 'Save Zoom Credentials'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= VIEW 2: CLASSES HUB ================= */}
        {mainView === 'classes' && !selectedCourse && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Your Classes</h2>
                <p className="text-xs text-slate-400">Select a class to generate live Zoom meetings, enroll students, and manage lessons.</p>
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
                <Loader2 className="w-4 h-4 animate-spin" /> Loading your courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
                No classes created yet. Click "Create New Class" to begin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c) => (
                  <div key={c.id} className="bg-[#0c1322] border border-slate-800/80 rounded-3xl p-6 space-y-4 hover:border-purple-500/40 transition shadow-xl">
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
                      <Settings className="w-3.5 h-3.5" /> Manage Class & Live Zoom
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 3: SINGLE CLASS MANAGEMENT HUB ================= */}
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
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-pulse">
                    <Radio className="w-3.5 h-3.5" /> Live Meeting Ready
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('zoom')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'zoom' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" /> Live Zoom Class
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'students' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> Students ({students.length})
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'content' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Tutes & Lessons
              </button>
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'quizzes' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Timed Quizzes
              </button>
              <button
                onClick={() => setActiveTab('slips')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'slips' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Bank Slips ({slips.length})
              </button>
            </div>

            {/* TAB: ZOOM LIVE MEETING GENERATOR */}
            {activeTab === 'zoom' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Zoom Create Form */}
                <form onSubmit={handleCreateZoomMeeting} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Create New Zoom Meeting</h3>
                  </div>

                  {!isZoomConfigured && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> ඔබගේ Zoom Account එක තවම Configure කර නැත.
                      </span>
                      <button
                        type="button"
                        onClick={() => setMainView('zoom_config')}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg cursor-pointer"
                      >
                        Set Keys ➔
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Class Topic</label>
                      <input
                        type="text"
                        value={meetingTopic}
                        onChange={(e) => setMeetingTopic(e.target.value)}
                        placeholder="e.g. Unit 05 Discussion"
                        className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Duration (Minutes)</label>
                      <input
                        type="number"
                        value={meetingDuration}
                        onChange={(e) => setMeetingDuration(e.target.value)}
                        placeholder="120"
                        className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingMeeting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50"
                  >
                    {isCreatingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>{isCreatingMeeting ? 'Creating Zoom Class...' : 'Generate Zoom Meeting'}</span>
                  </button>
                </form>

                {/* 2. Active Meeting Dashboard & Links */}
                <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400" /> Active Zoom Class Details
                    </h3>

                    {activeMeeting ? (
                      <div className="mt-4 space-y-4">
                        <div className="p-4 rounded-2xl bg-[#131c31] border border-slate-700/50 space-y-2">
                          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Topic</span>
                          <h4 className="text-sm font-bold text-white">{activeMeeting.topic}</h4>
                          <div className="flex gap-4 pt-1 font-mono text-xs text-slate-300">
                            <span>ID: <strong className="text-white">{activeMeeting.meeting_id || 'N/A'}</strong></span>
                            <span>Passcode: <strong className="text-emerald-400">{activeMeeting.password || 'None'}</strong></span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <a
                            href={activeMeeting.start_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-600/30"
                          >
                            <ExternalLink className="w-4 h-4" /> Start Class as Host (ගුරුතුමාට)
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
                      <div className="mt-12 text-center text-slate-500 text-xs space-y-2">
                        <Video className="w-8 h-8 mx-auto text-slate-600" />
                        <p>මෙම පන්තිය සඳහා තවම Zoom Meeting එකක් සාදා නැත.</p>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 text-center">
                    * සාදන Zoom Link එක මෙම පන්තියේ Enrolled සියලු සිසුන්ගේ Student Portal එකේ ස්වයංක්‍රීයව දිස්වේ.
                  </p>
                </div>

              </div>
            )}

            {/* TAB: STUDENTS */}
            {activeTab === 'students' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleAddStudent} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-white">Enroll New Student</h3>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp Phone"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Index No (ST-001)"
                    value={studentIndex}
                    onChange={(e) => setStudentIndex(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                    Register to this Class
                  </button>
                </form>

                <div className="lg:col-span-2 bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-white">Enrolled Students</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {students.map((st) => (
                      <div key={st.id} className="p-3 bg-[#131c31] border border-slate-700/50 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-white">{st.full_name}</h4>
                          <span className="text-[11px] text-purple-400 font-mono">ID: {st.index_number} • WhatsApp: {st.whatsapp_number}</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded-md border border-emerald-500/20">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CONTENT */}
            {activeTab === 'content' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleAddMaterial} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-white">Upload New Tute / PDF</h3>
                  <input
                    type="text" placeholder="Tute Title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                  />
                  <input
                    type="url" placeholder="PDF Document URL" value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                  />
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                    Add PDF Material
                  </button>
                </form>

                <form onSubmit={handleAddRecording} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="font-bold text-sm text-white">Add Past Lesson Recording</h3>
                  <input
                    type="text" placeholder="Lesson Title" value={recordingTitle} onChange={(e) => setRecordingTitle(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                  />
                  <input
                    type="text" placeholder="YouTube Video ID" value={recordingId} onChange={(e) => setRecordingId(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                  />
                  <button type="submit" className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                    Add Video Recording
                  </button>
                </form>
              </div>
            )}

            {/* TAB: QUIZZES */}
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

            {/* TAB: BANK SLIPS */}
            {activeTab === 'slips' && (
              <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="font-bold text-sm text-white">Student Payment Slips</h3>
                {slips.length === 0 ? (
                  <p className="text-xs text-slate-500">No payment slips submitted yet.</p>
                ) : (
                  slips.map((slp) => (
                    <div key={slp.id} className="p-4 bg-[#131c31] border border-slate-700/50 rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-white">{slp.students?.full_name} ({slp.students?.index_number})</h4>
                        <a href={slp.slip_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline">View Bank Slip ➔</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400">{slp.status}</span>
                        {slp.status !== 'Approved' && (
                          <button onClick={() => handleUpdateSlipStatus(slp.id, 'Approved')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        )}
      </main>

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
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingCourse} className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
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