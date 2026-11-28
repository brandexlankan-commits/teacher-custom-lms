'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Video, BookOpen, Clock, 
  HelpCircle, CheckCircle2, XCircle, Award, 
  Download, ShieldCheck, PlaySquare, 
  Lock, X, CreditCard, AlertCircle, LogOut, KeyRound, Smartphone, Upload, Loader2,
  ShieldAlert, ArrowRight, MessageSquare, Play, Pause, RotateCcw, RotateCw,
  Volume2, VolumeX, Maximize, Globe
} from 'lucide-react';

type Lang = 'en' | 'ta';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const TAMIL_MONTHS = [
  'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
];

const STUDENT_UI_TEXT = {
  en: {
    // Login Screen
    loginTagline: 'Student Portal Login • Education changes the world',
    identifierLabel: 'Index Number or WhatsApp Number',
    identifierPlaceholder: 'e.g. ST-001 or 0771234567',
    passwordLabel: 'Password',
    passwordHint: "* If you don't know your password, please enter your WhatsApp phone number.",
    verifyingBtn: 'Verifying...',
    loginBtn: 'Login to Student Hub',
    deviceSecurityFooter: 'Hardware 1-Device Security Active',
    deviceLockedError: '⚠️ Your account is locked to a different device. Please contact your teacher to unlock your device.',

    // Loading & Header
    verifyingAccount: 'Verifying student account...',
    deviceVerifiedBadge: '1 Device Verified',
    logoutBtn: 'Logout',

    // Unenrolled
    notEnrolledTitle: 'You are not enrolled in any class yet.',
    notEnrolledDesc: 'Please contact your teacher at Science Hub - Jaffna to get your Index Number registered for the class.',

    // Payment & Fees Banner
    classFeesSuffix: 'Class Fees',
    freeCardActiveMsg: 'Free Card Active — Full access granted to all classes and materials.',
    bothMonthsPaidPrefix: 'Payment verified for both',
    andWord: 'and',
    fullAccessActiveSuffix: '! Full access active.',
    nextMonthPendingPrefix: 'Your bank slip for',
    nextMonthPendingSuffix: 'is Pending approval. Current classes remain active.',
    paymentReminderTitle: 'Payment Reminder:',
    paymentReminderPart1: 'Please submit your',
    paymentReminderPart2: 'class fee',
    paymentReminderPart3: 'Grace period runs until the',
    paymentReminderPart4: '5th of',
    paymentReminderPart5: ', after which access will lock.',
    currentMonthApprovedPrefix: 'Payment verified for',
    currentMonthApprovedSuffix: '. Full access active.',
    tempExtensionPrefix: 'Teacher Temporary Access granted until',
    tempExtensionMid: '. Please upload your',
    tempExtensionSuffix: 'slip before that date.',
    currentMonthPendingPrefix: 'Bank slip for',
    currentMonthPendingMid: 'is Pending approval.',
    graceActiveUntilPrefix: 'Grace period access is active until the 5th of',
    unlockOnceApproved: 'Lessons will unlock once approved.',
    finalReminderTitle: 'Final Reminder (Grace Period 1st–5th):',
    finalReminderPart1: 'Please upload your',
    finalReminderPart2: 'fee',
    finalReminderPart3: 'before the',
    finalReminderPart4: '5th',
    finalReminderPart5: '. Access will lock after the 5th.',
    rejectedPrefix: 'Bank slip for',
    rejectedSuffix: 'was rejected. Please upload a valid slip',
    toUnlockLessons: 'to unlock lessons.',
    accessLockedTitle: 'Access Locked:',
    accessLockedPart1: 'The deadline (5th of',
    accessLockedPart2: ') has passed. Upload your bank slip for',
    accessLockedPart3: 'to restore access.',
    btnPaid: 'Paid',
    btnPending: 'Pending',
    btnUploading: 'Uploading...',
    btnSubmitSlip: 'Submit Slip',
    slipUploadedAlert: (monthLabel: string) =>
      `Bank slip for ${monthLabel} uploaded successfully! Waiting for teacher approval.`,

    // Live Zoom Class
    scheduledDurationPrefix: 'Scheduled Duration:',
    minsUnit: 'mins',
    minStayRequiredPrefix: 'Minimum stay required for Present mark:',
    zoomReadyHint: 'Once the Zoom session is ready, click Join Class to connect with your personal verified entry.',
    personalZoomLockPrefix: 'Personal Single-User Zoom Access • Display Name Locked to',
    lockedPaymentRequired: 'Locked • Monthly Payment Required',
    generatingPersonalEntry: 'Generating Personal Entry...',
    joinLiveClassBtn: 'Join Live Class (Protected Entry)',
    attendanceVerifiedBadge: (mins: number) => `Attendance Verified (${mins}m)!`,
    verifyingAttendanceBadge: (stay: number, req: number) =>
      `Verifying Attendance: ${stay} / ${req} mins completed (Keep this tab open during class)`,
    joinLockedAlert: (monthLabel: string) =>
      `Access Locked: The monthly fee payment window (25th of last month to 5th of ${monthLabel}) has ended. Please upload your bank slip for ${monthLabel} or contact your teacher.`,

    // Recordings, Tutes, Quizzes
    pastRecordingsTitle: 'Past Recordings',
    noRecordings: 'No recordings available.',
    watchLessonBtn: 'Watch Lesson',
    lockedPaymentShort: 'Locked (Payment Required)',
    tutesHandoutsTitle: 'Tutes & Handouts',
    noTutes: 'No tutes uploaded yet.',
    paymentRequiredDownloadTitle: 'Monthly payment required to download',
    examsQuizzesTitle: 'Exams & Quizzes',
    noExamsQuizzes: 'No exams or quizzes available.',
    strictOnlineExamLabel: 'Online Exam',
    practiceQuizLabel: 'Quiz',
    scoreLabel: 'Score',
    perQShort: 'Q',
    minsShort: 'Mins',
    lockedShort: 'Locked',
    completedBadge: 'Completed',
    startExamBtn: 'Start Exam',
    retakeQuizBtn: 'Retake Quiz',
    startQuizBtn: 'Start Quiz',
    examLockedAlert: (monthLabel: string) =>
      `Access Locked: Please upload your bank slip for ${monthLabel} or contact your teacher to take online exams.`,
    alreadyCompletedExamAlert: 'You have already completed this Online Exam. Only one attempt is permitted.',
    noQuestionsAddedAlert: 'Questions have not been added to this exam/quiz yet.',

    // Video Player Modal
    protectedStreamBadge: 'Science Hub - Jaffna Protected Stream',
    pauseBtn: 'Pause',
    playBtn: 'Play',
    rewindTitle: 'Rewind 10 seconds',
    forwardTitle: 'Forward 10 seconds',
    speedLabel: 'Speed:',
    fullscreenTitle: 'Fullscreen',

    // Exam & Quiz Modal
    perQuestionHeaderInfo: (curr: number, total: number) =>
      `Question ${curr} of ${total} • Locked Auto-Advance Mode`,
    wholeExamHeaderInfo: (total: number) =>
      `${total} Questions • Anti-Cheat Guard Active`,
    closeBtn: 'Close',
    cheatStrikeMax: '⚠️ Security Violation (3/3): Exam auto-submitted due to repeated tab switching.',
    cheatStrikeWarn: (strike: number) =>
      `⚠️ Anti-Cheat Warning (${strike}/3): Do not switch tabs or leave the exam window! On 3 warnings your exam will auto-submit.`,
    submittedSuffix: 'Submitted!',
    recordedForReviewMsg: "Your answers have been recorded for your teacher's review at Science Hub - Jaffna.",
    questionLabel: 'Question',
    marksLabel: 'Marks',
    typeAnswerBelow: 'Type your answer below:',
    writeAnswerPlaceholder: 'Write your answer here...',
    saveNextQuestionBtn: 'Save & Next Question (Cannot Return)',
    submitFinalAnswersBtn: 'Submit Final Answers',
    submittedForReviewBadge: 'Submitted for Review',
    correctBadge: 'Correct',
    incorrectBadge: 'Incorrect',
    expectedAnswerLabel: 'Expected Answer:',
    submitAnswersBtn: 'Submit Answers'
  },

  ta: {
    // Login Screen
    loginTagline: 'மாணவர் போர்டல் உள்நுழைவு • கல்வி உலகை மாற்றும்',
    identifierLabel: 'சுட்டெண் (Index Number) அல்லது WhatsApp எண்',
    identifierPlaceholder: 'உதா: ST-001 அல்லது 0771234567',
    passwordLabel: 'கடவுச்சொல்',
    passwordHint: '* உங்கள் கடவுச்சொல் தெரியாவிட்டால், உங்கள் WhatsApp தொலைபேசி எண்ணை உள்ளிடவும்.',
    verifyingBtn: 'சரிபார்க்கப்படுகிறது...',
    loginBtn: 'மாணவர் மையத்தில் உள்நுழையவும்',
    deviceSecurityFooter: '1-சாதன வன்பொருள் பாதுகாப்பு செயலில் உள்ளது',
    deviceLockedError: '⚠️ உங்கள் கணக்கு வேறொரு சாதனத்துடன் பூட்டப்பட்டுள்ளது. உங்கள் சாதனப் பூட்டை நீக்க ஆசிரியரைத் தொடர்பு கொள்ளவும்.',

    // Loading & Header
    verifyingAccount: 'மாணவர் கணக்கு சரிபார்க்கப்படுகிறது...',
    deviceVerifiedBadge: '1 சாதனம் சரிபார்க்கப்பட்டது',
    logoutBtn: 'வெளியேறு',

    // Unenrolled
    notEnrolledTitle: 'நீங்கள் இதுவரை எந்த வகுப்பிலும் இணைக்கப்படவில்லை.',
    notEnrolledDesc: 'வகுப்பில் உங்கள் சுட்டெண்ணைப் (Index Number) பதிவு செய்ய Science Hub - Jaffna ஆசிரியரைத் தொடர்பு கொள்ளவும்.',

    // Payment & Fees Banner
    classFeesSuffix: 'வகுப்புக் கட்டணம்',
    freeCardActiveMsg: 'இலவச அட்டை (Free Card) செயலில் உள்ளது — அனைத்து வகுப்புகள் மற்றும் கற்றல் வளங்களுக்கு முழு அணுகல் வழங்கப்பட்டுள்ளது.',
    bothMonthsPaidPrefix: 'இரு மாதங்களுக்கும் கட்டணம் உறுதிப்படுத்தப்பட்டுள்ளது:',
    andWord: 'மற்றும்',
    fullAccessActiveSuffix: '! முழு அணுகல் செயலில் உள்ளது.',
    nextMonthPendingPrefix: 'உங்கள் வங்கிப் பற்றுச்சீட்டு அனுமதிக்காக நிலுவையில் உள்ளது:',
    nextMonthPendingSuffix: '. தற்போதைய வகுப்புகள் தொடர்ந்தும் செயலில் உள்ளன.',
    paymentReminderTitle: 'கட்டண நினைவூட்டல்:',
    paymentReminderPart1: 'தயவுசெய்து உங்கள்',
    paymentReminderPart2: 'மாத வகுப்புக் கட்டணத்தை',
    paymentReminderPart3: 'செலுத்தவும். சலுகைக் காலம்',
    paymentReminderPart4: '5 ஆம் திகதி',
    paymentReminderPart5: 'வரை உள்ளது; அதன் பின்னர் அணுகல் பூட்டப்படும்.',
    currentMonthApprovedPrefix: 'கட்டணம் உறுதிப்படுத்தப்பட்டுள்ளது:',
    currentMonthApprovedSuffix: '. முழு அணுகல் செயலில் உள்ளது.',
    tempExtensionPrefix: 'ஆசிரியரின் தற்காலிக அணுகல் வழங்கப்பட்டுள்ள இறுதித் திகதி:',
    tempExtensionMid: '. அத்திகதிக்கு முன் உங்கள்',
    tempExtensionSuffix: 'மாதப் பற்றுச்சீட்டைப் பதிவேற்றவும்.',
    currentMonthPendingPrefix: 'வங்கிப் பற்றுச்சீட்டு அனுமதிக்காக நிலுவையில் உள்ளது:',
    currentMonthPendingMid: '.',
    graceActiveUntilPrefix: '5 ஆம் திகதி வரை சலுகைக் கால அணுகல் செயலில் உள்ளது:',
    unlockOnceApproved: 'அனுமதிக்கப்பட்டவுடன் பாடங்கள் திறக்கப்படும்.',
    finalReminderTitle: 'இறுதி நினைவூட்டல் (சலுகைக் காலம் 1–5 திகதி):',
    finalReminderPart1: 'தயவுசெய்து 5 ஆம் திகதிக்கு முன் உங்கள்',
    finalReminderPart2: 'மாதக் கட்டணத்தை',
    finalReminderPart3: 'பதிவேற்றவும்.',
    finalReminderPart4: '5 ஆம் திகதிக்குப் பிறகு',
    finalReminderPart5: 'அணுகல் பூட்டப்படும்.',
    rejectedPrefix: 'வங்கிப் பற்றுச்சீட்டு நிராகரிக்கப்பட்டது:',
    rejectedSuffix: '. சரியான பற்றுச்சீட்டை',
    toUnlockLessons: 'பதிவேற்றி பாடங்களைத் திறக்கவும்.',
    accessLockedTitle: 'அணுகல் பூட்டப்பட்டுள்ளது:',
    accessLockedPart1: 'இறுதித் திகதி (5 ஆம் திகதி -',
    accessLockedPart2: ') முடிந்துவிட்டது. அணுகலை மீண்டும் பெற',
    accessLockedPart3: 'மாதத்திற்கான வங்கிப் பற்றுச்சீட்டைப் பதிவேற்றவும்.',
    btnPaid: 'செலுத்தப்பட்டது',
    btnPending: 'நிலுவையில்',
    btnUploading: 'பதிவேற்றப்படுகிறது...',
    btnSubmitSlip: 'பற்றுச்சீட்டைச் சமர்ப்பி',
    slipUploadedAlert: (monthLabel: string) =>
      `${monthLabel} மாதத்திற்கான வங்கிப் பற்றுச்சீட்டு வெற்றிகரமாகப் பதிவேற்றப்பட்டது! ஆசிரியரின் அனுமதிக்காகக் காத்திருக்கிறது.`,

    // Live Zoom Class
    scheduledDurationPrefix: 'திட்டமிடப்பட்ட நேரம்:',
    minsUnit: 'நிமிடங்கள்',
    minStayRequiredPrefix: 'வருகை (Present) பதிவு செய்யத் தேவையான குறைந்தபட்ச நேரம்:',
    zoomReadyHint: 'Zoom வகுப்பு தயாரானதும், உங்கள் தனிப்பட்ட உறுதிப்படுத்தப்பட்ட நுழைவு மூலம் இணைய "நேரடி வகுப்பில் இணை" என்பதைக் கிளிக் செய்யவும்.',
    personalZoomLockPrefix: 'தனிப்பட்ட ஒரு-பயனர் Zoom அணுகல் • காட்சிப் பெயர் இவ்வாறு பூட்டப்பட்டுள்ளது:',
    lockedPaymentRequired: 'பூட்டப்பட்டுள்ளது • மாதாந்தக் கட்டணம் தேவை',
    generatingPersonalEntry: 'தனிப்பட்ட நுழைவு உருவாக்கப்படுகிறது...',
    joinLiveClassBtn: 'நேரடி வகுப்பில் இணை (பாதுகாக்கப்பட்ட நுழைவு)',
    attendanceVerifiedBadge: (mins: number) => `வருகை உறுதிப்படுத்தப்பட்டது (${mins} நிமிடம்)!`,
    verifyingAttendanceBadge: (stay: number, req: number) =>
      `வருகை சரிபார்க்கப்படுகிறது: ${stay} / ${req} நிமிடங்கள் நிறைவடைந்துள்ளன (வகுப்பின் போது இந்தத் தாவலைத் திறந்து வைக்கவும்)`,
    joinLockedAlert: (monthLabel: string) =>
      `அணுகல் பூட்டப்பட்டுள்ளது: மாதாந்தக் கட்டணம் செலுத்தும் காலம் (கடந்த மாதம் 25 முதல் ${monthLabel} 5 வரை) முடிவடைந்துள்ளது. தயவுசெய்து ${monthLabel} மாதத்திற்கான வங்கிப் பற்றுச்சீட்டைப் பதிவேற்றவும் அல்லது ஆசிரியரைத் தொடர்பு கொள்ளவும்.`,

    // Recordings, Tutes, Quizzes
    pastRecordingsTitle: 'கடந்த பாடப் பதிவுகள்',
    noRecordings: 'பாடப் பதிவுகள் எதுவும் இல்லை.',
    watchLessonBtn: 'பாடத்தைப் பார்',
    lockedPaymentShort: 'பூட்டப்பட்டுள்ளது (கட்டணம் தேவை)',
    tutesHandoutsTitle: 'பயிற்சித் தாள்கள் & குறிப்புகள்',
    noTutes: 'இதுவரை பயிற்சித் தாள்கள் எதுவும் பதிவேற்றப்படவில்லை.',
    paymentRequiredDownloadTitle: 'பதிவிறக்க மாதாந்தக் கட்டணம் செலுத்த வேண்டும்',
    examsQuizzesTitle: 'பரீட்சைகள் & வினாவிடைகள்',
    noExamsQuizzes: 'பரீட்சைகள் அல்லது வினாவிடைகள் எதுவும் இல்லை.',
    strictOnlineExamLabel: 'இணையப் பரீட்சை',
    practiceQuizLabel: 'வினாவிடை',
    scoreLabel: 'புள்ளி',
    perQShort: 'வினா',
    minsShort: 'நிமிடம்',
    lockedShort: 'பூட்டப்பட்டுள்ளது',
    completedBadge: 'நிறைவடைந்தது',
    startExamBtn: 'பரீட்சையைத் தொடங்கு',
    retakeQuizBtn: 'மீண்டும் செய்',
    startQuizBtn: 'வினாவிடையைத் தொடங்கு',
    examLockedAlert: (monthLabel: string) =>
      `அணுகல் பூட்டப்பட்டுள்ளது: இணையப் பரீட்சைகளில் பங்கேற்க ${monthLabel} மாதத்திற்கான வங்கிப் பற்றுச்சீட்டைப் பதிவேற்றவும் அல்லது ஆசிரியரைத் தொடர்பு கொள்ளவும்.`,
    alreadyCompletedExamAlert: 'நீங்கள் ஏற்கனவே இந்த இணையப் பரீட்சையை முடித்துவிட்டீர்கள். ஒரு முயற்சிக்கு மட்டுமே அனுமதி உண்டு.',
    noQuestionsAddedAlert: 'இந்தப் பரீட்சை / வினாவிடைக்கு இன்னும் வினாக்கள் சேர்க்கப்படவில்லை.',

    // Video Player Modal
    protectedStreamBadge: 'Science Hub - Jaffna பாதுகாக்கப்பட்ட ஒளிபரப்பு',
    pauseBtn: 'இடைநிறுத்து',
    playBtn: 'இயக்கு',
    rewindTitle: '10 வினாடிகள் பின்னோக்கி',
    forwardTitle: '10 வினாடிகள் முன்னோக்கி',
    speedLabel: 'வேகம்:',
    fullscreenTitle: 'முழுத்திரை',

    // Exam & Quiz Modal
    perQuestionHeaderInfo: (curr: number, total: number) =>
      `வினா ${curr} / ${total} • தானாக அடுத்த வினாவிற்குச் செல்லும் முறை`,
    wholeExamHeaderInfo: (total: number) =>
      `${total} வினாக்கள் • மோசடித் தடுப்பு செயலில் உள்ளது`,
    closeBtn: 'மூடு',
    cheatStrikeMax: '⚠️ பாதுகாப்பு மீறல் (3/3): மீண்டும் மீண்டும் தாவல்களை (Tabs) மாற்றியதால் பரீட்சை தானாகவே சமர்ப்பிக்கப்பட்டது.',
    cheatStrikeWarn: (strike: number) =>
      `⚠️ மோசடித் தடுப்பு எச்சரிக்கை (${strike}/3): தாவல்களை மாற்றவோ பரீட்சை சாளரத்தை விட்டு வெளியேறவோ வேண்டாம்! 3 எச்சரிக்கைகளில் பரீட்சை தானாகவே சமர்ப்பிக்கப்படும்.`,
    submittedSuffix: 'சமர்ப்பிக்கப்பட்டது!',
    recordedForReviewMsg: 'Science Hub - Jaffna ஆசிரியரின் மதிப்பாய்விற்காக உங்கள் விடைகள் பதிவு செய்யப்பட்டுள்ளன.',
    questionLabel: 'வினா',
    marksLabel: 'புள்ளிகள்',
    typeAnswerBelow: 'உங்கள் விடையைக் கீழே தட்டச்சு செய்யவும்:',
    writeAnswerPlaceholder: 'உங்கள் விடையை இங்கே எழுதவும்...',
    saveNextQuestionBtn: 'சேமித்து அடுத்த வினாவிற்குச் செல் (திரும்ப முடியாது)',
    submitFinalAnswersBtn: 'இறுதி விடைகளைச் சமர்ப்பி',
    submittedForReviewBadge: 'மதிப்பாய்விற்குச் சமர்ப்பிக்கப்பட்டது',
    correctBadge: 'சரி',
    incorrectBadge: 'தவறு',
    expectedAnswerLabel: 'எதிர்பார்க்கப்படும் விடை:',
    submitAnswersBtn: 'விடைகளைச் சமர்ப்பி'
  }
} as const;

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

