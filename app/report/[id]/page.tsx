'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, TrendingDown, Minus, Calendar, Award,
  MessageSquareQuote, CheckCircle2, XCircle, Printer, Globe, Loader2, ShieldCheck
} from 'lucide-react';

type Lang = 'en' | 'ta';

const TAMIL_SHORT_MONTHS = [
  'ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'
];

const UI = {
  en: {
    portalTitle: 'SCIENCE HUB - JAFFNA',
    portalTagline: 'Official Student Progress & Performance Portal',
    studentId: 'Student ID',
    batch: 'Batch / Class',
    printBtn: 'Save / Print Report',
    loading: 'Loading student progress report...',
    notFoundTitle: 'Report Not Found',
    notFoundDesc: 'This student report link may be invalid or removed.',
    overallStatusLabel: 'Overall Academic Status',
    statusImproving: 'Showing Great Progress',
    statusConsistent: 'Steady & Consistent',
    statusAttention: 'Needs More Focus',
    attRateTitle: 'Class Attendance',
    attendedDays: 'Days Attended',
    totalRecorded: 'Total Classes',
    examAvgTitle: 'Overall Exam Average',
    examsCount: 'Exams Completed',
    vsLastMonth: 'vs Last Month',
    improved: 'Improved',
    dropped: 'Dropped',
    same: 'Consistent',
    chartSectionTitle: 'Exam & Paper Performance Trend',
    chartSub: 'Visual progress across recent exams and unit tests',
    noExamsChart: 'No exam results recorded yet.',
    remarksSectionTitle: 'Teacher Remarks & Feedback',
    noRemarks: 'No specific remarks added yet.',
    examHistoryTitle: 'Detailed Exam & Paper Results',
    attHistoryTitle: 'Recent Class Attendance Log',
    present: 'Present',
    absent: 'Absent',
    footerNote: 'Verified Digital Progress Report • Science Hub - Jaffna'
  },
  ta: {
    portalTitle: 'SCIENCE HUB - JAFFNA',
    portalTagline: 'உத்தியோகபூர்வ மாணவர் முன்னேற்ற அறிக்கை',
    studentId: 'மாணவர் ஐடி',
    batch: 'வகுப்பு / பிரிவு',
    printBtn: 'அச்சிடு / PDF சேமி',
    loading: 'மாணவர் முன்னேற்ற அறிக்கை ஏற்றப்படுகிறது...',
    notFoundTitle: 'அறிக்கை கிடைக்கவில்லை',
    notFoundDesc: 'இந்த இணைப்பு தவறானது அல்லது நீக்கப்பட்டுள்ளது.',
    overallStatusLabel: 'ஒட்டுமொத்த கல்வி நிலை',
    statusImproving: 'சிறந்த முன்னேற்றம்',
    statusConsistent: 'சீரான நிலை',
    statusAttention: 'மேலதிக கவனம் தேவை',
    attRateTitle: 'வகுப்பு வருகை',
    attendedDays: 'கலந்துகொண்ட நாட்கள்',
    totalRecorded: 'மொத்த வகுப்புகள்',
    examAvgTitle: 'மொத்தப் பரீட்சை சராசரி',
    examsCount: 'முடித்த பரீட்சைகள்',
    vsLastMonth: 'கடந்த மாதத்துடன் ஒப்பிடுகையில்',
    improved: 'முன்னேற்றம்',
    dropped: 'குறைவு',
    same: 'சீரானது',
    chartSectionTitle: 'பரீட்சை & வினாத்தாள் முன்னேற்ற வரைபடம்',
    chartSub: 'சமீபத்திய பரீட்சைகளின் புள்ளி விபர ஒப்பீடு',
    noExamsChart: 'இதுவரை பரீட்சைப் புள்ளிகள் பதிவு செய்யப்படவில்லை.',
    remarksSectionTitle: 'ஆசிரியரின் விசேட கருத்துக்கள்',
    noRemarks: 'இதுவரை விசேட கருத்துக்கள் எதுவும் சேர்க்கப்படவில்லை.',
    examHistoryTitle: 'பரீட்சைப் புள்ளிகள் விபரம்',
    attHistoryTitle: 'வகுப்பு வருகைப் பதிவுகள்',
    present: 'சமூகம்',
    absent: 'சமூகமில்லை',
    footerNote: 'உறுதிப்படுத்தப்பட்ட டிஜிட்டல் முன்னேற்ற அறிக்கை • Science Hub - Jaffna'
  }
} as const;

