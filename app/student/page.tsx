'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Video, BookOpen, Clock, 
  HelpCircle, CheckCircle2, XCircle, Award, 
  Download, ShieldCheck, PlaySquare, 
  Lock, X, CreditCard, AlertCircle, LogOut, KeyRound, Smartphone, Upload, Loader2,
  ShieldAlert, ArrowRight, MessageSquare, Play, Pause, RotateCcw, RotateCw,
  Volume2, VolumeX, Maximize
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Deterministic Hardware + Browser Fingerprint Generator
function generateHardwareFingerprint(): string {
  if (typeof window === 'undefined') return 'DEV-SSR';

  try {
    const components: string[] = [
      navigator.userAgent || '',
      navigator.language || '',
      `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      String(navigator.hardwareConcurrency || 0),
      String((navigator as any).deviceMemory || 0),
      navigator.platform || ''
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 240;
      canvas.height = 40;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(10, 5, 80, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('SmartTuitionLMS-Sec', 14, 8);
      components.push(canvas.toDataURL());
    }

    const raw = components.join('||');
    let hash1 = 5381;
    let hash2 = 52711;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash1 = (hash1 * 33) ^ char;
      hash2 = (hash2 * 33) ^ char;
    }

    const fingerprint =
      'DEV-' +
      (hash1 >>> 0).toString(16).toUpperCase().padStart(8, '0') +
      '-' +
      (hash2 >>> 0).toString(16).toUpperCase().padStart(8, '0');

    localStorage.setItem('lms_device_token', fingerprint);
    return fingerprint;
  } catch {
    let fallback = localStorage.getItem('lms_device_token');
    if (!fallback) {
      fallback = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('lms_device_token', fallback);
    }
    return fallback;
  }
}

function getColomboDateInfo() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); // 'YYYY-MM-DD'
  const currentMonth = todayStr.slice(0, 7); // 'YYYY-MM'
  const dayOfMonth = Number(todayStr.slice(8, 10));
  return { todayStr, currentMonth, dayOfMonth };
}

function formatMonthLabel(ym: string): string {
  if (!ym || !ym.includes('-')) return ym;
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getSelectableBillingMonths(baseYm: string): string[] {
  if (!baseYm || !baseYm.includes('-')) return [];
  const [y, m] = baseYm.split('-').map(Number);
  const offsets = [-1, 0, 1];
  return offsets.map((offset) => {
    const d = new Date(y, (m || 1) - 1 + offset, 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mo}`;
  });
}

