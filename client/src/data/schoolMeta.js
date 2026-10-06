export const SCHOOL = {
  nameGu: 'ઉત્તર બુનિયાદી આશ્રમ શાળા',
  nameEn: 'Uttar Buniyadi Ashram Shala',
  motto: 'શીખો · વગડો · સેવો',
  board: 'ગુજરાત માધ્યમિક શિક્ષણ બોર્ડ',
  medium: 'ગુજરાતી માધ્યમ',
  year: '2026-27',
};

export const COMPLAINT_CATEGORIES = [
  { value: 'hostel', label: 'ભવન / હોસ્ટેલ સમસ્યા', short: 'ભવન', icon: '🏠' },
  { value: 'campus', label: 'કેમ્પસ સમસ્યા', short: 'કેમ્પસ', icon: '🏫' },
  { value: 'bullying', label: 'રેગિંગ', short: 'રેગિંગ', icon: '🛡️' },
];

export const STATUS_STYLE = {
  'નવી': 'bg-rose-100 text-rose-700',
  'ચર્ચામાં': 'bg-gold-200 text-brand-900',
  'ઉકેલાઈ': 'bg-brand-100 text-brand-800',
  'નકારાયેલ': 'bg-brand-100 text-brand-700/70',
  open: 'bg-rose-100 text-rose-700',
  answered: 'bg-brand-100 text-brand-800',
  closed: 'bg-brand-100 text-brand-700/70',
};

// ધોરણ મુજબની પરીક્ષાઓ
export const EXAM_OPTIONS = {
  9: [
    { code: 'FIRST', gu: 'પ્રથમ પરીક્ષા', max: 50, pass: 17 },
    { code: 'SECOND', gu: 'દ્વિતીય પરીક્ષા', max: 50, pass: 17 },
    { code: 'INTERNAL', gu: 'આંતરિક ગુણ', max: 20, internal: true },
    { code: 'ANNUAL', gu: 'વાર્ષિક પરીક્ષા', max: 80, pass: 33 },
  ],
  10: [
    { code: 'FIRST', gu: 'પ્રથમ પરીક્ષા', max: 80, pass: 26 },
    { code: 'SECOND', gu: 'દ્વિતીય પરીક્ષા', max: 80, pass: 26 },
    { code: 'INTERNAL', gu: 'આંતરિક ગુણ', max: 20, internal: true },
  ],
};

export const examsFor = (std) => EXAM_OPTIONS[Number(std)] || EXAM_OPTIONS[9];
