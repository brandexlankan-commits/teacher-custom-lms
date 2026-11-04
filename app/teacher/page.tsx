'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, Users, BookOpen, HelpCircle, Award, 
  Printer, ArrowLeft, Plus, Trash2, Video, FileText, 
  PlaySquare, Settings, CreditCard, CheckCircle, XCircle, Clock, ShieldCheck, Download
} from 'lucide-react';

export default function TeacherDashboard() {
  // Main Navigation State
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  
  // Tabs inside a specific course
  const [classTab, setClassTab] = useState<'overview' | 'students' | 'slips' | 'recordings' | 'materials' | 'quizzes'>('overview');

  // Course Specific Data
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [courseSlips, setCourseSlips] = useState<any[]>([]);
  const [courseRecordings, setCourseRecordings] = useState<any[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);

  // Modals & Forms
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any | null>(null);

  // Load All Courses on Mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data);
  };

  // Load Specific Data when a Course is Selected
  useEffect(() => {
    if (!selectedCourse) return;
    fetchCourseData(selectedCourse.id);
  }, [selectedCourse]);

  const fetchCourseData = async (courseId: string) => {
    // Fetch Enrolled Students (from enrollments table joined with students)
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('*, students(*)')
      .eq('course_id', courseId);
    if (enrollData) setEnrolledStudents(enrollData.map(e => e.students));

    // Fetch Slips for this course
    const { data: slipsData } = await supabase
      .from('slips')
      .select('*, students(full_name, index_number, whatsapp_number)')
      .eq('course_id', courseId)
      .order('submitted_at', { ascending: false });
    if (slipsData) setCourseSlips(slipsData);

    // Fetch Content
    const { data: recs } = await supabase.from('recordings').select('*').eq('course_id', courseId).order('uploaded_at', { ascending: false });
    const { data: mats } = await supabase.from('materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    const { data: qzs } = await supabase.from('quizzes').select('*').eq('course_id', courseId).order('created_at', { ascending: false });

    if (recs) setCourseRecordings(recs);
    if (mats) setCourseMaterials(mats);
    if (qzs) setCourseQuizzes(qzs);
  };

  // ===================== ACTIONS =====================

  // Create Course
  const handleCreateCourse = async (e: any) => {
    e.preventDefault();
    const { data } = await supabase.from('courses').insert([{
      title: e.target.title.value,
      grade: e.target.grade.value,
      class_type: e.target.type.value,
      monthly_fee: Number(e.target.fee.value),
    }]).select().single();

    if (data) {
      setCourses([data, ...courses]);
      setShowAddCourse(false);
    }
  };

  // Update Zoom
  const handleUpdateZoom = async (e: any) => {
    e.preventDefault();
    const zoom = e.target.zoom.value;
    await supabase.from('courses').update({ zoom_link: zoom }).eq('id', selectedCourse.id);
    setSelectedCourse({ ...selectedCourse, zoom_link: zoom });
    alert('Zoom Link Updated!');
  };

  // Register Student into Current Class
  const handleRegisterStudent = async (e: any) => {
    e.preventDefault();
    const name = e.target.name.value;
    const cleanName = name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = `st_${cleanName}${Math.floor(100 + Math.random() * 900)}`;

    const { data: newStudent } = await supabase.from('students').insert([{
      index_number: username,
      full_name: name,
      whatsapp_number: e.target.phone.value,
      grade: selectedCourse.grade
    }]).select().single();

    if (newStudent) {
      await supabase.from('enrollments').insert([{ student_id: newStudent.id, course_id: selectedCourse.id, is_active: true }]);
      alert(`Student Registered! Username: ${username}`);
      fetchCourseData(selectedCourse.id);
      e.target.reset();
    }
  };

  // Approve Slip
  const handleApproveSlip = async (slipId: string, studentId: string) => {
    await supabase.from('slips').update({ status: 'Approved' }).eq('id', slipId);
    await supabase.from('enrollments').upsert([{ student_id: studentId, course_id: selectedCourse.id, is_active: true }]);
    fetchCourseData(selectedCourse.id);
  };

  // Create Content (Recording, Tute, Quiz)
  const handleAddRecording = async (e: any) => {
    e.preventDefault();
    let videoId = e.target.vid.value;
    if (videoId.includes('v=')) videoId = videoId.split('v=')[1].split('&')[0];
    else if (videoId.includes('youtu.be/')) videoId = videoId.split('youtu.be/')[1].split('?')[0];

    await supabase.from('recordings').insert([{ course_id: selectedCourse.id, title: e.target.title.value, youtube_video_id: videoId }]);
    e.target.reset(); fetchCourseData(selectedCourse.id);
  };

  const handleAddTute = async (e: any) => {
    e.preventDefault();
    await supabase.from('materials').insert([{ course_id: selectedCourse.id, title: e.target.title.value, file_url: e.target.url.value }]);
    e.target.reset(); fetchCourseData(selectedCourse.id);
  };

  const handleAddQuiz = async (e: any) => {
    e.preventDefault();
    await supabase.from('quizzes').insert([{ 
      course_id: selectedCourse.id, title: e.target.title.value, 
      duration_minutes: Number(e.target.dur.value), per_question_timer: e.target.timer.checked, enable_watermark: e.target.wm.checked 
    }]);
    e.target.reset(); fetchCourseData(selectedCourse.id);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans">
      
      {/* GLOBAL HEADER */}
      <header className="border-b border-slate-800/80 px-6 py-4 bg-[#0c1322] sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base">Teacher Master Panel</h1>
            <span className="text-[11px] text-purple-400 font-mono tracking-wider">LMS Administration</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* =========================================================
            LEVEL 1: DASHBOARD (ALL CLASSES)
        ========================================================= */}
        {!selectedCourse ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#0c1322] border border-slate-800 p-6 rounded-3xl shadow-xl">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-400"/> Your Classes</h2>
                <p className="text-xs text-slate-400 mt-1">Select a class to manage its students, zoom links, and materials.</p>
              </div>
              <button onClick={() => setShowAddCourse(true)} className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-purple-600/20">
                <Plus className="w-4 h-4" /> Create New Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map(c => (
                <div key={c.id} onClick={() => setSelectedCourse(c)} className="bg-[#0c1322] border border-slate-800 hover:border-purple-500/50 rounded-3xl p-6 shadow-xl cursor-pointer transition group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] uppercase font-bold">{c.grade} • {c.class_type}</span>
                    <span className="font-mono text-xs font-bold text-emerald-400">Rs. {c.monthly_fee}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition leading-tight mb-4">{c.title}</h3>
                  <div className="pt-4 border-t border-slate-800 flex items-center text-xs font-semibold text-slate-400 group-hover:text-white transition">
                    Manage Class Hub ➔
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (

        /* =========================================================
            LEVEL 2: INSIDE A SPECIFIC CLASS HUB
        ========================================================= */
          <div className="space-y-6">
            
            {/* CLASS HEADER */}
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-[#0c1322] border border-purple-500/30 p-6 rounded-3xl shadow-xl">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedCourse(null)} className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 transition">
                  <ArrowLeft className="w-5 h-5 text-slate-300" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] uppercase font-bold tracking-wider">{selectedCourse.grade}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-bold tracking-wider">{selectedCourse.class_type}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{selectedCourse.title}</h2>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Total Students</div>
                <div className="text-2xl font-black text-emerald-400">{enrolledStudents.length}</div>
              </div>
            </div>

            {/* CLASS TABS */}
            <div className="flex flex-wrap items-center gap-2 bg-[#0c1322] p-2 rounded-2xl border border-slate-800">
              {[
                { id: 'overview', icon: Settings, label: 'Zoom & Overview' },
                { id: 'students', icon: Users, label: `Students (${enrolledStudents.length})` },
                { id: 'slips', icon: CreditCard, label: `Slips (${courseSlips.filter(s=>s.status==='Pending').length})` },
                { id: 'recordings', icon: PlaySquare, label: 'Recordings' },
                { id: 'materials', icon: FileText, label: 'Tutes / PDF' },
                { id: 'quizzes', icon: HelpCircle, label: 'Quizzes' },
              ].map(t => (
                <button
                  key={t.id} onClick={() => setClassTab(t.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    classTab === t.id ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 shadow-xl min-h-[500px]">
              
              {/* 1. OVERVIEW & ZOOM */}
              {classTab === 'overview' && (
                <div className="max-w-2xl space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Video className="w-5 h-5 text-blue-400"/> Class Zoom Link setup</h3>
                  <form onSubmit={handleUpdateZoom} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Live Class Zoom Link</label>
                      <input 
                        type="url" name="zoom" defaultValue={selectedCourse.zoom_link} required
                        placeholder="https://zoom.us/j/..."
                        className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono"
                      />
                    </div>
                    <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition">
                      Update Zoom Link
                    </button>
                  </form>
                </div>
              )}

              {/* 2. STUDENTS IN THIS CLASS */}
              {classTab === 'students' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Add Student to Class */}
                  <div className="lg:col-span-4 space-y-4 border-r border-slate-800 pr-4">
                    <h3 className="font-bold text-sm text-purple-400">+ Enroll New Student</h3>
                    <form onSubmit={handleRegisterStudent} className="space-y-3">
                      <input type="text" name="name" required placeholder="Student Full Name" className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
                      <input type="text" name="phone" required placeholder="WhatsApp Number" className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
                      <button type="submit" className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold">Register to this Class</button>
                    </form>
                  </div>
                  {/* List Students */}
                  <div className="lg:col-span-8 space-y-4">
                    <h3 className="font-bold text-sm">Enrolled Students ({enrolledStudents.length})</h3>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {enrolledStudents.map(st => (
                        <div key={st.id} className="p-3 bg-[#131c31] border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm">{st.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">@{st.index_number} | {st.whatsapp_number}</div>
                          </div>
                          <button onClick={() => setSelectedStudentForReport(st)} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-lg border border-purple-500/20">
                            Progress Report
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. CLASS SLIPS */}
              {classTab === 'slips' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm">Pending Slips for this Class</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courseSlips.map(slp => (
                      <div key={slp.id} className="bg-[#131c31] border border-slate-800 p-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold">{slp.students?.full_name}</span>
                          <span className="text-[10px] text-amber-400">{slp.status}</span>
                        </div>
                        <img src={slp.slip_url} alt="slip" className="w-full h-32 object-cover rounded-xl mb-3 border border-slate-700"/>
                        {slp.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveSlip(slp.id, slp.student_id)} className="flex-1 bg-emerald-600 py-1.5 rounded-lg text-[11px] font-bold text-white">Approve</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. RECORDINGS */}
              {classTab === 'recordings' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <form onSubmit={handleAddRecording} className="space-y-3">
                    <h3 className="font-bold text-sm text-red-400">+ Add YouTube Recording</h3>
                    <input type="text" name="title" required placeholder="Lesson Title" className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
                    <input type="text" name="vid" required placeholder="YouTube ID / Link" className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
                    <button type="submit" className="w-full py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold">Add Secure Video</button>
                  </form>
                  <div className="space-y-2">
                    {courseRecordings.map(rec => (
                      <div key={rec.id} className="p-3 bg-[#131c31] border border-slate-800 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-semibold">{rec.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. TUTES */}
              {classTab === 'materials' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <form onSubmit={handleAddTute} className="space-y-3">
                    <h3 className="font-bold text-sm text-emerald-400">+ Add Tute / PDF</h3>
                    <input type="text" name="title" required placeholder="Tute Title" className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
                    <input type="url" name="url" required placeholder="Drive / PDF Link" className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
                    <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">Upload Tute</button>
                  </form>
                  <div className="space-y-2">
                    {courseMaterials.map(mat => (
                      <div key={mat.id} className="p-3 bg-[#131c31] border border-slate-800 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-semibold">{mat.title}</span>
                        <a href={mat.file_url} target="_blank" rel="noreferrer" className="text-emerald-400"><Download className="w-4 h-4"/></a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. QUIZZES */}
              {classTab === 'quizzes' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <form onSubmit={handleAddQuiz} className="space-y-3">
                    <h3 className="font-bold text-sm text-amber-400">+ Create Timed Quiz</h3>
                    <input type="text" name="title" required placeholder="Quiz Title" className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
                    <input type="number" name="dur" required placeholder="Duration in Mins (e.g. 45)" className="w-full bg-[#131c31] border border-slate-700 rounded-xl px-3 py-2 text-xs" />
                    <div className="flex gap-4 text-[10px]">
                      <label><input type="checkbox" name="timer" className="mr-1"/> Per-Question Timer</label>
                      <label><input type="checkbox" name="wm" defaultChecked className="mr-1"/> Watermark</label>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-amber-600 text-slate-900 rounded-xl text-xs font-bold">Publish Quiz</button>
                  </form>
                  <div className="space-y-2">
                    {courseQuizzes.map(q => (
                      <div key={q.id} className="p-3 bg-[#131c31] border border-slate-800 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-semibold">{q.title}</span>
                        <span className="text-[10px] text-amber-400 font-mono">{q.duration_minutes} Mins</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* CREATE COURSE MODAL */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0c1322] border border-slate-800 p-6 rounded-3xl w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold">Create New Class</h2>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <input type="text" name="title" required placeholder="Class Name (e.g. Science)" className="w-full bg-[#131c31] rounded-xl px-3 py-2 text-xs" />
              <input type="text" name="grade" required placeholder="Grade (e.g. Grade 10)" className="w-full bg-[#131c31] rounded-xl px-3 py-2 text-xs" />
              <input type="text" name="type" required placeholder="Type (Theory/Revision)" className="w-full bg-[#131c31] rounded-xl px-3 py-2 text-xs" />
              <input type="number" name="fee" required placeholder="Monthly Fee" className="w-full bg-[#131c31] rounded-xl px-3 py-2 text-xs" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCourse(false)} className="flex-1 py-2 bg-slate-800 rounded-xl text-xs">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-purple-600 rounded-xl text-xs font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT PROGRESS REPORT MODAL */}
      {selectedStudentForReport && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0c1322] w-full max-w-2xl rounded-3xl p-6 print:bg-white print:text-black">
            <div className="flex justify-between mb-4 print:hidden">
              <h2 className="font-bold">Progress Report</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1 bg-purple-600 rounded-lg text-xs">Print</button>
                <button onClick={() => setSelectedStudentForReport(null)} className="px-3 py-1 bg-slate-800 rounded-lg text-xs">Close</button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-black">Smart Tuition Academy</h1>
              <div className="grid grid-cols-2 gap-4 bg-[#131c31] print:bg-slate-100 p-4 rounded-xl text-xs">
                <div><span className="text-slate-500 block">Name</span><span className="font-bold">{selectedStudentForReport.full_name}</span></div>
                <div><span className="text-slate-500 block">ID</span><span className="font-bold font-mono">{selectedStudentForReport.index_number}</span></div>
                <div><span className="text-slate-500 block">Grade</span><span className="font-bold">{selectedStudentForReport.grade}</span></div>
                <div><span className="text-slate-500 block">Class</span><span className="font-bold">{selectedCourse?.title}</span></div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#131c31] print:bg-slate-100 rounded-xl"><span className="text-[10px] text-slate-500 block">Attendance</span><span className="text-lg font-bold text-emerald-500">92%</span></div>
                <div className="p-3 bg-[#131c31] print:bg-slate-100 rounded-xl"><span className="text-[10px] text-slate-500 block">Quiz Average</span><span className="text-lg font-bold text-purple-500">85%</span></div>
                <div className="p-3 bg-[#131c31] print:bg-slate-100 rounded-xl"><span className="text-[10px] text-slate-500 block">Evaluation</span><span className="text-lg font-bold text-amber-500">Excellent</span></div>
              </div>

              <div className="h-24 flex items-end gap-2 pt-4 justify-around bg-[#131c31] print:bg-slate-100 p-4 rounded-xl">
                {[80, 75, 92, 88, 95].map((val, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold">{val}%</span>
                    <div className="w-8 bg-purple-500 rounded-t-md" style={{height: `${val}%`}}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}