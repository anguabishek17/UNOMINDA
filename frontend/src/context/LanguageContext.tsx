'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'ta' | 'hi';

const translations = {
  en: {
    // Login
    welcome: 'UNO MINDA ERP Portal',
    subWelcome: 'Machine Instruction & Compliance System',
    email: 'Email Address',
    password: 'Password',
    signIn: 'Secure Sign In',
    loggingIn: 'Signing in...',
    language: 'Language',
    // Sidebar/Nav
    dashboard: 'Dashboard',
    machines: 'Machines',
    lines: 'Production Lines',
    instructions: 'Instructions & SOPs',
    reports: 'Compliance Reports',
    notifications: 'Notifications',
    settings: 'Settings',
    logout: 'Sign Out',
    employeePortal: 'Employee Terminal',
    // Dashboard Admin
    adminDashboard: 'Supervisor Command Center',
    totalMachines: 'Total Machines',
    totalLines: 'Active Lines',
    totalEmployees: 'Active Workers',
    totalInstructions: 'Total SOPs',
    pendingAcks: 'Pending Sign-offs',
    expiredSOPs: 'Expired Guides',
    todayActivity: 'Shift Activity Stream',
    complianceRate: 'Compliance Rate',
    deptCompliance: 'Department Compliance (%)',
    machineCompliance: 'Machine SOP Compliance (%)',
    monthlyTrend: 'Monthly SOP Audits',
    // Employee portal
    scanQR: 'Scan Machine QR Code',
    scanSubText: 'Scan the bar code or select machine to fetch latest SOPs',
    acknowledged: 'Signed Off',
    readConfirm: 'I HAVE READ AND UNDERSTOOD',
    readTimer: 'Please review for {time} more seconds before signing off.',
    instructionList: 'Active Machine Instructions',
    noInstructions: 'No active instructions found for this machine.',
    viewManual: 'View Manual',
    downloadPdf: 'Download SOP',
    watchVideo: 'Watch Training Video',
    history: 'Acknowledge History',
    // AI Assistant
    aiAssistant: 'AI SOP Assistant',
    summarizeBtn: 'AI SOP Summary',
    checklistBtn: 'Auto-Checklist',
    warningBtn: 'Suggest Warnings',
    aiLoading: 'AI is thinking...',
    // Common Actions
    add: 'Add New',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save Changes',
    loading: 'Loading...',
    status: 'Status',
    priority: 'Priority',
    version: 'Version',
    target: 'Assigned Target',
    active: 'Active',
    inactive: 'Inactive',
    maintenance: 'Maintenance'
  },
  ta: {
    // Login
    welcome: 'யுனோ மிண்டா ஈஆர்பி போர்ட்டல்',
    subWelcome: 'இயந்திர அறிவுறுத்தல் & இணக்க அமைப்பு',
    email: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    signIn: 'பாதுகாப்பான உள்நுழைவு',
    loggingIn: 'உள்நுழைகிறது...',
    language: 'மொழி',
    // Sidebar/Nav
    dashboard: 'கட்டுப்பாட்டு அறை',
    machines: 'இயந்திரங்கள்',
    lines: 'தயாரிப்பு பாதைகள்',
    instructions: 'வழிமுறைகள் & SOPகள்',
    reports: 'இணக்க அறிக்கைகள்',
    notifications: 'அறிவிப்புகள்',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு',
    employeePortal: 'தொழிலாளர் முனையம்',
    // Dashboard Admin
    adminDashboard: 'கண்காணிப்பாளர் கட்டுப்பாட்டு மையம்',
    totalMachines: 'மொத்த இயந்திரங்கள்',
    totalLines: 'செயலில் உள்ள பாதைகள்',
    totalEmployees: 'செயலில் உள்ள பணியாளர்கள்',
    totalInstructions: 'மொத்த SOPகள்',
    pendingAcks: 'நிலுவையில் உள்ள ஒப்புதல்கள்',
    expiredSOPs: 'காலாவதியான வழிகாட்டிகள்',
    todayActivity: 'இன்றைய பணி செயல்பாடுகள்',
    complianceRate: 'இணக்க விகிதம்',
    deptCompliance: 'துறை வாரியான இணக்கம் (%)',
    machineCompliance: 'இயந்திர வாரியான இணக்கம் (%)',
    monthlyTrend: 'மாதாந்திர தணிக்கை',
    // Employee portal
    scanQR: 'இயந்திர கியூஆர் குறியீட்டை ஸ்கேன் செய்க',
    scanSubText: 'சமீபத்திய SOPகளைப் பெற கியூஆர் குறியீட்டை ஸ்கேன் செய்யவும்',
    acknowledged: 'ஒப்புதல் அளிக்கப்பட்டது',
    readConfirm: 'நான் படித்து புரிந்து கொண்டேன்',
    readTimer: 'ஒப்புதல் அளிப்பதற்கு முன் மேலும் {time} வினாடிகள் மதிப்பாய்வு செய்யவும்.',
    instructionList: 'இயந்திரத்தின் செயலில் உள்ள வழிமுறைகள்',
    noInstructions: 'இந்த இயந்திரத்திற்கு செயலில் உள்ள வழிமுறைகள் எதுவும் இல்லை.',
    viewManual: 'கையேட்டைப் பார்',
    downloadPdf: 'SOP பதிவிறக்கு',
    watchVideo: 'பயிற்சி வீடியோவைப் பார்',
    history: 'ஒப்புதல் வரலாறு',
    // AI Assistant
    aiAssistant: 'AI SOP உதவியாளர்',
    summarizeBtn: 'AI SOP சுருக்கம்',
    checklistBtn: 'தானியங்கி சரிபார்ப்புப் பட்டியல்',
    warningBtn: 'எச்சரிக்கைகளை பரிந்துரைக்கவும்',
    aiLoading: 'AI யோசிக்கிறது...',
    // Common Actions
    add: 'புதியது சேர்',
    edit: 'திருத்து',
    delete: 'அழி',
    cancel: 'ரத்துசெய்',
    save: 'மாற்றங்களைச் சேமி',
    loading: 'ஏற்றுகிறது...',
    status: 'நிலை',
    priority: 'முன்னுரிமை',
    version: 'பதிப்பு',
    target: 'ஒதுக்கப்பட்ட இலக்கு',
    active: 'செயலில்',
    inactive: 'செயலற்றது',
    maintenance: 'பராமரிப்பு'
  },
  hi: {
    // Login
    welcome: 'यूनो मिंडा ईआरपी पोर्टल',
    subWelcome: 'मशीन निर्देश एवं अनुपालन प्रणाली',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    signIn: 'सुरक्षित साइन इन',
    loggingIn: 'साइन इन हो रहा है...',
    language: 'भाषा',
    // Sidebar/Nav
    dashboard: 'डैशबोर्ड',
    machines: 'मशीनें',
    lines: 'उत्पादन लाइनें',
    instructions: 'निर्देश और एसओपी',
    reports: 'अनुपालन रिपोर्ट',
    notifications: 'अधिसूचनाएं',
    settings: 'सेटिंग्स',
    logout: 'साइन आउट',
    employeePortal: 'कर्मचारी टर्मिनल',
    // Dashboard Admin
    adminDashboard: 'पर्यवेक्षक कमांड सेंटर',
    totalMachines: 'कुल मशीनें',
    totalLines: 'सक्रिय लाइनें',
    totalEmployees: 'सक्रिय कर्मचारी',
    totalInstructions: 'कुल एसओपी',
    pendingAcks: 'लंबित हस्ताक्षर',
    expiredSOPs: 'समाप्त मार्गदर्शिकाएँ',
    todayActivity: 'शिफ्ट गतिविधि प्रवाह',
    complianceRate: 'अनुपालन दर',
    deptCompliance: 'विभाग अनुपालन (%)',
    machineCompliance: 'मशीन अनुपालन (%)',
    monthlyTrend: 'मासिक एसओपी ऑडिट',
    // Employee portal
    scanQR: 'मशीन क्यूआर कोड स्कैन करें',
    scanSubText: 'नवीनतम एसओपी प्राप्त करने के लिए क्यूआर कोड स्कैन करें',
    acknowledged: 'हस्ताक्षरित',
    readConfirm: 'मैंने पढ़ और समझ लिया है',
    readTimer: 'हस्ताक्षर करने से पहले कृपया {time} सेकंड और समीक्षा करें।',
    instructionList: 'सक्रिय मशीन निर्देश',
    noInstructions: 'इस मशीन के लिए कोई सक्रिय निर्देश नहीं मिला।',
    viewManual: 'मैनुअल देखें',
    downloadPdf: 'एसओपी डाउनलोड करें',
    watchVideo: 'प्रशिक्षण वीडियो देखें',
    history: 'हस्ताक्षर इतिहास',
    // AI Assistant
    aiAssistant: 'एआई एसओपी सहायक',
    summarizeBtn: 'एआई एसओपी सारांश',
    checklistBtn: 'ऑटो-चेकलिस्ट',
    warningBtn: 'चेतावनी सुझाव',
    aiLoading: 'एआई सोच रहा है...',
    // Common Actions
    add: 'नया जोड़ें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    cancel: 'रद्द करें',
    save: 'बदलाव सहेजें',
    loading: 'लोड हो रहा है...',
    status: 'स्थिति',
    priority: 'प्राथमिकता',
    version: 'संस्करण',
    target: 'निर्धारित लक्ष्य',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    maintenance: 'रखरखाव'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], replaceValues?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof typeof translations['en'], replaceValues?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations['en']?.[key] || String(key);
    
    if (replaceValues) {
      Object.keys(replaceValues).forEach(sub => {
        text = text.replace(`{${sub}}`, String(replaceValues[sub]));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
