export const colors = {
  // Brand
  teal: '#0D9488',
  tealDark: '#0F766E',
  tealLight: '#CCFBF1',

  // Purple (clinical protocols)
  purple: '#8B5CF6',
  purpleLight: '#F5F3FF',

  // Emerald (nutrition recommended)
  emerald: '#10B981',
  emeraldLight: '#ECFDF5',

  // Red (foods to avoid)
  red: '#EF4444',
  redLight: '#FEF2F2',

  // Amber (warnings, allergies)
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  amberBorder: '#FDE68A',

  // Neutrals
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  white: '#FFFFFF',
} as const

export const spacing = {
  page: { top: 70, bottom: 45, left: 40, right: 40 },
  section: 16,
  small: 6,
  xs: 3,
} as const

export const fontSize = {
  clinicName: 18,
  title: 13,
  sectionHeader: 11,
  heading: 12,
  body: 9,
  small: 8,
  tiny: 7,
} as const