function formatShortMonth(date: Date, lang: Lang) {
  if (lang === 'ta') {
    return `${TAMIL_SHORT_MONTHS[date.getMonth()] || ''} ${date.getFullYear()}`;
  }
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function ReportContent() {
  const params = useParams();
  const studentId = params?.id as string;

  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);

  const t = UI[lang];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchLang = new URLSearchParams(window.location.search).get('lang');
      if (searchLang === 'ta' || searchLang === 'en') {
        setLang(searchLang);
      }
    }
  }, []);

  useEffect(() => {
    if (!studentId) return;
    const loadReport = async () => {
      setLoading(true);
      const { data: stu } = await supabase
        .from('physical_students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (stu) {
        setStudent(stu);
        const [{ data: att }, { data: mrk }] = await Promise.all([
          supabase
            .from('physical_attendance')
            .select('*')
            .eq('student_id', stu.id)
            .order('attendance_date', { ascending: false }),
          supabase
            .from('physical_marks')
            .select('*')
            .eq('student_id', stu.id)
            .order('exam_date', { ascending: false })
        ]);
        setAttendance(att || []);
        setMarks(mrk || []);
      }
      setLoading(false);
    };

    loadReport();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a13] text-slate-200 flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">{t.loading}</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-[#060a13] text-slate-200 flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-xl font-black text-white">{t.notFoundTitle}</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md">{t.notFoundDesc}</p>
      </div>
    );
  }

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

  const presentLogs = attendance.filter((a) => a.status === 'Present');
  const attendancePct = attendance.length > 0 ? Math.round((presentLogs.length / attendance.length) * 100) : 0;

  const thisMonthAtt = presentLogs.filter((a) => isSameMonthYear(a.attendance_date, thisMonth, thisYear)).length;
  const lastMonthAtt = presentLogs.filter((a) => isSameMonthYear(a.attendance_date, lastMonth, lastMonthYear)).length;
  const attDiff = thisMonthAtt - lastMonthAtt;

  const calcPct = (m: any) => {
    const tot = Number(m.total_marks || 100);
    return tot > 0 ? Math.round((Number(m.marks_obtained || 0) / tot) * 100) : 0;
  };

  const overallAvg =
    marks.length > 0 ? Math.round(marks.reduce((acc, m) => acc + calcPct(m), 0) / marks.length) : 0;

  const thisMonthExams = marks.filter((m) => isSameMonthYear(m.exam_date, thisMonth, thisYear));
  const lastMonthExams = marks.filter((m) => isSameMonthYear(m.exam_date, lastMonth, lastMonthYear));

  const thisMonthAvg =
    thisMonthExams.length > 0
      ? Math.round(thisMonthExams.reduce((acc, m) => acc + calcPct(m), 0) / thisMonthExams.length)
      : 0;
  const lastMonthAvg =
    lastMonthExams.length > 0
      ? Math.round(lastMonthExams.reduce((acc, m) => acc + calcPct(m), 0) / lastMonthExams.length)
      : 0;

  const scoreDiff = thisMonthAvg - lastMonthAvg;
  const chronologicalMarks = [...marks].reverse().slice(-10);
  const remarksList = marks.filter((m) => m.teacher_remark && m.teacher_remark.trim() !== '');

  const isImproving = scoreDiff > 0 || attDiff > 0 || overallAvg >= 75;
  const needsAttention = (overallAvg > 0 && overallAvg < 50) || (attendance.length > 0 && attendancePct < 60);

  return (
    <div className="min-h-screen bg-[#060a13] text-slate-100 pb-14 print:bg-white print:text-slate-900">
      {/* Top Navbar */}
      <div className="bg-[#0c1322] border-b border-slate-800/80 sticky top-0 z-20 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Logo"
              onError={(e) => (e.currentTarget.style.display = 'none')}
              className="w-9 h-9 rounded-full object-cover border border-emerald-500/50"
            />
            <div>
              <h1 className="text-sm font-black tracking-wide text-white">{t.portalTitle}</h1>
              <p className="text-[10px] text-emerald-400">{t.portalTagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.printBtn}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Student Hero Card */}
        <div className="bg-gradient-to-br from-[#0e1729] to-[#0a101d] border border-slate-800 rounded-3xl p-6 shadow-2xl print:border-slate-300 print:bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.portalTitle}</span>
              </div>
              <h2 className="text-2xl font-black text-white print:text-slate-900">{student.full_name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                <span>
                  {t.studentId}: <strong className="text-emerald-400 font-mono">{student.index_number}</strong>
                </span>
                <span>•</span>
                <span>
                  {t.batch}: <strong className="text-slate-200 print:text-slate-800">{student.class_name}</strong>
                </span>
              </div>
            </div>

            {/* Overall Visual Status Pill */}
            <div className="bg-[#131d33] border border-slate-700/70 rounded-2xl p-3.5 text-left sm:text-right print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.overallStatusLabel}</span>
              {needsAttention ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-black text-amber-400 mt-1">
                  <TrendingDown className="w-4 h-4" /> {t.statusAttention}
                </span>
              ) : isImproving ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-400 mt-1">
                  <TrendingUp className="w-4 h-4" /> {t.statusImproving}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-black text-blue-400 mt-1">
                  <Minus className="w-4 h-4" /> {t.statusConsistent}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Visual KPI Cards with Progress Bars & Month Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Attendance Card */}
          <div className="bg-[#0c1322] border border-slate-800/90 rounded-3xl p-5 space-y-4 shadow-xl print:border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white print:text-slate-900">{t.attRateTitle}</h3>
                  <p className="text-[11px] text-slate-400">
                    {presentLogs.length} / {attendance.length} {t.attendedDays}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-black text-blue-400">{attendancePct}%</span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${attendancePct}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">
                {formatShortMonth(lastMonthDate, lang)}: <strong className="text-slate-200">{lastMonthAtt}d</strong> →{' '}
                {formatShortMonth(now, lang)}: <strong className="text-white">{thisMonthAtt}d</strong>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  attDiff > 0
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : attDiff < 0
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {attDiff > 0 ? `+${attDiff} ${t.improved}` : attDiff < 0 ? `${attDiff} ${t.dropped}` : t.same}
              </span>
            </div>
          </div>

          {/* Exam Average Card */}
          <div className="bg-[#0c1322] border border-slate-800/90 rounded-3xl p-5 space-y-4 shadow-xl print:border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white print:text-slate-900">{t.examAvgTitle}</h3>
                  <p className="text-[11px] text-slate-400">
                    {marks.length} {t.examsCount}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-black text-emerald-400">{overallAvg}%</span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallAvg >= 75
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : overallAvg >= 50
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-400'
                    : 'bg-gradient-to-r from-amber-500 to-orange-400'
                }`}
                style={{ width: `${overallAvg}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">
                {formatShortMonth(lastMonthDate, lang)}: <strong className="text-slate-200">{lastMonthAvg}%</strong> →{' '}
                {formatShortMonth(now, lang)}: <strong className="text-white">{thisMonthAvg}%</strong>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  scoreDiff > 0
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : scoreDiff < 0
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {scoreDiff > 0 ? `+${scoreDiff}% ${t.improved}` : scoreDiff < 0 ? `${scoreDiff}% ${t.dropped}` : t.same}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Exam Performance Bar Chart */}
        <div className="bg-[#0c1322] border border-slate-800/90 rounded-3xl p-6 shadow-xl print:border-slate-300">
          <div className="mb-5">
            <h3 className="text-base font-black text-white print:text-slate-900">{t.chartSectionTitle}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.chartSub}</p>
          </div>

          {chronologicalMarks.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">{t.noExamsChart}</p>
          ) : (
            <div className="flex items-end gap-3 sm:gap-5 h-48 pt-6 px-2 border-b border-slate-800 overflow-x-auto">
              {chronologicalMarks.map((m) => {
                const pct = Math.min(100, calcPct(m));
                const barGradient =
                  pct >= 75
                    ? 'from-emerald-600 to-emerald-400'
                    : pct >= 50
                    ? 'from-blue-600 to-indigo-400'
                    : 'from-amber-600 to-amber-400';

                return (
                  <div key={m.id} className="flex-1 min-w-[54px] flex flex-col items-center gap-2">
                    <span className="text-xs font-black text-white print:text-slate-900">{pct}%</span>
                    <div className="w-full max-w-[44px] h-32 bg-slate-800/70 rounded-t-xl flex items-end overflow-hidden">
                      <div
                        className={`w-full bg-gradient-to-t ${barGradient} rounded-t-xl transition-all duration-700`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 text-center line-clamp-2 leading-tight h-7">
                      {m.exam_title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Teacher Remarks Highlight Section */}
        <div className="bg-[#0c1322] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-4 print:border-slate-300">
          <h3 className="text-base font-black text-white flex items-center gap-2 print:text-slate-900">
            <MessageSquareQuote className="w-5 h-5 text-amber-400" />
            <span>{t.remarksSectionTitle}</span>
          </h3>

          {remarksList.length === 0 ? (
            <p className="text-xs text-slate-500">{t.noRemarks}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {remarksList.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#131c31] border border-amber-500/20 rounded-2xl p-4 space-y-1.5 print:border-slate-300"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-400">{m.exam_title}</span>
                    <span className="text-slate-500 font-mono">{m.exam_date}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed print:text-slate-800">“{m.teacher_remark}”</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0c1322] border border-slate-800/90 rounded-3xl p-5 space-y-3 shadow-xl print:border-slate-300">
            <h4 className="text-sm font-black text-white print:text-slate-900">{t.examHistoryTitle}</h4>
            <div className="space-y-2">
              {marks.map((m) => {
                const pct = calcPct(m);
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-2 print:border-slate-300"
                  >
                    <div>
                      <p className="text-xs font-bold text-white print:text-slate-900">{m.exam_title}</p>
                      <span className="text-[10px] font-mono text-slate-500">{m.exam_date}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-emerald-400">
                        {m.marks_obtained}/{m.total_marks}
                      </span>
                      <span className="block text-[10px] text-slate-400">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0c1322] border border-slate-800/90 rounded-3xl p-5 space-y-3 shadow-xl print:border-slate-300">
            <h4 className="text-sm font-black text-white print:text-slate-900">{t.attHistoryTitle}</h4>
            <div className="space-y-2">
              {attendance.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-2xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-2 print:border-slate-300"
                >
                  <div>
                    <p className="text-xs font-bold text-white print:text-slate-900">{a.class_topic}</p>
                    <span className="text-[10px] font-mono text-slate-500">{a.attendance_date}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      a.status === 'Present'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {a.status === 'Present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {a.status === 'Present' ? t.present : t.absent}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 pt-4">{t.footerNote}</p>
      </div>
    </div>
  );
}

export default function PublicStudentReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060a13] text-slate-200 flex items-center justify-center p-6">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}