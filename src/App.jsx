import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Menu, X, ChevronRight, Star, Users, CheckCircle, Globe,
  LogOut, Plus, Edit, Eye, Trash2, Settings, BarChart3, Package,
  CreditCard, Copy, Check, Mail, Lock, ArrowLeft, Save, DollarSign, MessageCircle, Phone,
} from 'lucide-react';
import {
  ADMIN_EMAIL, DEFAULT_PAYMENT_SETTINGS, SAMPLE_TEMPLATES,
  CATEGORIES, TESTIMONIALS, FAQ_ITEMS, BRIDE_NAMES, GROOM_NAMES, getRandomName,
} from './data.js';


const LOCAL_MEDIA_DB = 'nnvow_local_media';
const LOCAL_MEDIA_STORE = 'files';

const openLocalMediaDB = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
  const request = indexedDB.open(LOCAL_MEDIA_DB, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(LOCAL_MEDIA_STORE)) request.result.createObjectStore(LOCAL_MEDIA_STORE);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Could not open media database'));
});

const saveLocalMedia = async (file) => {
  const db = await openLocalMediaDB();
  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(LOCAL_MEDIA_STORE, 'readwrite');
    tx.objectStore(LOCAL_MEDIA_STORE).put({ blob: file, name: file.name, type: file.type }, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Could not save media'));
  });
  db.close();
  return key;
};

const loadLocalMedia = async (key) => {
  if (!key) return '';
  const db = await openLocalMediaDB();
  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(LOCAL_MEDIA_STORE, 'readonly');
    const request = tx.objectStore(LOCAL_MEDIA_STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not load media'));
  });
  db.close();
  return record?.blob ? URL.createObjectURL(record.blob) : '';
};

const hydrateInvitationMedia = async (invitation) => {
  if (!invitation?.data) return invitation;
  const data = { ...invitation.data };
  if (Array.isArray(data.photoMediaKeys) && data.photoMediaKeys.length) {
    const urls = await Promise.all(data.photoMediaKeys.slice(0, 6).map(loadLocalMedia).map(p => p.catch ? p : p));
    data.photos = urls.filter(Boolean);
  }
  if (data.musicMediaKey) {
    const url = await loadLocalMedia(data.musicMediaKey).catch(() => '');
    if (url) data.musicUrl = url;
  }
  return { ...invitation, data };
};

