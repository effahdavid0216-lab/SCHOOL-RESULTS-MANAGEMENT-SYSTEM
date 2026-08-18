import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'tw' | 'fr' | 'ee' | 'ga';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English (UK/GH)', flag: '🇬🇭' },
  { code: 'tw', label: 'Twi', nativeName: 'Twi (Akan)', flag: '🇬🇭' },
  { code: 'fr', label: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ee', label: 'Ewe', nativeName: 'Eʋegbe', flag: '🇬🇭' },
  { code: 'ga', label: 'Ga', nativeName: 'Ga', flag: '🇬🇭' }
];

export interface Translations {
  [key: string]: Record<LanguageCode, string>;
}

export const TRANSLATION_DICTIONARY: Translations = {
  // Global & Navigation
  'app.name': {
    en: 'EduMaster Pro',
    tw: 'EduMaster Pro',
    fr: 'EduMaster Pro',
    ee: 'EduMaster Pro',
    ga: 'EduMaster Pro'
  },
  'nav.dashboard': {
    en: 'Dashboard',
    tw: 'Dwumadie Titiriw',
    fr: 'Tableau de bord',
    ee: 'Dɔwɔƒe Gã',
    ga: 'Nitsumɔ He'
  },
  'nav.teachers': {
    en: 'Teachers',
    tw: 'Akyerɛkyerɛfo',
    fr: 'Enseignants',
    ee: 'Nufialawo',
    ga: 'Tswɛlɔi'
  },
  'nav.students': {
    en: 'Students',
    tw: 'Asuafo',
    fr: 'Élèves',
    ee: 'Sukuviwo',
    ga: 'Kaselɔi'
  },
  'nav.classes': {
    en: 'Classes & Streams',
    tw: 'Mfaakuo & Nkyekyem',
    fr: 'Classes et Niveaux',
    ee: 'Sukuxɔwo',
    ga: 'Klaasii'
  },
  'nav.subjects': {
    en: 'Subjects',
    tw: 'Adesuade',
    fr: 'Matières',
    ee: 'Nufiame Wɔɖe',
    ga: 'Nikasemɔi'
  },
  'nav.attendance': {
    en: 'Attendance',
    tw: 'Nkabom Nhwɛso',
    fr: 'Présence',
    ee: 'Sukudede',
    ga: 'Babaoo Nitsumɔ'
  },
  'nav.grading': {
    en: 'Grading & Exams',
    tw: 'Sɔhwɛ & Nsɔhwɛ',
    fr: 'Notes et Examens',
    ee: 'Dodokpɔwo',
    ga: 'Kaamɔi'
  },
  'nav.fees': {
    en: 'Fees & Finance',
    tw: 'Sukuu Ka & Sika',
    fr: 'Frais et Finances',
    ee: 'Sukuufeewo',
    ga: 'Sukuu Nyɔmɔ'
  },
  'nav.timetable': {
    en: 'Timetable',
    tw: 'Bere Nhyehyɛe',
    fr: 'Emploi du temps',
    ee: 'Gaƒoƒo Ðoɖowɔwɔ',
    ga: 'Be Gbɛjianɔtoo'
  },
  'nav.reports': {
    en: 'Reports & Broadsheet',
    tw: 'Amanneɛbɔ & Krataa',
    fr: 'Bulletins & Rapports',
    ee: 'Nyatakakawɔƒe',
    ga: 'Amaniehbɔɔ'
  },
  'nav.analytics': {
    en: 'Analytics',
    tw: 'Nhwehwɛmu',
    fr: 'Analytiques',
    ee: 'Nukpɔkpɔ Dzɔdzɔ',
    ga: 'Nitsumɔ Kadimɔ'
  },
  'nav.settings': {
    en: 'School Settings',
    tw: 'Sukuu Nhyehyɛe',
    fr: 'Paramètres',
    ee: 'Sukudodo',
    ga: 'Sukuu He Gbɛjianɔtoo'
  },
  'nav.logout': {
    en: 'Sign Out',
    tw: 'Pue Wɔ Mu',
    fr: 'Se déconnecter',
    ee: 'Do Go',
    ga: 'Je Kpo'
  },

  // Auth & Login
  'auth.login': {
    en: 'Log In',
    tw: 'Wura Mu',
    fr: 'Connexion',
    ee: 'Ge Ðe Eme',
    ga: 'Bote Mli'
  },
  'auth.portal_signin': {
    en: 'Authorized Portal Sign-In',
    tw: 'Sukuu Dwumadie Wuram',
    fr: 'Connexion Portail Autorisé',
    ee: 'Sukudɔwɔƒe Geɖeeme',
    ga: 'Sukuu Botemɔ He'
  },
  'auth.school_id': {
    en: 'Unique School ID',
    tw: 'Sukuu ID Soronko',
    fr: 'Identifiant École Unique',
    ee: 'Sukuu Dzesi',
    ga: 'Sukuu Kadimɔ Nɔmba'
  },
  'auth.username_email': {
    en: 'Username / Email / ID',
    tw: 'Din / Email / ID',
    fr: 'Nom d\'utilisateur / Email / ID',
    ee: 'Ŋkɔ / Email / ID',
    ga: 'Gbɛ́i / Email / ID'
  },
  'auth.password': {
    en: 'Password',
    tw: 'Ahintasɛm',
    fr: 'Mot de passe',
    ee: 'Nyagbe Ɣaɣla',
    ga: 'Teemɔŋ Wiemɔ'
  },
  'auth.forgot_password': {
    en: 'Forgot Password?',
    tw: 'Wo werɛ afi wo password?',
    fr: 'Mot de passe oublié ?',
    ee: 'Èŋlɔ nyagbe ɣaɣla be?',
    ga: 'Ohie ekpa o-teemɔŋ wiemɔ nɔ?'
  },
  'auth.recover_password': {
    en: 'Password Recovery',
    tw: 'Fa Ahintasɛm Foforo',
    fr: 'Récupération du mot de passe',
    ee: 'Nyagbe Ɣaɣla Yeye',
    ga: 'Teemɔŋ Wiemɔ Hee'
  },
  'auth.reset_instructions': {
    en: 'Enter your registered email address to receive secure password recovery verification instructions via Supabase Auth.',
    tw: 'Fa wo email a wode gyee din no hyɛ ha na yɛmfa ahintasɛm foforo nhyehyɛe mmrɛ wo.',
    fr: 'Entrez votre adresse email enregistrée pour recevoir les instructions de récupération.',
    ee: 'Tsɔ wò email si nètsɔ ŋlɔ ŋkɔe na míadɔ dodokpɔ dzesi na wò.',
    ga: 'Ngmalamɔ o-email ni okɛ-ŋma ogbɛ́i lɛ koni akɛ teemɔŋ wiemɔ hee tsɔɔmɔi amaje bo.'
  },
  'auth.send_recovery_code': {
    en: 'Send Recovery Instructions',
    tw: 'Mane Nhyehyɛe No',
    fr: 'Envoyer les instructions',
    ee: 'Dɔ Dzesi Ða',
    ga: 'Majemɔ Gbɛjianɔtoo Lɛ'
  },
  'auth.verification_token': {
    en: '6-Digit Verification Token',
    tw: 'Nsɔhwɛ Nɔma 6',
    fr: 'Jeton de vérification (6 chiffres)',
    ee: 'Dodokpɔ Dzesi (6)',
    ga: 'Kadimɔ Nɔmba (6)'
  },
  'auth.new_password': {
    en: 'New Password',
    tw: 'Ahintasɛm Foforo',
    fr: 'Nouveau mot de passe',
    ee: 'Nyagbe Ɣaɣla Yeye',
    ga: 'Teemɔŋ Wiemɔ Hee'
  },
  'auth.confirm_password': {
    en: 'Confirm New Password',
    tw: 'Si Ahintasɛm Foforo No So',
    fr: 'Confirmer le mot de passe',
    ee: 'Ðo Kpe Nyagbe Ɣaɣla Dzi',
    ga: 'Maa Teemɔŋ Wiemɔ Hee Nɔ'
  },
  'auth.update_password': {
    en: 'Update & Reset Password',
    tw: 'Sesa Ahintasɛm No',
    fr: 'Mettre à jour le mot de passe',
    ee: 'Trɔ Nyagbe Ɣaɣla',
    ga: 'Tsakemɔ Teemɔŋ Wiemɔ Lɛ'
  },
  'auth.back_to_login': {
    en: 'Back to Sign In',
    tw: 'San Kɔ Wuram',
    fr: 'Retour à la connexion',
    ee: 'Trɔ Yi Geɖeeme',
    ga: 'Kuu Ohe Kɛba Botemɔ Mli'
  },

  // Actions
  'action.save': {
    en: 'Save Changes',
    tw: 'Kora Nsesae So',
    fr: 'Enregistrer',
    ee: 'Dzra Ðo',
    ga: 'To Tsakemɔi Lɛ He'
  },
  'action.cancel': {
    en: 'Cancel',
    tw: 'Twa Mu',
    fr: 'Annuler',
    ee: 'Tɔ Te',
    ga: 'Fite Mli'
  },
  'action.refresh': {
    en: 'Refresh Feed',
    tw: 'Hyehyɛ Foforo',
    fr: 'Actualiser',
    ee: 'Yeyewɔwɔ',
    ga: 'Hee-feemɔ'
  },
  'action.search': {
    en: 'Search...',
    tw: 'Hwehwɛ...',
    fr: 'Rechercher...',
    ee: 'Dii...',
    ga: 'Taomɔ...'
  },
  'action.filter': {
    en: 'Filter',
    tw: 'Yi Mu',
    fr: 'Filtrer',
    ee: 'Tia Me',
    ga: 'Halamɔ'
  },
  'action.download_report': {
    en: 'Download Report (PDF)',
    tw: 'Fa Krataa No (PDF)',
    fr: 'Télécharger le rapport (PDF)',
    ee: 'Kpɔ Nyatakaka (PDF)',
    ga: 'Kɛ Amaniehbɔɔ Lɛ Ba (PDF)'
  },
  'action.print': {
    en: 'Print',
    tw: 'Tintim',
    fr: 'Imprimer',
    ee: 'Ta Eme',
    ga: 'Ngmalamɔ'
  },
  'action.export': {
    en: 'Export Data',
    tw: 'Yi Data Kɔ',
    fr: 'Exporter les données',
    ee: 'Ðo Nyawo Ða',
    ga: 'Kɛ Sadzi Lɛ Je Kpo'
  },

  // Impersonation & Super Admin
  'impersonate.title': {
    en: 'Super Admin Role Impersonation',
    tw: 'Super Admin Gyinabea Nsɔhwɛ',
    fr: 'Emprunt d\'identité de rôle Super Admin',
    ee: 'Super Admin Ŋkɔ Tsɔtsɔ Dodokpɔ',
    ga: 'Super Admin Gbɛjianɔtoo Kaamɔ'
  },
  'impersonate.banner_active': {
    en: 'Super Admin Impersonation Mode Active',
    tw: 'Super Admin Nsɔhwɛ Bere Gu So',
    fr: 'Mode d\'emprunt d\'identité Super Admin Actif',
    ee: 'Super Admin Dodokpɔ Le Dɔ Wɔm',
    ga: 'Super Admin Kaamɔ Be Miinya Nɔ'
  },
  'impersonate.exit': {
    en: 'Exit Impersonation',
    tw: 'Gyae Nsɔhwɛ No',
    fr: 'Quitter l\'emprunt',
    ee: 'Do Le Dodokpɔ Me',
    ga: 'Je Kaamɔ Lɛ Mli'
  },
  'impersonate.switch_role': {
    en: 'Switch Role',
    tw: 'Sesa Gyinabea',
    fr: 'Changer de rôle',
    ee: 'Trɔ Ŋkɔ',
    ga: 'Tsakemɔ Gbɛjianɔtoo'
  },
  'impersonate.select_school': {
    en: 'Select Target School Tenant',
    tw: 'Fa Sukuu a Wopɛ sɛ Wosɔ Hwɛ',
    fr: 'Sélectionner l\'école cible',
    ee: 'Tia Sukuu Si Nèdi',
    ga: 'Halamɔ Sukuu Lɛ'
  },
  'impersonate.select_role': {
    en: 'Select Role to Test',
    tw: 'Fa Gyinabea a Wopɛ sɛ Wosɔ Hwɛ',
    fr: 'Sélectionner le rôle à tester',
    ee: 'Tia Ŋkɔ Si Nèdi Be Yeadodokpɔ',
    ga: 'Halamɔ Gbɛjianɔtoo Lɛ'
  },
  'impersonate.launch': {
    en: 'Launch Impersonation Session',
    tw: 'Hyɛ Nsɔhwɛ No Ase',
    fr: 'Lancer la session de test',
    ee: 'Dze Dodokpɔ Gɔme',
    ga: 'Je Kaamɔ Nitsumɔ Lɛ Shishi'
  },

  // Language Menu
  'lang.select_language': {
    en: 'Language',
    tw: 'Kasa',
    fr: 'Langue',
    ee: 'Gbe',
    ga: 'Wiemɔ'
  },
  'lang.current': {
    en: 'English (UK/GH)',
    tw: 'Twi (Akan)',
    fr: 'Français',
    ee: 'Eʋegbe',
    ga: 'Ga'
  }
};

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'edumaster_language_preference';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && ['en', 'tw', 'fr', 'ee', 'ga'].includes(saved)) {
        return saved;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const entry = TRANSLATION_DICTIONARY[key];
    if (!entry) {
      return fallback || key;
    }
    return entry[currentLanguage] || entry['en'] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
