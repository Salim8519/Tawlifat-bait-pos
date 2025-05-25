import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';

// PWA installation event interfaces
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Translations
const translations = {
  en: {
    installApp: 'Install متجري',
    installPrompt: 'Install متجري on your device for better experience',
    installNow: 'Install Now',
    later: 'Later',
    alreadyInstalled: 'متجري is already installed',
    notSupported: 'Installation not supported on this browser'
  },
  ar: {
    installApp: 'تثبيت متجري',
    installPrompt: 'قم بتثبيت متجري على جهازك للحصول على تجربة أفضل',
    installNow: 'تثبيت الآن',
    later: 'لاحقاً',
    alreadyInstalled: 'متجري مثبت بالفعل',
    notSupported: 'التثبيت غير مدعوم في هذا المتصفح'
  }
};

export function PWAInstallPrompt() {
  const { language } = useLanguageStore();
  const t = translations[language as keyof typeof translations];
  
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Check if the app is already installed and detect platform
  useEffect(() => {
    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    
    // For iOS Safari detection (limited support)
    const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone === true;
    
    // For Chrome, Edge, etc.
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          window.matchMedia('(display-mode: fullscreen)').matches ||
                          window.matchMedia('(display-mode: minimal-ui)').matches ||
                          isIOSStandalone;
    
    setIsInstalled(isAppInstalled);
    
    // Check if we've shown the prompt recently
    const lastPrompt = localStorage.getItem('pwa-prompt-last-shown');
    const now = Date.now();
    const showAgain = !lastPrompt || (now - parseInt(lastPrompt)) > 24 * 60 * 60 * 1000; // 24 hours
    
    // For iOS, always show the prompt if not installed and not recently shown
    if (iOS && !isIOSStandalone && showAgain) {
      setTimeout(() => setShowPrompt(true), 2000);
      localStorage.setItem('pwa-prompt-last-shown', now.toString());
    }
    
    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the browser from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
      console.log('Install prompt captured and ready to use');
      
      // Show our custom install prompt if not recently shown
      if (showAgain) {
        setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem('pwa-prompt-last-shown', now.toString());
        }, 2000); // Show after 2 seconds
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      console.log('PWA was installed');
    });
    
    // Force show the prompt for testing if needed
    // Uncomment this to test the prompt appearance
    // setTimeout(() => setShowPrompt(true), 2000);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    
    // Show the install prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
    setShowPrompt(false);
  };
  
  const dismissPrompt = () => {
    setShowPrompt(false);
    // Don't show again for this session
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };
  
  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }
  
  return (
    <div 
      className={`fixed bottom-4 left-0 right-0 mx-auto max-w-md bg-white rounded-lg shadow-xl p-5 border border-gray-200 z-50 ${
        showPrompt ? 'animate-fade-in' : 'hidden'
      }`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start">
        <div className="mr-4 rtl:ml-4 rtl:mr-0 flex-shrink-0">
          <img 
            src="https://i.ibb.co/7dYt1R1T/monitor.png" 
            alt="App Icon" 
            className="w-14 h-14 rounded-lg shadow-sm"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{t.installApp}</h3>
          <p className="text-sm text-gray-600 mt-1">{t.installPrompt}</p>
          
          {isIOS ? (
            <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs text-gray-700 border border-gray-200">
              <p className="font-medium">{language === 'ar' ? 'تعليمات لمستخدمي آيفون وآيباد:' : 'Instructions for iPhone & iPad users:'}</p>
              <ol className="list-decimal mt-1 ml-4 rtl:mr-4 rtl:ml-0 space-y-1">
                <li>{language === 'ar' ? 'انقر على زر المشاركة' : 'Tap the Share button'} <span className="inline-block w-4 h-4 bg-blue-500 text-white text-center rounded">↑</span></li>
                <li>{language === 'ar' ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Select "Add to Home Screen"'}</li>
                <li>{language === 'ar' ? 'انقر على "إضافة" في الأعلى' : 'Tap "Add" at the top'}</li>
              </ol>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex justify-end space-x-3 rtl:space-x-reverse">
        <button
          onClick={dismissPrompt}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          {t.later}
        </button>
        {!isIOS && installPrompt ? (
          <button
            onClick={handleInstallClick}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
          >
            {t.installNow}
          </button>
        ) : null}
      </div>
    </div>
  );
}
