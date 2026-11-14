'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Users, BookOpen, Video, HelpCircle, Plus, 
  Settings, CheckCircle2, XCircle, ExternalLink, 
  ArrowLeft, Loader2, KeyRound, 
  Radio, Share2, Layers, AlertCircle, 
  Unlock, CreditCard, PlaySquare, FileText, Trash2,
  Copy, Key, BarChart3, Award, Calendar, X, Lock, LogOut, Upload, Clock,
  ShieldAlert, MessageSquare, ChevronDown, ChevronUp, Edit3, RefreshCw,
  TrendingUp, TrendingDown, Minus, Printer, ShieldCheck
} from 'lucide-react';

interface DraftQuestion {
  question_type: 'mcq' | 'free_answer';
  question_text: string;
  options: string[];
  correct_option: number;
  sample_answer: string;
  marks: number;
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

export default function TeacherMasterDashboard() {
  const [dateInfo, setDateInfo] = useState({ todayStr: '', currentMonth: '', dayOfMonth: 1 });
  const { todayStr, currentMonth, dayOfMonth } = dateInfo;

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

  // Student Flexible Payment & Access Override Modal States
  const [selectedStudentForAccess, setSelectedStudentForAccess] = useState<any | null>(null);
  const [manualPayMonth, setManualPayMonth] = useState<string>('');
  const [extensionDateInput, setExtensionDateInput] = useState<string>('');
  const [freeCardToggle, setFreeCardToggle] = useState<boolean>(false);
  const [isSavingAccessOverride, setIsSavingAccessOverride] = useState<boolean>(false);

  // Student Performance Report Modal States
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any | null>(null);
  const [studentQuizResults, setStudentQuizResults] = useState<any[]>([]);
  const [studentAttendanceLogs, setStudentAttendanceLogs] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Detailed Submission Inspection & Teacher Remark States
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const [submissionQuestionsMap, setSubmissionQuestionsMap] = useState<Record<string, any[]>>({});
  const [remarkInputs, setRemarkInputs] = useState<Record<string, string>>({});
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [savingFeedbackId, setSavingFeedbackId] = useState<string | null>(null);

  // Zoom Meeting Creator inside Course Hub
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('120');
  const [minAttendanceMins, setMinAttendanceMins] = useState('30');
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);
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

  // Multi-Question Exam & Quiz Builder States
  const [editingExistingQuiz, setEditingExistingQuiz] = useState<any | null>(null);
  const [assessmentType, setAssessmentType] = useState<'Quiz' | 'Online Exam'>('Online Exam');
  const [timerMode, setTimerMode] = useState<'whole_exam' | 'per_question'>('whole_exam');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState('30');
  const [perQuestionSeconds, setPerQuestionSeconds] = useState('60');

