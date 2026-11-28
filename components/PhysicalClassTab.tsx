'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, Plus, Trash2, Calendar, Award, Printer,
  Search, CheckCircle2, XCircle, Loader2, ClipboardList, FileSpreadsheet
} from 'lucide-react';

type Lang = 'en' | 'ta';

interface PhysicalClassTabProps {
  lang: Lang;
  course?: any;
  students?: any[];
  onRefreshCourse?: () => Promise<void> | void;
}

const TAMIL_SHORT_MONTHS = [
  'ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'
];

const TEXT = {
  en: {
    headerTitle: 'Physical Class Students & Manual Reports',
    headerDesc: 'Add physical class students, record manual attendance & paper marks, and generate official Parent PDF Reports.',
    addStudentTitle: 'Add Physical Class Student',
    fullName: 'Student Full Name',
    fullNamePh: 'e.g. Kavishka Perera',
    indexNo: 'Student ID / Index No',
    indexNoPh: 'e.g. PHY-101 (Auto if blank)',
    className: 'Physical Class / Batch Name',
    classNamePh: 'e.g. 2026 A/L Physics - Physical',
    whatsapp: 'Parent / Student WhatsApp',
    whatsappPh: '0771234567',
    addStudentBtn: 'Register Physical Student',
    addingBtn: 'Adding...',
    directoryTitle: 'Physical Students List',
    searchPh: 'Search by name, ID, or class...',
    noStudents: 'No physical class students added yet.',
    selectPromptTitle: 'Select a Physical Student',
    selectPromptDesc: 'Click on a student from the left list to enter manual attendance, exam marks, and download their Parent PDF Report.',
    downloadPdfBtn: 'Download / Print Parent PDF',
    totalClassesCard: 'Classes Attended',
    totalExamsCard: 'Papers / Exams',
    overallAvgCard: 'Overall Average',
    daysUnit: 'Days',

    // Attendance Form & List
    attSectionTitle: 'Manual Class Attendance Entry',
    attDate: 'Class Date',
    attTopic: 'Lesson / Class Topic',
    attTopicPh: 'e.g. Mechanics - Paper Discussion',
    attStatus: 'Status',
    present: 'Present',
    absent: 'Absent',
    saveAttBtn: 'Save Attendance',
    attHistoryTitle: 'Recorded Attendance Logs',
    noAttLogs: 'No manual attendance recorded yet.',

    // Marks Form & List
    marksSectionTitle: 'Manual Exam / Paper Marks Entry',
    examTitle: 'Exam / Paper Title',
    examTitlePh: 'e.g. Term 01 Paper / Unit Test 03',
    examDate: 'Exam Date',
    marksObtained: 'Marks Obtained',
    totalMarks: 'Total Marks',
    teacherRemark: 'Teacher Remark (Shown in Parent PDF)',
    teacherRemarkPh: 'e.g. Very good improvement in structured questions.',
    saveMarksBtn: 'Save Exam Marks',
    marksHistoryTitle: 'Recorded Exam & Paper Marks',
    noMarksLogs: 'No exam marks recorded yet.',

    confirmDeleteStudent: (name: string) => `Delete physical student "${name}" and all their attendance & marks?`,
    allowPopups: 'Please allow pop-ups in your browser to download/print the PDF report.',

    // PDF Labels
    pdfSubtitle: 'Official Physical Class Progress Report • Education changes the world',
    pdfIssuedDate: 'Issued Date:',
    pdfClass: 'Class:',
    pdfStudentName: 'STUDENT NAME',
    pdfIndexNumber: 'STUDENT ID',
    pdfContactWhatsapp: 'CONTACT / WHATSAPP',
    pdfVerifiedSessionsTitle: 'Classes Attended',
    pdfSessionsUnit: 'Sessions',
    pdfExamsCompletedTitle: 'Exams & Papers Completed',
    pdfAssessmentsUnit: 'Papers',
    pdfOverallAvgTitle: 'Overall Exam Average',
    pdfMonthlyComparisonTitle: 'Month-over-Month Development Comparison',
    pdfAttendanceDev: 'Attendance Development',
    pdfExamScoreDev: 'Exam Score Development',
    pdfDaysUnit: 'days',
    pdfImprovedUp: 'Improved ↑',
    pdfConsistentRight: 'Consistent →',
    pdfLowerDown: 'Lower ↓',
    pdfSteadyRight: 'Steady →',
    pdfDropDown: 'Drop ↓',
    pdfChartTitle: 'Exam & Paper Performance Chart',
    pdfNoChartScores: 'No exam scores available to chart yet.',
    pdfMarksTableTitle: 'Exam Marks & Teacher Remarks',
    pdfColExamTitle: 'Exam / Paper Title',
    pdfColDate: 'Date',
    pdfColMarks: 'Marks',
    pdfColPct: 'Percentage',
    pdfColRemark: 'Teacher Remark',
    pdfNoExamsRow: 'No exam marks recorded yet.',
    pdfAttTableTitle: 'Physical Class Attendance Log',
    pdfColTopic: 'Lesson / Topic',
    pdfColStatus: 'Status',
    pdfNoAttRow: 'No attendance logs recorded yet.',
    pdfFooterPortal: 'Science Hub - Jaffna • Official Physical Class Record',
    pdfTeacherSig: 'Class Teacher Signature'
  },
  ta: {
    headerTitle: 'நேரடி வகுப்பு (Physical Class) மாணவர்கள் & அறிக்கைகள்',
    headerDesc: 'நேரடி வகுப்பு மாணவர்களைச் சேர்த்து, வருகை மற்றும் பரீட்சைப் புள்ளிகளை உள்ளிட்டு பெற்றோர் PDF அறிக்கையை உருவாக்கவும்.',
    addStudentTitle: 'நேரடி வகுப்பு மாணவரைச் சேர்',
    fullName: 'மாணவர் முழுப் பெயர்',
    fullNamePh: 'உதா: கவிஷ்க பெரேரா',
    indexNo: 'மாணவர் ஐடி / சுட்டெண்',
    indexNoPh: 'உதா: PHY-101 (தானாக உருவாக்க காலியாக விடவும்)',
    className: 'நேரடி வகுப்பு / பிரிவு பெயர்',
    classNamePh: 'உதா: 2026 A/L பௌதிகவியல் - Physical',
    whatsapp: 'பெற்றோர் / மாணவர் WhatsApp',
    whatsappPh: '0771234567',
    addStudentBtn: 'மாணவரைப் பதிவு செய்',
    addingBtn: 'சேர்க்கப்படுகிறது...',
    directoryTitle: 'நேரடி வகுப்பு மாணவர்கள்',
    searchPh: 'பெயர், ஐடி அல்லது வகுப்பு மூலம் தேடு...',
    noStudents: 'இதுவரை நேரடி வகுப்பு மாணவர்கள் எவரும் சேர்க்கப்படவில்லை.',
    selectPromptTitle: 'ஒரு மாணவரைத் தேர்ந்தெடுக்கவும்',
    selectPromptDesc: 'வருகை, பரீட்சைப் புள்ளிகள் மற்றும் பெற்றோர் PDF அறிக்கையைப் பெற இடதுபுறப் பட்டியலில் உள்ள மாணவரைக் கிளிக் செய்யவும்.',
    downloadPdfBtn: 'பெற்றோர் PDF அறிக்கையைப் பதிவிறக்கு / அச்சிடு',
    totalClassesCard: 'வகுப்பு வருகை',
    totalExamsCard: 'பரீட்சைகள் / வினாத்தாள்கள்',
    overallAvgCard: 'மொத்த சராசரி',
    daysUnit: 'நாட்கள்',

    // Attendance Form & List
    attSectionTitle: 'நேரடி வகுப்பு வருகைப் பதிவு',
    attDate: 'வகுப்புத் திகதி',
    attTopic: 'பாடம் / வகுப்புத் தலைப்பு',
    attTopicPh: 'உதா: பொறியியல் - வினாத்தாள் கலந்துரையாடல்',
    attStatus: 'நிலை',
    present: 'சமூகம் (Present)',
    absent: 'சமூகமில்லை (Absent)',
    saveAttBtn: 'வருகையைச் சேமி',
    attHistoryTitle: 'பதிவு செய்யப்பட்ட வருகை விபரம்',
    noAttLogs: 'இதுவரை வருகைப் பதிவுகள் எதுவும் இல்லை.',

    // Marks Form & List
    marksSectionTitle: 'பரீட்சை / வினாத்தாள் புள்ளிகள் உள்ளீடு',
    examTitle: 'பரீட்சை / வினாத்தாள் தலைப்பு',
    examTitlePh: 'உதா: தவணை 01 பரீட்சை / அலகுப் பரீட்சை 03',
    examDate: 'பரீட்சைத் திகதி',
    marksObtained: 'பெற்ற புள்ளிகள்',
    totalMarks: 'மொத்தப் புள்ளிகள்',
    teacherRemark: 'ஆசிரியர் கருத்து (பெற்றோர் PDF அறிக்கையில் இடம்பெறும்)',
    teacherRemarkPh: 'உதா: கட்டமைப்பு வினாக்களில் நல்ல முன்னேற்றம்.',
    saveMarksBtn: 'புள்ளிகளைச் சேமி',
    marksHistoryTitle: 'பதிவு செய்யப்பட்ட பரீட்சைப் புள்ளிகள்',
    noMarksLogs: 'இதுவரை பரீட்சைப் புள்ளிகள் எதுவும் இல்லை.',

    confirmDeleteStudent: (name: string) => `"${name}" என்ற மாணவரையும் அவரது அனைத்து வருகை மற்றும் புள்ளிகளையும் நீக்க விரும்புகிறீர்களா?`,
    allowPopups: 'PDF அறிக்கையைப் பதிவிறக்க / அச்சிட உங்கள் உலாவியில் Pop-ups அனுமதிக்கவும்.',

    // PDF Labels
    pdfSubtitle: 'உத்தியோகபூர்வ நேரடி வகுப்பு முன்னேற்ற அறிக்கை • கல்வி உலகை மாற்றும்',
    pdfIssuedDate: 'வெளியிடப்பட்ட திகதி:',
    pdfClass: 'வகுப்பு:',
    pdfStudentName: 'மாணவர் பெயர்',
    pdfIndexNumber: 'மாணவர் ஐடி',
    pdfContactWhatsapp: 'தொடர்பு / WHATSAPP',
    pdfVerifiedSessionsTitle: 'கலந்துகொண்ட வகுப்புகள்',
    pdfSessionsUnit: 'வகுப்புகள்',
    pdfExamsCompletedTitle: 'முடிக்கப்பட்ட பரீட்சைகள்',
    pdfAssessmentsUnit: 'பரீட்சைகள்',
    pdfOverallAvgTitle: 'மொத்தப் பரீட்சை சராசரி',
    pdfMonthlyComparisonTitle: 'மாதாந்த முன்னேற்ற ஒப்பீடு',
    pdfAttendanceDev: 'வருகை முன்னேற்றம்',
    pdfExamScoreDev: 'பரீட்சைப் புள்ளி முன்னேற்றம்',
    pdfDaysUnit: 'நாட்கள்',
    pdfImprovedUp: 'முன்னேற்றம் ↑',
    pdfConsistentRight: 'சீரானது →',
    pdfLowerDown: 'குறைவு ↓',
    pdfSteadyRight: 'நிலையானது →',
    pdfDropDown: 'குறைவு ↓',
    pdfChartTitle: 'பரீட்சை & வினாத்தாள் செயற்றிறன் வரைபடம்',
    pdfNoChartScores: 'வரைபடம் வரைய இன்னும் பரீட்சைப் புள்ளிகள் இல்லை.',
    pdfMarksTableTitle: 'பரீட்சைப் புள்ளிகள் & ஆசிரியர் கருத்துக்கள்',
    pdfColExamTitle: 'பரீட்சை / வினாத்தாள்',
    pdfColDate: 'திகதி',
    pdfColMarks: 'புள்ளிகள்',
    pdfColPct: 'சதவீதம்',
    pdfColRemark: 'ஆசிரியர் கருத்து',
    pdfNoExamsRow: 'இதுவரை பரீட்சைப் புள்ளிகள் எதுவும் பதிவு செய்யப்படவில்லை.',
    pdfAttTableTitle: 'நேரடி வகுப்பு வருகைப் பதிவு',
    pdfColTopic: 'பாடம் / தலைப்பு',
    pdfColStatus: 'நிலை',
    pdfNoAttRow: 'இதுவரை வருகைப் பதிவுகள் எதுவும் இல்லை.',
    pdfFooterPortal: 'Science Hub - Jaffna • உத்தியோகபூர்வ நேரடி வகுப்புப் பதிவு',
    pdfTeacherSig: 'வகுப்பு ஆசிரியர் கையொப்பம்'
  }
} as const;

