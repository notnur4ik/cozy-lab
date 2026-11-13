import type { I18nText, Locale } from '@/types/domain';

export function pickI18n(text: Partial<I18nText> | null | undefined, locale: Locale): string {
  if (!text) return '';
  return text[locale] || text.ru || text.en || text.kk || '';
}

export interface Dictionary {
  nav: {
    home: string;
    services: string;
    masters: string;
    branches: string;
    gallery: string;
    contacts: string;
    bookOnline: string;
    crm: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    photoDisclaimer: string;
  };
  sections: {
    servicesOverview: string;
    servicesOverviewSub: string;
    popularServices: string;
    mastersTitle: string;
    mastersSub: string;
    portfolioTitle: string;
    portfolioSub: string;
    reviewsTitle: string;
    reviewsSub: string;
    branchesTitle: string;
    branchesSub: string;
    contactsTitle: string;
    contactsSub: string;
    viewAll: string;
  };
  common: {
    priceOnRequest: string;
    priceUnverifiedNote: string;
    addressPendingVerification: string;
    placeholderPhotoBadge: string;
    minutesShort: string;
    kztSymbol: string;
    bookWithMaster: string;
    bookAtBranch: string;
    anyAvailableMaster: string;
    loading: string;
    emptyState: string;
    dbNotConfigured: string;
    workingHours: string;
    phone: string;
    address: string;
    whatsapp: string;
    instagram: string;
    openMap: string;
    close: string;
    allCategories: string;
    allMasters: string;
    allBranches: string;
    searchPlaceholder: string;
  };
  booking: {
    title: string;
    subtitle: string;
    methodOnline: string;
    methodWhatsApp: string;
    stepBranch: string;
    stepCategory: string;
    stepService: string;
    stepMaster: string;
    stepDate: string;
    stepTime: string;
    stepDetails: string;
    stepConfirm: string;
    customerName: string;
    customerPhone: string;
    comment: string;
    submitBooking: string;
    submitting: string;
    noSlots: string;
    confirmedTitle: string;
    confirmedSubtitle: string;
    bookingCodeLabel: string;
    whatsappNote: string;
    openWhatsApp: string;
    manageTitle: string;
    manageCodePlaceholder: string;
    managePhonePlaceholder: string;
    requestCancel: string;
    requestReschedule: string;
    reasonPlaceholder: string;
    preferredDateLabel: string;
  };
  footer: {
    tagline: string;
    navigation: string;
    branches: string;
    legal: string;
    privacy: string;
    credit: string;
  };
}

