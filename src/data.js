// ==================== DATA & CONFIG ====================

// Admin email — ONLY this email can access admin portal
export const ADMIN_EMAIL = 'nadanabiil231@gmail.com';

// Payment settings — IBAN for bank transfer
export const DEFAULT_PAYMENT_SETTINGS = {
  iban: '', // Admin sets this in Settings tab
  bankName: '',
  accountHolder: '',
  paymentInstructions: 'Please transfer the total amount to the bank account above, then send a screenshot of the transfer to confirm your order.',
};

// Random name pools for diverse placeholder names
export const BRIDE_NAMES = ['Sophia', 'Emma', 'Amira', 'Leila', 'Zara', 'Noor', 'Saira', 'Yasmin', 'Dina', 'Hana', 'Fatima', 'Nadia', 'Raida', 'Salma', 'Layla', 'Jasmine', 'Zahra', 'Rania', 'Lina', 'Mariam'];
export const GROOM_NAMES = ['Aiden', 'Karim', 'Omar', 'Ahmed', 'Hassan', 'Tariq', 'Malik', 'Rashid', 'Hadi', 'Khalid', 'Hamza', 'Samir', 'Rayan', 'Adel', 'Faris', 'Jamal', 'Naveed', 'Amin', 'Rahul', 'Arjun'];

// Helper function to get random name
export const getRandomName = (names) => names[Math.floor(Math.random() * names.length)];

// Sample templates
export const SAMPLE_TEMPLATES = [
  {
    id: 1,
    name: 'Toscana',
    category: 'romantic',
    price: 850,
    description: 'Tuscan golden hour — vineyard hills, cypress & terracotta warmth',
    colors: ['#F9F6F1', '#C9985F', '#8B7355'],
    features: ['RSVP', 'Map', 'Gallery', 'Music', 'Countdown', 'Story', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Warm terracotta with golden vineyard landscape',
  },
  {
    id: 2,
    name: 'Santorini',
    category: 'modern',
    price: 850,
    description: 'Aegean island — whitewash, cobalt domes & bougainvillea',
    colors: ['#FFFFFF', '#0066CC', '#FF6B9D'],
    features: ['RSVP', 'Map', 'Gallery', 'Story', 'Countdown', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'White with cobalt blue and coral accents',
  },
  {
    id: 3,
    name: 'Sakura',
    category: 'floral',
    price: 850,
    description: 'Cherry-blossom minimalism — drifting petals & ink-brush calm',
    colors: ['#FFF9F7', '#D4A5A5', '#4A4A4A'],
    features: ['RSVP', 'Map', 'Gallery', 'Music', 'Story', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Soft pink with minimalist cherry blossom elements',
  },
  {
    id: 4,
    name: 'Deco',
    category: 'luxury',
    price: 900,
    description: 'Art-deco ballroom — Gatsby gold geometry on velvet noir',
    colors: ['#1A1A1A', '#D4AF93', '#F9F6F1'],
    features: ['RSVP', 'Map', 'Gallery', 'Music', 'Countdown', 'Dress Code', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Black with gold geometric patterns',
  },
  {
    id: 5,
    name: 'Provence',
    category: 'floral',
    price: 850,
    description: 'Lavender fields — French pastoral, linen & wildflowers',
    colors: ['#F5E6D3', '#9B8BA8', '#6B7C59'],
    features: ['RSVP', 'Map', 'Gallery', 'Music', 'Story', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Soft lavender and sage with wildflower accents',
  },
  {
    id: 6,
    name: 'Palma',
    category: 'modern',
    price: 800,
    description: 'Tropical destination — palms, warm sand & sunset coral',
    colors: ['#FFF5E1', '#FF9D5C', '#5FA5A5'],
    features: ['RSVP', 'Map', 'Gallery', 'Countdown', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Warm coral with tropical sunset tones',
  },
  {
    id: 7,
    name: 'Bloom',
    category: 'floral',
    price: 850,
    description: 'English garden — watercolor roses, trellis greens & ivory',
    colors: ['#F9F6F1', '#E8B4C8', '#7A9B5F'],
    features: ['RSVP', 'Map', 'Gallery', 'Music', 'Story', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Ivory with blush roses and garden greens',
  },
  {
    id: 8,
    name: 'Royal',
    category: 'luxury',
    price: 900,
    description: 'Warm ivory + soft umber with gold-script elegance — couture aesthetic',
    colors: ['#F9F6F1', '#8B6B5F', '#D4AF93'],
    features: ['RSVP', 'Map', 'Gallery', 'Music', 'Countdown', 'Dress Code', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Elegant cream with gold calligraphy',
  },
  {
    id: 9,
    name: 'Lantern',
    category: 'arabic',
    price: 950,
    description: 'Golden-hour courtyard, blossom garlands, mosaic tile patterns',
    colors: ['#F0E6D2', '#D4A574', '#8B5A3C'],
    features: ['RSVP', 'Map', 'Gallery', 'Music', 'Arabic Support', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Golden courtyard with Islamic patterns',
  },
  {
    id: 10,
    name: 'Pyramids',
    category: 'arabic',
    price: 900,
    description: 'Painterly Egyptian-desert hero, sage accents, and elegant typography',
    colors: ['#F9F6F1', '#9B8B7F', '#8B9D8F'],
    features: ['RSVP', 'Map', 'Gallery', 'Arabic Support', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Desert landscape with Egyptian elegance',
  },
  {
    id: 11,
    name: 'Imperial',
    category: 'luxury',
    price: 950,
    description: 'Cream + deep burgundy baroque with crystal-chandelier hero',
    colors: ['#F9F6F1', '#8B3A3A', '#D4AF93'],
    features: ['RSVP', 'Map', 'Gallery', 'Music', 'Countdown', 'Dress Code', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Burgundy velvet with crystal accents',
  },
  {
    id: 12,
    name: 'Twilight',
    category: 'romantic',
    price: 850,
    description: 'Warm cream + deep olive-sage, painterly dusk illustrations',
    colors: ['#F5E6D3', '#7A8F6F', '#E8D4C4'],
    features: ['RSVP', 'Map', 'Gallery', 'Story', 'Music', 'Music', 'Gallery', 'Countdown', 'Custom Note'],
    heroStyle: 'Painted dusk with olive sage tones',
  },
];

export const CATEGORIES = [
  { id: 'romantic', label: 'Romantic' },
  { id: 'modern', label: 'Modern' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'floral', label: 'Floral' },
  { id: 'arabic', label: 'Arabic' },
];

export const TESTIMONIALS = [
  { name: 'Sophia & Aiden', text: 'N&N Vow made our invitation so beautiful and personal. Our guests loved it!' },
  { name: 'Noor & Ahmed', text: 'Easy to use, elegant design, and delivered so quickly. Highly recommended!' },
  { name: 'Leila & Hassan', text: 'The customization options are amazing. We felt like we had a designer on our team.' },
];

export const FAQ_ITEMS = [
  { q: 'How do I receive my invitation?', a: 'After completing payment, you will instantly receive a shareable link that you can send to all your guests.' },
  { q: 'Can I customize the invitation?', a: 'Yes! Each template can be fully personalized with your names, date, venue, story, and more.' },
  { q: 'How do I pay?', a: 'After customizing your invitation, you will be shown our bank IBAN number. Transfer the amount and your invitation will be activated.' },
  { q: 'How long does it take?', a: 'Your invitation is ready to share immediately after payment confirmation — usually within a few hours.' },
  { q: 'Can I edit after purchase?', a: 'Yes, you can edit your invitation details anytime from your dashboard.' },
];