export default function StudentPortal() {
  const [dateInfo, setDateInfo] = useState({ todayStr: '', currentMonth: '', dayOfMonth: 1 });
  const { todayStr, currentMonth, dayOfMonth } = dateInfo;

  const [studentInfo, setStudentInfo] = useState<any | null>(null);
  const [currentCourse, setCurrentCourse] = useState<any | null>(null);
  const [enrollmentInfo, setEnrollmentInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Course Dynamic Data
  const [activeMeeting, setActiveMeeting] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [mySubmissionsMap, setMySubmissionsMap] = useState<Record<string, any>>({});
  const [recordings, setRecordings] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');

  // Protected LMS Video Player States & Refs
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [watermarkPos, setWatermarkPos] = useState({ top: '18%', left: '14%' });

  // Secure Zoom Join & Verified Attendance States
  const [isJoiningZoom, setIsJoiningZoom] = useState(false);
  const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(null);
  const [verifiedStayMinutes, setVerifiedStayMinutes] = useState<number>(0);
  const [minRequiredMinutes, setMinRequiredMinutes] = useState<number>(30);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);

  // Monthly Bank Slip File Upload States
  const [selectedBillingMonth, setSelectedBillingMonth] = useState<string>('');
  const [studentSlips, setStudentSlips] = useState<any[]>([]);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  // Exam & Quiz Execution States
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Anti-Cheat States
  const [tabStrikes, setTabStrikes] = useState<number>(0);
  const [cheatAlertMsg, setCheatAlertMsg] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Compute Flexible Access Control (Free Card / Extension Date / 1st-15th Grace Period / Current Month Approved Slip)
  const currentMonthSlip = studentSlips.find((s) => (s.billing_month || '') === currentMonth) || null;
  const selectedMonthSlip = studentSlips.find((s) => (s.billing_month || '') === selectedBillingMonth) || null;

  const isFreeCard = Boolean(enrollmentInfo?.is_free_card);
  const hasValidExtension = Boolean(todayStr && enrollmentInfo?.access_until && todayStr <= enrollmentInfo.access_until);
  const isWithinGracePeriod = Boolean(todayStr) && dayOfMonth <= 15;
  const isCurrentMonthApproved = currentMonthSlip?.status === 'Approved';

  const isUnlocked = isFreeCard || hasValidExtension || isWithinGracePeriod || isCurrentMonthApproved;

  useEffect(() => {
    const info = getColomboDateInfo();
    setDateInfo(info);
    setSelectedBillingMonth(info.currentMonth);

    const savedStudent = localStorage.getItem('lms_student_session');
    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        verifyAndLoadStudent(parsed.id);
      } catch {
        localStorage.removeItem('lms_student_session');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Initialize Protected YouTube IFrame API Player
  useEffect(() => {
    if (!activeVideoId || !isUnlocked) {
      setIsVideoReady(false);
      setIsPlaying(false);
      setVideoCurrentTime(0);
      setVideoDuration(0);
      return;
    }

    let isCancelled = false;
    let progressTimer: ReturnType<typeof setInterval> | null = null;

    const initPlayer = () => {
      if (isCancelled || !playerContainerRef.current) return;

      playerContainerRef.current.innerHTML = '';
      const mountDiv = document.createElement('div');
      mountDiv.style.width = '100%';
      mountDiv.style.height = '100%';
      playerContainerRef.current.appendChild(mountDiv);

      ytPlayerRef.current = new window.YT.Player(mountDiv, {
        videoId: activeVideoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : ''
        },
        events: {
          onReady: (event: any) => {
            if (isCancelled) return;
            setIsVideoReady(true);
            setVideoDuration(event.target.getDuration() || 0);
            event.target.playVideo();
            setIsPlaying(true);

            progressTimer = setInterval(() => {
              if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
                setVideoCurrentTime(ytPlayerRef.current.getCurrentTime() || 0);
                const dur = ytPlayerRef.current.getDuration();
                if (dur) setVideoDuration(dur);
              }
            }, 500);
          },
          onStateChange: (event: any) => {
            if (isCancelled) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    const wmTimer = setInterval(() => {
      const tops = ['14%', '28%', '52%', '68%', '40%'];
      const lefts = ['10%', '48%', '24%', '56%', '18%'];
      const randIdx = Math.floor(Math.random() * tops.length);
      setWatermarkPos({ top: tops[randIdx], left: lefts[randIdx] });
    }, 6000);

    return () => {
      isCancelled = true;
      if (progressTimer) clearInterval(progressTimer);
      clearInterval(wmTimer);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // Ignore destroy error
        }
        ytPlayerRef.current = null;
      }
    };
  }, [activeVideoId, isUnlocked]);

  const handleToggleVideoPlay = () => {
    if (!ytPlayerRef.current || !isVideoReady) return;
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleSkipVideo = (deltaSeconds: number) => {
    if (!ytPlayerRef.current || !isVideoReady) return;
    const current = ytPlayerRef.current.getCurrentTime() || 0;
    const target = Math.max(0, Math.min(videoDuration, current + deltaSeconds));
    ytPlayerRef.current.seekTo(target, true);
    setVideoCurrentTime(target);
  };

  const handleSeekVideo = (newTime: number) => {
    if (!ytPlayerRef.current || !isVideoReady) return;
    ytPlayerRef.current.seekTo(newTime, true);
    setVideoCurrentTime(newTime);
  };

  const handleToggleMute = () => {
    if (!ytPlayerRef.current || !isVideoReady) return;
    if (isMuted) {
      ytPlayerRef.current.unMute();
      setIsMuted(false);
    } else {
      ytPlayerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleChangePlaybackSpeed = (rate: number) => {
    if (!ytPlayerRef.current || !isVideoReady) return;
    ytPlayerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
  };

  const handleToggleProtectedFullscreen = () => {
    if (!playerWrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      playerWrapperRef.current.requestFullscreen().catch(() => {});
    }
  };

  const formatVideoSeconds = (totalSecs: number) => {
    const s = Math.floor(totalSecs || 0);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const currentDeviceId = generateHardwareFingerprint();

      const res = await fetch('/api/student-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword.trim(),
          deviceFingerprint: currentDeviceId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed. Please check your credentials.');
        setIsLoggingIn(false);
        return;
      }

      localStorage.setItem('lms_student_session', JSON.stringify(data.student));
      await verifyAndLoadStudent(data.student.id);
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
    setEnrollmentInfo(null);
  };

  const verifyAndLoadStudent = async (studentId: string) => {
    setLoading(true);
    const { data: stu } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
    if (!stu) {
      handleLogout();
      setLoading(false);
      return;
    }

    const currentDeviceId = generateHardwareFingerprint();
    if (!stu.device_id) {
      await supabase.from('students').update({ device_id: currentDeviceId }).eq('id', stu.id);
    } else if (stu.device_id !== currentDeviceId) {
      handleLogout();
      setLoginError('⚠️ Your account is locked to a different device. Please contact your teacher to unlock your device.');
      setLoading(false);
      return;
    }

    setStudentInfo({
      id: stu.id,
      name: stu.full_name,
      indexNo: stu.index_number,
      phone: stu.whatsapp_number
    });

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', stu.id)
      .limit(1)
      .maybeSingle();

    if (enrollments && enrollments.courses) {
      const course = enrollments.courses as any;
      setCurrentCourse(course);
      setEnrollmentInfo(enrollments);

      const { data: mtg } = await supabase
        .from('zoom_meetings')
        .select('*')
        .eq('course_id', course.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setActiveMeeting(mtg);
      if (mtg?.min_attendance_minutes) {
        setMinRequiredMinutes(mtg.min_attendance_minutes);
      }

      const { data: mat } = await supabase.from('materials').select('*').eq('course_id', course.id);
      const { data: qz } = await supabase.from('quizzes').select('*').eq('course_id', course.id).order('created_at', { ascending: false });
      const { data: rec } = await supabase.from('recordings').select('*').eq('course_id', course.id);
      const { data: slp } = await supabase
        .from('slips')
        .select('*')
        .eq('student_id', stu.id)
        .eq('course_id', course.id)
        .order('submitted_at', { ascending: false });
      const { data: subs } = await supabase.from('quiz_submissions').select('*').eq('student_id', stu.id).order('submitted_at', { ascending: false });

      if (mat) setMaterials(mat);
      if (qz) setQuizzes(qz);
      if (rec) setRecordings(rec);
      if (slp) setStudentSlips(slp);

      if (subs) {
        const subMap: Record<string, any> = {};
        subs.forEach((s: any) => {
          if (!subMap[s.quiz_id]) subMap[s.quiz_id] = s;
        });
        setMySubmissionsMap(subMap);
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayAtt } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', stu.id)
        .eq('course_id', course.id)
        .gte('marked_at', todayStart.toISOString())
        .order('marked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (todayAtt) {
        setActiveAttendanceId(todayAtt.id);
        setVerifiedStayMinutes(todayAtt.verified_minutes || 0);
        setAttendanceStatus(todayAtt.status);
      }
    }

    setLoading(false);
  };

  // Periodic Attendance Verification Heartbeat
  useEffect(() => {
    if (!activeAttendanceId || !studentInfo || !currentCourse || attendanceStatus === 'Present') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/zoom/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attendanceId: activeAttendanceId,
            studentId: studentInfo.id,
            courseId: currentCourse.id
          })
        });

        if (res.ok) {
          const data = await res.json();
          setVerifiedStayMinutes(data.verifiedMinutes || 0);
          setMinRequiredMinutes(data.minRequiredMinutes || 30);
          setAttendanceStatus(data.status);
        }
      } catch {
        // Ignore transient network hiccup
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeAttendanceId, studentInfo, currentCourse, attendanceStatus]);

  const handleJoinClass = async () => {
    if (!isUnlocked) {
      alert('Access Locked: The monthly fee grace period (1st–15th) has ended. Please upload your bank slip for this month or contact your teacher.');
      return;
    }

    if (!studentInfo || !currentCourse) return;
    setIsJoiningZoom(true);

    try {
      const currentDeviceId = generateHardwareFingerprint();

      const res = await fetch('/api/zoom/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentInfo.id,
          courseId: currentCourse.id,
          deviceFingerprint: currentDeviceId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Unable to join live class.');
        setIsJoiningZoom(false);
        return;
      }

      setActiveAttendanceId(data.attendanceId);
      setVerifiedStayMinutes(data.verifiedMinutes || 0);
      setMinRequiredMinutes(data.minRequiredMinutes || 30);
      setAttendanceStatus(data.status || 'Joined (Verifying)');

      window.open(data.joinUrl, '_blank');
    } catch (err: any) {
      alert('Zoom Join Error: ' + err.message);
    } finally {
      setIsJoiningZoom(false);
    }
  };

  const handleUploadSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMonth = selectedBillingMonth || getColomboDateInfo().currentMonth;
    if (!slipFile || !currentCourse || !studentInfo || !targetMonth) return;
    setIsUploadingSlip(true);

    try {
      const fileExt = slipFile.name.split('.').pop() || 'jpg';
      const filePath = `slips/${studentInfo.indexNo}_${targetMonth}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lms-files')
        .upload(filePath, slipFile, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('lms-files')
        .getPublicUrl(filePath);

      const { data: insertedSlip, error: dbError } = await supabase
        .from('slips')
        .insert([
          {
            student_id: studentInfo.id,
            course_id: currentCourse.id,
            billing_month: targetMonth,
            slip_url: urlData.publicUrl,
            status: 'Pending'
          }
        ])
        .select()
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (insertedSlip) {
        setStudentSlips((prev) => [insertedSlip, ...prev]);
      }
      setSlipFile(null);
      alert(`Bank slip for ${formatMonthLabel(targetMonth)} uploaded successfully! Waiting for teacher approval.`);
    } catch (err: any) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleStartQuiz = async (quiz: any) => {
    if (!isUnlocked) {
      alert('Access Locked: Please upload your bank slip for this month or contact your teacher to take online exams.');
      return;
    }

    if (quiz.assessment_type === 'Online Exam' && mySubmissionsMap[quiz.id]) {
      alert('You have already completed this Online Exam. Only one attempt is permitted.');
      return;
    }

    const { data: qData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id).order('id', { ascending: true });
    if (qData && qData.length > 0) {
      let preparedQuestions = [...qData];
      if (quiz.assessment_type === 'Online Exam') {
        preparedQuestions = preparedQuestions.sort(() => Math.random() - 0.5);
      }

      isSubmittingRef.current = false;
      setQuestions(preparedQuestions);
      setActiveQuiz(quiz);
      setCurrentQuestionIdx(0);
      setTimeLeft((quiz.duration_minutes || 20) * 60);
      setQuestionTimeLeft(quiz.per_question_seconds || 60);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setScore(0);
      setTabStrikes(0);
      setCheatAlertMsg(null);

      if (quiz.assessment_type === 'Online Exam' && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      alert('Questions have not been added to this exam/quiz yet.');
    }
  };

  useEffect(() => {
    if (!activeQuiz || quizSubmitted) return;

    const isPerQuestion = activeQuiz.timer_mode === 'per_question';

    const timer = setInterval(() => {
      if (isPerQuestion) {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            setCurrentQuestionIdx((currIdx) => {
              if (currIdx + 1 < questions.length) {
                setQuestionTimeLeft(activeQuiz.per_question_seconds || 60);
                return currIdx + 1;
              } else {
                clearInterval(timer);
                handleSubmitQuiz(tabStrikes);
                return currIdx;
              }
            });
            return activeQuiz.per_question_seconds || 60;
          }
          return prev - 1;
        });
      } else {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitQuiz(tabStrikes);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, quizSubmitted, questions.length, tabStrikes]);

  useEffect(() => {
    if (!activeQuiz || quizSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabStrikes((prev) => {
          const nextStrike = prev + 1;
          if (nextStrike >= 3) {
            setCheatAlertMsg('⚠️ Security Violation (3/3): Exam auto-submitted due to repeated tab switching.');
            handleSubmitQuiz(nextStrike);
          } else {
            setCheatAlertMsg(
              `⚠️ Anti-Cheat Warning (${nextStrike}/3): Do not switch tabs or leave the exam window! On 3 warnings your exam will auto-submit.`
            );
          }
          return nextStrike;
        });
      }
    };

    const preventCheatingAction = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', preventCheatingAction);
    document.addEventListener('cut', preventCheatingAction);
    document.addEventListener('paste', preventCheatingAction);
    document.addEventListener('contextmenu', preventCheatingAction);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', preventCheatingAction);
      document.removeEventListener('cut', preventCheatingAction);
      document.removeEventListener('paste', preventCheatingAction);
      document.removeEventListener('contextmenu', preventCheatingAction);
    };
  }, [activeQuiz, quizSubmitted]);

  const handleNextPerQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setQuestionTimeLeft(activeQuiz.per_question_seconds || 60);
    } else {
      handleSubmitQuiz(tabStrikes);
    }
  };

  const handleSubmitQuiz = async (finalTabStrikes = tabStrikes) => {
    if (isSubmittingRef.current || quizSubmitted) return;
    isSubmittingRef.current = true;

    let earnedMarks = 0;
    questions.forEach((q) => {
      const ans = selectedAnswers[q.id];
      if (q.question_type === 'free_answer') {
        if (
          q.sample_answer &&
          typeof ans === 'string' &&
          ans.trim().toLowerCase() === q.sample_answer.trim().toLowerCase()
        ) {
          earnedMarks += q.marks || 10;
        }
      } else {
        if (ans === q.correct_option) {
          earnedMarks += q.marks || 10;
        }
      }
    });

    setScore(earnedMarks);
    setQuizSubmitted(true);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    if (activeQuiz && studentInfo) {
      const { data: insertedSub } = await supabase
        .from('quiz_submissions')
        .insert([{
          quiz_id: activeQuiz.id,
          student_id: studentInfo.id,
          score: earnedMarks,
          total_questions: questions.length,
          answers: selectedAnswers,
          tab_switches: finalTabStrikes
        }])
        .select()
        .single();

      if (insertedSub) {
        setMySubmissionsMap((prev) => ({
          ...prev,
          [activeQuiz.id]: insertedSub
        }));
      }
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
            <img
              src="/logo.jpg"
              alt="Science Hub - Jaffna"
              className="w-16 h-16 rounded-full object-cover bg-white p-0.5 mx-auto shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50"
            />
            <h2 className="text-xl font-black text-white">Science Hub - Jaffna</h2>
            <p className="text-xs text-slate-400">Student Portal Login • Education changes the world</p>
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
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Hardware 1-Device Security Active
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

  const selectableMonths = getSelectableBillingMonths(currentMonth);
  const isSelectedMonthLockedForUpload =
    selectedMonthSlip?.status === 'Approved' || selectedMonthSlip?.status === 'Pending';

  // ================= VIEW 3: STUDENT DASHBOARD =================
  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-purple-500 selection:text-white pb-12">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 bg-[#0c1322] sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Science Hub - Jaffna"
            className="w-10 h-10 rounded-full object-cover bg-white p-0.5 shadow-md ring-2 ring-emerald-400/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm">{studentInfo?.name}</h1>
              <span className="hidden md:inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Science Hub - Jaffna
              </span>
            </div>
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
            <p className="text-xs text-slate-400">Please contact your teacher at Science Hub - Jaffna to get your Index Number registered for the class.</p>
          </div>
        ) : (
          <>
            {/* FLEXIBLE MONTHLY PAYMENT STATUS & SLIP BANNER */}
            <div className={`p-1 rounded-2xl border bg-gradient-to-r ${
              isFreeCard || isCurrentMonthApproved
                ? 'from-emerald-900/40 to-teal-900/20 border-emerald-500/30'
                : hasValidExtension
                ? 'from-blue-900/40 to-indigo-900/20 border-blue-500/30'
                : currentMonthSlip?.status === 'Pending'
                ? 'from-amber-900/40 to-yellow-900/20 border-amber-500/30'
                : !isUnlocked
                ? 'from-red-900/40 to-rose-900/20 border-red-500/30'
                : 'from-purple-900/40 to-pink-900/20 border-purple-500/30'
            }`}>
              <div className="bg-[#0c1322] rounded-xl p-5 md:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CreditCard className={`w-5 h-5 ${
                      isFreeCard || isCurrentMonthApproved ? 'text-emerald-400' : 
                      !isUnlocked ? 'text-red-400' : 'text-purple-400'
                    }`} />
                    <h3 className="font-bold text-sm text-white">{currentCourse.title} - Class Fees</h3>
                    {currentMonth && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {formatMonthLabel(currentMonth)}
                      </span>
                    )}
                  </div>
                  
                  {isFreeCard ? (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Free Card Active — Full access granted to all classes and materials.
                    </div>
                  ) : isCurrentMonthApproved ? (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Payment verified for {formatMonthLabel(currentMonth)}. Full access active.
                    </div>
                  ) : hasValidExtension ? (
                    <div className="text-xs text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 flex-shrink-0 text-blue-400" />
                      <span>
                        Teacher Temporary Access granted until <strong>{enrollmentInfo.access_until}</strong>. Please upload your {formatMonthLabel(currentMonth)} slip before that date.
                      </span>
                    </div>
                  ) : currentMonthSlip?.status === 'Pending' ? (
                    <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Bank slip for {formatMonthLabel(currentMonth)} is Pending approval. {isWithinGracePeriod ? 'Grace period access is currently active.' : 'Lessons will unlock once approved.'}
                      </span>
                    </div>
                  ) : isWithinGracePeriod ? (
                    <div className="text-xs text-purple-300 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20 inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 flex-shrink-0 text-purple-400" />
                      <span>
                        Grace Period Active (1st–15th): Monthly Fee <strong className="text-emerald-400 font-mono">Rs. {currentCourse.monthly_fee}/-</strong> is due before the <strong>15th</strong> to keep lessons unlocked.
                      </span>
                    </div>
                  ) : currentMonthSlip?.status === 'Rejected' ? (
                    <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 inline-flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Bank slip for {formatMonthLabel(currentMonth)} was rejected. Please upload a valid slip (Rs. {currentCourse.monthly_fee}/-) to unlock lessons.
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-red-300 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 inline-flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>
                        Grace period (1st–15th) ended. Upload your bank slip for <strong>{formatMonthLabel(currentMonth)}</strong> (Rs. {currentCourse.monthly_fee}/-) to unlock lessons.
                      </span>
                    </div>
                  )}
                </div>

                {/* Month Selector + Bank Slip Upload Form (Hidden for Free Card holders) */}
                {!isFreeCard && (
                  <form onSubmit={handleUploadSlip} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                    <select
                      value={selectedBillingMonth}
                      onChange={(e) => setSelectedBillingMonth(e.target.value)}
                      className="bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      {selectableMonths.map((ym) => (
                        <option key={ym} value={ym}>
                          {formatMonthLabel(ym)}
                        </option>
                      ))}
                    </select>

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={isUploadingSlip || isSelectedMonthLockedForUpload}
                      onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                      className="flex-1 min-w-[210px] bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600/20 file:text-purple-400 hover:file:bg-purple-600/30 cursor-pointer disabled:opacity-50"
                      required
                    />

                    <button
                      type="submit"
                      disabled={isUploadingSlip || isSelectedMonthLockedForUpload || !slipFile}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 flex-shrink-0"
                    >
                      {isUploadingSlip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>
                        {selectedMonthSlip?.status === 'Approved'
                          ? 'Paid'
                          : selectedMonthSlip?.status === 'Pending'
                          ? 'Pending'
                          : isUploadingSlip
                          ? 'Uploading...'
                          : 'Submit Slip'}
                      </span>
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
                      ? `Scheduled Duration: ${activeMeeting.duration_minutes} mins • Minimum stay required for Present mark: ${minRequiredMinutes} mins.`
                      : 'Once the Zoom session is ready, click Join Class to connect with your personal verified entry.'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
              </div>

              {activeMeeting && isUnlocked && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-[#070b14] p-3 rounded-xl border border-slate-800/60 w-fit">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Personal Single-User Zoom Access • Display Name Locked to <strong className="text-purple-400 font-mono">[{studentInfo?.indexNo}]</strong>
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isUnlocked ? (
                  <button
                    disabled
                    className="px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 bg-slate-800/80 border border-slate-700 text-slate-400 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Locked • Monthly Payment Required</span>
                  </button>
                ) : (
                  <button
                    onClick={handleJoinClass}
                    disabled={isJoiningZoom || (!activeMeeting?.join_url && !currentCourse.zoom_link)}
                    className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition ${
                      activeMeeting?.join_url || currentCourse.zoom_link 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isJoiningZoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>{isJoiningZoom ? 'Generating Personal Entry...' : 'Join Live Class (Protected Entry)'}</span>
                  </button>
                )}

                {attendanceStatus === 'Present' && isUnlocked && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Attendance Verified ({verifiedStayMinutes}m)!
                  </span>
                )}

                {attendanceStatus && attendanceStatus !== 'Present' && isUnlocked && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                    <Clock className="w-4 h-4 animate-pulse" />
                    Verifying Attendance: {verifiedStayMinutes} / {minRequiredMinutes} mins completed (Keep this tab open during class)
                  </span>
                )}
              </div>
            </div>

            {/* RECORDINGS, TUTES, EXAMS & QUIZZES */}
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
                            onClick={() => {
                              setActiveVideoTitle(rec.title);
                              setActiveVideoId(rec.youtube_video_id);
                            }}
                            className="w-full py-2 rounded-xl bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 text-xs font-semibold transition cursor-pointer"
                          >
                            Watch Lesson
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400" /> Locked (Payment Required)
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
                  <BookOpen className="w-4 h-4 text-emerald-400" /> Tutes &amp; Handouts ({materials.length})
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
                          <span title="Monthly payment required to download" className="p-2 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed">
                            <Lock className="w-4 h-4 text-amber-400" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exams & Quizzes */}
              <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" /> Exams &amp; Quizzes ({quizzes.length})
                </h3>
                {quizzes.length === 0 ? (
                  <p className="text-xs text-slate-500">No exams or quizzes available.</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {quizzes.map((q) => {
                      const prevSub = mySubmissionsMap[q.id];
                      const isExam = q.assessment_type === 'Online Exam';
                      const isPerQ = q.timer_mode === 'per_question';

                      return (
                        <div key={q.id} className="p-3.5 rounded-2xl bg-[#131c31] border border-slate-700/50 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                                isExam
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {q.assessment_type || 'Quiz'}
                            </span>
                            {prevSub && (
                              <span className="text-[10px] font-mono font-bold text-emerald-400">
                                Score: {prevSub.score}/{q.total_marks || 100}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs text-white line-clamp-1">{q.title}</h4>

                          {prevSub?.teacher_feedback && (
                            <p className="text-[10px] text-blue-300 bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20 flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                              <span>{prevSub.teacher_feedback}</span>
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {isPerQ ? `${q.per_question_seconds || 60}s / Q` : `${q.duration_minutes} Mins`}
                            </span>

                            {!isUnlocked ? (
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-[11px] font-bold flex items-center gap-1 cursor-not-allowed"
                              >
                                <Lock className="w-3 h-3 text-amber-400" /> Locked
                              </button>
                            ) : isExam && prevSub ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                Completed
                              </span>
                            ) : (
                              <button
                                onClick={() => handleStartQuiz(q)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  isExam
                                    ? 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white'
                                    : 'bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-900'
                                }`}
                              >
                                {isExam ? 'Start Exam' : prevSub ? 'Retake Quiz' : 'Start Quiz'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* PROTECTED ANTI-SHARE LMS LESSON STREAM MODAL */}
      {activeVideoId && isUnlocked && (
        <div
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none"
        >
          <div className="bg-[#0c1322] border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" /> Science Hub - Jaffna Protected Stream
                </span>
                <h4 className="text-xs font-bold text-white truncate">{activeVideoTitle}</h4>
              </div>
              <button
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  setActiveVideoId(null);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={playerWrapperRef}
              onContextMenu={(e) => e.preventDefault()}
              className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 flex flex-col justify-between"
            >
              <div className="relative w-full pt-[56.25%] bg-black overflow-hidden">
                <div
                  ref={playerContainerRef}
                  className="absolute inset-0 w-full h-full pointer-events-none scale-[1.02]"
                />

                <div
                  onClick={handleToggleVideoPlay}
                  onContextMenu={(e) => e.preventDefault()}
                  className="absolute inset-0 z-20 cursor-pointer bg-transparent"
                />

                <div
                  style={{ top: watermarkPos.top, left: watermarkPos.left }}
                  className="pointer-events-none select-none absolute z-30 transition-all duration-1000 px-3 py-1 rounded-lg bg-black/35 border border-white/10 text-[11px] font-mono font-bold text-white/40"
                >
                  Science Hub - Jaffna • {studentInfo?.name} • {studentInfo?.indexNo} • {studentInfo?.phone}
                </div>

                {!isPlaying && isVideoReady && (
                  <button
                    type="button"
                    onClick={handleToggleVideoPlay}
                    className="absolute inset-0 z-25 m-auto w-16 h-16 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white flex items-center justify-center shadow-2xl transition cursor-pointer"
                  >
                    <Play className="w-7 h-7 fill-white ml-0.5" />
                  </button>
                )}
              </div>

              <div className="relative z-30 bg-[#070b14] border-t border-slate-800/90 px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
                    {formatVideoSeconds(videoCurrentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 100}
                    step={1}
                    value={videoCurrentTime}
                    onChange={(e) => handleSeekVideo(Number(e.target.value))}
                    className="flex-1 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-400 w-12">
                    {formatVideoSeconds(videoDuration)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleVideoPlay}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkipVideo(-10)}
                      title="Rewind 10 seconds"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>10s</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkipVideo(10)}
                      title="Forward 10 seconds"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>10s</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[#0c1322] border border-slate-800 rounded-xl px-2 py-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Speed:</span>
                      {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleChangePlaybackSpeed(rate)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                            playbackRate === rate
                              ? 'bg-purple-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleProtectedFullscreen}
                      title="Fullscreen"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECURE ONLINE EXAM & QUIZ MODAL */}
      {activeQuiz && isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto select-none">
          <div className="bg-[#0c1322] border border-slate-800 text-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
            {activeQuiz.enable_watermark && (
              <div className="pointer-events-none select-none fixed inset-0 z-20 flex items-center justify-center overflow-hidden opacity-[0.05] rotate-[-25deg]">
                <div className="text-center font-mono font-black text-2xl text-white space-y-12">
                  <p>Science Hub - Jaffna • {studentInfo?.name} • {studentInfo?.indexNo}</p>
                  <p>{currentCourse?.title} • {activeQuiz.title}</p>
                  <p>{studentInfo?.name} • {studentInfo?.indexNo} • {studentInfo?.phone}</p>
                </div>
              </div>
            )}

            <div className="sticky top-0 bg-[#0c1322]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-30">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      activeQuiz.assessment_type === 'Online Exam'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {activeQuiz.assessment_type || 'Quiz'}
                  </span>
                  <h3 className="font-bold text-sm text-white">{activeQuiz.title}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeQuiz.timer_mode === 'per_question'
                    ? `Question ${currentQuestionIdx + 1} of ${questions.length} • Locked Auto-Advance Mode`
                    : `${questions.length} Questions • Anti-Cheat Guard Active`}
                </span>
              </div>

              {!quizSubmitted && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono font-bold text-sm">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>
                    {activeQuiz.timer_mode === 'per_question'
                      ? formatTime(questionTimeLeft)
                      : formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {quizSubmitted && (
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>

            <div className="p-6 space-y-6 relative z-10">
              {cheatAlertMsg && !quizSubmitted && (
                <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-pulse">
                  <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="font-semibold">{cheatAlertMsg}</span>
                </div>
              )}

              {quizSubmitted && (
                <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/40 p-6 rounded-2xl text-center space-y-2">
                  <Award className="w-12 h-12 text-yellow-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">{activeQuiz.assessment_type || 'Quiz'} Submitted!</h4>
                  <p className="text-3xl font-black text-purple-300">
                    Score: {score} / {questions.reduce((a, b) => a + (b.marks || 10), 0)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Your answers have been recorded for your teacher&apos;s review at Science Hub - Jaffna.
                  </p>
                </div>
              )}

              {!quizSubmitted && activeQuiz.timer_mode === 'per_question' && questions[currentQuestionIdx] && (() => {
                const q = questions[currentQuestionIdx];
                const studentAns = selectedAnswers[q.id];

                return (
                  <div className="space-y-5">
                    <div className="bg-[#070b14] border border-slate-800/80 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Question {currentQuestionIdx + 1} / {questions.length}</span>
                        <span className="text-purple-400">{q.marks || 10} Marks</span>
                      </div>

                      <h5 className="font-semibold text-base text-white leading-relaxed">
                        {currentQuestionIdx + 1}. {q.question_text}
                      </h5>

                      {q.question_type === 'free_answer' ? (
                        <div className="space-y-2">
                          <label className="text-[11px] text-slate-400 block">Type your answer below:</label>
                          <textarea
                            rows={3}
                            placeholder="Write your answer here..."
                            value={typeof studentAns === 'string' ? studentAns : ''}
                            onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            className="w-full bg-[#0c1322] border border-slate-700 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-purple-500 select-text"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {(q.options || []).map((opt: string, optIdx: number) => {
                            const isSelected = studentAns === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                className={`w-full text-left p-3.5 rounded-xl border text-xs transition cursor-pointer ${
                                  isSelected
                                    ? 'border-purple-500 bg-purple-500/20 text-white font-bold'
                                    : 'border-slate-700 bg-[#0c1322] text-slate-300 hover:border-purple-500/50'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextPerQuestion}
                      className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-lg shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>
                        {currentQuestionIdx + 1 < questions.length
                          ? 'Save & Next Question (Cannot Return)'
                          : 'Submit Final Answers'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}

              {(quizSubmitted || activeQuiz.timer_mode !== 'per_question') && (
                <>
                  <div className="space-y-4">
                    {questions.map((q, qIdx) => {
                      const studentAns = selectedAnswers[q.id];
                      const isFree = q.question_type === 'free_answer';
                      const isCorrect = isFree
                        ? Boolean(
                            q.sample_answer &&
                              typeof studentAns === 'string' &&
                              studentAns.trim().toLowerCase() === q.sample_answer.trim().toLowerCase()
                          )
                        : studentAns === q.correct_option;

                      return (
                        <div key={q.id} className="bg-[#070b14] border border-slate-800/80 p-5 rounded-2xl space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="font-semibold text-sm text-slate-200">
                              {qIdx + 1}. {q.question_text}
                            </h5>
                            {quizSubmitted && (
                              isFree ? (
                                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 flex-shrink-0">
                                  Submitted for Review
                                </span>
                              ) : isCorrect ? (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex-shrink-0">
                                  <CheckCircle2 className="w-3 h-3" /> Correct
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 flex-shrink-0">
                                  <XCircle className="w-3 h-3" /> Incorrect
                                </span>
                              )
                            )}
                          </div>

                          {isFree ? (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                disabled={quizSubmitted}
                                placeholder="Type your answer here..."
                                value={typeof studentAns === 'string' ? studentAns : ''}
                                onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-full bg-[#0c1322] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 select-text"
                              />
                              {quizSubmitted && q.sample_answer && (
                                <p className="text-[11px] text-emerald-400">
                                  Expected Answer: <strong>{q.sample_answer}</strong>
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(q.options || []).map((opt: string, optIdx: number) => {
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
                                    type="button"
                                    disabled={quizSubmitted}
                                    onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition ${optStyle}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted && (
                    <button
                      type="button"
                      onClick={() => handleSubmitQuiz(tabStrikes)}
                      className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-lg shadow-purple-600/30 cursor-pointer"
                    >
                      Submit Answers
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}