const ru: Dictionary = {
  nav: {
    home: 'Главная',
    services: 'Услуги',
    masters: 'Мастера',
    branches: 'Филиалы',
    gallery: 'Портфолио',
    contacts: 'Контакты',
    bookOnline: 'Записаться онлайн',
    crm: 'CRM',
  },
  hero: {
    eyebrow: 'Сеть салонов красоты в Алматы',
    title: 'Эстетика спокойствия и безупречного ухода',
    subtitle:
      'COZY LAB — пространство минимализма, заботы и профессионального бьюти-сервиса в Алматы. Запишитесь онлайн или через WhatsApp в удобный филиал.',
    primaryCta: 'Записаться онлайн',
    secondaryCta: 'Наши услуги',
    photoDisclaimer: 'Демо-визуал. Будет заменён на реальные фотографии COZY LAB.',
  },
  sections: {
    servicesOverview: 'Направления ухода',
    servicesOverviewSub: 'Динамический каталог услуг, управляемый через административную систему.',
    popularServices: 'Популярные услуги',
    mastersTitle: 'Команда мастеров',
    mastersSub: 'Профили мастеров, специализации и расписание.',
    portfolioTitle: 'Портфолио работ',
    portfolioSub: 'Избранные работы мастеров COZY LAB.',
    reviewsTitle: 'Отзывы гостей',
    reviewsSub: 'Только подтверждённые отзывы и ссылки на внешние площадки.',
    branchesTitle: 'Наши филиалы в Алматы',
    branchesSub: 'Выберите удобную локацию для визита.',
    contactsTitle: 'Связаться с нами',
    contactsSub: 'Адреса, телефоны, режим работы и быстрая запись.',
    viewAll: 'Смотреть все',
  },
  common: {
    priceOnRequest: 'Стоимость уточняется',
    priceUnverifiedNote: 'Требует подтверждения администратором',
    addressPendingVerification: 'Адрес на подтверждении клиента',
    placeholderPhotoBadge: 'Демо-фото',
    minutesShort: 'мин',
    kztSymbol: '₸',
    bookWithMaster: 'Записаться к мастеру',
    bookAtBranch: 'Записаться в филиал',
    anyAvailableMaster: 'Любой свободный мастер',
    loading: 'Загрузка...',
    emptyState: 'Записи пока не добавлены.',
    dbNotConfigured:
      'База данных PostgreSQL/Supabase ещё не подключена. Добавьте переменные окружения и выполните миграции.',
    workingHours: 'Режим работы',
    phone: 'Телефон',
    address: 'Адрес',
    whatsapp: 'Написать в WhatsApp',
    instagram: 'Instagram',
    openMap: 'Открыть на карте',
    close: 'Закрыть',
    allCategories: 'Все категории',
    allMasters: 'Все мастера',
    allBranches: 'Все филиалы',
    searchPlaceholder: 'Поиск...',
  },
  booking: {
    title: 'Онлайн-запись в COZY LAB',
    subtitle: 'Выберите филиал, услугу, мастера и удобное время.',
    methodOnline: 'Способ A: Онлайн-запись',
    methodWhatsApp: 'Способ B: Запись через WhatsApp',
    stepBranch: '1. Филиал',
    stepCategory: '2. Категория',
    stepService: '3. Услуга',
    stepMaster: '4. Мастер',
    stepDate: '5. Дата',
    stepTime: '6. Свободное время',
    stepDetails: '7. Ваши данные',
    stepConfirm: '8. Подтверждение',
    customerName: 'Ваше имя',
    customerPhone: 'Номер телефона (+7...)',
    comment: 'Комментарий (необязательно)',
    submitBooking: 'Подтвердить запись',
    submitting: 'Создаём запись...',
    noSlots: 'На выбранную дату нет свободных слотов. Выберите другой день или мастера.',
    confirmedTitle: 'Запись успешно создана',
    confirmedSubtitle: 'Мы сохранили вашу заявку. Сохраните уникальный код записи.',
    bookingCodeLabel: 'Код записи',
    whatsappNote:
      'Запрос в WhatsApp не блокирует время в календаре автоматически. Администратор подтвердит точный слот в переписке.',
    openWhatsApp: 'Открыть WhatsApp с заявкой',
    manageTitle: 'Управление существующей записью',
    manageCodePlaceholder: 'Код записи (напр. CL-20261113-...)',
    managePhonePlaceholder: 'Телефон (+7...)',
    requestCancel: 'Запросить отмену',
    requestReschedule: 'Запросить перенос',
    reasonPlaceholder: 'Причина или пожелание',
    preferredDateLabel: 'Желаемая дата/время переноса',
  },
  footer: {
    tagline: 'Премиальный минимализм и бережная забота о вашей красоте в Алматы.',
    navigation: 'Навигация',
    branches: 'Филиалы',
    legal: 'Информация',
    privacy: 'Защита персональных данных',
    credit: 'Designed & developed by NOVEN.CODE',
  },
};

