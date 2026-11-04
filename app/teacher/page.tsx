'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Users, BookOpen, Video, HelpCircle, Plus, 
  Settings, CheckCircle2, XCircle, ExternalLink, 
  GraduationCap, ArrowLeft, Loader2, KeyRound, 
  Radio, Share2, Layers, AlertCircle, Smartphone, 
  Unlock, CreditCard, PlaySquare, FileText, Trash2
} from 'lucide-react';

export default function TeacherMasterDashboard() {
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
      alert('Zoom API Credentials සාර්ථකව සුරැකිණි!');
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

    const { data: mat } = await supabase.from('materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    if (mat) setMaterials(mat);

    const { data: rec } = await supabase.from('recordings').select('*').eq('course_id', courseId).order('uploaded_at', { ascending: false });
    if (rec) setRecordings(rec);

    const { data: qz } = await supabase.from('quizzes').select('*').eq('course_id', courseId);
    if (qz) setQuizzes(qz);

    const { data: slp } = await supabase.from('slips').select('*, students(full_name, index_number, whatsapp_number)').eq('course_id', courseId).order('submitted_at', { ascending: false });
    if (slp) setSlips(slp);
  };

  const handleCreateZoomMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    if (!isZoomConfigured) {
      alert('කරුණාකර මුලින්ම Zoom Account ටැබ් එකට ගොස් ඔබගේ Zoom Credentials ඇතුළත් කර Save කරන්න.');
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
      if (!res.ok) throw new Error(resData.error || 'Meeting එක සාදා ගැනීමට නොහැකි විය');

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

  // Student Actions
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
      alert('ශිෂ්‍යයා සාර්ථකව පන්තියට ඇතුළත් කරන ලදී!');
    }
  };

  // Student Action: Device Unlock
  const handleUnlockDevice = async (studentId: string) => {
    const { error } = await supabase.from('students').update({ device_id: null }).eq('id', studentId);
    if (!error) {
      alert('Device එක සාර්ථකව Unlock කරන ලදී! ශිෂ්‍යයාට නව Device එකකින් ලොග් විය හැක.');
      loadCourseDetails(selectedCourse.id);
    } else {
      alert('Unlock Error: ' + error.message);
    }
  };

  // Recording Actions
  const handleAddRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingTitle || !recordingId || !selectedCourse) return;
    
    // YouTube link හෝ ID පිරිසිදු කරගැනීම
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
      alert('Recording එක සාර්ථකව එකතු විය!');
    }
  };

  const handleDeleteRecording = async (recId: string) => {
    if (!confirm('මෙම Recording එක ඉවත් කිරීමට අවශ්‍යද?')) return;
    await supabase.from('recordings').delete().eq('id', recId);
    loadCourseDetails(selectedCourse.id);
  };

  // Materials & Quizzes
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle || !materialUrl || !selectedCourse) return;
    await supabase.from('materials').insert([{ course_id: selectedCourse.id, title: materialTitle, file_url: materialUrl, tute_type: 'PDF' }]);
    setMaterialTitle('');
    setMaterialUrl('');
    loadCourseDetails(selectedCourse.id);
    alert('Tute එක සාර්ථකව Upload විය!');
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
      alert('Quiz එක සාර්ථකව පළ විය!');
    }
  };

  const handleUpdateSlipStatus = async (slipId: string, status: 'Approved' | 'Rejected') => {
    await supabase.from('slips').update({ status }).eq('id', slipId);
    if (selectedCourse) loadCourseDetails(selectedCourse.id);
  };

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

        <div className="flex items-center gap-3">
          <Link href="/student" target="_blank" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition flex items-center gap-2">
            <span>Student View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
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
                    Zoom Server-to-Server OAuth හි Account ID, Client ID සහ Client Secret මෙහි Save කරන්න.
                  </p>
                </div>
              </div>

              {isZoomConfigured && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Zoom Account එක සාර්ථකව සම්බන්ධ වී ඇත!</span>
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
                <p className="text-xs text-slate-400">පන්තියක් තෝරා Zoom, සිසුන්, Recordings සහ Tutes කළමනාකරණය කරන්න.</p>
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
                <Loader2 className="w-4 h-4 animate-spin" /> පන්ති ලෝඩ් වෙමින් පවතී...
              </div>
            ) : courses.length === 0 ? (
              <div className="border border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
                තවම පන්ති සාදා නැත. "Create New Class" ඔබන්න.
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
            {/* Header info */}
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
                    <span>{isCreatingMeeting ? 'Meeting එක සෑදෙමින් පවතී...' : 'Generate Zoom Meeting'}</span>
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
                      <div className="mt-12 text-center text-slate-500 text-xs">
                        <p>මෙම පන්තිය සඳහා තවම Zoom Meeting එකක් සාදා නැත.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMPLETE STUDENT MANAGEMENT (Unlock Device + Payment Status + Bank Slips) */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Enroll form */}
                  <form onSubmit={handleAddStudent} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl h-fit">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-purple-400" /> Enroll New Student
                    </h3>
                    <input
                      type="text" placeholder="Full Name" value={studentName} onChange={(e) => setStudentName(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                    />
                    <input
                      type="text" placeholder="WhatsApp Number (077...)" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <input
                      type="text" placeholder="Index No (Optional)" value={studentIndex} onChange={(e) => setStudentIndex(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                    <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                      Enroll to this Class
                    </button>
                  </form>

                  {/* Enrolled Students with Device Unlock */}
                  <div className="lg:col-span-2 bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" /> Enrolled Students & Device Security
                      </h3>
                      <span className="text-xs text-slate-400">{students.length} Total</span>
                    </div>

                    {students.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">තවම සිසුන් ලියාපදිංචි කර නැත.</p>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {students.map((st) => (
                          <div key={st.id} className="p-4 bg-[#131c31] border border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-white flex items-center gap-2">
                                {st.full_name}
                                <span className="text-[10px] text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                  {st.index_number}
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-400 font-mono">📱 WhatsApp: {st.whatsapp_number}</p>
                            </div>

                            {/* Device Unlock Button */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUnlockDevice(st.id)}
                                title="Device reset කර ශිෂ්‍යයාට නව Device එකකින් ලොග් වීමට අවසර දෙන්න"
                                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-900 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Unlock Device</span>
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
                      <p className="text-xs text-slate-400">සිසුන් එවූ බැංකු රිසිට්පත් පරීක්ෂා කර Approve හෝ Reject කරන්න.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">{slips.length} Slips Submitted</span>
                  </div>

                  {slips.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">තවම රිසිට්පත් කිසිවක් ලැබී නැත.</p>
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

            {/* TAB 3: LESSON RECORDINGS (Dedicated Section) */}
            {activeTab === 'recordings' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleAddRecording} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl h-fit">
                  <div className="flex items-center gap-2">
                    <PlaySquare className="w-5 h-5 text-red-400" />
                    <h3 className="font-bold text-sm text-white">Add Past Lesson Recording</h3>
                  </div>
                  <p className="text-xs text-slate-400">පන්ති පාඩමේ YouTube Video Link එක හෝ Video ID එක මෙහි ඇතුළත් කරන්න.</p>

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
                    <p className="text-xs text-slate-500 py-8 text-center">තවම කිසිදු Recording එකක් දමා නැත.</p>
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
                  <input
                    type="text" placeholder="Tute Title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                  />
                  <input
                    type="url" placeholder="PDF File URL (Google Drive etc.)" value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                  />
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer">
                    Add PDF Material
                  </button>
                </form>

                <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-3 shadow-xl">
                  <h3 className="font-bold text-sm text-white">Active Tutes ({materials.length})</h3>
                  {materials.map(m => (
                    <div key={m.id} className="p-3 bg-[#131c31] border border-slate-700/50 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-white font-medium truncate">{m.title}</span>
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline">Download ➔</a>
                    </div>
                  ))}
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