import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { dashboardTranslations } from './translations/dashboard';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          ...dashboardTranslations.en
        }
      },
      ar: {
        translation: {
          ...dashboardTranslations.ar
        }
      }
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