const kk: Dictionary = {
  nav: {
    home: 'Басты бет',
    services: 'Қызметтер',
    masters: 'Шеберлер',
    branches: 'Филиалдар',
    gallery: 'Портфолио',
    contacts: 'Байланыс',
    bookOnline: 'Онлайн жазылу',
    crm: 'CRM',
  },
  hero: {
    eyebrow: 'Алматыдағы сұлулық салондары желісі',
    title: 'Тыныштық эстетикасы және мінсіз күтім',
    subtitle:
      'COZY LAB — Алматыдағы минимализм, жайлылық және кәсіби сұлулық сервисі кеңістігі. Өзіңізге ыңғайлы филиалға онлайн немесе WhatsApp арқылы жазылыңыз.',
    primaryCta: 'Онлайн жазылу',
    secondaryCta: 'Қызметтеріміз',
    photoDisclaimer: 'Демо-сурет. COZY LAB нақты фотосуреттерімен ауыстырылады.',
  },
  sections: {
    servicesOverview: 'Қызмет бағыттары',
    servicesOverviewSub: 'Әкімшілік жүйе арқылы басқарылатын динамикалық қызметтер каталогы.',
    popularServices: 'Танымал қызметтер',
    mastersTitle: 'Шеберлер командасы',
    mastersSub: 'Шеберлер профильдері, мамандықтары және кестесі.',
    portfolioTitle: 'Жұмыстар портфолиосы',
    portfolioSub: 'COZY LAB шеберлерінің таңдаулы жұмыстары.',
    reviewsTitle: 'Қонақтар пікірлері',
    reviewsSub: 'Тек расталған пікірлер мен сыртқы платформаларға сілтемелер.',
    branchesTitle: 'Алматыдағы филиалдарымыз',
    branchesSub: 'Келуге ыңғайлы мекенжайды таңдаңыз.',
    contactsTitle: 'Бізбен байланысу',
    contactsSub: 'Мекенжайлар, телефондар, жұмыс уақыты және жылдам жазылу.',
    viewAll: 'Барлығын көру',
  },
  common: {
    priceOnRequest: 'Бағасы нақтыланады',
    priceUnverifiedNote: 'Әкімшінің растауын қажет етеді',
    addressPendingVerification: 'Мекенжай клиентпен нақтылануда',
    placeholderPhotoBadge: 'Демо-фото',
    minutesShort: 'мин',
    kztSymbol: '₸',
    bookWithMaster: 'Шеберге жазылу',
    bookAtBranch: 'Филиалға жазылу',
    anyAvailableMaster: 'Кез келген бос шебер',
    loading: 'Жүктелуде...',
    emptyState: 'Жазбалар әлі қосылмаған.',
    dbNotConfigured:
      'PostgreSQL/Supabase дерекқоры әлі қосылмаған. Орта айнымалыларын қосып, миграцияларды орындаңыз.',
    workingHours: 'Жұмыс уақыты',
    phone: 'Телефон',
    address: 'Мекенжай',
    whatsapp: 'WhatsApp-қа жазу',
    instagram: 'Instagram',
    openMap: 'Картадан ашу',
    close: 'Жабу',
    allCategories: 'Барлық санаттар',
    allMasters: 'Барлық шеберлер',
    allBranches: 'Барлық филиалдар',
    searchPlaceholder: 'Іздеу...',
  },
  booking: {
    title: 'COZY LAB-қа онлайн жазылу',
    subtitle: 'Филиалды, қызметті, шеберді және ыңғайлы уақытты таңдаңыз.',
    methodOnline: 'А тәсілі: Онлайн жазылу',
    methodWhatsApp: 'B тәсілі: WhatsApp арқылы жазылу',
    stepBranch: '1. Филиал',
    stepCategory: '2. Санат',
    stepService: '3. Қызмет',
    stepMaster: '4. Шебер',
    stepDate: '5. Күні',
    stepTime: '6. Бос уақыт',
    stepDetails: '7. Сіздің деректеріңіз',
    stepConfirm: '8. Растау',
    customerName: 'Атыңыз',
    customerPhone: 'Телефон нөмірі (+7...)',
    comment: 'Түсініктеме (міндетті емес)',
    submitBooking: 'Жазылуды растау',
    submitting: 'Жазылу жасалуда...',
    noSlots: 'Таңдалған күнге бос орын жоқ. Басқа күнді немесе шеберді таңдаңыз.',
    confirmedTitle: 'Жазылу сәтті жасалды',
    confirmedSubtitle: 'Өтініміңіз сақталды. Бірегей жазылу кодын сақтап қойыңыз.',
    bookingCodeLabel: 'Жазылу коды',
    whatsappNote:
      'WhatsApp сұранысы күнтізбедегі уақытты автоматты түрде бұғаттамайды. Нақты уақытты әкімші растайды.',
    openWhatsApp: 'Өтініммен WhatsApp ашу',
    manageTitle: 'Бар жазылуды басқару',
    manageCodePlaceholder: 'Жазылу коды (мысалы, CL-20261113-...)',
    managePhonePlaceholder: 'Телефон (+7...)',
    requestCancel: 'Бас тартуды сұрау',
    requestReschedule: 'Ауыстыруды сұрау',
    reasonPlaceholder: 'Себебі немесе тілегіңіз',
    preferredDateLabel: 'Қалаған күн/уақыт',
  },
  footer: {
    tagline: 'Алматыдағы премиум минимализм және сұлулығыңызға нәзік қамқорлық.',
    navigation: 'Навигация',
    branches: 'Филиалдар',
    legal: 'Ақпарат',
    privacy: 'Дербес деректерді қорғау',
    credit: 'Designed & developed by NOVEN.CODE',
  },
};

