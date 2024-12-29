import React from 'react';
import { Mail, Phone, Github, Linkedin, Globe } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { developerTranslations } from '../translations/developer';

export function DeveloperInfoPage() {
  const { language } = useLanguageStore();
  const t = developerTranslations[language];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.developerInfo}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center">
              <span className="text-4xl font-bold text-indigo-600">SA</span>
            </div>
          </div>
        </div>

        <div className="pt-20 pb-8 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">{t.developerName}</h2>
          <p className="mt-2 text-gray-600">{t.role}</p>
          
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <Mail className="w-5 h-5 text-gray-500" />
              <a href="mailto:contact.salim.alsenani@gmail.com" className="text-indigo-600 hover:text-indigo-800">
                contact.salim.alsenani@gmail.com
              </a>
            </div>
            
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <Phone className="w-5 h-5 text-gray-500" />
              <a href="tel:+96892309390" className="text-indigo-600 hover:text-indigo-800">
                +968 92309390
              </a>
            </div>
          </div>

          <div className="mt-8">
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold mb-4">{t.about}</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t.description}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold mb-4">{t.specialties}</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {t.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold mb-4">{t.support}</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t.supportText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}