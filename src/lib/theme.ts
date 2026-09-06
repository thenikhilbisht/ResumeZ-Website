/**
 * Global Design System Tokens: DEEP INDIGO + ROYAL GOLD LUXURY THEME
 * ResumeZ AI Platform
 */

export const THEME_COLORS = {
  bgPrimary: '#080711',
  bgSecondary: '#0E0C1B',
  surface: '#121025',
  card: '#151329',
  cardHover: '#1B1833',
  elevated: '#1D1938',
  border: '#292344',
  subtleBorder: 'rgba(255, 255, 255, 0.08)',
  
  // Royal Gold Palette
  goldPrimary: '#C6A75E',
  goldHighlight: '#E1C77A',
  goldLight: '#F0DFA8',
  
  // AI Indigo & Purple
  aiIndigo: '#6366A8',
  deepIndigo: '#312E63',
  softPurple: '#7C6BA8',
  
  // Text Colors
  textPrimary: '#F5F1E8', // Ivory
  textSecondary: '#AAA6B7',
  textMuted: '#706C7C',
  
  // Status Colors
  success: '#4F9D69',
  warning: '#C49A4A',
  error: '#A94D4D',
  info: '#6688B5',
};

/**
 * Reusable Score Color utility across the application
 * 90-100: Success (#4F9D69)
 * 75-89: Royal Gold (#C6A75E)
 * 60-74: Warning Amber (#C49A4A)
 * 0-59: Error Crimson (#A94D4D)
 */
export function scoreColor(score: number): string {
  if (score >= 90) return THEME_COLORS.success;
  if (score >= 75) return THEME_COLORS.goldPrimary;
  if (score >= 60) return THEME_COLORS.warning;
  return THEME_COLORS.error;
}

export function scoreStatusText(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Needs Improvement';
  return 'Critical Attention';
}

export function scoreBadgeClass(score: number): string {
  if (score >= 90) return 'bg-[#4F9D69]/15 text-[#4F9D69] border-[#4F9D69]/30';
  if (score >= 75) return 'bg-[#C6A75E]/15 text-[#E1C77A] border-[#C6A75E]/30';
  if (score >= 60) return 'bg-[#C49A4A]/15 text-[#C49A4A] border-[#C49A4A]/30';
  return 'bg-[#A94D4D]/15 text-[#A94D4D] border-[#A94D4D]/30';
}