function formatShortMonthLabel(date: Date, lang: Lang): string {
  if (lang === 'ta') {
    return `${TAMIL_SHORT_MONTHS[date.getMonth()] || ''} ${date.getFullYear()}`;
  }
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function PhysicalClassTab({
  lang,
  course,
  students: _initialStudents,
  onRefreshCourse
}: PhysicalClassTabProps) {
  const t = TEXT[lang];
  const todayIso = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });

  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Add Student Form
  const [fullName, setFullName] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [className, setClassName] = useState(course?.title || '');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Selected Student Records
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [marksLogs, setMarksLogs] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Add Attendance Form
  const [attDate, setAttDate] = useState(todayIso);
  const [attTopic, setAttTopic] = useState('');
  const [attStatus, setAttStatus] = useState<'Present' | 'Absent'>('Present');
  const [isSavingAtt, setIsSavingAtt] = useState(false);

  // Add Marks Form
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(todayIso);
  const [marksObtained, setMarksObtained] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [teacherRemark, setTeacherRemark] = useState('');
  const [isSavingMarks, setIsSavingMarks] = useState(false);

  useEffect(() => {
    if (course?.title && !className) {
      setClassName(course.title);
    }
  }, [course?.title]);

  useEffect(() => {
    fetchPhysicalStudents();
  }, []);

  const fetchPhysicalStudents = async () => {
    setLoadingStudents(true);
    const { data } = await supabase
      .from('physical_students')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setStudents(data);
    setLoadingStudents(false);
  };

  const loadStudentRecords = async (student: any) => {
    setSelectedStudent(student);
    setLoadingRecords(true);

    const [{ data: att }, { data: mrk }] = await Promise.all([
      supabase
        .from('physical_attendance')
        .select('*')
        .eq('student_id', student.id)
        .order('attendance_date', { ascending: false }),
      supabase
        .from('physical_marks')
        .select('*')
        .eq('student_id', student.id)
        .order('exam_date', { ascending: false })
    ]);

    setAttendanceLogs(att || []);
    setMarksLogs(mrk || []);
    setLoadingRecords(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !className.trim()) return;
    setIsAddingStudent(true);

    const autoId = indexNumber.trim() || `PHY-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await supabase
      .from('physical_students')
      .insert([{
        full_name: fullName.trim(),
        index_number: autoId,
        class_name: className.trim(),
        whatsapp_number: whatsappNumber.trim() || '-'
      }])
      .select()
      .single();

    if (!error && data) {
      setStudents((prev) => [data, ...prev]);
      setFullName('');
      setIndexNumber('');
      setWhatsappNumber('');
      loadStudentRecords(data);
      if (onRefreshCourse) await onRefreshCourse();
    } else {
      alert('Error adding student: ' + (error?.message || 'Unknown error'));
    }
    setIsAddingStudent(false);
  };

  const handleDeleteStudent = async (stu: any) => {
    if (!confirm(t.confirmDeleteStudent(stu.full_name))) return;
    const { error } = await supabase.from('physical_students').delete().eq('id', stu.id);
    if (!error) {
      setStudents((prev) => prev.filter((s) => s.id !== stu.id));
      if (selectedStudent?.id === stu.id) {
        setSelectedStudent(null);
        setAttendanceLogs([]);
        setMarksLogs([]);
      }
      if (onRefreshCourse) await onRefreshCourse();
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !attTopic.trim() || !attDate) return;
    setIsSavingAtt(true);

    const { data, error } = await supabase
      .from('physical_attendance')
      .insert([{
        student_id: selectedStudent.id,
        class_topic: attTopic.trim(),
        attendance_date: attDate,
        status: attStatus
      }])
      .select()
      .single();

    if (!error && data) {
      setAttendanceLogs((prev) => [data, ...prev]);
      setAttTopic('');
    } else {
      alert('Error saving attendance: ' + (error?.message || 'Unknown error'));
    }
    setIsSavingAtt(false);
  };

  const handleDeleteAttendance = async (id: string) => {
    await supabase.from('physical_attendance').delete().eq('id', id);
    setAttendanceLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !examTitle.trim() || marksObtained === '') return;
    setIsSavingMarks(true);

    const { data, error } = await supabase
      .from('physical_marks')
      .insert([{
        student_id: selectedStudent.id,
        exam_title: examTitle.trim(),
        exam_date: examDate,
        marks_obtained: Number(marksObtained),
        total_marks: Number(totalMarks) || 100,
        teacher_remark: teacherRemark.trim()
      }])
      .select()
      .single();

    if (!error && data) {
      setMarksLogs((prev) => [data, ...prev]);
      setExamTitle('');
      setMarksObtained('');
      setTeacherRemark('');
    } else {
      alert('Error saving marks: ' + (error?.message || 'Unknown error'));
    }
    setIsSavingMarks(false);
  };

  const handleDeleteMarks = async (id: string) => {
    await supabase.from('physical_marks').delete().eq('id', id);
    setMarksLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const getAnalytics = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const isSameMonthYear = (dateStr: string, m: number, y: number) => {
      if (!dateStr) return false;
      const [year, month] = dateStr.split('-').map(Number);
      return year === y && month - 1 === m;
    };

    const presentLogs = attendanceLogs.filter((a) => a.status === 'Present');
    const thisMonthAtt = presentLogs.filter((a) => isSameMonthYear(a.attendance_date, thisMonth, thisYear)).length;
    const lastMonthAtt = presentLogs.filter((a) => isSameMonthYear(a.attendance_date, lastMonth, lastMonthYear)).length;
    const attDiff = thisMonthAtt - lastMonthAtt;

    const calcPct = (m: any) => {
      const tot = Number(m.total_marks || 100);
      return tot > 0 ? Math.round((Number(m.marks_obtained || 0) / tot) * 100) : 0;
    };

    const thisMonthExams = marksLogs.filter((m) => isSameMonthYear(m.exam_date, thisMonth, thisYear));
    const lastMonthExams = marksLogs.filter((m) => isSameMonthYear(m.exam_date, lastMonth, lastMonthYear));

    const thisMonthAvg =
      thisMonthExams.length > 0
        ? Math.round(thisMonthExams.reduce((acc, m) => acc + calcPct(m), 0) / thisMonthExams.length)
        : 0;
    const lastMonthAvg =
      lastMonthExams.length > 0
        ? Math.round(lastMonthExams.reduce((acc, m) => acc + calcPct(m), 0) / lastMonthExams.length)
        : 0;

    const scoreDiff = thisMonthAvg - lastMonthAvg;
    const overallAvg =
      marksLogs.length > 0
        ? Math.round(marksLogs.reduce((acc, m) => acc + calcPct(m), 0) / marksLogs.length)
        : 0;

    return {
      thisMonthLabel: formatShortMonthLabel(now, lang),
      lastMonthLabel: formatShortMonthLabel(lastMonthDate, lang),
      thisMonthAtt,
      lastMonthAtt,
      attDiff,
      thisMonthAvg,
      lastMonthAvg,
      scoreDiff,
      overallAvg,
      presentCount: presentLogs.length,
      chronologicalMarks: [...marksLogs].reverse().slice(-8)
    };
  };

  const handlePrintPhysicalReport = () => {
    if (!selectedStudent) return;
    const analytics = getAnalytics();
    const logoUrl = `${window.location.origin}/logo.jpg`;
    const reportDate = new Date().toLocaleDateString(lang === 'ta' ? 'ta-LK' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const examRowsHtml =
      marksLogs.length === 0
        ? `<tr><td colspan="5" style="text-align:center;color:#64748b;padding:14px;">${t.pdfNoExamsRow}</td></tr>`
        : marksLogs
            .map((m) => {
              const tot = Number(m.total_marks || 100);
              const pct = tot > 0 ? Math.round((Number(m.marks_obtained || 0) / tot) * 100) : 0;
              return `
                <tr>
                  <td><strong>${escapeHtml(m.exam_title)}</strong></td>
                  <td>${escapeHtml(m.exam_date)}</td>
                  <td><strong>${escapeHtml(m.marks_obtained)} / ${tot}</strong></td>
                  <td><span class="badge ${pct >= 75 ? 'badge-green' : pct >= 50 ? 'badge-blue' : 'badge-amber'}">${pct}%</span></td>
                  <td>${escapeHtml(m.teacher_remark || '-')}</td>
                </tr>
              `;
            })
            .join('');

    const attRowsHtml =
      attendanceLogs.length === 0
        ? `<tr><td colspan="3" style="text-align:center;color:#64748b;padding:14px;">${t.pdfNoAttRow}</td></tr>`
        : attendanceLogs
            .map(
              (a) => `
              <tr>
                <td><strong>${escapeHtml(a.class_topic)}</strong></td>
                <td>${escapeHtml(a.attendance_date)}</td>
                <td><span class="badge ${a.status === 'Present' ? 'badge-green' : 'badge-amber'}">${a.status === 'Present' ? t.present : t.absent}</span></td>
              </tr>
            `
            )
            .join('');

    const chartBarsHtml =
      analytics.chronologicalMarks.length === 0
        ? `<p style="font-size:11px;color:#64748b;text-align:center;padding:16px;">${t.pdfNoChartScores}</p>`
        : analytics.chronologicalMarks
            .map((m) => {
              const tot = Number(m.total_marks || 100);
              const pct = tot > 0 ? Math.min(100, Math.round((Number(m.marks_obtained || 0) / tot) * 100)) : 0;
              const barColor = pct >= 75 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';
              const shortTitle = escapeHtml((m.exam_title || 'Exam').slice(0, 14));
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
      alert(t.allowPopups);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Science Hub - Jaffna | ${escapeHtml(selectedStudent.full_name)} (${escapeHtml(selectedStudent.index_number)})</title>
          <style>
            * { box-sizing: border-box; font-family: 'Segoe UI', 'Noto Sans Tamil', Arial, sans-serif; }
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
            .card-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            .section-title { font-size: 12px; font-weight: 800; color: #1e1b4b; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.4px; }
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
              <img src="${logoUrl}" alt="Science Hub - Jaffna" onerror="this.style.display='none'" />
              <div>
                <h1 class="title">SCIENCE HUB - JAFFNA</h1>
                <p class="subtitle">${t.pdfSubtitle}</p>
              </div>
            </div>
            <div style="text-align:right;font-size:11px;color:#475569;">
              <strong>${t.pdfIssuedDate}</strong> ${escapeHtml(reportDate)}<br/>
              <strong>${t.pdfClass}</strong> ${escapeHtml(selectedStudent.class_name)}
            </div>
          </div>

          <div class="student-box">
            <div>
              <div style="color:#64748b;font-size:10px;font-weight:700;">${t.pdfStudentName}</div>
              <div style="font-size:15px;font-weight:800;color:#0f172a;">${escapeHtml(selectedStudent.full_name)}</div>
            </div>
            <div>
              <div style="color:#64748b;font-size:10px;font-weight:700;">${t.pdfIndexNumber}</div>
              <div style="font-size:14px;font-weight:700;color:#059669;">${escapeHtml(selectedStudent.index_number)}</div>
            </div>
            <div>
              <div style="color:#64748b;font-size:10px;font-weight:700;">${t.pdfContactWhatsapp}</div>
              <div style="font-size:13px;font-weight:600;">${escapeHtml(selectedStudent.whatsapp_number || '-')}</div>
            </div>
          </div>

          <div class="grid-3">
            <div class="card">
              <div class="card-label">${t.pdfVerifiedSessionsTitle}</div>
              <div class="card-val">${analytics.presentCount} ${t.pdfSessionsUnit}</div>
            </div>
            <div class="card">
              <div class="card-label">${t.pdfExamsCompletedTitle}</div>
              <div class="card-val">${marksLogs.length} ${t.pdfAssessmentsUnit}</div>
            </div>
            <div class="card">
              <div class="card-label">${t.pdfOverallAvgTitle}</div>
              <div class="card-val" style="color:#059669;">${analytics.overallAvg}%</div>
            </div>
          </div>

          <div class="section-title">${t.pdfMonthlyComparisonTitle} (${analytics.lastMonthLabel} vs ${analytics.thisMonthLabel})</div>
          <div class="grid-2">
            <div class="card">
              <div class="card-label">${t.pdfAttendanceDev}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:11px;gap:6px;">
                <span>${analytics.lastMonthLabel}: <strong>${analytics.lastMonthAtt} ${t.pdfDaysUnit}</strong></span>
                <span>${analytics.thisMonthLabel}: <strong>${analytics.thisMonthAtt} ${t.pdfDaysUnit}</strong></span>
                <span class="badge ${analytics.attDiff >= 0 ? 'badge-green' : 'badge-amber'}">
                  ${analytics.attDiff > 0 ? `+${analytics.attDiff} ${t.pdfImprovedUp}` : analytics.attDiff === 0 ? t.pdfConsistentRight : `${analytics.attDiff} ${t.pdfLowerDown}`}
                </span>
              </div>
            </div>
            <div class="card">
              <div class="card-label">${t.pdfExamScoreDev}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:11px;gap:6px;">
                <span>${analytics.lastMonthLabel}: <strong>${analytics.lastMonthAvg}%</strong></span>
                <span>${analytics.thisMonthLabel}: <strong>${analytics.thisMonthAvg}%</strong></span>
                <span class="badge ${analytics.scoreDiff >= 0 ? 'badge-green' : 'badge-amber'}">
                  ${analytics.scoreDiff > 0 ? `+${analytics.scoreDiff}% ${t.pdfImprovedUp}` : analytics.scoreDiff === 0 ? t.pdfSteadyRight : `${analytics.scoreDiff}% ${t.pdfDropDown}`}
                </span>
              </div>
            </div>
          </div>

          <div class="section-title">${t.pdfChartTitle}</div>
          <div class="card" style="display:flex;align-items:flex-end;gap:12px;min-height:135px;margin-bottom:20px;">
            ${chartBarsHtml}
          </div>

          <div class="section-title">${t.pdfMarksTableTitle}</div>
          <table>
            <thead>
              <tr>
                <th>${t.pdfColExamTitle}</th>
                <th>${t.pdfColDate}</th>
                <th>${t.pdfColMarks}</th>
                <th>${t.pdfColPct}</th>
                <th>${t.pdfColRemark}</th>
              </tr>
            </thead>
            <tbody>${examRowsHtml}</tbody>
          </table>

          <div class="section-title">${t.pdfAttTableTitle}</div>
          <table>
            <thead>
              <tr>
                <th>${t.pdfColTopic}</th>
                <th>${t.pdfColDate}</th>
                <th>${t.pdfColStatus}</th>
              </tr>
            </thead>
            <tbody>${attRowsHtml}</tbody>
          </table>

          <div class="footer">
            <div>${t.pdfFooterPortal}</div>
            <div>___________________________<br/>${t.pdfTeacherSig}</div>
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

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.index_number?.toLowerCase().includes(q) ||
      s.class_name?.toLowerCase().includes(q)
    );
  });

  const analytics = selectedStudent ? getAnalytics() : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl shadow-xl">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-400" />
          <span>{t.headerTitle}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">{t.headerDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Add Student & Student Directory */}
        <div className="space-y-6">
          <form onSubmit={handleAddStudent} className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-3.5 shadow-xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> {t.addStudentTitle}
            </h3>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">{t.fullName}</label>
              <input
                type="text"
                placeholder={t.fullNamePh}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">{t.className}</label>
              <input
                type="text"
                placeholder={t.classNamePh}
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">{t.indexNo}</label>
                <input
                  type="text"
                  placeholder={t.indexNoPh}
                  value={indexNumber}
                  onChange={(e) => setIndexNumber(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">{t.whatsapp}</label>
                <input
                  type="text"
                  placeholder={t.whatsappPh}
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAddingStudent}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isAddingStudent ? t.addingBtn : t.addStudentBtn}
            </button>
          </form>

          {/* Directory */}
          <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> {t.directoryTitle} ({students.length})
              </h3>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t.searchPh}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white"
              />
            </div>

            {loadingStudents ? (
              <div className="py-6 text-center text-slate-500 text-xs flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">{t.noStudents}</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredStudents.map((stu) => {
                  const isSelected = selectedStudent?.id === stu.id;
                  return (
                    <div
                      key={stu.id}
                      onClick={() => loadStudentRecords(stu)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-[#131c31] border-slate-800 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs truncate">{stu.full_name}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span className="text-emerald-400">{stu.index_number}</span>
                          <span>•</span>
                          <span className="truncate">{stu.class_name}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudent(stu);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Manual Attendance, Marks & 1-Click Parent PDF */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <div className="bg-[#0c1322] border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3 h-full flex flex-col items-center justify-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-bold text-sm text-slate-300">{t.selectPromptTitle}</h3>
              <p className="text-xs text-slate-500 max-w-md">{t.selectPromptDesc}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Student Header + 1-Click PDF Button */}
              <div className="bg-[#0c1322] border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{selectedStudent.full_name}</h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {selectedStudent.index_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedStudent.class_name} • 📱 {selectedStudent.whatsapp_number}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrintPhysicalReport}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{t.downloadPdfBtn}</span>
                  </button>
                </div>

                {analytics && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-[#131c31] border border-slate-700/50 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t.totalClassesCard}</span>
                      <h4 className="text-lg font-black text-blue-400 mt-0.5">{analytics.presentCount} {t.daysUnit}</h4>
                    </div>
                    <div className="bg-[#131c31] border border-slate-700/50 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t.totalExamsCard}</span>
                      <h4 className="text-lg font-black text-white mt-0.5">{marksLogs.length}</h4>
                    </div>
                    <div className="bg-[#131c31] border border-slate-700/50 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t.overallAvgCard}</span>
                      <h4 className="text-lg font-black text-emerald-400 mt-0.5">{analytics.overallAvg}%</h4>
                    </div>
                  </div>
                )}
              </div>

              {loadingRecords ? (
                <div className="py-12 text-center text-slate-500 text-xs flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Manual Attendance Card */}
                  <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
                    <h4 className="font-bold text-xs text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" /> {t.attSectionTitle}
                    </h4>

                    <form onSubmit={handleSaveAttendance} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">{t.attDate}</label>
                          <input
                            type="date"
                            value={attDate}
                            onChange={(e) => setAttDate(e.target.value)}
                            className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">{t.attStatus}</label>
                          <select
                            value={attStatus}
                            onChange={(e) => setAttStatus(e.target.value as 'Present' | 'Absent')}
                            className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            <option value="Present">{t.present}</option>
                            <option value="Absent">{t.absent}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{t.attTopic}</label>
                        <input
                          type="text"
                          placeholder={t.attTopicPh}
                          value={attTopic}
                          onChange={(e) => setAttTopic(e.target.value)}
                          className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingAtt}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {t.saveAttBtn}
                      </button>
                    </form>

                    <div className="pt-2 border-t border-slate-800 space-y-2 max-h-60 overflow-y-auto">
                      <span className="text-[10px] font-bold text-slate-400 block">{t.attHistoryTitle}</span>
                      {attendanceLogs.length === 0 ? (
                        <p className="text-[11px] text-slate-500">{t.noAttLogs}</p>
                      ) : (
                        attendanceLogs.map((a) => (
                          <div key={a.id} className="p-2.5 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{a.class_topic}</p>
                              <span className="text-[10px] font-mono text-slate-500">{a.attendance_date}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                  a.status === 'Present'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {a.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {a.status === 'Present' ? t.present : t.absent}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAttendance(a.id)}
                                className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Manual Exam Marks Card */}
                  <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
                    <h4 className="font-bold text-xs text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" /> {t.marksSectionTitle}
                    </h4>

                    <form onSubmit={handleSaveMarks} className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{t.examTitle}</label>
                        <input
                          type="text"
                          placeholder={t.examTitlePh}
                          value={examTitle}
                          onChange={(e) => setExamTitle(e.target.value)}
                          className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">{t.examDate}</label>
                          <input
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-emerald-400 block mb-1">{t.marksObtained}</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="82"
                            value={marksObtained}
                            onChange={(e) => setMarksObtained(e.target.value)}
                            className="w-full bg-[#070b14] border border-emerald-500/40 rounded-xl px-2.5 py-2 text-xs text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">{t.totalMarks}</label>
                          <input
                            type="number"
                            step="any"
                            placeholder="100"
                            value={totalMarks}
                            onChange={(e) => setTotalMarks(e.target.value)}
                            className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{t.teacherRemark}</label>
                        <input
                          type="text"
                          placeholder={t.teacherRemarkPh}
                          value={teacherRemark}
                          onChange={(e) => setTeacherRemark(e.target.value)}
                          className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingMarks}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {t.saveMarksBtn}
                      </button>
                    </form>

                    <div className="pt-2 border-t border-slate-800 space-y-2 max-h-60 overflow-y-auto">
                      <span className="text-[10px] font-bold text-slate-400 block">{t.marksHistoryTitle}</span>
                      {marksLogs.length === 0 ? (
                        <p className="text-[11px] text-slate-500">{t.noMarksLogs}</p>
                      ) : (
                        marksLogs.map((m) => (
                          <div key={m.id} className="p-2.5 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{m.exam_title}</p>
                              <span className="text-[10px] font-mono text-slate-500">{m.exam_date}</span>
                              {m.teacher_remark && (
                                <p className="text-[10px] text-blue-300 truncate mt-0.5">{m.teacher_remark}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                {m.marks_obtained}/{m.total_marks}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteMarks(m.id)}
                                className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}