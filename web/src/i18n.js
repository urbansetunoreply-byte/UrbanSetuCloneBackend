import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';
import es from './locales/es/translation.json';
import fr from './locales/fr/translation.json';
import bn from './locales/bn/translation.json';
import gu from './locales/gu/translation.json';
import kn from './locales/kn/translation.json';
import ml from './locales/ml/translation.json';
import mr from './locales/mr/translation.json';
import pa from './locales/pa/translation.json';
import ta from './locales/ta/translation.json';
import te from './locales/te/translation.json';

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    es: { translation: es },
    fr: { translation: fr },
    bn: { translation: bn },
    gu: { translation: gu },
    kn: { translation: kn },
    ml: { translation: ml },
    mr: { translation: mr },
    pa: { translation: pa },
    ta: { translation: ta },
    te: { translation: te }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
