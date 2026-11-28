'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, HelpCircle, Users, ArrowRight, Globe } from 'lucide-react';

type Lang = 'en' | 'ta';

const HOME_UI_TEXT = {
  en: {
    tagline: 'Education changes the world',
    officialPortalBadge: 'Official Learning Portal',
    heroPill: 'Attendance • Timed Exams • Tutes • Progress Reports',
    heroHighlight: 'Smart Online Learning Portal',
    heroDesc:
      'Official digital classroom of Science Hub - Jaffna featuring automated attendance tracking, anti-cheat timed online exams, PDF study tutes, and 1-click official progress reports.',
    teacherCardTitle: 'Teacher Admin Panel',
    teacherCardDesc:
      'Track attendance, publish new tutes & quizzes, and view detailed student progress reports.',
    teacherCardAction: 'Enter Control Panel →',
    studentCardTitle: 'Student Learning Portal',
    studentCardDesc:
      'Access 1-click Zoom classes, download study tutes, and take timed live online quizzes.',
    studentCardAction: 'Enter Student Portal →',
    footerTagline: 'Education changes the world'
  },
  ta: {
    tagline: 'கல்வி உலகை மாற்றும்',
    officialPortalBadge: 'உத்தியோகபூர்வ கற்றல் தளம்',
    heroPill: 'வருகைப் பதிவு • நேரப் பரீட்சைகள் • பயிற்சித் தாள்கள் • முன்னேற்ற அறிக்கைகள்',
    heroHighlight: 'நவீன இணையக் கற்றல் தளம்',
    heroDesc:
      'தானியங்கி வருகைப் பதிவு, மோசடித் தடுப்பு கொண்ட நேர இணையப் பரீட்சைகள், PDF கற்றல் குறிப்புகள் மற்றும் உடனடி உத்தியோகபூர்வ முன்னேற்ற அறிக்கைகளை உள்ளடக்கிய Science Hub - Jaffna இன் உத்தியோகபூர்வ டிஜிட்டல் வகுப்பறை.',
    teacherCardTitle: 'ஆசிரியர் நிர்வாகப் பலகம்',
    teacherCardDesc:
      'வருகைப் பதிவைக் கண்காணிக்கவும், புதிய பயிற்சித் தாள்கள் & வினாவிடைகளை வெளியிடவும், மாணவர்களின் விரிவான முன்னேற்ற அறிக்கைகளைப் பார்வையிடவும்.',
    teacherCardAction: 'நிர்வாகப் பலகத்திற்குள் நுழையவும் →',
    studentCardTitle: 'மாணவர் கற்றல் தளம்',
    studentCardDesc:
      'ஒரே கிளிக்கில் Zoom வகுப்புகளில் இணையவும், கற்றல் குறிப்புகளைப் பதிவிறக்கவும், நேர இணையப் பரீட்சைகளில் பங்கேற்கவும்.',
    studentCardAction: 'மாணவர் தளத்திற்குள் நுழையவும் →',
    footerTagline: 'கல்வி உலகை மாற்றும்'
  }
} as const;

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('en');
  const [currentYear, setCurrentYear] = useState('2026');
  const t = HOME_UI_TEXT[lang];

  useEffect(() => {
    setCurrentYear(String(new Date().getFullYear()));
    const savedLang =
      localStorage.getItem('lms_portal_lang') ||
      localStorage.getItem('lms_student_lang') ||
      localStorage.getItem('lms_teacher_lang');
    if (savedLang === 'ta' || savedLang === 'en') {
      setLang(savedLang);
    }
  }, []);

  const handleLanguageChange = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('lms_portal_lang', newLang);
    localStorage.setItem('lms_student_lang', newLang);
    localStorage.setItem('lms_teacher_lang', newLang);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between selection:bg-purple-500 selection:text-white font-sans">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 px-4 md:px-6 py-4 bg-[#0c1322] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Science Hub - Jaffna"
            className="w-10 h-10 rounded-full object-cover bg-white p-0.5 shadow-md ring-2 ring-emerald-400/40"
          />
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">Science Hub - Jaffna</h1>
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">{t.tagline}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#070b14] border border-slate-700 hover:border-emerald-500/50 rounded-xl px-3 py-1.5 transition">
            <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as Lang)}
              aria-label="Select Language"
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-[#0c1322] text-white">English</option>
              <option value="ta" className="bg-[#0c1322] text-white">தமிழ்</option>
            </select>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
            {t.officialPortalBadge}
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center space-y-8">
        
        <div className="flex flex-col items-center space-y-4">
          <img
            src="/logo.jpg"
            alt="Science Hub - Jaffna Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover bg-white p-1 shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-400/50"
          />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{t.heroPill}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Science Hub - Jaffna <br />
            <span className="bg-gradient-to-r from-emerald-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
              {t.heroHighlight}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>
        </div>

        {/* 2 Quick Portal Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4 text-left">
          
          {/* Card 1: Teacher Control Panel */}
          <Link
            href="/teacher"
            className="group p-6 rounded-3xl bg-[#0c1322] border border-slate-800 hover:border-purple-500/50 hover:bg-gradient-to-br hover:from-purple-950/20 hover:to-[#0c1322] transition-all duration-300 space-y-4 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>{t.teacherCardTitle}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition text-purple-400 flex-shrink-0" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t.teacherCardDesc}
              </p>
            </div>
            <span className="inline-block text-[11px] font-bold text-purple-400 group-hover:underline">
              {t.teacherCardAction}
            </span>
          </Link>

          {/* Card 2: Student Portal */}
          <Link
            href="/student"
            className="group p-6 rounded-3xl bg-[#0c1322] border border-slate-800 hover:border-indigo-500/50 hover:bg-gradient-to-br hover:from-indigo-950/20 hover:to-[#0c1322] transition-all duration-300 space-y-4 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>{t.studentCardTitle}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition text-indigo-400 flex-shrink-0" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t.studentCardDesc}
              </p>
            </div>
            <span className="inline-block text-[11px] font-bold text-indigo-400 group-hover:underline">
              {t.studentCardAction}
            </span>
          </Link>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 bg-[#0c1322]">
        © {currentYear} Science Hub - Jaffna • {t.footerTagline}
      </footer>

    </div>
  );
}