function getNextMonthYm(baseYm: string): string {
  if (!baseYm || !baseYm.includes('-')) return '';
  const [y, m] = baseYm.split('-').map(Number);
  const d = new Date(y, (m || 1), 1);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${yr}-${mo}`;
}

function getColomboDateInfo() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); // 'YYYY-MM-DD'
  const currentMonth = todayStr.slice(0, 7); // 'YYYY-MM'
  const dayOfMonth = Number(todayStr.slice(8, 10));
  const nextMonth = getNextMonthYm(currentMonth);
  return { todayStr, currentMonth, dayOfMonth, nextMonth };
}

function formatMonthLabel(ym: string, lang: Lang = 'en'): string {
  if (!ym || !ym.includes('-')) return ym;
  const [y, m] = ym.split('-').map(Number);
  const monthIndex = (m || 1) - 1;
  if (lang === 'ta') {
    return `${TAMIL_MONTHS[monthIndex] || ''} ${y}`;
  }
  const d = new Date(y, monthIndex, 1);
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
  const [lang, setLang] = useState<Lang>('en');
  const t = STUDENT_UI_TEXT[lang];

  const [dateInfo, setDateInfo] = useState({ todayStr: '', currentMonth: '', dayOfMonth: 1, nextMonth: '' });
  const { todayStr, currentMonth, dayOfMonth, nextMonth } = dateInfo;

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

  // Compute Flexible Access Control (25th Advance Reminder + 1st-5th Grace Period + Lock from 6th)
  const currentMonthSlip = studentSlips.find((s) => (s.billing_month || '') === currentMonth) || null;
  const nextMonthSlip = studentSlips.find((s) => (s.billing_month || '') === nextMonth) || null;
  const selectedMonthSlip = studentSlips.find((s) => (s.billing_month || '') === selectedBillingMonth) || null;

  const isFreeCard = Boolean(enrollmentInfo?.is_free_card);
  const hasValidExtension = Boolean(todayStr && enrollmentInfo?.access_until && todayStr <= enrollmentInfo.access_until);
  const isWithinGracePeriod = Boolean(todayStr) && dayOfMonth <= 5;
  const isAdvanceReminderWindow = Boolean(todayStr) && dayOfMonth >= 25;
  const isCurrentMonthApproved = currentMonthSlip?.status === 'Approved';
  const isNextMonthApproved = nextMonthSlip?.status === 'Approved';

  const isUnlocked = isFreeCard || hasValidExtension || isWithinGracePeriod || isCurrentMonthApproved;

  useEffect(() => {
    const savedLang = localStorage.getItem('lms_student_lang');
    if (savedLang === 'ta' || savedLang === 'en') {
      setLang(savedLang);
    }

    const info = getColomboDateInfo();
    setDateInfo(info);
    setSelectedBillingMonth(info.dayOfMonth >= 25 ? info.nextMonth : info.currentMonth);

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

  const handleLanguageChange = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('lms_student_lang', newLang);
  };

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
      const savedLang = (localStorage.getItem('lms_student_lang') as Lang) || 'en';
      setLoginError(STUDENT_UI_TEXT[savedLang].deviceLockedError);
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
      alert(t.joinLockedAlert(formatMonthLabel(currentMonth, lang)));
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
    const info = getColomboDateInfo();
    const targetMonth = selectedBillingMonth || (info.dayOfMonth >= 25 ? info.nextMonth : info.currentMonth);
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
      alert(t.slipUploadedAlert(formatMonthLabel(targetMonth, lang)));
    } catch (err: any) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleStartQuiz = async (quiz: any) => {
    if (!isUnlocked) {
      alert(t.examLockedAlert(formatMonthLabel(currentMonth, lang)));
      return;
    }

    if (quiz.assessment_type === 'Online Exam' && mySubmissionsMap[quiz.id]) {
      alert(t.alreadyCompletedExamAlert);
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
      alert(t.noQuestionsAddedAlert);
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
            setCheatAlertMsg(t.cheatStrikeMax);
            handleSubmitQuiz(nextStrike);
          } else {
            setCheatAlertMsg(t.cheatStrikeWarn(nextStrike));
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
  }, [activeQuiz, quizSubmitted, lang]);

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
          {/* Top Language Switcher on Login Card */}
          <div className="flex justify-end">
            <div className="flex items-center gap-1.5 bg-[#070b14] border border-slate-700 hover:border-emerald-500/50 rounded-xl px-2.5 py-1.5 transition">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value as Lang)}
                aria-label="Select Language"
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-[#0c1322] text-white">English</option>
                <option value="ta" className="bg-[#0c1322] text-white">தமிழ்</option>
              </select>
            </div>
          </div>

          <div className="text-center space-y-2">
            <img
              src="/logo.jpg"
              alt="Science Hub - Jaffna"
              className="w-16 h-16 rounded-full object-cover bg-white p-0.5 mx-auto shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50"
            />
            <h2 className="text-xl font-black text-white">Science Hub - Jaffna</h2>
            <p className="text-xs text-slate-400">{t.loginTagline}</p>
          </div>

          {loginError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">{t.identifierLabel}</label>
              <input
                type="text"
                placeholder={t.identifierPlaceholder}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">{t.passwordLabel}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">{t.passwordHint}</span>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoggingIn ? t.verifyingBtn : t.loginBtn}</span>
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> {t.deviceSecurityFooter}
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
        <p className="text-xs font-mono">{t.verifyingAccount}</p>
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
      <header className="border-b border-slate-800/80 px-4 md:px-6 py-4 bg-[#0c1322] sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 shadow-md">
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

          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
            <Lock className="w-3.5 h-3.5" /> {t.deviceVerifiedBadge}
          </span>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logoutBtn}</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">

        {!currentCourse ? (
          <div className="p-8 text-center bg-[#0c1322] border border-slate-800 rounded-3xl space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-base text-white">{t.notEnrolledTitle}</h3>
            <p className="text-xs text-slate-400">{t.notEnrolledDesc}</p>
          </div>
        ) : (
          <>
            {/* FLEXIBLE MONTHLY PAYMENT STATUS & REMINDER BANNER (25th Advance Reminder -> 5th Grace -> 6th Lock) */}
            <div className={`p-1 rounded-2xl border bg-gradient-to-r ${
              !isUnlocked
                ? 'from-red-900/40 to-rose-900/20 border-red-500/30'
                : isAdvanceReminderWindow && !isFreeCard && !isNextMonthApproved
                ? 'from-amber-900/40 to-orange-900/20 border-amber-500/40'
                : isFreeCard || isCurrentMonthApproved
                ? 'from-emerald-900/40 to-teal-900/20 border-emerald-500/30'
                : hasValidExtension
                ? 'from-blue-900/40 to-indigo-900/20 border-blue-500/30'
                : currentMonthSlip?.status === 'Pending'
                ? 'from-amber-900/40 to-yellow-900/20 border-amber-500/30'
                : 'from-purple-900/40 to-pink-900/20 border-purple-500/30'
            }`}>
              <div className="bg-[#0c1322] rounded-xl p-5 md:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CreditCard className={`w-5 h-5 ${
                      !isUnlocked
                        ? 'text-red-400'
                        : isAdvanceReminderWindow && !isFreeCard && !isNextMonthApproved
                        ? 'text-amber-400'
                        : isFreeCard || isCurrentMonthApproved
                        ? 'text-emerald-400'
                        : 'text-purple-400'
                    }`} />
                    <h3 className="font-bold text-sm text-white">{currentCourse.title} - {t.classFeesSuffix}</h3>
                    {currentMonth && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {formatMonthLabel(currentMonth, lang)}
                      </span>
                    )}
                  </div>
                  
                  {isFreeCard ? (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {t.freeCardActiveMsg}
                    </div>
                  ) : isAdvanceReminderWindow ? (
                    isNextMonthApproved ? (
                      <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {t.bothMonthsPaidPrefix} <strong>{formatMonthLabel(currentMonth, lang)}</strong> {t.andWord} <strong>{formatMonthLabel(nextMonth, lang)}</strong>{t.fullAccessActiveSuffix}
                        </span>
                      </div>
                    ) : nextMonthSlip?.status === 'Pending' ? (
                      <div className="text-xs text-amber-300 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/30 inline-flex items-center gap-1.5">
                        <Clock className="w-4 h-4 flex-shrink-0 text-amber-400" />
                        <span>
                          {t.nextMonthPendingPrefix} <strong>{formatMonthLabel(nextMonth, lang)}</strong> {t.nextMonthPendingSuffix}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-300 bg-amber-500/15 px-3 py-2 rounded-lg border border-amber-500/40 inline-flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 animate-pulse" />
                        <span>
                          <strong>{t.paymentReminderTitle}</strong> {t.paymentReminderPart1} <strong className="text-white">{formatMonthLabel(nextMonth, lang)}</strong> {t.paymentReminderPart2} (<strong className="text-emerald-400 font-mono">Rs. {currentCourse.monthly_fee}/-</strong>). {t.paymentReminderPart3} <strong>{t.paymentReminderPart4} {formatMonthLabel(nextMonth, lang)}</strong>{t.paymentReminderPart5}
                        </span>
                      </div>
                    )
                  ) : isCurrentMonthApproved ? (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {t.currentMonthApprovedPrefix} {formatMonthLabel(currentMonth, lang)}{t.currentMonthApprovedSuffix}
                    </div>
                  ) : hasValidExtension ? (
                    <div className="text-xs text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20 inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 flex-shrink-0 text-blue-400" />
                      <span>
                        {t.tempExtensionPrefix} <strong>{enrollmentInfo.access_until}</strong>{t.tempExtensionMid} {formatMonthLabel(currentMonth, lang)} {t.tempExtensionSuffix}
                      </span>
                    </div>
                  ) : currentMonthSlip?.status === 'Pending' ? (
                    <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {t.currentMonthPendingPrefix} {formatMonthLabel(currentMonth, lang)} {t.currentMonthPendingMid} {isWithinGracePeriod ? `${t.graceActiveUntilPrefix} ${formatMonthLabel(currentMonth, lang)}.` : t.unlockOnceApproved}
                      </span>
                    </div>
                  ) : isWithinGracePeriod ? (
                    <div className="text-xs text-amber-300 bg-amber-500/15 px-3 py-2 rounded-lg border border-amber-500/30 inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 flex-shrink-0 text-amber-400 animate-pulse" />
                      <span>
                        <strong>{t.finalReminderTitle}</strong> {t.finalReminderPart1} <strong className="text-white">{formatMonthLabel(currentMonth, lang)}</strong> {t.finalReminderPart2} (<strong className="text-emerald-400 font-mono">Rs. {currentCourse.monthly_fee}/-</strong>) {t.finalReminderPart3} <strong>{t.finalReminderPart4}</strong>{t.finalReminderPart5}
                      </span>
                    </div>
                  ) : currentMonthSlip?.status === 'Rejected' ? (
                    <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 inline-flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {t.rejectedPrefix} {formatMonthLabel(currentMonth, lang)} {t.rejectedSuffix} (Rs. {currentCourse.monthly_fee}/-) {t.toUnlockLessons}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-red-300 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 inline-flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>
                        <strong>{t.accessLockedTitle}</strong> {t.accessLockedPart1} {formatMonthLabel(currentMonth, lang)}{t.accessLockedPart2} <strong>{formatMonthLabel(currentMonth, lang)}</strong> (Rs. {currentCourse.monthly_fee}/-) {t.accessLockedPart3}
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
                          {formatMonthLabel(ym, lang)}
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
                          ? t.btnPaid
                          : selectedMonthSlip?.status === 'Pending'
                          ? t.btnPending
                          : isUploadingSlip
                          ? t.btnUploading
                          : t.btnSubmitSlip}
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
                      ? `${t.scheduledDurationPrefix} ${activeMeeting.duration_minutes} ${t.minsUnit} • ${t.minStayRequiredPrefix} ${minRequiredMinutes} ${t.minsUnit}.`
                      : t.zoomReadyHint}
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
                    {t.personalZoomLockPrefix} <strong className="text-purple-400 font-mono">[{studentInfo?.indexNo}]</strong>
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
                    <span>{t.lockedPaymentRequired}</span>
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
                    <span>{isJoiningZoom ? t.generatingPersonalEntry : t.joinLiveClassBtn}</span>
                  </button>
                )}

                {attendanceStatus === 'Present' && isUnlocked && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> {t.attendanceVerifiedBadge(verifiedStayMinutes)}
                  </span>
                )}

                {attendanceStatus && attendanceStatus !== 'Present' && isUnlocked && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                    <Clock className="w-4 h-4 animate-pulse" />
                    {t.verifyingAttendanceBadge(verifiedStayMinutes, minRequiredMinutes)}
                  </span>
                )}
              </div>
            </div>

            {/* RECORDINGS, TUTES, EXAMS & QUIZZES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Recordings */}
              <div className="bg-[#0c1322] border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-xl">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <PlaySquare className="w-4 h-4 text-red-400" /> {t.pastRecordingsTitle} ({recordings.length})
                </h3>
                {recordings.length === 0 ? (
                  <p className="text-xs text-slate-500">{t.noRecordings}</p>
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
                            {t.watchLessonBtn}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400" /> {t.lockedPaymentShort}
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
                  <BookOpen className="w-4 h-4 text-emerald-400" /> {t.tutesHandoutsTitle} ({materials.length})
                </h3>
                {materials.length === 0 ? (
                  <p className="text-xs text-slate-500">{t.noTutes}</p>
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
                          <span title={t.paymentRequiredDownloadTitle} className="p-2 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed">
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
                  <HelpCircle className="w-4 h-4 text-amber-400" /> {t.examsQuizzesTitle} ({quizzes.length})
                </h3>
                {quizzes.length === 0 ? (
                  <p className="text-xs text-slate-500">{t.noExamsQuizzes}</p>
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
                              {isExam ? t.strictOnlineExamLabel : t.practiceQuizLabel}
                            </span>
                            {prevSub && (
                              <span className="text-[10px] font-mono font-bold text-emerald-400">
                                {t.scoreLabel}: {prevSub.score}/{q.total_marks || 100}
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
                              {isPerQ ? `${q.per_question_seconds || 60}s / ${t.perQShort}` : `${q.duration_minutes} ${t.minsShort}`}
                            </span>

                            {!isUnlocked ? (
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-[11px] font-bold flex items-center gap-1 cursor-not-allowed"
                              >
                                <Lock className="w-3 h-3 text-amber-400" /> {t.lockedShort}
                              </button>
                            ) : isExam && prevSub ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                {t.completedBadge}
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
                                {isExam ? t.startExamBtn : prevSub ? t.retakeQuizBtn : t.startQuizBtn}
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
                  <ShieldCheck className="w-3.5 h-3.5" /> {t.protectedStreamBadge}
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
                      <span>{isPlaying ? t.pauseBtn : t.playBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkipVideo(-10)}
                      title={t.rewindTitle}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>10s</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkipVideo(10)}
                      title={t.forwardTitle}
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
                      <span className="text-[10px] text-slate-400 font-semibold">{t.speedLabel}</span>
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
                      title={t.fullscreenTitle}
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
                    {activeQuiz.assessment_type === 'Online Exam' ? t.strictOnlineExamLabel : t.practiceQuizLabel}
                  </span>
                  <h3 className="font-bold text-sm text-white">{activeQuiz.title}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeQuiz.timer_mode === 'per_question'
                    ? t.perQuestionHeaderInfo(currentQuestionIdx + 1, questions.length)
                    : t.wholeExamHeaderInfo(questions.length)}
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
                  {t.closeBtn}
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
                  <h4 className="text-lg font-bold text-white">
                    {activeQuiz.assessment_type === 'Online Exam' ? t.strictOnlineExamLabel : t.practiceQuizLabel} {t.submittedSuffix}
                  </h4>
                  <p className="text-3xl font-black text-purple-300">
                    {t.scoreLabel}: {score} / {questions.reduce((a, b) => a + (b.marks || 10), 0)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t.recordedForReviewMsg}
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
                        <span>{t.questionLabel} {currentQuestionIdx + 1} / {questions.length}</span>
                        <span className="text-purple-400">{q.marks || 10} {t.marksLabel}</span>
                      </div>

                      <h5 className="font-semibold text-base text-white leading-relaxed">
                        {currentQuestionIdx + 1}. {q.question_text}
                      </h5>

                      {q.question_type === 'free_answer' ? (
                        <div className="space-y-2">
                          <label className="text-[11px] text-slate-400 block">{t.typeAnswerBelow}</label>
                          <textarea
                            rows={3}
                            placeholder={t.writeAnswerPlaceholder}
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
                          ? t.saveNextQuestionBtn
                          : t.submitFinalAnswersBtn}
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
                                  {t.submittedForReviewBadge}
                                </span>
                              ) : isCorrect ? (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex-shrink-0">
                                  <CheckCircle2 className="w-3 h-3" /> {t.correctBadge}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 flex-shrink-0">
                                  <XCircle className="w-3 h-3" /> {t.incorrectBadge}
                                </span>
                              )
                            )}
                          </div>

                          {isFree ? (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                disabled={quizSubmitted}
                                placeholder={t.writeAnswerPlaceholder}
                                value={typeof studentAns === 'string' ? studentAns : ''}
                                onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-full bg-[#0c1322] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 select-text"
                              />
                              {quizSubmitted && q.sample_answer && (
                                <p className="text-[11px] text-emerald-400">
                                  {t.expectedAnswerLabel} <strong>{q.sample_answer}</strong>
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
                      {t.submitAnswersBtn}
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