'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, Video, BookOpen, Clock, 
  HelpCircle, CheckCircle2, XCircle, Award, 
  ArrowLeft, Download, ShieldCheck, PlaySquare, 
  Lock, X, CreditCard, AlertCircle
} from 'lucide-react';

export default function StudentPortal() {
  const [currentCourse, setCurrentCourse] = useState<any | null>(null);
  const [studentInfo, setStudentInfo] = useState<any | null>(null);
  const [noClassFound, setNoClassFound] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const [slipUrl, setSlipUrl] = useState('');
  const [slipStatus, setSlipStatus] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // 1. Direct Fetching Fallback for Demo
  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        // Step A: කෙළින්ම students table එකේ අන්තිමට හදපු ළමයා ගනිමු
        const { data: latestStudent } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestStudent) {
          setStudentInfo({
            id: latestStudent.id,
            name: latestStudent.full_name,
            indexNo: latestStudent.index_number,
            phone: latestStudent.whatsapp_number
          });

          // Step B: කෙළින්ම courses table එකේ අන්තිමට හදපු පන්තිය ගනිමු
          const { data: latestCourse } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (latestCourse) {
            setCurrentCourse(latestCourse);

            // Step C: ඒ පන්තියට අදාළ දත්ත ටික අදින්න
            const { data: mat } = await supabase.from('materials').select('*').eq('course_id', latestCourse.id);
            const { data: qz } = await supabase.from('quizzes').select('*').eq('course_id', latestCourse.id);
            const { data: rec } = await supabase.from('recordings').select('*').eq('course_id', latestCourse.id);
            const { data: slp } = await supabase.from('slips').select('*').eq('student_id', latestStudent.id).eq('course_id', latestCourse.id).order('submitted_at', { ascending: false }).limit(1);

            if (mat) setMaterials(mat);
            if (qz) setQuizzes(qz);
            if (rec) setRecordings(rec);
            if (slp && slp.length > 0) setSlipStatus(slp[0].status);
            
            return; // Success
          }
        }
        
        // No Data
        setNoClassFound(true);
      } catch (err) {
        console.error(err);
        setNoClassFound(true);
      }
    };

    fetchDemoData();
  }, []);

  const handleUploadSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipUrl || !currentCourse || !studentInfo) return;
    setIsUploadingSlip(true);

    const { error } = await supabase.from('slips').insert([
      { student_id: studentInfo.id, course_id: currentCourse.id, slip_url: slipUrl, status: 'Pending' }
    ]);

    if (!error) {
      setSlipStatus('Pending');
      setSlipUrl('');
      alert('ඔබගේ බැංකු රිසිට්පත සාර්ථකව යොමු කෙරිණි.');
    }
    setIsUploadingSlip(false);
  };

  const handleJoinClass = async () => {
    if (!currentCourse?.zoom_link) {
      alert('මෙම පන්තිය සඳහා Zoom Link එකක් තවම සකසා නොමැත.');
      return;
    }
    await supabase.from('attendance').insert([{ student_id: studentInfo.id, course_id: currentCourse.id, duration_minutes: 120, status: 'Present' }]);
    setAttendanceMarked(true);
    window.open(currentCourse.zoom_link, '_blank');
  };

  const handleStartQuiz = async (quiz: any) => {
    const { data: qData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
    if (qData && qData.length > 0) {
      setQuestions(qData);
      setActiveQuiz(quiz);
      setTimeLeft(quiz.duration_minutes * 60);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setScore(0);
    } else {
      alert('මෙම විභාගය සඳහා ප්‍රශ්න තවම ඇතුළත් කර නොමැත.');
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
      await supabase.from('quiz_submissions').insert([{ quiz_id: activeQuiz.id, student_id: studentInfo.id, score: earnedMarks, total_questions: questions.length, answers: selectedAnswers }]);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (noClassFound) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-bold text-white">කිසිදු පන්තියකට ඔබව ලියාපදිංචි කර නැත</h2>
        <p className="text-xs text-center max-w-md">කරුණාකර ගුරුතුමාට දන්වා ඔබව පන්තියකට Enroll කරවා ගන්න.</p>
        <Link href="/teacher" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition">
          Admin Panel එකට යන්න ➔
        </Link>
      </div>
    );
  }

  if (!currentCourse || !studentInfo) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono">Loading dynamic student details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-purple-500 selection:text-white pb-12">
      
      <header className="border-b border-slate-800/80 px-6 py-4 bg-[#0c1322] sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm">{studentInfo.name}</h1>
            <span className="text-[11px] font-mono text-purple-400">ID: {studentInfo.indexNo}</span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> 1 Device Verified
        </span>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">

        {/* TOP BANNER: PAYMENT & SLIP UPLOAD */}
        <div className={`p-1 rounded-2xl border bg-gradient-to-r ${
          slipStatus === 'Approved' ? 'from-emerald-900/40 to-teal-900/20 border-emerald-500/30' : 
          slipStatus === 'Pending' ? 'from-amber-900/40 to-yellow-900/20 border-amber-500/30' : 
          'from-purple-900/40 to-pink-900/20 border-purple-500/30'
        }`}>
          <div className="bg-[#0c1322] rounded-xl p-5 md:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-5 h-5 ${slipStatus === 'Approved' ? 'text-emerald-400' : 'text-purple-400'}`} />
                  <h3 className="font-bold text-sm text-white">පන්ති ගාස්තු ගෙවීම් (Subscription Status)</h3>
                </div>
                
                {slipStatus === 'Approved' ? (
                  <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 
                    <span className="font-semibold">ගෙවීම් තහවුරු කර ඇත. පන්තියේ පාඩම් සඳහා ඔබට පූර්ණ ප්‍රවේශය ඇත.</span>
                  </div>
                ) : slipStatus === 'Pending' ? (
                  <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> 
                    <span className="font-semibold">රිසිට්පත යොමු කර ඇත (Pending). ගුරුතුමා විසින් අනුමත කරන තෙක් රැඳී සිටින්න.</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300">
                    {currentCourse.title} සඳහා මාසික ගාස්තුව <strong className="text-emerald-400 font-mono text-sm">Rs. {currentCourse.monthly_fee}/-</strong> කි. පහතින් Bank Slip එක Upload කරන්න.
                  </div>
                )}
              </div>

              {/* Upload Form */}
              {slipStatus !== 'Approved' && (
                <form onSubmit={handleUploadSlip} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <input
                    type="url"
                    placeholder="Bank Slip URL / Drive Link..."
                    value={slipUrl}
                    onChange={(e) => setSlipUrl(e.target.value)}
                    className="flex-1 min-w-[250px] bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isUploadingSlip || slipStatus === 'Pending'}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-50 shadow-lg shadow-purple-600/30 whitespace-nowrap cursor-pointer"
                  >
                    {isUploadingSlip ? 'Uploading...' : 'Submit Slip'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Live Zoom Class */}
        <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                {currentCourse.grade} • {currentCourse.class_type}
              </span>
              <h2 className="text-lg font-bold text-white">{currentCourse.title}</h2>
              <p className="text-xs text-slate-400">පන්තිය සූදානම්. Join Class ඔබා සජීවීව සම්බන්ධ වී Attendance සලකුණු කරගන්න.</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleJoinClass}
              disabled={!currentCourse.zoom_link}
              className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition ${
                currentCourse.zoom_link 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Join Live Class</span>
            </button>
            {attendanceMarked && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Attendance සටහන් විය!
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <PlaySquare className="w-4 h-4 text-red-400" /> Past Recordings
            </h3>
            {recordings.length === 0 ? (
              <p className="text-xs text-slate-500">No recordings available yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {recordings.map((rec) => (
                  <div key={rec.id} className="p-3.5 rounded-2xl bg-[#131c31] border border-slate-700/50 hover:border-red-500/30 transition">
                    <h4 className="font-bold text-xs text-white line-clamp-1 mb-2">{rec.title}</h4>
                    <button
                      onClick={() => setActiveVideoId(rec.youtube_video_id)}
                      className="w-full py-2 rounded-xl bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 text-xs font-semibold transition cursor-pointer"
                    >
                      Watch Lesson
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" /> Tutes & Handouts
            </h3>
            {materials.length === 0 ? (
              <p className="text-xs text-slate-500">No Tutes uploaded yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {materials.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-[#131c31] border border-slate-700/50 flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white line-clamp-1 pr-2">{m.title}</h4>
                    <a
                      href={m.file_url} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" /> Quizzes & Papers
            </h3>
            {quizzes.length === 0 ? (
              <p className="text-xs text-slate-500">No active quizzes.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {quizzes.map((q) => (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-[#131c31] border border-slate-700/50 space-y-2">
                    <h4 className="font-bold text-xs text-white line-clamp-1">{q.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">{q.duration_minutes} Mins</span>
                      <button
                        onClick={() => handleStartQuiz(q)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-900 text-[11px] font-bold transition cursor-pointer"
                      >
                        Start Exam
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </main>

      {/* VIDEO MODAL PLAYER */}
      {activeVideoId && (
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
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* QUIZ MODAL */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#0c1322] border border-slate-800 text-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
            
            {activeQuiz.enable_watermark && (
              <div className="pointer-events-none select-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden opacity-[0.06] rotate-[-25deg]">
                <div className="text-center font-mono font-black text-xl text-white space-y-6">
                  <p>{studentInfo.name} • {studentInfo.phone}</p>
                  <p>{studentInfo.indexNo} • {currentCourse?.title}</p>
                </div>
              </div>
            )}

            <div className="sticky top-0 bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-30">
              <div>
                <h3 className="font-bold text-sm text-white">{activeQuiz.title}</h3>
                <span className="text-[10px] text-slate-400">ප්‍රශ්න {questions.length} කින් සමන්විතයි</span>
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
                  <h4 className="text-lg font-bold text-white">ප්‍රශ්නාවලිය සාර්ථකව අවසන්!</h4>
                  <p className="text-3xl font-black text-purple-300">
                    ලකුණු: {score} / {questions.reduce((a, b) => a + (b.marks || 10), 0)}
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
                              <CheckCircle2 className="w-3 h-3" /> නිවැරදියි
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                              <XCircle className="w-3 h-3" /> වැරදියි
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
                  පිළිතුරු Submit කරන්න
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}