const en: Dictionary = {
  nav: {
    home: 'Home',
    services: 'Services',
    masters: 'Masters',
    branches: 'Branches',
    gallery: 'Portfolio',
    contacts: 'Contacts',
    bookOnline: 'Book Online',
    crm: 'CRM',
  },
  hero: {
    eyebrow: 'Beauty Salon Network in Almaty',
    title: 'Calm Aesthetics & Effortless Care',
    subtitle:
      'COZY LAB is a minimalist sanctuary of comfort and professional beauty care in Almaty. Book online or via WhatsApp at your preferred branch.',
    primaryCta: 'Book Online',
    secondaryCta: 'Our Services',
    photoDisclaimer: 'Demo visual. Will be replaced with verified COZY LAB photography.',
  },
  sections: {
    servicesOverview: 'Service Categories',
    servicesOverviewSub: 'Dynamic service catalog managed directly from the administrative CRM.',
    popularServices: 'Popular Services',
    mastersTitle: 'Our Masters',
    mastersSub: 'Master profiles, specializations, and working schedules.',
    portfolioTitle: 'Beauty Portfolio',
    portfolioSub: 'Selected works by COZY LAB specialists.',
    reviewsTitle: 'Guest Reviews',
    reviewsSub: 'Verified reviews and external platform links only.',
    branchesTitle: 'Our Branches in Almaty',
    branchesSub: 'Choose a convenient location for your visit.',
    contactsTitle: 'Contact Us',
    contactsSub: 'Addresses, phone numbers, working hours, and quick booking.',
    viewAll: 'View all',
  },
  common: {
    priceOnRequest: 'Price upon confirmation',
    priceUnverifiedNote: 'Pending verification in CRM',
    addressPendingVerification: 'Address pending client confirmation',
    placeholderPhotoBadge: 'Demo photo',
    minutesShort: 'min',
    kztSymbol: '₸',
    bookWithMaster: 'Book with Master',
    bookAtBranch: 'Book at Branch',
    anyAvailableMaster: 'Any available master',
    loading: 'Loading...',
    emptyState: 'No records added yet.',
    dbNotConfigured:
      'PostgreSQL/Supabase is not configured yet. Set environment variables and run migrations.',
    workingHours: 'Working Hours',
    phone: 'Phone',
    address: 'Address',
    whatsapp: 'Message on WhatsApp',
    instagram: 'Instagram',
    openMap: 'Open on Map',
    close: 'Close',
    allCategories: 'All Categories',
    allMasters: 'All Masters',
    allBranches: 'All Branches',
    searchPlaceholder: 'Search...',
  },
  booking: {
    title: 'Online Booking — COZY LAB',
    subtitle: 'Select a branch, service, master, and available time slot.',
    methodOnline: 'Method A: Online Booking',
    methodWhatsApp: 'Method B: WhatsApp Booking',
    stepBranch: '1. Branch',
    stepCategory: '2. Category',
    stepService: '3. Service',
    stepMaster: '4. Master',
    stepDate: '5. Date',
    stepTime: '6. Available Time',
    stepDetails: '7. Your Details',
    stepConfirm: '8. Confirmation',
    customerName: 'Your Name',
    customerPhone: 'Phone Number (+7...)',
    comment: 'Comment (optional)',
    submitBooking: 'Confirm Booking',
    submitting: 'Creating booking...',
    noSlots: 'No available slots on this date. Please select another day or master.',
    confirmedTitle: 'Booking Request Created',
    confirmedSubtitle: 'Your appointment request has been saved. Keep your unique booking code.',
    bookingCodeLabel: 'Booking Code',
    whatsappNote:
      'WhatsApp inquiries do not automatically block calendar slots. An administrator will confirm your exact time.',
    openWhatsApp: 'Open WhatsApp with Request',
    manageTitle: 'Manage Existing Booking',
    manageCodePlaceholder: 'Booking code (e.g. CL-20261113-...)',
    managePhonePlaceholder: 'Phone (+7...)',
    requestCancel: 'Request Cancellation',
    requestReschedule: 'Request Rescheduling',
    reasonPlaceholder: 'Reason or note',
    preferredDateLabel: 'Preferred date/time for reschedule',
  },
  footer: {
    tagline: 'Premium minimalism and thoughtful beauty care in Almaty.',
    navigation: 'Navigation',
    branches: 'Branches',
    legal: 'Information',
    privacy: 'Personal Data Protection',
    credit: 'Designed & developed by NOVEN.CODE',
  },
};

export const DICTIONARIES: Record<Locale, Dictionary> = { ru, kk, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.ru;
}