  const [quizQuestionsList, setQuizQuestionsList] = useState<DraftQuestion[]>([]);
  const [questionType, setQuestionType] = useState<'mcq' | 'free_answer'>('mcq');
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctOpt, setCorrectOpt] = useState('0');
  const [sampleAnswer, setSampleAnswer] = useState('');
  const [qMarks, setQMarks] = useState('10');
  const [isPublishingQuiz, setIsPublishingQuiz] = useState(false);

  useEffect(() => {
    const info = getColomboDateInfo();
    setDateInfo(info);
    setManualPayMonth(info.currentMonth);

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
      setNewGrade('');
      setNewFee('');
      fetchCourses();
    }
    setIsSubmittingCourse(false);
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${courseTitle}"?`)) return;
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (!error) {
      fetchCourses();
    } else {
      alert('Error deleting class: ' + error.message);
    }
  };

  const openCourseManager = async (course: any) => {
    setSelectedCourse(course);
    setMeetingTopic(course.title + ' - Live Class');
    await loadCourseDetails(course.id);
  };

  const loadCourseDetails = async (courseId: string) => {
    const activeMonth = currentMonth || getColomboDateInfo().currentMonth;

    const { data: mtg } = await supabase.from('zoom_meetings').select('*').eq('course_id', courseId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    setActiveMeeting(mtg || null);

    const { data: slp } = await supabase
      .from('slips')
      .select('*, students(full_name, index_number, whatsapp_number)')
      .eq('course_id', courseId)
      .order('submitted_at', { ascending: false });
    if (slp) setSlips(slp);

    let { data: enr, error: enrErr } = await supabase
      .from('enrollments')
      .select('student_id, is_active, is_free_card, access_until, students(*)')
      .eq('course_id', courseId);

    if (enrErr) {
      const fallbackEnr = await supabase
        .from('enrollments')
        .select('student_id, is_active, students(*)')
        .eq('course_id', courseId);
      enr = fallbackEnr.data as any;
    }

    if (enr) {
      const approvedStudentIdsThisMonth = new Set(
        (slp || [])
          .filter((s: any) => s.status === 'Approved' && (s.billing_month || '') === activeMonth)
          .map((s: any) => s.student_id)
      );

      setStudents(
        enr
          .filter((e: any) => e.students)
          .map((e: any) => ({
            ...e.students,
            is_active: e.is_active,
            is_free_card: Boolean(e.is_free_card),
            access_until: e.access_until || '',
            is_current_month_paid: approvedStudentIdsThisMonth.has(e.student_id)
          }))
      );
    }

    const { data: mat } = await supabase.from('materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    if (mat) setMaterials(mat);

    const { data: rec } = await supabase.from('recordings').select('*').eq('course_id', courseId).order('uploaded_at', { ascending: false });
    if (rec) setRecordings(rec);

    const { data: qz } = await supabase.from('quizzes').select('*, quiz_questions(count)').eq('course_id', courseId).order('created_at', { ascending: false });
    if (qz) setQuizzes(qz);
  };

  // Flexible Payment & Access Override Handlers
  const handleOpenAccessModal = (student: any) => {
    const activeMonth = currentMonth || getColomboDateInfo().currentMonth;
    setSelectedStudentForAccess(student);
    setManualPayMonth(activeMonth);
    setExtensionDateInput(student.access_until || '');
    setFreeCardToggle(Boolean(student.is_free_card));
  };

  const handleSaveEnrollmentAccessRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAccess || !selectedCourse) return;
    setIsSavingAccessOverride(true);

    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          is_free_card: freeCardToggle,
          access_until: extensionDateInput.trim() || null
        })
        .eq('student_id', selectedStudentForAccess.id)
        .eq('course_id', selectedCourse.id);

      if (error) throw new Error(error.message);

      await loadCourseDetails(selectedCourse.id);
      setSelectedStudentForAccess(null);
      alert('Student access rules updated successfully!');
    } catch (err: any) {
      alert('Error updating access: ' + err.message);
    } finally {
      setIsSavingAccessOverride(false);
    }
  };

  const handleManualMarkMonthPaid = async () => {
    const targetMonth = manualPayMonth || getColomboDateInfo().currentMonth;
    if (!selectedStudentForAccess || !selectedCourse || !targetMonth) return;
    setIsSavingAccessOverride(true);

    try {
      const { data: existingSlip } = await supabase
        .from('slips')
        .select('id')
        .eq('student_id', selectedStudentForAccess.id)
        .eq('course_id', selectedCourse.id)
        .eq('billing_month', targetMonth)
        .limit(1)
        .maybeSingle();

      if (existingSlip) {
        const { error } = await supabase
          .from('slips')
          .update({ status: 'Approved' })
          .eq('id', existingSlip.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('slips').insert([
          {
            student_id: selectedStudentForAccess.id,
            course_id: selectedCourse.id,
            billing_month: targetMonth,
            slip_url: 'MANUAL_TEACHER_APPROVAL',
            status: 'Approved'
          }
        ]);
        if (error) throw new Error(error.message);
      }

      await loadCourseDetails(selectedCourse.id);
      setSelectedStudentForAccess(null);
      alert(`${selectedStudentForAccess.full_name} marked as PAID for ${formatMonthLabel(targetMonth)}!`);
    } catch (err: any) {
      alert('Error marking payment: ' + err.message);
    } finally {
      setIsSavingAccessOverride(false);
    }
  };

  // Student Performance Report Viewer Logic
  const handleOpenStudentReport = async (student: any) => {
    setSelectedStudentForReport(student);
    setExpandedSubmissionId(null);
    setLoadingReport(true);

    try {
      const { data: qSubs } = await supabase
        .from('quiz_submissions')
        .select('*, quizzes(title, duration_minutes, total_marks, assessment_type, timer_mode)')
        .eq('student_id', student.id)
        .order('submitted_at', { ascending: false });

      if (qSubs) {
        setStudentQuizResults(qSubs);
        const initialRemarks: Record<string, string> = {};
        const initialScores: Record<string, string> = {};
        qSubs.forEach((sub: any) => {
          initialRemarks[sub.id] = sub.teacher_feedback || '';
          initialScores[sub.id] = String(sub.score ?? 0);
        });
        setRemarkInputs(initialRemarks);
        setScoreInputs(initialScores);
      }

      const { data: attLogs } = await supabase
        .from('attendance')
        .select('*, courses(title)')
        .eq('student_id', student.id)
        .order('marked_at', { ascending: false });

      if (attLogs) setStudentAttendanceLogs(attLogs);
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const getProgressAnalytics = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const isSameMonthYear = (dateStr: string, m: number, y: number) => {
      const d = new Date(dateStr);
      return d.getMonth() === m && d.getFullYear() === y;
    };

    const verifiedAttendance = studentAttendanceLogs.filter(
      (a) => a.status === 'Present' || !String(a.status || '').startsWith('Joined')
    );

    const thisMonthAtt = verifiedAttendance.filter((a) => isSameMonthYear(a.marked_at, thisMonth, thisYear)).length;
    const lastMonthAtt = verifiedAttendance.filter((a) => isSameMonthYear(a.marked_at, lastMonth, lastMonthYear)).length;
    const attDiff = thisMonthAtt - lastMonthAtt;

    const calcPct = (sub: any) => {
      const total = Number(sub.quizzes?.total_marks || 100);
      return total > 0 ? Math.round((Number(sub.score || 0) / total) * 100) : 0;
    };

    const thisMonthQuizzes = studentQuizResults.filter((q) => isSameMonthYear(q.submitted_at, thisMonth, thisYear));
    const lastMonthQuizzes = studentQuizResults.filter((q) => isSameMonthYear(q.submitted_at, lastMonth, lastMonthYear));

    const thisMonthAvg =
      thisMonthQuizzes.length > 0
        ? Math.round(thisMonthQuizzes.reduce((acc, q) => acc + calcPct(q), 0) / thisMonthQuizzes.length)
        : 0;

    const lastMonthAvg =
      lastMonthQuizzes.length > 0
        ? Math.round(lastMonthQuizzes.reduce((acc, q) => acc + calcPct(q), 0) / lastMonthQuizzes.length)
        : 0;

    const scoreDiff = thisMonthAvg - lastMonthAvg;

    const overallAvg =
      studentQuizResults.length > 0
        ? Math.round(studentQuizResults.reduce((acc, q) => acc + calcPct(q), 0) / studentQuizResults.length)
        : 0;

    const thisMonthLabel = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const lastMonthLabel = lastMonthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    return {
      thisMonthLabel,
      lastMonthLabel,
      thisMonthAtt,
      lastMonthAtt,
      attDiff,
      thisMonthAvg,
      lastMonthAvg,
      scoreDiff,
      overallAvg,
      verifiedAttendanceCount: verifiedAttendance.length,
      chronologicalQuizzes: [...studentQuizResults].reverse().slice(-8)
    };
  };

  const handlePrintParentReport = () => {
    if (!selectedStudentForReport) return;
    const analytics = getProgressAnalytics();
    const stu = selectedStudentForReport;
    const courseTitle = selectedCourse?.title || 'Science Class';
    const logoUrl = `${window.location.origin}/logo.jpg`;
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const examRowsHtml =
      studentQuizResults.length === 0
        ? `<tr><td colspan="5" style="text-align:center;color:#64748b;padding:14px;">No exams or quizzes attempted yet.</td></tr>`
        : studentQuizResults
            .map((res) => {
              const total = Number(res.quizzes?.total_marks || 100);
              const pct = total > 0 ? Math.round((Number(res.score || 0) / total) * 100) : 0;
              return `
                <tr>
                  <td><strong>${res.quizzes?.title || 'Online Exam'}</strong><br/><span style="font-size:10px;color:#64748b;">${res.quizzes?.assessment_type || 'Quiz'}</span></td>
                  <td>${new Date(res.submitted_at).toLocaleDateString()}</td>
                  <td><strong>${res.score} / ${total}</strong></td>
                  <td><span class="badge ${pct >= 75 ? 'badge-green' : pct >= 50 ? 'badge-blue' : 'badge-amber'}">${pct}%</span></td>
                  <td>${res.teacher_feedback || '-'}</td>
                </tr>
              `;
            })
            .join('');

    const attRowsHtml =
      studentAttendanceLogs.length === 0
        ? `<tr><td colspan="4" style="text-align:center;color:#64748b;padding:14px;">No attendance logs recorded yet.</td></tr>`
        : studentAttendanceLogs
            .map(
              (att) => `
              <tr>
                <td><strong>${att.courses?.title || courseTitle}</strong></td>
                <td>${new Date(att.marked_at).toLocaleDateString()}</td>
                <td>${att.verified_minutes || att.duration_minutes || 0} mins</td>
                <td><span class="badge ${att.status === 'Present' ? 'badge-green' : 'badge-amber'}">${att.status}</span></td>
              </tr>
            `
            )
            .join('');

    const chartBarsHtml =
      analytics.chronologicalQuizzes.length === 0
        ? `<p style="font-size:11px;color:#64748b;text-align:center;padding:16px;">No exam scores available to chart yet.</p>`
        : analytics.chronologicalQuizzes
            .map((q) => {
              const total = Number(q.quizzes?.total_marks || 100);
              const pct = total > 0 ? Math.min(100, Math.round((Number(q.score || 0) / total) * 100)) : 0;
              const barColor = pct >= 75 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';
              const shortTitle = (q.quizzes?.title || 'Exam').slice(0, 14);
              return `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
                  <span style="font-size:10px;font-weight:700;color:#1e293b;">${pct}%</span>
                  <div style="width:100%;max-width:38px;height:90px;background:#e2e8f0;border-radius:6px;display:flex;align-items:flex-end;overflow:hidden;">
                    <div style="width:100%;height:${pct}%;background:${barColor};border-radius:6px 6px 0 0;"></div>
                  </div>
                  <span style="font-size:9px;color:#475569;text-align:center;line-height:1.1;">${shortTitle}</span>
                </div>
              `;
            })
            .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      alert('Please allow pop-ups in your browser to download/print the PDF report.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Science Hub - Jaffna | Progress Report - ${stu.full_name} (${stu.index_number})</title>
          <style>
            * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
            body { margin: 0; padding: 28px; color: #0f172a; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
            .brand { display: flex; align-items: center; gap: 14px; }
            .brand img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid #10b981; padding: 2px; background: #ffffff; }
            .title { font-size: 21px; font-weight: 800; color: #064e3b; margin: 0; }
            .subtitle { font-size: 12px; color: #475569; margin: 3px 0 0; }
            .student-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; }
            .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
            .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px; }
            .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; background: #ffffff; }
            .card-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; }
            .card-val { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            .section-title { font-size: 13px; font-weight: 800; color: #1e1b4b; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 18px; }
            th { background: #f1f5f9; text-align: left; padding: 9px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #334155; }
            td { padding: 8px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            .badge-amber { background: #fef3c7; color: #92400e; }
            .footer { margin-top: 32px; display: flex; justify-content: space-between; font-size: 11px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 16px; }
            @media print {
              body { padding: 12px; }
              @page { size: A4; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <img src="${logoUrl}" alt="Science Hub - Jaffna" />
              <div>
                <h1 class="title">SCIENCE HUB - JAFFNA</h1>
                <p class="subtitle">Official Student Progress Report • Education changes the world</p>
              </div>
            </div>
            <div style="text-align:right;font-size:11px;color:#475569;">
              <strong>Issued Date:</strong> ${reportDate}<br/>
              <strong>Class:</strong> ${courseTitle}
            </div>
          </div>

          <div class="student-box">
            <div>
              <div style="color:#64748b;font-size:10px;font-weight:700;">STUDENT NAME</div>
              <div style="font-size:15px;font-weight:800;color:#0f172a;">${stu.full_name}</div>
            </div>
            <div>
              <div style="color:#64748b;font-size:10px;font-weight:700;">INDEX NUMBER</div>
              <div style="font-size:14px;font-weight:700;color:#059669;">${stu.index_number}</div>
            </div>
            <div>
              <div style="color:#64748b;font-size:10px;font-weight:700;">CONTACT / WHATSAPP</div>
              <div style="font-size:13px;font-weight:600;">${stu.whatsapp_number}</div>
            </div>
          </div>

          <div class="grid-3">
            <div class="card">
              <div class="card-label">Verified Classes Attended</div>
              <div class="card-val">${analytics.verifiedAttendanceCount} Sessions</div>
            </div>
            <div class="card">
              <div class="card-label">Exams & Quizzes Completed</div>
              <div class="card-val">${studentQuizResults.length} Assessments</div>
            </div>
            <div class="card">
              <div class="card-label">Overall Exam Average</div>
              <div class="card-val" style="color:#059669;">${analytics.overallAvg}%</div>
            </div>
          </div>

          <div class="section-title">Month-over-Month Development Comparison (${analytics.lastMonthLabel} vs ${analytics.thisMonthLabel})</div>
          <div class="grid-2">
            <div class="card">
              <div class="card-label">Attendance Development</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;">
                <span>${analytics.lastMonthLabel}: <strong>${analytics.lastMonthAtt} days</strong></span>
                <span>${analytics.thisMonthLabel}: <strong>${analytics.thisMonthAtt} days</strong></span>
                <span class="badge ${analytics.attDiff >= 0 ? 'badge-green' : 'badge-amber'}">
                  ${analytics.attDiff > 0 ? `+${analytics.attDiff} Improved ↑` : analytics.attDiff === 0 ? 'Consistent →' : `${analytics.attDiff} Lower ↓`}
                </span>
              </div>
            </div>
            <div class="card">
              <div class="card-label">Exam Score Development</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;">
                <span>${analytics.lastMonthLabel}: <strong>${analytics.lastMonthAvg}%</strong></span>
                <span>${analytics.thisMonthLabel}: <strong>${analytics.thisMonthAvg}%</strong></span>
                <span class="badge ${analytics.scoreDiff >= 0 ? 'badge-green' : 'badge-amber'}">
                  ${analytics.scoreDiff > 0 ? `+${analytics.scoreDiff}% Improved ↑` : analytics.scoreDiff === 0 ? 'Steady →' : `${analytics.scoreDiff}% Drop ↓`}
                </span>
              </div>
            </div>
          </div>

          <div class="section-title">Exam & Quiz Performance Chart</div>
          <div class="card" style="display:flex;align-items:flex-end;gap:12px;min-height:135px;margin-bottom:20px;">
            ${chartBarsHtml}
          </div>

          <div class="section-title">Exam Marks & Teacher Remarks</div>
          <table>
            <thead>
              <tr>
                <th>Exam / Quiz Title</th>
                <th>Date</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Teacher Remark</th>
              </tr>
            </thead>
            <tbody>${examRowsHtml}</tbody>
          </table>

          <div class="section-title">Class Attendance Log</div>
          <table>
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Date</th>
                <th>Verified Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${attRowsHtml}</tbody>
          </table>

          <div class="footer">
            <div>Science Hub - Jaffna • Official Learning Portal</div>
            <div>___________________________<br/>Class Teacher Signature</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleToggleSubmissionDetails = async (submission: any) => {
    if (expandedSubmissionId === submission.id) {
      setExpandedSubmissionId(null);
      return;
    }

    setExpandedSubmissionId(submission.id);

    if (!submissionQuestionsMap[submission.quiz_id]) {
      const { data: qList } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', submission.quiz_id)
        .order('id', { ascending: true });

      if (qList) {
        setSubmissionQuestionsMap((prev) => ({
          ...prev,
          [submission.quiz_id]: qList
        }));
      }
    }
  };

  const handleSaveSubmissionFeedback = async (submissionId: string) => {
    setSavingFeedbackId(submissionId);
    try {
      const updatedFeedback = remarkInputs[submissionId] ?? '';
      const updatedScore = Number(scoreInputs[submissionId]);

      const { error } = await supabase
        .from('quiz_submissions')
        .update({
          teacher_feedback: updatedFeedback,
          score: isNaN(updatedScore) ? 0 : updatedScore
        })
        .eq('id', submissionId);

      if (error) throw new Error(error.message);

      setStudentQuizResults((prev) =>
        prev.map((item) =>
          item.id === submissionId
            ? { ...item, teacher_feedback: updatedFeedback, score: isNaN(updatedScore) ? item.score : updatedScore }
            : item
        )
      );

      alert('Teacher remark and score saved for this exam!');
    } catch (err: any) {
      alert('Error saving feedback: ' + err.message);
    } finally {
      setSavingFeedbackId(null);
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
          minAttendanceMinutes: Number(minAttendanceMins) || 30,
          courseId: selectedCourse.id
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create meeting');

      await loadCourseDetails(selectedCourse.id);
      alert('Zoom Live Meeting created with Anti-Link-Sharing & Attendance Verification!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const handleSyncZoomAttendance = async () => {
    if (!selectedCourse || !activeMeeting?.meeting_id) {
      alert('No active Zoom meeting ID found to sync.');
      return;
    }

    setIsSyncingAttendance(true);
    try {
      const res = await fetch('/api/zoom/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          meetingId: activeMeeting.meeting_id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync Zoom attendance');

      alert(
        `Zoom Attendance Synced!\n\nTotal Zoom Participants Found: ${data.totalParticipantsFound}\nEnrolled Students Verified: ${data.syncedCount}`
      );
    } catch (err: any) {
      alert('Sync Notice: ' + err.message);
    } finally {
      setIsSyncingAttendance(false);
    }
  };

  const handleCopyWhatsAppText = () => {
    if (!activeMeeting || !selectedCourse) return;
    const portalUrl = `${window.location.origin}/student`;
    const msg = `📢 *Science Hub - Jaffna | ${selectedCourse.title} - Live Zoom Class*\n\n` +
      `📌 Topic: ${activeMeeting.topic}\n` +
      `⏱️ Duration: ${activeMeeting.duration_minutes} Minutes\n\n` +
      `🔐 *Protected LMS Class Entry:*\n` +
      `Log in to your Student Portal and click *"Join Live Class"* to enter:\n${portalUrl}\n\n` +
      `⚠️ Note: Direct links are disabled for security. You must stay at least ${activeMeeting.min_attendance_minutes || 30} mins for attendance to be marked.`;

    navigator.clipboard.writeText(msg);
    alert('Secure LMS Class Invite copied to clipboard!');
  };

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

      const credText = `🎓 *Welcome to Science Hub - Jaffna (${selectedCourse.title})*\n\n` +
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
    const credText = `🎓 *Welcome to Science Hub - Jaffna (${selectedCourse.title})*\n\n` +
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
    
    const trimmed = recordingId.trim();
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = trimmed.match(regExp);
    const cleanId = match ? match[1] : trimmed;

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

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to remove this tute?')) return;
    await supabase.from('materials').delete().eq('id', materialId);
    if (selectedCourse) loadCourseDetails(selectedCourse.id);
  };

  const handleAddQuestionToList = () => {
    if (!qText.trim()) {
      alert('Please enter the question text.');
      return;
    }

    if (questionType === 'mcq') {
      if (!opt0.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim()) {
        alert('Please enter all 4 answer options for an MCQ question.');
        return;
      }
    }

    const newQuestion: DraftQuestion = {
      question_type: questionType,
      question_text: qText.trim(),
      options: questionType === 'mcq' ? [opt0.trim(), opt1.trim(), opt2.trim(), opt3.trim()] : [],
      correct_option: questionType === 'mcq' ? Number(correctOpt) : 0,
      sample_answer: questionType === 'free_answer' ? sampleAnswer.trim() : '',
      marks: Number(qMarks) || 10
    };

    setQuizQuestionsList((prev) => [...prev, newQuestion]);
    setQText('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setSampleAnswer('');
    setCorrectOpt('0');
  };

  const handleRemoveDraftQuestion = (indexToRemove: number) => {
    setQuizQuestionsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleStartAddingMoreQuestions = (quiz: any) => {
    setEditingExistingQuiz(quiz);
    setQuizTitle(quiz.title);
    setAssessmentType(quiz.assessment_type || 'Online Exam');
    setTimerMode(quiz.timer_mode || 'whole_exam');
    setQuizDuration(String(quiz.duration_minutes || 30));
    setPerQuestionSeconds(String(quiz.per_question_seconds || 60));
    setQuizQuestionsList([]);
  };

  const handleCancelEditingQuiz = () => {
    setEditingExistingQuiz(null);
    setQuizTitle('');
    setQuizQuestionsList([]);
    setQText('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setSampleAnswer('');
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!editingExistingQuiz && !quizTitle.trim()) return;

    const finalQuestions: DraftQuestion[] = [...quizQuestionsList];

    if (qText.trim()) {
      if (questionType === 'mcq' && opt0.trim() && opt1.trim() && opt2.trim() && opt3.trim()) {
        finalQuestions.push({
          question_type: 'mcq',
          question_text: qText.trim(),
          options: [opt0.trim(), opt1.trim(), opt2.trim(), opt3.trim()],
          correct_option: Number(correctOpt),
          sample_answer: '',
          marks: Number(qMarks) || 10
        });
      } else if (questionType === 'free_answer') {
        finalQuestions.push({
          question_type: 'free_answer',
          question_text: qText.trim(),
          options: [],
          correct_option: 0,
          sample_answer: sampleAnswer.trim(),
          marks: Number(qMarks) || 10
        });
      }
    }

    if (finalQuestions.length === 0) {
      alert('Please add at least one complete question before saving.');
      return;
    }

    setIsPublishingQuiz(true);
    try {
      const addedMarks = finalQuestions.reduce((sum, item) => sum + (item.marks || 10), 0);

      if (editingExistingQuiz) {
        const questionRows = finalQuestions.map((item) => ({
          quiz_id: editingExistingQuiz.id,
          question_type: item.question_type,
          question_text: item.question_text,
          options: item.options,
          correct_option: item.correct_option,
          sample_answer: item.sample_answer,
          marks: item.marks
        }));

        const { error: qInsertErr } = await supabase.from('quiz_questions').insert(questionRows);
        if (qInsertErr) throw new Error(qInsertErr.message);

        const newTotalMarks = Number(editingExistingQuiz.total_marks || 0) + addedMarks;
        await supabase
          .from('quizzes')
          .update({ total_marks: newTotalMarks })
          .eq('id', editingExistingQuiz.id);

        handleCancelEditingQuiz();
        await loadCourseDetails(selectedCourse.id);
        alert(`${finalQuestions.length} additional question(s) added to "${editingExistingQuiz.title}"!`);
      } else {
        const { data: qz, error: qzErr } = await supabase.from('quizzes').insert([{
          course_id: selectedCourse.id,
          title: quizTitle.trim(),
          assessment_type: assessmentType,
          timer_mode: timerMode,
          duration_minutes: timerMode === 'whole_exam' ? (Number(quizDuration) || 30) : Math.max(1, Math.ceil((finalQuestions.length * (Number(perQuestionSeconds) || 60)) / 60)),
          per_question_seconds: Number(perQuestionSeconds) || 60,
          enable_watermark: true,
          total_marks: addedMarks
        }]).select().single();

        if (qzErr || !qz) {
          throw new Error(qzErr?.message || 'Failed to create exam/quiz.');
        }

        const questionRows = finalQuestions.map((item) => ({
          quiz_id: qz.id,
          question_type: item.question_type,
          question_text: item.question_text,
          options: item.options,
          correct_option: item.correct_option,
          sample_answer: item.sample_answer,
          marks: item.marks
        }));

        const { error: qInsertErr } = await supabase.from('quiz_questions').insert(questionRows);
        if (qInsertErr) {
          throw new Error(qInsertErr.message);
        }

        handleCancelEditingQuiz();
        await loadCourseDetails(selectedCourse.id);
        alert(`${assessmentType} "${qz.title}" published successfully with ${finalQuestions.length} question(s)!`);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsPublishingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this exam/quiz and all its questions?')) return;
    await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
    await supabase.from('quiz_submissions').delete().eq('quiz_id', quizId);
    await supabase.from('quizzes').delete().eq('id', quizId);
    if (editingExistingQuiz?.id === quizId) handleCancelEditingQuiz();
    if (selectedCourse) loadCourseDetails(selectedCourse.id);
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
            <img
              src="/logo.jpg"
              alt="Science Hub - Jaffna"
              className="w-16 h-16 rounded-full object-cover bg-white p-0.5 mx-auto shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50"
            />
            <h2 className="text-xl font-black text-white">Science Hub - Jaffna</h2>
            <p className="text-xs text-slate-400">Teacher Master Login • Education changes the world</p>
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

  const reportAnalytics = selectedStudentForReport ? getProgressAnalytics() : null;
  const selectableMonths = getSelectableBillingMonths(currentMonth);

  // ================= AUTHENTICATED TEACHER DASHBOARD =================
  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 bg-[#0c1322] sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <img
            src="/logo.jpg"
            alt="Science Hub - Jaffna"
            className="w-10 h-10 rounded-full object-cover bg-white p-0.5 shadow-md ring-2 ring-emerald-400/40"
          />
          <div>
            <h1 className="font-bold text-sm tracking-wide">Science Hub - Jaffna</h1>
            <p className="text-[10px] text-emerald-400 font-mono">Teacher Master Panel</p>
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
                <h2 className="text-xl font-black">Science Hub - Jaffna Classes</h2>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCourseManager(c)}
                        className="flex-1 py-2.5 bg-slate-800/80 hover:bg-purple-600 hover:text-white text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" /> Manage Class Hub
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c.id, c.title)}
                        title="Delete Class"
                        className="p-2.5 bg-slate-800/80 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                <BookOpen className="w-4 h-4" /> Tutes &amp; Notes ({materials.length})
              </button>

              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'quizzes' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Exams &amp; Quizzes ({quizzes.length})
              </button>
            </div>

            {/* TAB 1: ZOOM */}
            {activeTab === 'zoom' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form onSubmit={handleCreateZoomMeeting} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Create Protected Zoom Meeting</h3>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Class Topic</label>
                      <input
                        type="text" value={meetingTopic} onChange={(e) => setMeetingTopic(e.target.value)}
                        placeholder="e.g. Unit 05 Discussion" className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Total Duration (Minutes)</label>
                        <input
                          type="number" min="10" value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)}
                          placeholder="120" className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white" required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-emerald-400 font-semibold mb-1 block">Min. Attendance Stay (Mins)</label>
                        <input
                          type="number" min="1" value={minAttendanceMins} onChange={(e) => setMinAttendanceMins(e.target.value)}
                          placeholder="30" className="w-full bg-[#070b14] border border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-white" required
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      * Anti-Link-Sharing &amp; Waiting Room enabled: Only enrolled, approved students logged in from their 1-device-locked LMS account can enter. Students leaving before <strong>{minAttendanceMins || 30} mins</strong> are not marked Present.
                    </p>
                  </div>

                  <button
                    type="submit" disabled={isCreatingMeeting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 disabled:opacity-50"
                  >
                    {isCreatingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>{isCreatingMeeting ? 'Creating Protected Meeting...' : 'Generate Protected Zoom Meeting'}</span>
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
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Topic</span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Min Stay: {activeMeeting.min_attendance_minutes || 30}m
                            </span>
                          </div>
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
                            <Share2 className="w-4 h-4" /> Copy Protected LMS Class Notice
                          </button>
                          <button
                            type="button"
                            disabled={isSyncingAttendance}
                            onClick={handleSyncZoomAttendance}
                            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/40 text-slate-300 hover:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAttendance ? 'animate-spin' : ''}`} />
                            <span>{isSyncingAttendance ? 'Syncing Zoom Server Logs...' : 'Sync Real Zoom Attendance Logs'}</span>
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

            {/* TAB 2: STUDENT MANAGEMENT WITH FLEXIBLE ACCESS CONTROLS, REPORTS & MONTHLY SLIPS */}
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
                      Enroll &amp; Generate Login Credentials
                    </button>
                  </form>

                  {/* Enrolled Students List with Flexible Access Control + Performance Report Button */}
                  <div className="lg:col-span-2 bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" /> Enrolled Students &amp; Parent Reports
                      </h3>
                      <span className="text-xs text-slate-400">
                        {students.length} Total {currentMonth ? `• ${formatMonthLabel(currentMonth)}` : ''}
                      </span>
                    </div>

                    {students.length === 0 ? (
                      <p className="text-xs text-slate-500 py-8 text-center">No students enrolled yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                        {students.map((st) => {
                          const hasExt = Boolean(todayStr && st.access_until && todayStr <= st.access_until);
                          const inGrace = Boolean(todayStr) && dayOfMonth <= 15;

                          return (
                            <div key={st.id} className="p-4 bg-[#131c31] border border-slate-700/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-sm text-white">{st.full_name}</h4>
                                  {st.is_free_card ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      Free Card
                                    </span>
                                  ) : st.is_current_month_paid ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      Paid ({currentMonth})
                                    </span>
                                  ) : hasExt ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                      Extended until {st.access_until}
                                    </span>
                                  ) : inGrace ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                      Grace Period (1st–15th)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                                      Payment Due
                                    </span>
                                  )}
                                </div>
                                
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

                              {/* Actions: Access Override + View Report + Copy Login + Device Unlock */}
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => handleOpenAccessModal(st)}
                                  title="Manually mark paid, extend access date, or set Free Card"
                                  className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Access</span>
                                </button>

                                <button
                                  onClick={() => handleOpenStudentReport(st)}
                                  title="View progress charts, monthly comparison, exam remarks, and export PDF report"
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
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Slips & Payment Approvals Section */}
                <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" /> Student Bank Slips &amp; Payment Status
                      </h3>
                      <p className="text-xs text-slate-400">Review student bank slips by billing month and approve or reject payments.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">{slips.length} Slips Recorded</span>
                  </div>

                  {slips.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No bank slips submitted yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slips.map((slp) => {
                        const isManualEntry = slp.slip_url === 'MANUAL_TEACHER_APPROVAL';

                        return (
                          <div key={slp.id} className="p-4 bg-[#131c31] border border-slate-700/60 rounded-2xl space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-white">{slp.students?.full_name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {slp.students?.index_number}</span>
                                  {slp.billing_month && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                      {formatMonthLabel(slp.billing_month)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                                slp.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                slp.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {slp.status}
                              </span>
                            </div>

                            <div className="pt-1">
                              {isManualEntry ? (
                                <div className="text-xs text-emerald-300 flex items-center gap-1.5 p-2 rounded-xl bg-slate-900 border border-slate-800">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  <span className="truncate">Manual Teacher Approval (No Slip)</span>
                                </div>
                              ) : (
                                <a
                                  href={slp.slip_url} target="_blank" rel="noreferrer"
                                  className="text-xs text-blue-400 hover:underline flex items-center gap-1.5 p-2 rounded-xl bg-slate-900 border border-slate-800"
                                >
                                  <FileText className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">View Uploaded Slip ➔</span>
                                </a>
                              )}
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
                        );
                      })}
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
                  <p className="text-xs text-slate-400">
                    Enter the YouTube video link or video ID for the class lesson recording (set video to Unlisted on YouTube for privacy).
                  </p>

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
                        type="text" placeholder="e.g. https://youtu.be/dQw4w9WgXcQ" value={recordingId}
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
                <form onSubmit={handleAddMaterial} className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl h-fit">
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
                      <div key={m.id} className="p-3 bg-[#131c31] border border-slate-700/50 rounded-xl flex items-center justify-between gap-3">
                        <span className="text-xs text-white font-medium truncate">{m.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline">Download ➔</a>
                          <button
                            onClick={() => handleDeleteMaterial(m.id)}
                            title="Delete Tute"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: EXAMS & QUIZZES */}
            {activeTab === 'quizzes' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleCreateQuiz} className="lg:col-span-2 bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-5 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-sm text-white">
                        {editingExistingQuiz ? `Add More Questions to: ${editingExistingQuiz.title}` : 'Create Online Exam or Timed Quiz'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {quizQuestionsList.length} Question(s) Queued
                      </span>
                      {editingExistingQuiz && (
                        <button
                          type="button"
                          onClick={handleCancelEditingQuiz}
                          className="text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Cancel Add
                        </button>
                      )}
                    </div>
                  </div>

                  {!editingExistingQuiz && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold mb-1.5 block">Assessment Mode</label>
                          <div className="grid grid-cols-2 gap-1.5 bg-[#070b14] p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setAssessmentType('Online Exam')}
                              className={`py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                assessmentType === 'Online Exam' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Strict Online Exam
                            </button>
                            <button
                              type="button"
                              onClick={() => setAssessmentType('Quiz')}
                              className={`py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                assessmentType === 'Quiz' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Practice Quiz
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold mb-1.5 block">Timer Rule</label>
                          <div className="grid grid-cols-2 gap-1.5 bg-[#070b14] p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setTimerMode('whole_exam')}
                              className={`py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                timerMode === 'whole_exam' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Whole Exam Time
                            </button>
                            <button
                              type="button"
                              onClick={() => setTimerMode('per_question')}
                              className={`py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                timerMode === 'per_question' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Per-Question Time
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Exam / Quiz Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Mid Exam - Term 01"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                            required
                          />
                        </div>

                        {timerMode === 'whole_exam' ? (
                          <div>
                            <label className="text-[11px] text-slate-300 font-semibold mb-1 block">Total Time (Minutes)</label>
                            <input
                              type="number"
                              min="1"
                              placeholder="30"
                              value={quizDuration}
                              onChange={(e) => setQuizDuration(e.target.value)}
                              className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                              required
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="text-[11px] text-blue-400 font-semibold mb-1 block">Seconds Per Question</label>
                            <input
                              type="number"
                              min="10"
                              placeholder="60"
                              value={perQuestionSeconds}
                              onChange={(e) => setPerQuestionSeconds(e.target.value)}
                              className="w-full bg-[#070b14] border border-blue-500/40 rounded-xl px-4 py-2.5 text-xs text-white"
                              required
                            />
                          </div>
                        )}
                      </div>

                      {assessmentType === 'Online Exam' && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span>
                            Strict Anti-Cheat Enabled: Tab-switch strike auto-submit, copy/paste block, dynamic student watermark, question shuffle, and 1-attempt limit.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">Question #{quizQuestionsList.length + 1}</span>
                        <div className="flex items-center bg-[#0c1322] p-0.5 rounded-lg border border-slate-700">
                          <button
                            type="button"
                            onClick={() => setQuestionType('mcq')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                              questionType === 'mcq' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            MCQ (4 Options)
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuestionType('free_answer')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                              questionType === 'free_answer' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Free Answer
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Marks:</span>
                        <input
                          type="number"
                          min="1"
                          value={qMarks}
                          onChange={(e) => setQMarks(e.target.value)}
                          className="w-16 bg-[#0c1322] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter question text..."
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="w-full bg-[#0c1322] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />

                    {questionType === 'mcq' ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            placeholder="Option 1"
                            value={opt0}
                            onChange={(e) => setOpt0(e.target.value)}
                            className="bg-[#0c1322] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Option 2"
                            value={opt1}
                            onChange={(e) => setOpt1(e.target.value)}
                            className="bg-[#0c1322] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Option 3"
                            value={opt2}
                            onChange={(e) => setOpt2(e.target.value)}
                            className="bg-[#0c1322] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Option 4"
                            value={opt3}
                            onChange={(e) => setOpt3(e.target.value)}
                            className="bg-[#0c1322] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-semibold text-emerald-400">Correct Answer:</label>
                            <select
                              value={correctOpt}
                              onChange={(e) => setCorrectOpt(e.target.value)}
                              className="bg-[#0c1322] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            >
                              <option value="0">Option 1</option>
                              <option value="1">Option 2</option>
                              <option value="2">Option 3</option>
                              <option value="3">Option 4</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddQuestionToList}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Question to Queue
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Model / Expected Answer (Optional — used for auto-check or teacher review)"
                          value={sampleAnswer}
                          onChange={(e) => setSampleAnswer(e.target.value)}
                          className="w-full bg-[#0c1322] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddQuestionToList}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Free Answer Question
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {quizQuestionsList.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      <span className="text-[11px] font-bold text-slate-400 block">Questions Queue ({quizQuestionsList.length}):</span>
                      {quizQuestionsList.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#131c31] border border-slate-700/60 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {idx + 1}. {item.question_text}
                            </p>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {item.question_type === 'mcq'
                                ? `MCQ • Correct: Option ${item.correct_option + 1} (${item.options[item.correct_option]})`
                                : `Free Answer${item.sample_answer ? ` • Expected: ${item.sample_answer}` : ''}`}{' '}
                              • {item.marks} Marks
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftQuestion(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPublishingQuiz}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-amber-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPublishingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>
                      {isPublishingQuiz
                        ? 'Saving...'
                        : editingExistingQuiz
                        ? `Save & Append Questions to "${editingExistingQuiz.title}"`
                        : `Publish ${assessmentType}`}
                    </span>
                  </button>
                </form>

                <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl h-fit">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> Published Exams &amp; Quizzes ({quizzes.length})
                  </h3>

                  {quizzes.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">No exams or quizzes published yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                      {quizzes.map((qz) => {
                        const qCount = qz.quiz_questions?.[0]?.count ?? 0;
                        const isExam = qz.assessment_type === 'Online Exam';
                        const isPerQ = qz.timer_mode === 'per_question';

                        return (
                          <div key={qz.id} className="p-4 bg-[#131c31] border border-slate-700/60 rounded-2xl space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                    isExam
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}
                                >
                                  {qz.assessment_type || 'Quiz'}
                                </span>
                                <h4 className="font-bold text-xs text-white line-clamp-2 pt-0.5">{qz.title}</h4>
                              </div>
                              <button
                                onClick={() => handleDeleteQuiz(qz.id)}
                                title="Delete Exam/Quiz"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                              <span className="flex items-center gap-1 bg-[#070b14] px-2 py-0.5 rounded border border-slate-800">
                                <Clock className="w-3 h-3 text-amber-400" />
                                {isPerQ ? `${qz.per_question_seconds || 60}s / Question` : `${qz.duration_minutes} Mins Total`}
                              </span>
                              <span className="text-purple-400 bg-[#070b14] px-2 py-0.5 rounded border border-slate-800">
                                {qCount} Questions
                              </span>
                              <span className="text-emerald-400 bg-[#070b14] px-2 py-0.5 rounded border border-slate-800">
                                {qz.total_marks || 100} Marks
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStartAddingMoreQuestions(qz)}
                              className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add More Questions
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* ================= MODAL: FLEXIBLE PAYMENT & ACCESS OVERRIDE ================= */}
      {selectedStudentForAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0c1322] border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-7 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Manage Student Access &amp; Fees</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedStudentForAccess.full_name} (<span className="font-mono text-purple-400">{selectedStudentForAccess.index_number}</span>)
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForAccess(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option A: Manual Mark Month as Paid (for WhatsApp slips or cash payments) */}
            <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white">1. Manual Payment Approval (Without Student Slip Upload)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Approve a specific billing month directly if the student sent the slip on WhatsApp or paid in cash.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={manualPayMonth}
                  onChange={(e) => setManualPayMonth(e.target.value)}
                  className="flex-1 bg-[#0c1322] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold"
                >
                  {selectableMonths.map((ym) => (
                    <option key={ym} value={ym}>
                      {formatMonthLabel(ym)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isSavingAccessOverride}
                  onClick={handleManualMarkMonthPaid}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Month Paid</span>
                </button>
              </div>
            </div>

            {/* Option B & C: Temporary Extension Date & Free Card */}
            <form onSubmit={handleSaveEnrollmentAccessRules} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white">2. Temporary Access Extension (Custom Due Date)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Grant temporary access until a specific date (e.g. 20th of the month). Access locks automatically after that date.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={extensionDateInput}
                    onChange={(e) => setExtensionDateInput(e.target.value)}
                    className="flex-1 bg-[#0c1322] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  {currentMonth && (
                    <button
                      type="button"
                      onClick={() => setExtensionDateInput(`${currentMonth}-20`)}
                      className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-bold transition cursor-pointer"
                    >
                      Until 20th
                    </button>
                  )}
                  {extensionDateInput && (
                    <button
                      type="button"
                      onClick={() => setExtensionDateInput('')}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 text-[11px] font-bold transition cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <label className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">3. Free Card (Permanent Exemption)</span>
                  <span className="text-[11px] text-slate-400">
                    Student retains uninterrupted access every month without payment locks.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={freeCardToggle}
                  onChange={(e) => setFreeCardToggle(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForAccess(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAccessOverride}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingAccessOverride ? 'Saving...' : 'Save Access Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: OFFICIAL PARENT PROGRESS REPORT WITH CHARTS, MONTH COMPARISON & PDF EXPORT ================= */}
      {selectedStudentForReport && reportAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0c1322] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
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
                    📱 {selectedStudentForReport.whatsapp_number} • {selectedCourse?.title} • Science Hub - Jaffna
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrintParentReport}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print Parent PDF</span>
                </button>

                <button
                  onClick={() => setSelectedStudentForReport(null)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingReport ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing official progress report...
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#131c31] border border-slate-700/50 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Exams &amp; Quizzes</span>
                    <h4 className="text-xl font-black text-white mt-1">{studentQuizResults.length}</h4>
                  </div>
                  <div className="bg-[#131c31] border border-slate-700/50 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Overall Average</span>
                    <h4 className="text-xl font-black text-emerald-400 mt-1">{reportAnalytics.overallAvg}%</h4>
                  </div>
                  <div className="bg-[#131c31] border border-slate-700/50 p-4 rounded-2xl text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Verified Attendance</span>
                    <h4 className="text-xl font-black text-blue-400 mt-1">{reportAnalytics.verifiedAttendanceCount} Days</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[#070b14] border border-slate-800/90 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Monthly Progress ({reportAnalytics.lastMonthLabel} vs {reportAnalytics.thisMonthLabel})
                    </h4>

                    <div className="p-3.5 rounded-xl bg-[#0c1322] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Class Attendance</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            reportAnalytics.attDiff > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : reportAnalytics.attDiff < 0
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {reportAnalytics.attDiff > 0 ? (
                            <>
                              <TrendingUp className="w-3 h-3" /> +{reportAnalytics.attDiff} Days Improved
                            </>
                          ) : reportAnalytics.attDiff < 0 ? (
                            <>
                              <TrendingDown className="w-3 h-3" /> {reportAnalytics.attDiff} Days Lower
                            </>
                          ) : (
                            <>
                              <Minus className="w-3 h-3" /> Consistent
                            </>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
                        <div className="bg-[#070b14] p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">{reportAnalytics.lastMonthLabel}</span>
                          <strong className="text-slate-200">{reportAnalytics.lastMonthAtt} Classes</strong>
                        </div>
                        <div className="bg-[#070b14] p-2.5 rounded-lg border border-blue-500/30">
                          <span className="text-[10px] text-blue-400 block">{reportAnalytics.thisMonthLabel}</span>
                          <strong className="text-white">{reportAnalytics.thisMonthAtt} Classes</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0c1322] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold">Exam &amp; Quiz Average</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            reportAnalytics.scoreDiff > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : reportAnalytics.scoreDiff < 0
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {reportAnalytics.scoreDiff > 0 ? (
                            <>
                              <TrendingUp className="w-3 h-3" /> +{reportAnalytics.scoreDiff}% Improved
                            </>
                          ) : reportAnalytics.scoreDiff < 0 ? (
                            <>
                              <TrendingDown className="w-3 h-3" /> {reportAnalytics.scoreDiff}% Drop
                            </>
                          ) : (
                            <>
                              <Minus className="w-3 h-3" /> Steady
                            </>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
                        <div className="bg-[#070b14] p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">{reportAnalytics.lastMonthLabel}</span>
                          <strong className="text-slate-200">{reportAnalytics.lastMonthAvg}% Avg</strong>
                        </div>
                        <div className="bg-[#070b14] p-2.5 rounded-lg border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-400 block">{reportAnalytics.thisMonthLabel}</span>
                          <strong className="text-emerald-300">{reportAnalytics.thisMonthAvg}% Avg</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#070b14] border border-slate-800/90 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" /> Exam Score Progression Chart
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">Latest {reportAnalytics.chronologicalQuizzes.length} Exams</span>
                    </div>

                    {reportAnalytics.chronologicalQuizzes.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-8">
                        No exam results available to plot chart yet.
                      </div>
                    ) : (
                      <div className="flex items-end justify-between gap-2.5 h-44 pt-4 px-2 border-b border-slate-800/80">
                        {reportAnalytics.chronologicalQuizzes.map((q) => {
                          const total = Number(q.quizzes?.total_marks || 100);
                          const pct = total > 0 ? Math.min(100, Math.round((Number(q.score || 0) / total) * 100)) : 0;
                          const barColor =
                            pct >= 75
                              ? 'from-emerald-600 to-emerald-400'
                              : pct >= 50
                              ? 'from-purple-600 to-indigo-400'
                              : 'from-amber-600 to-amber-400';

                          return (
                            <div key={q.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end pb-2">
                              <span className="text-[10px] font-mono font-bold text-slate-200">{pct}%</span>
                              <div className="w-full max-w-[34px] h-28 bg-[#0c1322] rounded-lg border border-slate-800 flex items-end overflow-hidden p-0.5">
                                <div
                                  style={{ height: `${Math.max(8, pct)}%` }}
                                  className={`w-full rounded-md bg-gradient-to-t ${barColor} transition-all duration-500`}
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 text-center line-clamp-1 w-full" title={q.quizzes?.title}>
                                {q.quizzes?.title || 'Exam'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> 75%+ Distinction
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span> 50-74% Merit
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> &lt;50% Needs Focus
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> Exam Marks, Answers &amp; Teacher Remarks
                  </h4>

                  {studentQuizResults.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#070b14] border border-slate-800 text-center text-slate-500 text-xs">
                      This student has not taken any exams or quizzes yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentQuizResults.map((res) => {
                        const isExpanded = expandedSubmissionId === res.id;
                        const qList = submissionQuestionsMap[res.quiz_id] || [];
                        const ansObj = res.answers || {};

                        return (
                          <div key={res.id} className="bg-[#070b14] border border-slate-800/90 rounded-2xl overflow-hidden">
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {res.quizzes?.assessment_type || 'Quiz'}
                                  </span>
                                  <h5 className="font-bold text-xs text-white">{res.quizzes?.title || 'Online Exam'}</h5>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono">
                                  <span>
                                    Date: {new Date(res.submitted_at).toLocaleDateString()} • {new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {Number(res.tab_switches || 0) > 0 && (
                                    <span className="text-red-400 font-bold">
                                      ⚠️ Tab Switches: {res.tab_switches}
                                    </span>
                                  )}
                                </div>
                                {res.teacher_feedback && !isExpanded && (
                                  <p className="text-[11px] text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 w-fit mt-1">
                                    Remark: {res.teacher_feedback}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                  Score: {res.score} / {res.quizzes?.total_marks || 100}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubmissionDetails(res)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{isExpanded ? 'Hide Answers' : 'Review & Remark'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-slate-800 bg-[#0c1322]/70 p-4 space-y-4">
                                <div className="space-y-2.5">
                                  <span className="text-[11px] font-bold text-slate-300 block">
                                    Student Answers Breakdown ({res.quizzes?.title}):
                                  </span>

                                  {qList.length === 0 ? (
                                    <p className="text-xs text-slate-500">Loading questions...</p>
                                  ) : (
                                    qList.map((qItem: any, idx: number) => {
                                      const rawAns = ansObj[qItem.id] !== undefined ? ansObj[qItem.id] : ansObj[idx];
                                      const isFree = qItem.question_type === 'free_answer';

                                      if (isFree) {
                                        return (
                                          <div key={qItem.id} className="p-3 rounded-xl bg-[#070b14] border border-slate-800 space-y-1.5">
                                            <p className="text-xs font-bold text-white">
                                              {idx + 1}. {qItem.question_text} <span className="text-[10px] text-slate-400">({qItem.marks} Marks)</span>
                                            </p>
                                            <p className="text-xs text-blue-300">
                                              Student Answer: <strong className="text-white">{rawAns || '(No answer submitted)'}</strong>
                                            </p>
                                            {qItem.sample_answer && (
                                              <p className="text-[11px] text-emerald-400">
                                                Expected Answer: {qItem.sample_answer}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      }

                                      const chosenIdx = typeof rawAns === 'number' ? rawAns : Number(rawAns);
                                      const hasAnswered = rawAns !== undefined && rawAns !== null && !isNaN(chosenIdx);
                                      const isRight = hasAnswered && chosenIdx === qItem.correct_option;

                                      return (
                                        <div key={qItem.id} className="p-3 rounded-xl bg-[#070b14] border border-slate-800 space-y-1.5">
                                          <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-bold text-white">
                                              {idx + 1}. {qItem.question_text}
                                            </p>
                                            {isRight ? (
                                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                                                +{qItem.marks} Marks
                                              </span>
                                            ) : (
                                              <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex-shrink-0">
                                                0 Marks
                                              </span>
                                            )}
                                          </div>

                                          <p className={`text-xs ${isRight ? 'text-emerald-400' : 'text-red-400'}`}>
                                            Student Selected:{' '}
                                            <strong>
                                              {hasAnswered ? (qItem.options?.[chosenIdx] || `Option ${chosenIdx + 1}`) : '(Timed Out / Unanswered)'}
                                            </strong>
                                          </p>

                                          {!isRight && (
                                            <p className="text-[11px] text-emerald-400">
                                              Correct Answer: <strong>{qItem.options?.[qItem.correct_option]}</strong>
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="p-4 rounded-2xl bg-[#131c31] border border-slate-700/60 space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                                    <MessageSquare className="w-4 h-4 text-blue-400" />
                                    <span>Teacher Remark &amp; Score Review for &quot;{res.quizzes?.title}&quot;</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-semibold block mb-1">Final Marks</label>
                                      <input
                                        type="number"
                                        value={scoreInputs[res.id] ?? res.score}
                                        onChange={(e) => setScoreInputs((prev) => ({ ...prev, [res.id]: e.target.value }))}
                                        className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                                        Teacher Remark / Comment (Included in Parent PDF Report &amp; Student Hub)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Good progress! Review Unit 2 theory questions carefully."
                                        value={remarkInputs[res.id] ?? ''}
                                        onChange={(e) => setRemarkInputs((prev) => ({ ...prev, [res.id]: e.target.value }))}
                                        className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      disabled={savingFeedbackId === res.id}
                                      onClick={() => handleSaveSubmissionFeedback(res.id)}
                                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                      {savingFeedbackId === res.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                      <span>Save Remark &amp; Marks</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" /> Zoom Class Attendance History (By Class)
                  </h4>

                  {studentAttendanceLogs.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 text-center text-slate-500 text-xs">
                      No attendance records found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {studentAttendanceLogs.map((att) => {
                        const isVerifiedPresent = att.status === 'Present';
                        return (
                          <div key={att.id} className="p-3 bg-[#070b14] border border-slate-800/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{att.courses?.title || selectedCourse?.title}</p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(att.marked_at).toLocaleDateString()} • {new Date(att.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded border flex-shrink-0 ${
                                isVerifiedPresent
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              }`}
                            >
                              {att.status} ({att.verified_minutes || att.duration_minutes || 0}m)
                            </span>
                          </div>
                        );
                      })}
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