export default function App() {
  // ==================== STATE ====================
  const [page, setPage] = useState('home');
  const [lang, setLang] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customizationData, setCustomizationData] = useState(null);
  const [cart, setCart] = useState(null);

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('admin');
  const [adminTemplates, setAdminTemplates] = useState(SAMPLE_TEMPLATES);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // User invitations
  const [userInvitations, setUserInvitations] = useState([]);

  // Contact form
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });

  // FAQ
  const [openFaq, setOpenFaq] = useState(null);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Entrance role selection
  const [entranceRole, setEntranceRole] = useState('couple');

  // Example placeholder names
  const [exampleNames] = useState(() => getRandomName ? { 
    brideName: getRandomName(BRIDE_NAMES), 
    groomName: getRandomName(GROOM_NAMES) 
  } : { brideName: 'Sophia', groomName: 'Aiden' });

  // Settings / music / payment workflow
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [adminFreeMode, setAdminFreeMode] = useState(false);
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nnvow_transactions') || '[]'); } catch { return []; }
  });
  const [freeInvitations, setFreeInvitations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nnvow_free_invitations') || '[]'); } catch { return []; }
  });
  const [demoMode, setDemoMode] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [entranceActive, setEntranceActive] = useState(false);
  const [publicInvitation, setPublicInvitation] = useState(null);
  const [paymentTab, setPaymentTab] = useState('payment');
  const [rsvpGuestName, setRsvpGuestName] = useState('');
  const [rsvpAttendance, setRsvpAttendance] = useState('Yes, I will attend');
  const [rsvpMessage, setRsvpMessage] = useState('');
  const audioRef = useRef(null);

  // ==================== TRANSLATIONS ====================
  const t = {
    en: {
      home: 'Home', designs: 'Our Designs', howWorks: 'How It Works', about: 'About',
      contact: 'Contact Us', login: 'Log In', account: 'My Account', logout: 'Log Out',
      heroTitle: 'Celebrate Your Love Story in Elegance',
      heroSubtitle: 'Luxury digital wedding invitations crafted for the most discerning couples',
      explore: 'Explore Collection', createOwn: 'Bespoke Design',
      featured: 'Featured Collection', viewInvitation: 'View Invitation',
      customizeDesign: 'Customize Design', price: 'Price', customize: 'Personalize',
      preview: 'Preview', coupleName: 'Couple Names', weddingDate: 'Wedding Date',
      weddingTime: 'Wedding Time', venue: 'Venue', location: 'Location',
      brideName: "Bride's Name", groomName: "Groom's Name", rsvp: 'RSVP Details',
      dressCode: 'Dress Code', story: 'Our Love Story', checkout: 'Secure Checkout',
      payment: 'Payment Details', total: 'Total Investment', complete: 'Complete Purchase',
      share: 'Share With Guests', copy: 'Copy Link', dashboard: 'My Collection',
      edit: 'Edit', viewLive: 'View Live', delete: 'Delete', admin: 'Admin Portal',
      templates: 'Designs', orders: 'Orders', customers: 'Clients', settings: 'Settings',
      back: 'Back', faq: 'FAQ', whyUs: 'Why N&N Vow',
      readyToInvite: 'Ready to Create Your Perfect Invitation?',
      step1: 'Select Design', step2: 'Personalize Details', step3: 'Review Preview',
      step4: 'Secure Payment', step5: 'Share Elegantly', myInvitations: 'My Invitations',
      status: 'Status', shareLink: 'Share Link', privacy: 'Privacy Policy',
      terms: 'TermsConditions', all: 'All',
    },
    ar: {
      home: 'Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©', designs: 'Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', howWorks: 'ÙƒÙŠÙÙŠØ© Ø§Ù„Ø¹Ù…Ù„', about: 'Ø¹Ù†Ù‘Ø§',
      contact: 'ØªÙˆØ§ØµÙ„', login: 'Ø¯Ø®ÙˆÙ„', account: 'Ø­Ø³Ø§Ø¨ÙŠ', logout: 'Ø®Ø±ÙˆØ¬',
      heroTitle: 'Ø§Ø­ØªÙÙ„ Ø¨Ù‚ØµØ© Ø­Ø¨Ùƒ Ø¨Ø£Ù†Ø§Ù‚Ø©',
      heroSubtitle: 'Ø¯Ø¹ÙˆØ§Øª Ø²ÙØ§Ù Ø±Ù‚Ù…ÙŠØ© ÙØ§Ø®Ø±Ø© Ù…ØµÙ…Ù…Ø© Ù„Ù„Ø£Ø²ÙˆØ§Ø¬ Ø§Ù„Ø£ÙƒØ«Ø± ØªÙ…ÙŠØ²Ø§Ù‹',
      explore: 'Ø§ÙƒØªØ´Ù Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©', createOwn: 'ØªØµÙ…ÙŠÙ… Ù…Ø®ØµØµ',
      featured: 'Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„Ù…Ù…ÙŠØ²Ø©', viewInvitation: 'Ø¹Ø±Ø¶ Ø§Ù„Ø¯Ø¹ÙˆØ©',
      customizeDesign: 'ØªØ®ØµÙŠØµ Ø§Ù„ØªØµÙ…ÙŠÙ…', price: 'Ø§Ù„Ø³Ø¹Ø±', customize: 'ØªØ®ØµÙŠØµ',
      preview: 'Ù…Ø¹Ø§ÙŠÙ†Ø©', coupleName: 'Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ø²ÙˆØ¬ÙŠÙ†', weddingDate: 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø²ÙØ§Ù',
      weddingTime: 'ÙˆÙ‚Øª Ø§Ù„Ø²ÙØ§Ù', venue: 'Ø§Ù„Ù…ÙƒØ§Ù†', location: 'Ø§Ù„Ù…ÙˆÙ‚Ø¹',
      brideName: 'Ø§Ø³Ù… Ø§Ù„Ø¹Ø±ÙˆØ³', groomName: 'Ø§Ø³Ù… Ø§Ù„Ø¹Ø±ÙŠØ³', rsvp: 'ØªÙØ§ØµÙŠÙ„ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¶ÙˆØ±',
      dressCode: 'Ø§Ù„Ù…Ù„Ø§Ø¨Ø³ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©', story: 'Ù‚ØµØªÙ†Ø§', checkout: 'Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¢Ù…Ù†',
      payment: 'ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¯ÙØ¹', total: 'Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ', complete: 'Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø´Ø±Ø§Ø¡',
      share: 'Ø´Ø§Ø±Ùƒ Ù…Ø¹ Ø§Ù„Ø¶ÙŠÙˆÙ', copy: 'Ù†Ø³Ø® Ø§Ù„Ø±Ø§Ø¨Ø·', dashboard: 'Ù…Ø¬Ù…ÙˆØ¹ØªÙŠ',
      edit: 'ØªØ¹Ø¯ÙŠÙ„', viewLive: 'Ø¹Ø±Ø¶', delete: 'Ø­Ø°Ù', admin: 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…',
      templates: 'Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', orders: 'Ø§Ù„Ø·Ù„Ø¨Ø§Øª', customers: 'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡', settings: 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',
      back: 'Ø±Ø¬ÙˆØ¹', faq: 'Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø´Ø§Ø¦Ø¹Ø©', whyUs: 'Ù„Ù…Ø§Ø°Ø§ N&N Vow',
      readyToInvite: 'Ù‡Ù„ Ø£Ù†Øª Ù…Ø³ØªØ¹Ø¯ Ù„Ø¥Ù†Ø´Ø§Ø¡ Ø¯Ø¹ÙˆØªÙƒ Ø§Ù„Ù…Ø«Ø§Ù„ÙŠØ©ØŸ',
      step1: 'Ø§Ø®ØªØ± Ø§Ù„ØªØµÙ…ÙŠÙ…', step2: 'Ø®ØµØµ Ø§Ù„ØªÙØ§ØµÙŠÙ„', step3: 'Ù…Ø¹Ø§ÙŠÙ†Ø©',
      step4: 'Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¢Ù…Ù†', step5: 'Ø´Ø§Ø±Ùƒ Ø¨Ø£Ù†Ø§Ù‚Ø©', myInvitations: 'Ø¯Ø¹ÙˆØ§ØªÙŠ',
      status: 'Ø§Ù„Ø­Ø§Ù„Ø©', shareLink: 'Ø±Ø§Ø¨Ø· Ø§Ù„Ù…Ø´Ø§Ø±ÙƒØ©', privacy: 'Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©',
      terms: 'Ø§Ù„Ø´Ø±ÙˆØ· ÙˆØ§Ù„Ø£Ø­ÙƒØ§Ù…', all: 'Ø§Ù„ÙƒÙ„',
    },
  };

  const tr = t[lang];

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (!entranceActive) return undefined;
    const timer = window.setTimeout(() => setEntranceActive(false), 7000);
    return () => window.clearTimeout(timer);
  }, [entranceActive]);

  useEffect(() => {
    if (!envelopeOpen || customizationData?.musicType !== 'upload' || !customizationData?.musicUrl) return;
    const timer = window.setTimeout(() => {
      audioRef.current?.play?.().catch(() => {});
    }, 50);
    return () => window.clearTimeout(timer);
  }, [envelopeOpen, customizationData?.musicType, customizationData?.musicUrl]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const loadPublicInvitation = async () => {
      const pathMatch = window.location.pathname.match(/^\/i\/([^/]+)/);
      const params = new URLSearchParams(window.location.search);
      const inviteSlug = pathMatch ? decodeURIComponent(pathMatch[1]) : params.get('invite');
      if (!inviteSlug) return;
      let found = null;
      try {
        const response = await fetch(`/api/invitations/${encodeURIComponent(inviteSlug)}`);
        if (response.ok) found = await response.json();
      } catch {}
      if (!found) {
        try {
          const all = JSON.parse(localStorage.getItem('nnvow_invitations') || '[]');
          const free = JSON.parse(localStorage.getItem('nnvow_free_invitations') || '[]');
          found = [...all, ...free].find((inv) => inv.slug === inviteSlug) || null;
        } catch {}
      }
      if (found && (found.paymentStatus === 'paid' || found.paymentStatus === 'free')) {
        found = await hydrateInvitationMedia(found);
        setPublicInvitation(found);
        setCustomizationData(found.data || {});
        const tmpl = adminTemplates.find((t) => t.name === found.template) || SAMPLE_TEMPLATES.find((t) => t.name === found.template) || SAMPLE_TEMPLATES[0];
        setSelectedTemplate(tmpl);
        setEnvelopeOpen(false);
        setPage('public');
      }
    };
    loadPublicInvitation();
  }, []);

  const stripBinaryData = (invitation) => {
    if (!invitation || typeof invitation !== 'object') return invitation;
    const data = invitation.data && typeof invitation.data === 'object' ? { ...invitation.data } : invitation.data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.photos)) data.photos = data.photos.filter((x) => !String(x).startsWith('data:') && !String(x).startsWith('blob:'));
      if (data.musicType === 'upload' && (String(data.musicUrl || '').startsWith('data:') || String(data.musicUrl || '').startsWith('blob:'))) data.musicUrl = '';
    }
    return { ...invitation, data };
  };

  const persistJson = (key, value, sanitizer = (v) => v) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      // Browser localStorage is small; uploaded photos/audio can exceed its quota.
      // Retry with binary file data removed so the app never crashes.
      try {
        const reduced = sanitizer(value);
        localStorage.setItem(key, JSON.stringify(reduced));
        return true;
      } catch {
        console.warn(`Could not save ${key} to localStorage; keeping it in memory.`);
        return false;
      }
    }
  };

  useEffect(() => {
    persistJson('nnvow_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    persistJson('nnvow_free_invitations', freeInvitations, (items) => (Array.isArray(items) ? items.map(stripBinaryData) : []));
  }, [freeInvitations]);

  useEffect(() => {
    try {
      const savedPrices = JSON.parse(localStorage.getItem('nnvow_templates') || 'null');
      const savedPayment = JSON.parse(localStorage.getItem('nnvow_payment_settings') || 'null');
      const savedInvitations = JSON.parse(localStorage.getItem('nnvow_invitations') || 'null');
      if (savedPrices) setAdminTemplates(savedPrices);
      if (savedPayment) setPaymentSettings(savedPayment);
      if (savedInvitations) setUserInvitations(savedInvitations);
    } catch {}
  }, []);

  useEffect(() => {
    persistJson('nnvow_templates', adminTemplates);
  }, [adminTemplates]);

  useEffect(() => {
    persistJson('nnvow_payment_settings', paymentSettings);
  }, [paymentSettings]);

  useEffect(() => {
    // Repair older records so every admin invitation has a stable slug and visible share URL.
    setFreeInvitations((prev) => prev.map((inv) => {
      const slug = inv.slug || makeSlug(inv.bride, inv.groom, inv.id);
      const shareUrl = buildShareUrl(slug);
      return inv.slug === slug && inv.shareUrl === shareUrl ? inv : { ...inv, slug, shareUrl };
    }));
  }, []);

  useEffect(() => {
    persistJson('nnvow_invitations', userInvitations, (items) => (Array.isArray(items) ? items.map(stripBinaryData) : []));
  }, [userInvitations]);

  // ==================== AUTH ====================
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginEmail.includes('@')) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    const userData = { email: loginEmail, name: loginEmail.split('@')[0] };
    setUser(userData);
    setIsLoggedIn(true);
    setShowLogin(false);
    if (loginEmail === ADMIN_EMAIL) {
      setIsAdmin(true);
      setPage('admin');
    } else {
      setIsAdmin(false);
      setPage('dashboard');
    }
    setLoginEmail('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    setPage('home');
  };

  // ==================== NAVIGATION ====================
  const navigate = (p) => {
    setPage(p);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==================== INVITATION HELPERS ====================
  const makeSlug = (bride, groom, id = '') => {
    const clean = (value) => String(value || '').toLowerCase().trim()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const base = `${clean(groom) || 'groom'}-${clean(bride) || 'bride'}`;
    return id ? `${base}-${String(id).slice(-4)}` : base;
  };

  const buildShareUrl = (slug) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.pathname = `/i/${encodeURIComponent(slug)}`;
    return url.toString();
  };

  const getShareUrl = (inv) => {
    if (!inv) return '';
    const slug = inv.slug || makeSlug(inv.bride, inv.groom);
    return buildShareUrl(slug);
  };

  const saveInvitationOnline = async (invitation) => {
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitation),
      });
      if (!response.ok) return invitation;
      const saved = await response.json();
      return { ...invitation, ...saved, shareUrl: buildShareUrl(saved.slug || invitation.slug) };
    } catch {
      return invitation;
    }
  };

  const uploadMediaOnline = async (file) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/media', { method: 'POST', body: form });
      if (!response.ok) return '';
      const result = await response.json();
      return result.url || '';
    } catch {
      return '';
    }
  };

  const getDaysRemaining = (dateValue) => {
    if (!dateValue) return null;
    const wedding = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(wedding.getTime())) return null;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(0, Math.ceil((wedding - start) / 86400000));
  };

  const getYouTubeEmbedUrl = (url, autoplay = false) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      let id = '';
      if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
      if (u.hostname.includes('youtube.com')) {
        id = u.searchParams.get('v') || '';
        if (!id && u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
        if (!id && u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2];
      }
      if (!id) return '';
      return `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}&rel=0&playsinline=1`;
    } catch {}
    return '';
  };

  const openEnvelope = () => {
    setEnvelopeOpen(true);
    setEntranceActive(true);
  };

  const getEntranceVideo = (templateName, role = 'couple') => {
    // Luxury real-couple walking footage from Pexels. Every theme uses bride + groom together.
    const videosCouple = {
      Santorini: { src: 'https://videos.pexels.com/video-files/5181952/5181952-uhd_3840_2160_30fps.mp4', effect: 'sun-glow', label: 'A cinematic seaside walk' },
      Toscana: { src: 'https://videos.pexels.com/video-files/10199075/10199075-uhd_2560_1440_25fps.mp4', effect: 'soft-glow', label: 'A golden countryside walk' },
      Sakura: { src: 'https://videos.pexels.com/video-files/25751937/11906212_3840_2160_50fps.mp4', effect: 'petals', label: 'A garden wedding walk' },
      Deco: { src: 'https://videos.pexels.com/video-files/36569513/15504683_1080_1920_60fps.mp4', effect: 'gold-dust', label: 'A couture ballroom entrance' },
      Provence: { src: 'https://videos.pexels.com/video-files/29659898/12759458_1920_1080_25fps.mp4', effect: 'petals', label: 'A romantic garden stroll' },
      Palma: { src: 'https://videos.pexels.com/video-files/5181952/5181952-uhd_3840_2160_30fps.mp4', effect: 'sun-glow', label: 'A luxury coastal walk' },
      Bloom: { src: 'https://videos.pexels.com/video-files/11698586/11698586-uhd_3840_2160_25fps.mp4', effect: 'petals', label: 'A lush garden stroll' },
      Royal: { src: 'https://videos.pexels.com/video-files/8435724/8435724-uhd_3840_2160_30fps.mp4', effect: 'gold-dust', label: 'A grand mansion entrance' },
      Lantern: { src: 'https://videos.pexels.com/video-files/6198382/6198382-uhd_4096_2160_25fps.mp4', effect: 'lantern-glow', label: 'A dramatic old-world walk' },
      Pyramids: { src: 'https://videos.pexels.com/video-files/10199075/10199075-uhd_2560_1440_25fps.mp4', effect: 'desert-dust', label: 'A cinematic open-landscape walk' },
      Imperial: { src: 'https://videos.pexels.com/video-files/8435724/8435724-uhd_3840_2160_30fps.mp4', effect: 'gold-dust', label: 'A timeless estate entrance' },
      Twilight: { src: 'https://videos.pexels.com/video-files/27101217/12072256_2160_3840_30fps.mp4', effect: 'soft-glow', label: 'An intimate city-light walk' },
    };
    return videosCouple[templateName] || videosCouple.Santorini;
  };

  const finishEntrance = () => setEntranceActive(false);

  // Helper function to get random example names
  const getExampleNames = () => {
    const brideName = getRandomName(BRIDE_NAMES);
    const groomName = getRandomName(GROOM_NAMES);
    return { brideName, groomName };
  };

  const addPhotoFiles = async (files) => {
    const selected = Array.from(files || []).slice(0, 6);
    for (const file of selected) {
      const onlineUrl = await uploadMediaOnline(file);
      if (onlineUrl) {
        setCustomizationData((prev) => ({ ...prev, photos: [...(prev?.photos || []), onlineUrl].slice(0, 6) }));
        continue;
      }
      try {
        const key = await saveLocalMedia(file);
        const url = URL.createObjectURL(file);
        setCustomizationData((prev) => ({
          ...prev,
          photos: [...(prev?.photos || []), url].slice(0, 6),
          photoMediaKeys: [...(prev?.photoMediaKeys || []), key].slice(0, 6),
        }));
      } catch {
        const reader = new FileReader();
        reader.onload = () => setCustomizationData((prev) => ({ ...prev, photos: [...(prev?.photos || []), reader.result].slice(0, 6) }));
        reader.readAsDataURL(file);
      }
    }
  };

  const removePhoto = (index) => {
    setCustomizationData((prev) => ({
      ...prev,
      photos: (prev?.photos || []).filter((_, i) => i !== index),
    }));
  };

  // ==================== TEMPLATE HANDLERS ====================
  const handleViewTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setPage('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustomize = (tmpl) => {
    setSelectedTemplate(tmpl);
    setEnvelopeOpen(false);
    setCustomizationData({
      brideName: '', groomName: '', weddingDate: '', weddingTime: '',
      venue: '', location: '', dressCode: '', story: '', note: '',
      photos: [], photoMediaKeys: [], musicMediaKey: '', envelopeColor: tmpl?.colors?.[0] || '#1c3552',
      accentColor: tmpl?.colors?.[1] || '#d4af37',
      envelopeStyle: 'classic', stampStyle: 'wax-round', invitationLanguage: 'en', initialsLanguage: 'en',
      englishFont: 'Cormorant Garamond', englishInitialFont: 'Great Vibes', textColor: tmpl?.colors?.[2] || '#2f2635',
      arabicFont: 'Amiri', arabicInitialFont: 'Amiri',
      arabicBrideName: '', arabicGroomName: '', arabicWeddingTime: '',
      arabicVenue: '', arabicLocation: '', arabicDressCode: '',
      arabicStory: '', arabicNote: '', arabicRsvp: '',
      rsvp: '', rsvpWhatsapp: '', rsvpEmail: '', rsvpLabel: 'RSVP',
      musicType: 'none', musicUrl: '', musicName: '',
    });
    setPage('customize');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDemo = () => {
    setDemoMode(true);
    setPage('demo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAdminFreeInvitation = (tmpl) => {
    if (!isAdmin) return;
    setSelectedTemplate(tmpl);
    setAdminFreeMode(true);
    setCustomizationData({
      brideName: '', groomName: '', weddingDate: '', weddingTime: '',
      venue: '', location: '', dressCode: '', story: '', note: '',
      photos: [], photoMediaKeys: [], musicMediaKey: '', envelopeColor: tmpl?.colors?.[0] || '#1c3552',
      accentColor: tmpl?.colors?.[1] || '#d4af37',
      envelopeStyle: 'classic', stampStyle: 'wax-round', invitationLanguage: 'en', initialsLanguage: 'en',
      englishFont: 'Cormorant Garamond', englishInitialFont: 'Great Vibes',
      arabicFont: 'Amiri', arabicInitialFont: 'Amiri',
      arabicBrideName: '', arabicGroomName: '', arabicWeddingTime: '',
      arabicVenue: '', arabicLocation: '', arabicDressCode: '',
      arabicStory: '', arabicNote: '', arabicRsvp: '',
      rsvp: '', rsvpWhatsapp: '', rsvpEmail: '', rsvpLabel: 'RSVP',
      musicType: 'none', musicUrl: '', musicName: '',
    });
    setPage('customize');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createFreeInvitationFromForm = async () => {
    if (!isAdmin || !selectedTemplate) return;
    const id = Date.now();
    const bride = customizationData?.brideName || 'Bride';
    const groom = customizationData?.groomName || 'Groom';
    const slug = makeSlug(bride, groom);
    const invitation = {
      id, slug, email: user?.email || ADMIN_EMAIL, template: selectedTemplate.name,
      bride, groom, date: customizationData?.weddingDate || 'TBD', status: 'active', paymentStatus: 'free',
      shareUrl: buildShareUrl(slug), data: { ...customizationData, invitationLanguage: customizationData?.invitationLanguage || 'en', initialsLanguage: customizationData?.initialsLanguage || 'en' },
      templateColors: selectedTemplate.colors, createdAt: new Date().toISOString(), createdByAdmin: true,
    };
    const saved = await saveInvitationOnline(invitation);
    setFreeInvitations((prev) => [saved, ...prev]);
    setUserInvitations((prev) => [saved, ...prev]);
    setAdminFreeMode(false); setPublicInvitation(saved); setEnvelopeOpen(false); setPage('share');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = () => {
    setCart({ template: selectedTemplate, data: customizationData });
    setDemoMode(false);
    setPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompletePurchase = async () => {
    const id = Date.now();
    const bride = customizationData.brideName || 'Bride';
    const groom = customizationData.groomName || 'Groom';
    const slug = makeSlug(bride, groom);
    const newInv = {
      id, slug, email: user?.email || '', template: selectedTemplate.name, bride, groom,
      date: customizationData.weddingDate || 'TBD', status: 'pending', paymentStatus: 'pending',
      shareUrl: buildShareUrl(slug), data: { ...customizationData }, templateColors: selectedTemplate.colors,
      createdAt: new Date().toISOString(),
    };
    const saved = await saveInvitationOnline(newInv);
    setUserInvitations((prev) => [saved, ...prev]);
    setTransactions((prev) => [{ id: saved.id, email: saved.email, invitationId: saved.id, amount: selectedTemplate.price, status: 'pending', createdAt: saved.createdAt }, ...prev]);
    setPage('share'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markTransactionPaid = (invitationId) => {
    let paidInvitation = null;
    setUserInvitations((prev) => prev.map((inv) => {
      if (String(inv.id) !== String(invitationId)) return inv;
      const finalSlug = inv.slug || makeSlug(inv.bride, inv.groom, inv.id);
      paidInvitation = { ...inv, slug: finalSlug, status: 'active', paymentStatus: 'paid', shareUrl: buildShareUrl(finalSlug) };
      fetch(`/api/invitations/${encodeURIComponent(finalSlug)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paidInvitation) }).catch(() => {});
      return paidInvitation;
    }));
    setTransactions((prev) => prev.map((tx) =>
      tx.invitationId === invitationId ? { ...tx, status: 'paid', paidAt: new Date().toISOString() } : tx
    ));
  };

  const handleDeleteInvitation = (id) => {
    setUserInvitations((prev) => prev.filter((inv) => inv.id !== id));
  };

  const handleEditInvitation = (inv) => {
    setSelectedTemplate(adminTemplates.find((t) => t.name === inv.template) || adminTemplates[0] || SAMPLE_TEMPLATES[0]);
    setCustomizationData(inv.data || {
      brideName: inv.bride, groomName: inv.groom, weddingDate: inv.date,
      weddingTime: '', venue: '', location: '', rsvp: '', dressCode: '', story: '',
      musicType: inv.data?.musicType || 'none', musicUrl: inv.data?.musicUrl || '', musicName: inv.data?.musicName || '',
      envelopeStyle: inv.data?.envelopeStyle || 'classic', stampStyle: inv.data?.stampStyle || 'wax-round', englishFont: inv.data?.englishFont || 'Cormorant Garamond', englishInitialFont: inv.data?.englishInitialFont || 'Great Vibes', arabicFont: inv.data?.arabicFont || 'Amiri', rsvpWhatsapp: inv.data?.rsvpWhatsapp || '', rsvpEmail: inv.data?.rsvpEmail || '', rsvpLabel: inv.data?.rsvpLabel || 'RSVP',
    });
    setPage('customize');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==================== ADMIN: PRICE EDITING ====================
  const startEditPrice = (tmpl) => {
    setEditingPriceId(tmpl.id);
    setEditingPriceValue(String(tmpl.price));
  };

  const savePrice = (id) => {
    const newPrice = parseInt(editingPriceValue, 10);
    if (!isNaN(newPrice) && newPrice > 0) {
      setAdminTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, price: newPrice } : t))
      );
    }
    setEditingPriceId(null);
    setEditingPriceValue('');
  };

  // ==================== ADMIN: SAVE SETTINGS ====================
  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // ==================== COPY LINK ====================
  const handleCopyLink = (url) => {
    const fullUrl = /^https?:\/\//i.test(String(url || '')) ? String(url) : `https://${url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ==================== CONTACT FORM ====================
  const handleContactSubmit = (e) => {
    e.preventDefault();
    const whatsappNumber = '201117141072';
    const whatsappMessage = [
      'ðŸ’Œ New message from N&N Vow website',
      '',
      `Name: ${contactForm.name}`,
      `Phone: ${contactForm.phone}`,
      `Email: ${contactForm.email || 'Not provided'}`,
      '',
      `Message: ${contactForm.message}`,
    ].join('\n');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setContactSent(true);
    setContactForm({ name: '', phone: '', email: '', message: '' });
    setTimeout(() => setContactSent(false), 5000);
  };

  // ==================== FILTERED TEMPLATES ====================
  const filteredTemplates = selectedCategory
    ? adminTemplates.filter((t) => t.category === selectedCategory)
    : adminTemplates;

  // ==================== DESIGN HELPERS ====================
  const getInitial = (name) => {
    const value = String(name || '').trim();
    if (!value) return '?';
    return Array.from(value)[0].toUpperCase();
  };

  // Invitation language and initials language are intentionally independent.
  const getCoupleInitials = (data) => {
    const initialsLanguage = data?.initialsLanguage || 'en';
    const bride = initialsLanguage === 'ar' ? (data?.arabicBrideName || data?.brideName) : (data?.brideName || data?.arabicBrideName);
    const groom = initialsLanguage === 'ar' ? (data?.arabicGroomName || data?.groomName) : (data?.groomName || data?.arabicGroomName);
    return `${getInitial(groom)}${getInitial(bride)}`;
  };

  const getInvitationFont = (data) =>
    (data?.invitationLanguage || 'en') === 'ar'
      ? (data?.arabicFont || 'Amiri')
      : (data?.englishFont || 'Cormorant Garamond');



  const getInitialFont = (data) =>
    (data?.initialsLanguage || 'en') === 'ar'
      ? (data?.arabicInitialFont || data?.arabicFont || 'Amiri')
      : (data?.englishInitialFont || 'Great Vibes');

  const getInvitationCopy = (data) => {
    const isArabic = (data?.invitationLanguage || 'en') === 'ar';
    return {
      isArabic,
      dir: isArabic ? 'rtl' : 'ltr',
      brideName: isArabic ? (data?.arabicBrideName || data?.brideName || 'Ø§Ù„Ø¹Ø±ÙˆØ³') : (data?.brideName || 'Bride'),
      groomName: isArabic ? (data?.arabicGroomName || data?.groomName || 'Ø§Ù„Ø¹Ø±ÙŠØ³') : (data?.groomName || 'Groom'),
      weddingTime: isArabic ? (data?.arabicWeddingTime || data?.weddingTime || 'ÙˆÙ‚Øª Ø§Ù„Ø²ÙØ§Ù') : (data?.weddingTime || ''),
      venue: isArabic ? (data?.arabicVenue || data?.venue || 'Ø§Ù„Ù…ÙƒØ§Ù†') : (data?.venue || ''),
      location: isArabic ? (data?.arabicLocation || data?.location || 'Ø§Ù„Ù…ÙˆÙ‚Ø¹') : (data?.location || ''),
      dressCode: isArabic ? (data?.arabicDressCode || data?.dressCode || 'Ø§Ù„Ù…Ù„Ø§Ø¨Ø³ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©') : (data?.dressCode || ''),
      story: isArabic ? (data?.arabicStory || data?.story || '') : (data?.story || ''),
      note: isArabic ? (data?.arabicNote || data?.note || '') : (data?.note || ''),
      rsvp: isArabic ? (data?.arabicRsvp || data?.rsvp || '') : (data?.rsvp || ''),
      kicker: isArabic ? 'Ø¨Ù…Ø´Ø§Ø±ÙƒØ© Ø¹Ø§Ø¦Ù„ØªÙŠÙ‡Ù…Ø§' : 'Together with their families',
      countdown: isArabic ? 'ÙŠÙˆÙ… Ø­ØªÙ‰ Ø§Ù„Ø²ÙØ§Ù' : 'days until the wedding',
      moments: isArabic ? 'Ù„Ø­Ø¸Ø§ØªÙ†Ø§' : 'Our moments',
      specialNote: isArabic ? 'Ø±Ø³Ø§Ù„Ø© Ø®Ø§ØµØ©' : 'A special note',
      rsvpPrompt: isArabic ? 'ÙŠØ³Ø¹Ø¯Ù†Ø§ Ù…Ø¹Ø±ÙØ© Ù…Ø§ Ø¥Ø°Ø§ ÙƒÙ†ØªÙ… Ø³ØªØ´Ø§Ø±ÙƒÙˆÙ†Ù†Ø§ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø©.' : 'We would love to know if you can join us.',
      yourName: isArabic ? 'Ø§Ø³Ù…Ùƒ' : 'Your name',
      optionalMessage: isArabic ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ø®ØªÙŠØ§Ø±ÙŠØ©' : 'Optional message',
      yes: isArabic ? 'Ù†Ø¹Ù…ØŒ Ø³Ø£Ø­Ø¶Ø±' : 'Yes, I will attend',
      no: isArabic ? 'Ø¹Ø°Ø±Ø§Ù‹ØŒ Ù„Ù† Ø£ØªÙ…ÙƒÙ† Ù…Ù† Ø§Ù„Ø­Ø¶ÙˆØ±' : "Sorry, I can't attend",
      whatsapp: isArabic ? 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø§Ø¨' : 'WhatsApp RSVP',
      email: isArabic ? 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ø¹Ø¨Ø± Ø§Ù„Ø¨Ø±ÙŠØ¯' : 'Email RSVP',
      weddingDate: isArabic ? (data?.arabicWeddingDate || data?.weddingDate || 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø²ÙØ§Ù') : (data?.weddingDate || 'Wedding Date'),
      weddingTimeLabel: isArabic ? 'ÙˆÙ‚Øª Ø§Ù„Ø²ÙØ§Ù' : 'Wedding Time',
      venueLabel: isArabic ? 'Ø§Ù„Ù…ÙƒØ§Ù†' : 'Venue',
      locationLabel: isArabic ? 'Ø§Ù„Ù…ÙˆÙ‚Ø¹' : 'Location',
      dressCodeLabel: isArabic ? 'Ø§Ù„Ù…Ù„Ø§Ø¨Ø³ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©' : 'Dress Code',
      storyLabel: isArabic ? 'Ù‚ØµØªÙ†Ø§' : 'Our Love Story',
      rsvpLabel: isArabic ? 'ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¶ÙˆØ±' : 'RSVP',
    };
  };

  const envelopeStyles = [
    { id: 'classic', label: 'Classic Ivory', description: 'Clean couture folded paper' },
    { id: 'pointed', label: 'Pointed Couture', description: 'Sharp V-fold with border detail' },
    { id: 'deep-v', label: 'Deep V', description: 'Dramatic triangular flap' },
    { id: 'arch', label: 'Soft Arch', description: 'Rounded luxury flap' },
    { id: 'double', label: 'Double Layer', description: 'Layered premium paper finish' },
    { id: 'arabic', label: 'Arabesque', description: 'Gilded repeating arabesque pattern' },
    { id: 'ottoman', label: 'Ottoman', description: 'Ornate baroque inspired paper' },
    { id: 'islamic', label: 'Geometric Star', description: 'Luxury star and geometry pattern' },
    { id: 'turkish', label: 'Turkish Tulip', description: 'Elegant tulip-inspired pattern' },
    { id: 'floral', label: 'Botanical', description: 'Vintage botanical corner ornament' },
    { id: 'damask', label: 'Damask Gold', description: 'Rich repeating damask pattern' },
    { id: 'velvet', label: 'Velvet Noir', description: 'Deep velvet texture with gold' },
    { id: 'pearl', label: 'Pearl Emboss', description: 'Soft pearl paper with raised detail' },
    { id: 'marble', label: 'Marble Vein', description: 'White marble paper with fine veins' },
  ];

  const stampStyles = [
    { id: 'wax-round', label: 'Classic Wax', description: 'Round raised wax seal' },
    { id: 'wax-scallop', label: 'Scalloped Wax', description: 'Hand-pressed scalloped seal' },
    { id: 'gold-medallion', label: 'Gold Medallion', description: 'Polished couture crest' },
    { id: 'square-crest', label: 'Square Crest', description: 'Modern engraved seal' },
    { id: 'botanical', label: 'Botanical Seal', description: 'Leaf-framed monogram seal' },
    { id: 'black-wax', label: 'Black Wax', description: 'Dark dramatic wax finish' },
  ];

  const englishFonts = ['Cormorant Garamond', 'Playfair Display', 'Cinzel', 'Libre Baskerville', 'Great Vibes', 'Bodoni Moda', 'DM Serif Display', 'EB Garamond', 'Marcellus', 'Prata', 'Lora', 'Allura', 'Parisienne', 'Alex Brush', 'Italianno', 'Tangerine', 'Sacramento'];
  const englishInitialFonts = ['Great Vibes', 'Allura', 'Parisienne', 'Alex Brush', 'Italianno', 'Tangerine', 'Sacramento', 'Cormorant Garamond', 'Bodoni Moda', 'Cinzel', 'Prata', 'DM Serif Display'];
  const arabicFonts = ['Amiri', 'Noto Naskh Arabic', 'Tajawal', 'Scheherazade New'];

  // ==================== RENDER HELPERS ====================
  const renderTemplatePreview = (tmpl, size = 'card', dataOverride = null) => {
    const [bg, accent, text] = tmpl.colors;
    const templateSlug = tmpl.name.toLowerCase().replace(/\s+/g, '-');
    
    if (size === 'card') {
      return (
        <div className={`template-preview template-${templateSlug}-preview`} style={{ background: `linear-gradient(135deg, ${bg}, ${accent})` }}>
          <div className="template-preview-text" style={{ color: text }}>{tmpl.name}</div>
        </div>
      );
    }

    const d = dataOverride || customizationData || {};
    const envelopeColor = d.envelopeColor || bg || '#1c3552';
    const accentColor = d.accentColor || accent || '#d4af37';
    const envelopeStyle = d.envelopeStyle || 'classic';
    const textColor = d.textColor || text || '#2f2635';
    const invitationCopy = getInvitationCopy(d);
    const invitationFont = getInvitationFont(d);
    const initialFont = getInitialFont(d);
    const days = getDaysRemaining(d.weddingDate);

    if (!envelopeOpen) {
      return (
        <div className="invitation-preview invitation-envelope-preview" dir={invitationCopy.dir} style={{ fontFamily: `'${invitationFont}', var(--serif)` }}>
          <div className="envelope-stage">
            <button className={`envelope envelope-${envelopeStyle}`} style={{ '--envelope': envelopeColor, '--accent': accentColor }} onClick={openEnvelope}>
              <div className="envelope-flap" />
              <div className={`envelope-seal stamp-${d.stampStyle || 'wax-round'}`} style={{ borderColor: accentColor, color: '#fff', fontFamily: `'${initialFont}', var(--serif)` }}>
                {Array.from(getCoupleInitials(d)).map((letter, index) => <span key={index} className="initial-letter">{letter}</span>)}
              </div>
              <div className="envelope-hint">Click the seal to open</div>
            </button>
          </div>
          <button className="btn btn-primary envelope-open-btn" onClick={openEnvelope}>
            Open invitation
          </button>
        </div>
      );
    }

    if (entranceActive) {
      const entrance = getEntranceVideo(tmpl?.name, entranceRole);
      return (
        <div className={`invitation-preview entrance-experience entrance-${entrance.effect}`}>
          <div className="entrance-video-wrap">
            <video
              className="entrance-video"
              src={entrance.src}
              autoPlay
              muted
              playsInline
              onEnded={finishEntrance}
              onError={finishEntrance}
            />
            <div className="entrance-vignette" />
            <div className="entrance-overlay">
              <div className="entrance-caption">{entrance.label}</div>
              <div className="entrance-couple-names" dir={invitationCopy.dir} style={{ fontFamily: `'${invitationFont}', var(--serif)` }}>{invitationCopy.groomName} <span>&amp;</span> {invitationCopy.brideName}</div>
              <div className="entrance-progress"><span /></div>
              {entrance.effect === 'petals' && <div className="petal-layer">{Array.from({length: 18}, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>}
              <button type="button" className="entrance-skip" onClick={finishEntrance}>Skip to invitation</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="invitation-preview invitation-opened" dir={invitationCopy.dir} style={{ fontFamily: `'${invitationFont}', var(--serif)`, color: textColor }}>
        <div className="invitation-hero" style={{
          background: `linear-gradient(135deg, ${envelopeColor}, ${bg})`,
          borderBottom: `3px solid ${accentColor}`
        }}>
          <div className="invitation-kicker" style={{ color: accentColor }}>{invitationCopy.kicker}</div>
          <div className="names" style={{ color: textColor }}>{invitationCopy.groomName}</div>
          <div className="ampersand" style={{ color: accentColor }}>&</div>
          <div className="names" style={{ color: textColor }}>{invitationCopy.brideName}</div>
          <div className="invitation-divider" style={{ background: accentColor }} />
          <div className="date" style={{ color: textColor }}>{invitationCopy.weddingDate}</div>
        </div>

        <div className="invitation-details" style={{ color: textColor }}>
          {days !== null && (
            <div className="countdown-box" style={{ borderColor: accentColor }}>
              <div className="countdown-number" style={{ color: accentColor }}>{days}</div>
              <div className="countdown-label">{invitationCopy.countdown}</div>
            </div>
          )}

          {invitationCopy.weddingTime && <div className="detail-row"><div className="detail-label">{invitationCopy.weddingTimeLabel}</div><div className="detail-value">{invitationCopy.weddingTime}</div></div>}
          {invitationCopy.venue && <div className="detail-row"><div className="detail-label">{invitationCopy.venueLabel}</div><div className="detail-value">{invitationCopy.venue}</div></div>}
          {invitationCopy.location && <div className="detail-row"><div className="detail-label">{invitationCopy.locationLabel}</div><div className="detail-value">{invitationCopy.location}</div></div>}
          {invitationCopy.dressCode && <div className="detail-row"><div className="detail-label">{invitationCopy.dressCodeLabel}</div><div className="detail-value">{invitationCopy.dressCode}</div></div>}

          {(d.photos || []).length > 0 && (
            <div className="invitation-gallery">
              <div className="detail-label">{invitationCopy.moments}</div>
              <div className="photo-grid">
                {d.photos.map((photo, i) => <img src={photo} alt={`Wedding moment ${i + 1}`} key={i} />)}
              </div>
            </div>
          )}

          {invitationCopy.story && <>
            <div className="invitation-divider" style={{ background: accentColor }} />
            <div className="detail-row"><div className="detail-label">{invitationCopy.storyLabel}</div><div className="detail-value invitation-story">{invitationCopy.story}</div></div>
          </>}

          {invitationCopy.note && <>
            <div className="invitation-divider" style={{ background: accentColor }} />
            <div className="invitation-note" style={{ borderColor: accentColor }}>
              <div className="detail-label">{invitationCopy.specialNote}</div>
              <div className="detail-value">{invitationCopy.note}</div>
            </div>
          </>}

          <div className="invitation-divider" style={{ background: accentColor }} />
          {invitationCopy.rsvp && <div className="detail-row"><div className="detail-label">{invitationCopy.rsvpLabel}</div><div className="detail-value">{invitationCopy.rsvp}</div></div>}

          {(d.rsvpWhatsapp || d.rsvpEmail) && (
            <div className="invitation-rsvp">
              <div className="detail-label">{invitationCopy.rsvpLabel}</div>
              <p>{invitationCopy.rsvpPrompt}</p>
              <input className="rsvp-input" value={rsvpGuestName} onChange={(e) => setRsvpGuestName(e.target.value)} placeholder={invitationCopy.yourName} />
              <select className="rsvp-input" value={rsvpAttendance} onChange={(e) => setRsvpAttendance(e.target.value)}>
                <option>{invitationCopy.yes}</option><option>{invitationCopy.no}</option>
              </select>
              <textarea className="rsvp-input" rows="2" value={rsvpMessage} onChange={(e) => setRsvpMessage(e.target.value)} placeholder={invitationCopy.optionalMessage} />
              <div className="rsvp-actions">
                {d.rsvpWhatsapp && <button type="button" className="btn btn-primary btn-small" onClick={() => { const phone = String(d.rsvpWhatsapp).replace(/[^0-9]/g, ''); const msg = `RSVP from ${rsvpGuestName || 'Guest'}: ${rsvpAttendance}${rsvpMessage ? `\n${rsvpMessage}` : ''}`; window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank'); }}>{invitationCopy.whatsapp}</button>}
                {d.rsvpEmail && <button type="button" className="btn btn-secondary btn-small" onClick={() => { const subject = `RSVP - ${rsvpGuestName || 'Guest'}`; const body = `Name: ${rsvpGuestName || 'Guest'}\nAttendance: ${rsvpAttendance}\n${rsvpMessage ? `Message: ${rsvpMessage}` : ''}`; window.location.href = `mailto:${d.rsvpEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; }}>{invitationCopy.email}</button>}
              </div>
            </div>
          )}

          {d.musicType === 'upload' && d.musicUrl && (
            <div className="invitation-music">
              <div className="music-playing">ðŸŽµ {d.musicName || 'Our song'}</div>
              <audio ref={audioRef} key={`${d.musicUrl}-${envelopeOpen}`} controls autoPlay playsInline src={d.musicUrl} />
            </div>
          )}

          {d.musicType === 'youtube' && getYouTubeEmbedUrl(d.musicUrl, envelopeOpen) && (
            <div className="invitation-music youtube-music">
              <div className="music-playing">ðŸŽµ Our song</div>
              <iframe
                key={`${d.musicUrl}-${envelopeOpen}`}
                src={getYouTubeEmbedUrl(d.musicUrl, envelopeOpen)}
                title="Invitation music"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== NAVBAR ====================
  const renderNavbar = () => (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo" onClick={() => navigate('home')}>
          <Heart size={20} /> N&N Vow
        </div>
        <ul className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li><a onClick={() => navigate('home')}>{tr.home}</a></li>
          <li><a onClick={() => navigate('designs')}>{tr.designs}</a></li>
          <li><a onClick={() => navigate('howWorks')}>{tr.howWorks}</a></li>
          <li><a onClick={() => navigate('about')}>{tr.about}</a></li>
          <li><a onClick={() => navigate('contact')}>{tr.contact}</a></li>
          {isLoggedIn ? (
            <>
              <li className="settings-menu">
                <button
                  type="button"
                  className="settings-btn"
                  aria-expanded={settingsMenuOpen}
                  onClick={() => setSettingsMenuOpen((open) => !open)}
                >
                  <Settings size={16} /> {tr.settings}
                </button>
                {settingsMenuOpen && (
                  <div className="settings-dropdown">
                    {isAdmin ? (
                      <>
                        <button type="button" onClick={() => { setSettingsMenuOpen(false); setAdminTab('settings'); setPaymentTab('payment'); navigate('admin'); }}>
                          <CreditCard size={15} /> Adjust Payment
                        </button>
                        <button type="button" onClick={() => { setSettingsMenuOpen(false); setAdminTab('templates'); navigate('admin'); }}>
                          <DollarSign size={15} /> Adjust Prices
                        </button>
                        <button type="button" onClick={() => { setSettingsMenuOpen(false); setAdminTab('admin'); navigate('admin'); }}>
                          <Settings size={15} /> Admin
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => { setSettingsMenuOpen(false); navigate('dashboard'); }}>
                        <Users size={15} /> My Account
                      </button>
                    )}
                  </div>
                )}
              </li>
              {!isAdmin && <li><a onClick={() => navigate('dashboard')}>{tr.account}</a></li>}
              {isAdmin && <li><a onClick={() => navigate('admin')}>{tr.admin}</a></li>}
              <li><a onClick={handleLogout} style={{ color: '#e8a87c' }}>{tr.logout}</a></li>
            </>
          ) : (
            <li><a onClick={() => setShowLogin(true)}>{tr.login}</a></li>
          )}
        </ul>
        <div className="navbar-actions">
          <button className="lang-toggle" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
            <Globe size={14} style={{ display: 'inline', marginRight: '4px' }} />
            {lang === 'en' ? 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' : 'English'}
          </button>
          <button className="menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );

  // ==================== HOME PAGE ====================
  const renderHome = () => (
    <>
      <header className="hero">
        <div className="hero-content">
          <h1>{tr.heroTitle.split(' ').slice(0, -2).join(' ')} <span>{tr.heroTitle.split(' ').slice(-2).join(' ')}</span></h1>
          <p>{tr.heroSubtitle}</p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => navigate('designs')}>
              {tr.explore} <ChevronRight size={18} />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('howWorks')}>
              {tr.createOwn}
            </button>
          </div>
        </div>
      </header>

      <section className="section" id="featured">
        <h2 className="section-title">{tr.featured}</h2>
        <p className="section-subtitle">{tr.whyUs}</p>
        <div className="template-grid">
          {adminTemplates.slice(0, 6).map((tmpl) => (
            <div className="template-card" key={tmpl.id} onClick={() => handleViewTemplate(tmpl)}>
              {renderTemplatePreview(tmpl)}
              <div className="template-info">
                <h3>{tmpl.name}</h3>
                <p>{tmpl.description}</p>
                <div className="template-features">
                  {tmpl.features.slice(0, 4).map((f, i) => (
                    <span className="feature-tag" key={i}>{f}</span>
                  ))}
                </div>
                <div className="template-footer">
                  <span className="template-price">${tmpl.price}</span>
                  <div className="template-actions">
                    <button className="btn btn-primary btn-small" onClick={(e) => { e.stopPropagation(); handleCustomize(tmpl); }}>
                      {tr.customize}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {renderHowItWorks()}
      {renderTestimonials()}
      {renderCTA()}
    </>
  );

  // ==================== DESIGNS PAGE ====================
  const renderDesigns = () => (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <h2 className="section-title">{tr.featured}</h2>
      <p className="section-subtitle">{tr.whyUs}</p>
      <div className="category-bar">
        <button
          className={`category-chip ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          {tr.all}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="template-grid">
        {filteredTemplates.map((tmpl) => (
          <div className="template-card" key={tmpl.id} onClick={() => handleViewTemplate(tmpl)}>
            {renderTemplatePreview(tmpl)}
            <div className="template-info">
              <h3>{tmpl.name}</h3>
              <p>{tmpl.description}</p>
              <div className="template-features">
                {tmpl.features.slice(0, 4).map((f, i) => (
                  <span className="feature-tag" key={i}>{f}</span>
                ))}
              </div>
              <div className="template-footer">
                <span className="template-price">${tmpl.price}</span>
                <div className="template-actions">
                  <button className="btn btn-primary btn-small" onClick={(e) => { e.stopPropagation(); handleCustomize(tmpl); }}>
                    {tr.customize}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // ==================== HOW IT WORKS ====================
  const renderHowItWorks = () => (
    <section className="section" id="howWorks">
      <h2 className="section-title">{tr.howWorks}</h2>
      <p className="section-subtitle">Simple steps to your perfect invitation</p>
      <div className="steps-grid">
        {[
          { num: '1', label: tr.step1, icon: <Package size={28} /> },
          { num: '2', label: tr.step2, icon: <Edit size={28} /> },
          { num: '3', label: tr.step3, icon: <Eye size={28} /> },
          { num: '4', label: tr.step4, icon: <CreditCard size={28} /> },
          { num: '5', label: tr.step5, icon: <Globe size={28} /> },
        ].map((step) => (
          <div className="step-card" key={step.num}>
            <div className="step-number">{step.num}</div>
            <div style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>{step.icon}</div>
            <h3>{step.label}</h3>
          </div>
        ))}
      </div>
    </section>
  );

  // ==================== TESTIMONIALS ====================
  const renderTestimonials = () => (
    <section className="section">
      <h2 className="section-title">Testimonials</h2>
      <p className="section-subtitle">What our couples say</p>
      <div className="testimonials-grid">
        {TESTIMONIALS.map((tm, i) => (
          <div className="testimonial-card" key={i}>
            <div className="stars">{'â˜…'.repeat(5)}</div>
            <p>"{tm.text}"</p>
            <div className="name">{tm.name}</div>
          </div>
        ))}
      </div>
    </section>
  );

  // ==================== CTA ====================
  const renderCTA = () => (
    <section className="cta-section">
      <h2>{tr.readyToInvite}</h2>
      <p>{tr.heroSubtitle}</p>
      <button className="btn btn-primary" onClick={() => navigate('designs')}>
        {tr.explore} <ChevronRight size={18} />
      </button>
    </section>
  );

  // ==================== PREVIEW PAGE ====================
  const renderPreview = () => (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <button className="btn btn-secondary btn-small" onClick={() => navigate('designs')} style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> {tr.back}
      </button>
      <h2 className="section-title">{selectedTemplate?.name}</h2>
      <p className="section-subtitle">{selectedTemplate?.heroStyle}</p>
      {selectedTemplate && renderTemplatePreview(selectedTemplate, 'full')}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn btn-primary" onClick={() => handleCustomize(selectedTemplate)}>
          {tr.customizeDesign} <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );

  // ==================== CUSTOMIZE PAGE ====================
  const renderCustomize = () => (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <button className="btn btn-secondary btn-small" onClick={() => navigate('designs')} style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> {tr.back}
      </button>
      <h2 className="section-title">{tr.customizeDesign}</h2>
      <p className="section-subtitle">
        {selectedTemplate?.name} â€” ${selectedTemplate?.price}
        {adminFreeMode && <span className="admin-mode-badge">Admin free invitation</span>}
      </p>
      <div className="customize-layout">
        <div className="customize-form">
          <div className="form-row">
            <div className="form-group">
              <label>{tr.brideName}</label>
              <input
                type="text"
                value={customizationData?.brideName || ''}
                onChange={(e) => setCustomizationData({ ...customizationData, brideName: e.target.value })}
                placeholder={`e.g. ${exampleNames.brideName}`}
              />
            </div>
            <div className="form-group">
              <label>{tr.groomName}</label>
              <input
                type="text"
                value={customizationData?.groomName || ''}
                onChange={(e) => setCustomizationData({ ...customizationData, groomName: e.target.value })}
                placeholder={`e.g. ${exampleNames.groomName}`}
              />
            </div>
          </div>
          <div className="cinematic-entrance-note">
            <strong>Luxury cinematic entrance ðŸŽ¬</strong>
            <span>Each theme now uses real bride-and-groom walking footage matched to the invitation style.</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{tr.weddingDate}</label>
              <input
                type="date"
                value={customizationData?.weddingDate || ''}
                onChange={(e) => setCustomizationData({ ...customizationData, weddingDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{tr.weddingTime}</label>
              <input
                type="time"
                value={customizationData?.weddingTime || ''}
                onChange={(e) => setCustomizationData({ ...customizationData, weddingTime: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>{tr.venue}</label>
            <input
              type="text"
              value={customizationData?.venue || ''}
              onChange={(e) => setCustomizationData({ ...customizationData, venue: e.target.value })}
              placeholder="e.g. Grand Ballroom, Cairo"
            />
          </div>
          <div className="form-group">
            <label>{tr.location}</label>
            <input
              type="text"
              value={customizationData?.location || ''}
              onChange={(e) => setCustomizationData({ ...customizationData, location: e.target.value })}
              placeholder="e.g. Cairo, Egypt"
            />
          </div>
          <div className="form-group">
            <label>{tr.dressCode}</label>
            <input
              type="text"
              value={customizationData?.dressCode || ''}
              onChange={(e) => setCustomizationData({ ...customizationData, dressCode: e.target.value })}
              placeholder="e.g. Black Tie"
            />
          </div>
          <div className="language-settings-box">
            <h3>Invitation language</h3>
            <p>Choose the language of the finished invitation independently from the initials.</p>
            <div className="form-row">
              <div className="form-group">
                <label>Invitation language</label>
                <select value={customizationData?.invitationLanguage || 'en'} onChange={(e) => setCustomizationData({ ...customizationData, invitationLanguage: e.target.value })}>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
              <div className="form-group">
                <label>Initials language</label>
                <select value={customizationData?.initialsLanguage || 'en'} onChange={(e) => setCustomizationData({ ...customizationData, initialsLanguage: e.target.value })}>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>
            {(customizationData?.invitationLanguage === 'ar' || customizationData?.initialsLanguage === 'ar') && (
              <div className="arabic-content-box" dir="rtl">
                <h4>Arabic content</h4>
                <p>Enter Arabic versions so the finished invitation uses real Arabic content, not translated labels only.</p>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ø§Ø³Ù… Ø§Ù„Ø¹Ø±ÙˆØ³</label>
                    <input dir="rtl" value={customizationData?.arabicBrideName || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicBrideName: e.target.value })} placeholder="Ù…Ø«Ø§Ù„: Ù…ÙŠØ§Ù†" />
                  </div>
                  <div className="form-group">
                    <label>Ø§Ø³Ù… Ø§Ù„Ø¹Ø±ÙŠØ³</label>
                    <input dir="rtl" value={customizationData?.arabicGroomName || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicGroomName: e.target.value })} placeholder="Ù…Ø«Ø§Ù„: Ù…Ø¤Ù…Ù†" />
                  </div>
                </div>
                {customizationData?.invitationLanguage === 'ar' && (
                  <>
                    <div className="form-row">
                      <div className="form-group"><label>Ø§Ù„ÙˆÙ‚Øª</label><input dir="rtl" value={customizationData?.arabicWeddingTime || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicWeddingTime: e.target.value })} placeholder="Ù…Ø«Ø§Ù„: 4:30 Ù…Ø³Ø§Ø¡Ù‹" /></div>
                      <div className="form-group"><label>Ø§Ù„Ù…ÙƒØ§Ù†</label><input dir="rtl" value={customizationData?.arabicVenue || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicVenue: e.target.value })} placeholder="Ø§Ø³Ù… Ø§Ù„Ù…ÙƒØ§Ù†" /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Ø§Ù„Ù…ÙˆÙ‚Ø¹</label><input dir="rtl" value={customizationData?.arabicLocation || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicLocation: e.target.value })} placeholder="Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø£Ùˆ Ø§Ù„Ù…ÙˆÙ‚Ø¹" /></div>
                      <div className="form-group"><label>Ø§Ù„Ù…Ù„Ø§Ø¨Ø³ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©</label><input dir="rtl" value={customizationData?.arabicDressCode || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicDressCode: e.target.value })} placeholder="Ù…Ø«Ø§Ù„: Ø±Ø³Ù…ÙŠ" /></div>
                    </div>
                    <div className="form-group"><label>Ù‚ØµØªÙ†Ø§</label><textarea dir="rtl" rows="4" value={customizationData?.arabicStory || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicStory: e.target.value })} placeholder="Ø§ÙƒØªØ¨ÙˆØ§ Ù‚ØµØªÙƒÙ… Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©..." /></div>
                    <div className="form-group"><label>Ø±Ø³Ø§Ù„Ø© Ø®Ø§ØµØ©</label><textarea dir="rtl" rows="3" value={customizationData?.arabicNote || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicNote: e.target.value })} placeholder="Ø±Ø³Ø§Ù„Ø© Ø§Ø®ØªÙŠØ§Ø±ÙŠØ© Ù„Ù„Ø¶ÙŠÙˆÙ..." /></div>
                    <div className="form-group"><label>Ù…Ù„Ø§Ø­Ø¸Ø© ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¶ÙˆØ±</label><input dir="rtl" value={customizationData?.arabicRsvp || ''} onChange={(e) => setCustomizationData({ ...customizationData, arabicRsvp: e.target.value })} placeholder="Ù…Ø«Ø§Ù„: ÙŠØ±Ø¬Ù‰ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ù‚Ø¨Ù„..." /></div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="rsvp-settings-box">
            <h3>RSVP / RESV</h3>
            <p>Let guests confirm attendance directly to the couple by WhatsApp or email.</p>
            <div className="form-group">
              <label>RSVP note (optional)</label>
              <input type="text" value={customizationData?.rsvp || ''} onChange={(e) => setCustomizationData({ ...customizationData, rsvp: e.target.value })} placeholder="e.g. Please reply by October 1st" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Client WhatsApp</label>
                <input type="tel" value={customizationData?.rsvpWhatsapp || ''} onChange={(e) => setCustomizationData({ ...customizationData, rsvpWhatsapp: e.target.value })} placeholder="+20 10 1234 5678" />
              </div>
              <div className="form-group">
                <label>Client email</label>
                <input type="email" value={customizationData?.rsvpEmail || ''} onChange={(e) => setCustomizationData({ ...customizationData, rsvpEmail: e.target.value })} placeholder="couple@example.com" />
              </div>
            </div>
            <small>Use the international WhatsApp format, including country code.</small>
          </div>
          <div className="form-group">
            <label>{tr.story}</label>
            <textarea
              rows="4"
              value={customizationData?.story || ''}
              onChange={(e) => setCustomizationData({ ...customizationData, story: e.target.value })}
              placeholder="Tell your love story..."
            />
          </div>

          <div className="form-group">
            <label>Special note (optional)</label>
            <textarea
              rows="3"
              value={customizationData?.note || ''}
              onChange={(e) => setCustomizationData({ ...customizationData, note: e.target.value })}
              placeholder="For example: We can't wait to celebrate with the kids..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>English invitation font</label>
              <select value={customizationData?.englishFont || 'Cormorant Garamond'} onChange={(e) => setCustomizationData({ ...customizationData, englishFont: e.target.value })}>
                {englishFonts.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>English initials font</label>
              <select value={customizationData?.englishInitialFont || 'Great Vibes'} onChange={(e) => setCustomizationData({ ...customizationData, englishInitialFont: e.target.value })}>
                {englishInitialFonts.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Arabic invitation font</label>
              <select value={customizationData?.arabicFont || 'Amiri'} onChange={(e) => setCustomizationData({ ...customizationData, arabicFont: e.target.value })}>
                {arabicFonts.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Arabic initials font</label>
              <select value={customizationData?.arabicInitialFont || 'Amiri'} onChange={(e) => setCustomizationData({ ...customizationData, arabicInitialFont: e.target.value })}>
                {arabicFonts.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Invitation font color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <input
                type="color"
                value={customizationData?.textColor || selectedTemplate?.colors?.[2] || '#2f2635'}
                onChange={(e) => setCustomizationData({ ...customizationData, textColor: e.target.value })}
                style={{ width: '56px', height: '42px', padding: 0, border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                aria-label="Invitation font color"
              />
              <span>{customizationData?.textColor || selectedTemplate?.colors?.[2] || '#2f2635'}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Envelope style</label>
            <div className="envelope-style-grid">
              {envelopeStyles.map((style) => (
                <button type="button" key={style.id} className={`envelope-style-option ${customizationData?.envelopeStyle === style.id ? 'active' : ''}`} onClick={() => setCustomizationData({ ...customizationData, envelopeStyle: style.id })}>
                  <span className={`mini-envelope mini-envelope-${style.id}`} />
                  <strong>{style.label}</strong>
                  <small>{style.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Initial stamp design</label>
            <div className="stamp-style-grid">
              {stampStyles.map((stamp) => (
                <button type="button" key={stamp.id} className={`stamp-style-option ${customizationData?.stampStyle === stamp.id ? 'active' : ''}`} onClick={() => setCustomizationData({ ...customizationData, stampStyle: stamp.id })}>
                  <span className={`mini-stamp mini-stamp-${stamp.id}`}>{getCoupleInitials(customizationData || {})}</span>
                  <strong>{stamp.label}</strong>
                  <small>{stamp.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Photos (up to 6)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => addPhotoFiles(e.target.files)} />
            {(customizationData?.photos || []).length > 0 && (
              <div className="photo-upload-grid">
                {customizationData.photos.map((photo, i) => (
                  <div className="photo-upload-item" key={i}>
                    <img src={photo} alt={`Selected ${i + 1}`} />
                    <button type="button" onClick={() => removePhoto(i)}>Ã—</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Envelope color</label>
              <div className="color-control">
                <input type="color" value={customizationData?.envelopeColor || '#1c3552'}
                  onChange={(e) => setCustomizationData({ ...customizationData, envelopeColor: e.target.value })} />
                <span>{customizationData?.envelopeColor || '#1c3552'}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Accent color</label>
              <div className="color-control">
                <input type="color" value={customizationData?.accentColor || '#d4af37'}
                  onChange={(e) => setCustomizationData({ ...customizationData, accentColor: e.target.value })} />
                <span>{customizationData?.accentColor || '#d4af37'}</span>
              </div>
            </div>
          </div>

          <div className="music-box">
            <h3><span>ðŸŽµ</span> Add a song</h3>
            <p className="music-help">Choose a song for the invitation. Upload an audio file or paste a YouTube URL.</p>
            <div className="music-options">
              <button type="button" className={`music-option ${customizationData?.musicType === 'upload' ? 'active' : ''}`}
                onClick={() => setCustomizationData({ ...customizationData, musicType: 'upload', musicUrl: '' })}>
                Upload song
              </button>
              <button type="button" className={`music-option ${customizationData?.musicType === 'youtube' ? 'active' : ''}`}
                onClick={() => setCustomizationData({ ...customizationData, musicType: 'youtube', musicUrl: '' })}>
                YouTube
              </button>
              <button type="button" className={`music-option ${!customizationData?.musicType || customizationData.musicType === 'none' ? 'active' : ''}`}
                onClick={() => setCustomizationData({ ...customizationData, musicType: 'none', musicUrl: '', musicName: '' })}>
                No song
              </button>
            </div>
            {customizationData?.musicType === 'upload' && (
              <div>
                <input type="file" accept="audio/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const onlineUrl = await uploadMediaOnline(file);
                  if (onlineUrl) {
                    setCustomizationData((prev) => ({ ...prev, musicType: 'upload', musicUrl: onlineUrl, musicName: file.name, musicMediaKey: '' }));
                    return;
                  }
                  try {
                    const key = await saveLocalMedia(file);
                    const url = URL.createObjectURL(file);
                    setCustomizationData((prev) => ({ ...prev, musicType: 'upload', musicUrl: url, musicName: file.name, musicMediaKey: key }));
                  } catch {
                    const reader = new FileReader();
                    reader.onload = () => setCustomizationData((prev) => ({ ...prev, musicType: 'upload', musicUrl: reader.result, musicName: file.name }));
                    reader.readAsDataURL(file);
                  }
                }} />
                {customizationData.musicName && <div className="music-file-name">âœ“ {customizationData.musicName}</div>}
                <small>For this local prototype, the audio is stored in your browser.</small>
              </div>
            )}
            {customizationData?.musicType === 'youtube' && (
              <input type="url" value={customizationData?.musicUrl || ''} onChange={(e) => setCustomizationData({ ...customizationData, musicUrl: e.target.value, musicName: 'YouTube song' })}
                placeholder="https://www.youtube.com/watch?v=..." />
            )}
          </div>

          <div className="customize-actions">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleDemo}>
              <Eye size={18} /> Demo
            </button>
            {adminFreeMode ? (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={createFreeInvitationFromForm}>
                <Plus size={18} /> Create free invitation
              </button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCheckout}>
                {tr.checkout} <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="live-preview">
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--primary)', textAlign: 'center' }}>
            {tr.preview}
          </h3>
          {renderTemplatePreview(selectedTemplate, 'full')}
        </div>
      </div>
    </section>
  );


  // ==================== DEMO PAGE ====================
  const renderDemo = () => (
    <section className="section demo-page" style={{ paddingTop: '8rem' }}>
      <div className="demo-banner">
        <div>
          <strong>Demo preview</strong>
          <span>This is a preview only. No shareable link is created.</span>
        </div>
        <button className="btn btn-primary btn-small" onClick={() => { setDemoMode(false); setPage('customize'); }}>
          Back to editing
        </button>
      </div>
      <h2 className="section-title">{selectedTemplate?.name}</h2>
      <p className="section-subtitle">This is exactly how your invitation will look with the information you've entered.</p>
      {selectedTemplate && renderTemplatePreview(selectedTemplate, 'full')}
      <div className="demo-locked">
        ðŸ”’ The guest/share link stays locked until payment is confirmed.
      </div>
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button className="btn btn-primary" onClick={handleCheckout}>
          Continue to payment <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );

  // ==================== CHECKOUT PAGE ====================
  const renderCheckout = () => (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <button className="btn btn-secondary btn-small" onClick={() => setPage('customize')} style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> {tr.back}
      </button>
      <h2 className="section-title">{tr.checkout}</h2>
      <p className="section-subtitle">{tr.payment}</p>
      <div className="checkout-layout">
        <div className="checkout-summary">
          <h3>{tr.templates}</h3>
          <div className="summary-row">
            <span>{selectedTemplate?.name}</span>
            <span>${selectedTemplate?.price}</span>
          </div>
          <div className="summary-row">
            <span>{customizationData?.groomName} & {customizationData?.brideName}</span>
            <span>{customizationData?.weddingDate}</span>
          </div>
          <div className="summary-row total">
            <span>{tr.total}</span>
            <span>${selectedTemplate?.price}</span>
          </div>
        </div>

        <div className="payment-box">
          <h3>{tr.payment}</h3>
          {paymentSettings.iban ? (
            <>
              <div className="iban-box">
                <div className="iban-label">IBAN</div>
                <div className="iban-number">{paymentSettings.iban}</div>
                {paymentSettings.bankName && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--light-text)' }}>
                    {paymentSettings.bankName}
                  </div>
                )}
                {paymentSettings.accountHolder && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>
                    {paymentSettings.accountHolder}
                  </div>
                )}
              </div>
              <ol className="payment-instructions">
                <li>Transfer the total amount (${selectedTemplate?.price}) to the IBAN above.</li>
                <li>{paymentSettings.paymentInstructions}</li>
                <li>Your invitation will be activated once payment is confirmed.</li>
              </ol>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={handleCompletePurchase}>
                {tr.complete} <CheckCircle size={18} />
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--light-text)' }}>
              <p>Payment details are being configured. Please check back soon, or contact us to complete your order.</p>
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('contact')}>
                Contact Us
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // ==================== PUBLIC INVITATION PAGE ====================
  const renderPublicInvitation = () => (
    <section className="section public-invitation-page" style={{ paddingTop: '8rem' }}>
      <div className="public-badge">N&N Vow â€¢ Wedding Invitation</div>
      <p className="section-subtitle">Tap the envelope to open your invitation.</p>
      {selectedTemplate && renderTemplatePreview(selectedTemplate, 'full')}
    </section>
  );

  // ==================== SHARE PAGE ====================
  const renderShare = () => {
    const latestInv = userInvitations[0];
    const latestShareUrl = getShareUrl(latestInv);
    return (
      <section className="section" style={{ paddingTop: '8rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <CheckCircle size={64} style={{ color: 'var(--gold)', marginBottom: '1rem' }} />
          <h2 className="section-title">{tr.share}</h2>
          <p className="section-subtitle">Your invitation is ready!</p>
          {latestInv && (
            <div className="checkout-summary" style={{ textAlign: 'left' }}>
              <div className="summary-row">
                <span>{tr.coupleName}</span>
                <span>{latestInv.bride}{latestInv.groom}</span>
              </div>
              <div className="summary-row">
                <span>{tr.weddingDate}</span>
                <span>{latestInv.date}</span>
              </div>
              <div className="summary-row">
                <span>{tr.status}</span>
                <span className={`status-badge ${latestInv.paymentStatus === 'paid' || latestInv.paymentStatus === 'free' ? 'status-active' : 'status-pending'}`}>
                  {latestInv.paymentStatus === 'free' ? 'Free / Active' : latestInv.paymentStatus === 'paid' ? 'Paid / Active' : 'Payment pending'}
                </span>
              </div>
              {latestInv.paymentStatus === 'paid' || latestInv.paymentStatus === 'free' ? (
                <>
                  <div className="summary-row">
                    <span>{tr.shareLink}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gold)', wordBreak: 'break-all' }}>{latestShareUrl}</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1.5rem' }}
                    onClick={() => handleCopyLink(latestShareUrl)}
                  >
                    {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> {tr.copy}</>}
                  </button>
                </>
              ) : (
                <div className="link-locked">
                  ðŸ”’ Your share link is locked until payment is confirmed by the admin.
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('dashboard')}>
              {tr.dashboard}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('home')}>
              {tr.home}
            </button>
          </div>
        </div>
      </section>
    );
  };

  // ==================== DASHBOARD PAGE ====================
  const renderDashboard = () => (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <h2 className="section-title">{tr.dashboard}</h2>
      <p className="section-subtitle">{tr.myInvitations}</p>
      {userInvitations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--light-text)' }}>
          <Package size={48} style={{ color: 'var(--gold)', marginBottom: '1rem' }} />
          <p>You have no invitations yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('designs')}>
            {tr.explore} <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        <div className="dashboard-table">
          <table>
            <thead>
              <tr>
                <th>{tr.coupleName}</th>
                <th>{tr.templates}</th>
                <th>{tr.weddingDate}</th>
                <th>{tr.status}</th>
                <th>{tr.shareLink}</th>
                <th>{tr.edit}</th>
              </tr>
            </thead>
            <tbody>
              {userInvitations.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.bride}{inv.groom}</td>
                  <td>{inv.template}</td>
                  <td>{inv.date}</td>
                  <td>
                    <span className={`status-badge ${inv.status === 'active' ? 'status-active' : 'status-pending'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.paymentStatus === 'paid' || inv.paymentStatus === 'free' ? (
                      <button className="btn-small btn-secondary" onClick={() => handleCopyLink(getShareUrl(inv))}>
                        {copied ? <Check size={14} /> : <Copy size={14} />} Copy
                      </button>
                    ) : (
                      <span className="status-badge status-pending">Locked</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-small btn-secondary" onClick={() => handleEditInvitation(inv)}>
                        <Edit size={14} />
                      </button>
                      <button className="btn-small btn-danger" onClick={() => handleDeleteInvitation(inv.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  // ==================== ADMIN PAGE ====================
  const renderAdmin = () => {
    if (!isAdmin) {
      return (
        <section className="section" style={{ paddingTop: '8rem', textAlign: 'center' }}>
          <h2 className="section-title">Admin access required</h2>
          <p className="section-subtitle">Please log in with the administrator account.</p>
          <button className="btn btn-primary" onClick={() => setShowLogin(true)}>Log in</button>
        </section>
      );
    }
    return (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <h2 className="section-title">{tr.admin}</h2>
      <p className="section-subtitle">Welcome, Admin â€” this area controls payment, prices, and admin-only invitations.</p>
      <div className="admin-tabs">
        <button className={`admin-tab admin-free-tab ${adminTab === 'admin' ? 'active' : ''}`} onClick={() => setAdminTab('admin')}>
          <Settings size={16} /> Admin â€” Free Invitations
        </button>
        <button className={`admin-tab ${adminTab === 'templates' ? 'active' : ''}`} onClick={() => setAdminTab('templates')}>
          <DollarSign size={16} /> Adjust Prices
        </button>
        <button className={`admin-tab ${adminTab === 'orders' ? 'active' : ''}`} onClick={() => setAdminTab('orders')}>
          <BarChart3 size={16} /> {tr.orders}
        </button>
        <button className={`admin-tab ${adminTab === 'customers' ? 'active' : ''}`} onClick={() => setAdminTab('customers')}>
          <Users size={16} /> {tr.customers}
        </button>
        <button className={`admin-tab ${adminTab === 'settings' ? 'active' : ''}`} onClick={() => { setAdminTab('settings'); setPaymentTab('payment'); }}>
          <CreditCard size={16} /> Adjust Payment
        </button>
      </div>

      {/* TEMPLATES TAB */}
      {adminTab === 'templates' && (
        <div className="admin-card">
          <h3>Manage Template Prices</h3>
          {adminTemplates.map((tmpl) => (
            <div className="template-admin-row" key={tmpl.id}>
              <div>
                <div className="name">{tmpl.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>{tmpl.category} â€” {tmpl.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingPriceId === tmpl.id ? (
                  <>
                    <span style={{ color: 'var(--gold)' }}>$</span>
                    <input
                      type="number"
                      className="price-edit-input"
                      value={editingPriceValue}
                      onChange={(e) => setEditingPriceValue(e.target.value)}
                      autoFocus
                    />
                    <button className="btn-small btn-primary" onClick={() => savePrice(tmpl.id)}>
                      <Save size={14} /> Save
                    </button>
                  </>
                ) : (
                  <>
                    <span className="template-price">${tmpl.price}</span>
                    <button className="btn-small btn-secondary" onClick={() => startEditPrice(tmpl)}>
                      <Edit size={14} /> {tr.edit}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS TAB */}
      {adminTab === 'orders' && (
        <div className="admin-card">
          <h3>OrdersTransactions</h3>
          {userInvitations.length === 0 ? (
            <p style={{ color: 'var(--light-text)' }}>No orders yet.</p>
          ) : (
            <div className="dashboard-table">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>{tr.coupleName}</th>
                    <th>{tr.templates}</th>
                    <th>{tr.price}</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userInvitations.map((inv) => {
                    const tmpl = adminTemplates.find((t) => t.name === inv.template);
                    return (
                      <tr key={inv.id}>
                        <td>{inv.email || 'Admin'}</td>
                        <td>{inv.bride}{inv.groom}</td>
                        <td>{inv.template}</td>
                        <td>${tmpl?.price || 'â€”'}</td>
                        <td>
                          <span className={`status-badge ${inv.paymentStatus === 'paid' || inv.paymentStatus === 'free' ? 'status-active' : 'status-pending'}`}>
                            {inv.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td>
                          {inv.paymentStatus === 'pending' ? (
                            <button className="btn-small btn-primary" onClick={() => markTransactionPaid(inv.id)}>
                              Confirm paid
                            </button>
                          ) : (
                            <span style={{ color: 'var(--light-text)' }}>Active</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Transaction history</h4>
          {transactions.length === 0 ? (
            <p style={{ color: 'var(--light-text)' }}>No payment transactions yet.</p>
          ) : (
            <div className="dashboard-table">
              <table>
                <thead><tr><th>Date</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.createdAt).toLocaleString()}</td>
                      <td>{tx.email || 'â€”'}</td>
                      <td>${tx.amount}</td>
                      <td><span className={`status-badge ${tx.status === 'paid' ? 'status-active' : 'status-pending'}`}>{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {adminTab === 'customers' && (
        <div className="admin-card">
          <h3>Clients</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--cream)' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600,
            }}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{user?.email || 'admin@nnvow.com'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>Admin Account</div>
            </div>
          </div>
          {userInvitations.length === 0 ? (
            <p style={{ color: 'var(--light-text)', marginTop: '1rem' }}>No customer orders yet.</p>
          ) : (
            <p style={{ color: 'var(--light-text)', marginTop: '1rem' }}>
              {userInvitations.length} invitation(s) created.
            </p>
          )}
        </div>
      )}

      {/* PAYMENT SETTINGS TAB */}
      {adminTab === 'settings' && (
        <div className="admin-card settings-form">
          <div className="admin-subtabs">
            <button className={paymentTab === 'payment' ? 'active' : ''} onClick={() => setPaymentTab('payment')}>Payment account</button>
            <button className={paymentTab === 'transactions' ? 'active' : ''} onClick={() => setPaymentTab('transactions')}>Transactions</button>
            <button className={`settings-admin-link ${adminTab === 'admin' ? 'active' : ''}`} onClick={() => setAdminTab('admin')}>
              <Settings size={15} /> Admin â€” Create Free Invitations
            </button>
          </div>

          {paymentTab === 'payment' ? (
            <>
              <h3>Payment account</h3>
              <p style={{ color: 'var(--light-text)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                These details are shown to customers at checkout.
              </p>
              {settingsSaved && <div className="alert alert-success"><CheckCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />Settings saved successfully!</div>}
              <div className="form-group">
                <label>IBAN Number</label>
                <input type="text" value={paymentSettings.iban} onChange={(e) => setPaymentSettings({ ...paymentSettings, iban: e.target.value })} placeholder="EG00 0000 0000 0000 0000 0000" />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" value={paymentSettings.bankName} onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })} placeholder="Bank name" />
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input type="text" value={paymentSettings.accountHolder} onChange={(e) => setPaymentSettings({ ...paymentSettings, accountHolder: e.target.value })} placeholder="Account holder" />
              </div>
              <div className="form-group">
                <label>Payment Instructions</label>
                <textarea rows="3" value={paymentSettings.paymentInstructions} onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentInstructions: e.target.value })} />
              </div>
              <button className="btn btn-primary" onClick={handleSaveSettings}><Save size={18} /> Save Payment Settings</button>
            </>
          ) : (
            <>
              <h3>Transactions</h3>
              {transactions.length === 0 ? (
                <p style={{ color: 'var(--light-text)' }}>No transactions yet.</p>
              ) : (
                <div className="dashboard-table">
                  <table>
                    <thead><tr><th>Date</th><th>Customer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const inv = userInvitations.find((item) => item.id === tx.invitationId);
                        return (
                          <tr key={tx.id}>
                            <td>{new Date(tx.createdAt).toLocaleString()}</td>
                            <td>{tx.email || 'â€”'}</td>
                            <td>${tx.amount}</td>
                            <td><span className={`status-badge ${tx.status === 'paid' ? 'status-active' : 'status-pending'}`}>{tx.status}</span></td>
                            <td>{tx.status === 'pending' && inv ? <button className="btn-small btn-primary" onClick={() => markTransactionPaid(inv.id)}>Confirm paid</button> : 'â€”'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ADMIN TAB */}
      {adminTab === 'admin' && (
        <div className="admin-card">
          <h3>Admin â€” Create Free Invitations</h3>
          <p style={{ color: 'var(--light-text)', marginBottom: '1rem' }}>
            This is your admin-only area. Create finished invitations for free, then copy their short guest link. No customer payment is required.
          </p>
          <div className="template-grid">
            {adminTemplates.map((tmpl) => (
              <div className="template-card" key={tmpl.id}>
                {renderTemplatePreview(tmpl)}
                <div className="template-info">
                  <h3>{tmpl.name}</h3>
                  <button className="btn btn-secondary btn-small" onClick={() => startAdminFreeInvitation(tmpl)}>
                    <Plus size={14} /> Create free invitation
                  </button>
                </div>
              </div>
            ))}
          </div>
          {freeInvitations.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h4>Free invitations</h4>
              {freeInvitations.map((inv) => {
                const inviteSlug = inv.slug || makeSlug(inv.bride, inv.groom, inv.id);
                const inviteUrl = getShareUrl({ ...inv, slug: inviteSlug });
                return (
                  <div className="free-invite-row" key={inv.id}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong>{inv.bride} {inv.groom}</strong>
                      <input
                        readOnly
                        value={inviteUrl}
                        aria-label={`Invitation link for ${inv.bride} ${inv.groom}`}
                        style={{ width: '100%', marginTop: '.45rem', fontSize: '.82rem' }}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      <button className="btn-small btn-secondary" onClick={() => { handleCopyLink(inviteUrl); }}>
                        <Copy size={14} /> Copy link
                      </button>
                      <button className="btn-small btn-primary" onClick={() => {
                        setPublicInvitation({ ...inv, slug: inviteSlug, shareUrl: getShareUrl({ ...inv, slug: inviteSlug }) });
                        setCustomizationData(inv.data || {});
                        const tmpl = adminTemplates.find((t) => t.name === inv.template) || SAMPLE_TEMPLATES[0];
                        setSelectedTemplate(tmpl);
                        setEnvelopeOpen(false);
                        setPage('public');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}>
                        <Eye size={14} /> Open
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </section>
    );
  };

  // ==================== ABOUT PAGE ====================
  const renderAbout = () => (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <h2 className="section-title">{tr.about}</h2>
      <p className="section-subtitle">{tr.whyUs}</p>
      <div className="about-content">
        <p>
          N&N Vow creates luxury digital wedding invitations that blend timeless elegance with modern technology.
          Each design is crafted with love, inspired by the world's most beautiful destinations and aesthetics.
        </p>
        <p>
          From Tuscan vineyards to Aegean shores, from art-deco ballrooms to cherry-blossom gardens â€”
          we offer a collection that speaks to every love story. Our invitations are fully customizable,
          shareable instantly, and accessible from any device.
        </p>
        <p>
          Built on Cloudflare's global edge network, your invitations load instantly for guests anywhere in the world.
        </p>
      </div>
    </section>
  );

  // ==================== CONTACT PAGE ====================
  const renderContact = () => (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <h2 className="section-title">{tr.contact}</h2>
      <p className="section-subtitle">We'd love to hear from you</p>
      <form className="contact-form" onSubmit={handleContactSubmit}>
        {contactSent && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
            WhatsApp opened with your message ready to send.
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder={invitationCopy.yourName} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" required value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="Your phone number" />
          </div>
        </div>
        <div className="form-group">
          <label>Email <span style={{ opacity: 0.6 }}>(optional)</span></label>
          <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="your@email.com" />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea rows="5" required value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="How can we help?" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          <MessageCircle size={18} /> Send via WhatsApp
        </button>
        <a href="tel:+201117141072" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <Phone size={18} /> Call us
        </a>
      </form>
    </section>
  );

  // ==================== FAQ PAGE ====================
  const renderFAQ = () => (
    <section className="section" style={{ paddingTop: '8rem' }}>
      <h2 className="section-title">{tr.faq}</h2>
      <p className="section-subtitle">Frequently asked questions</p>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {FAQ_ITEMS.map((item, i) => (
          <div className="faq-item" key={i}>
            <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              {item.q}
              {openFaq === i ? <X size={18} /> : <ChevronRight size={18} />}
            </div>
            {openFaq === i && (
              <div className="faq-answer">{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  // ==================== FOOTER ====================
  const renderFooter = () => (
    <footer className="footer">
      <div className="footer-links">
        <a onClick={() => navigate('home')}>{tr.home}</a>
        <a onClick={() => navigate('designs')}>{tr.designs}</a>
        <a onClick={() => navigate('howWorks')}>{tr.howWorks}</a>
        <a onClick={() => navigate('about')}>{tr.about}</a>
        <a onClick={() => navigate('contact')}>{tr.contact}</a>
        <a onClick={() => navigate('faq')}>{tr.faq}</a>
      </div>
      <p>&copy; {new Date().getFullYear()} N&N Vow. Crafted with <Heart size={12} style={{ display: 'inline', color: 'var(--gold)' }} /> on Cloudflare.</p>
    </footer>
  );

  // ==================== LOGIN MODAL ====================
  const renderLoginModal = () => (
    <div className="modal-overlay" onClick={() => setShowLogin(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '2.5rem' }}>
        <div className="modal-close" onClick={() => setShowLogin(false)}><X size={24} /></div>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>
            <Heart size={40} />
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', color: 'var(--primary)' }}>N&N Vow</h2>
          <p style={{ color: 'var(--light-text)', fontSize: '0.9rem' }}>Log in to your account</p>
        </div>
        {loginError && <div className="alert alert-error">{loginError}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Lock size={16} /> {tr.login}
          </button>
        </form>
        <p style={{ fontSize: '0.8rem', color: 'var(--light-text)', textAlign: 'center', marginTop: '1.5rem' }}>
          Admin? Log in with your admin email to access the portal.
        </p>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div>
      {renderNavbar()}
      <main>
        {page === 'home' && renderHome()}
        {page === 'designs' && renderDesigns()}
        {page === 'howWorks' && renderHowItWorks()}
        {page === 'about' && renderAbout()}
        {page === 'contact' && renderContact()}
        {page === 'faq' && renderFAQ()}
        {page === 'preview' && renderPreview()}
        {page === 'customize' && renderCustomize()}
        {page === 'demo' && renderDemo()}
        {page === 'checkout' && renderCheckout()}
        {page === 'public' && renderPublicInvitation()}
        {page === 'share' && renderShare()}
        {page === 'dashboard' && renderDashboard()}
        {page === 'admin' && renderAdmin()}
      </main>
      {renderFooter()}
      {showLogin && renderLoginModal()}
    </div>
  );
}

