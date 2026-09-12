import { SyllableDecomposition } from '../types';

export const INITIAL_CONSONANTS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

export const MEDIAL_VOWELS = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

export const FINAL_CONSONANTS = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// Map compound vowels from sequential inputs
export const COMPOUND_VOWELS: Record<string, string> = {
  'ㅗㅏ': 'ㅘ',
  'ㅗㅐ': 'ㅙ',
  'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ',
  'ㅜㅔ': 'ㅞ',
  'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ',
};

// Map compound finals from sequential consonant inputs
export const COMPOUND_FINALS: Record<string, string> = {
  'ㄱㅅ': 'ㄳ',
  'ㄴㅈ': 'ㄵ',
  'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ',
  'ㄹㅁ': 'ㄻ',
  'ㄹㅂ': 'ㄼ',
  'ㄹㅅ': 'ㄽ',
  'ㄹㅌ': 'ㄾ',
  'ㄹㅍ': 'ㄿ',
  'ㄹㅎ': 'ㅀ',
  'ㅂㅅ': 'ㅄ',
};

/**
 * Check if character is a complete Korean syllable (가~힣)
 */
export function isHangulSyllable(char: string): boolean {
  if (!char || char.length === 0) return false;
  const code = char.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

/**
 * Decomposes a single Korean syllable into initial (초성), medial (중성), and final (종성)
 */
export function decomposeSyllable(char: string): SyllableDecomposition {
  if (!isHangulSyllable(char)) {
    return {
      syllable: char,
      initial: char,
      medial: '',
      final: undefined,
    };
  }

  const code = char.charCodeAt(0) - 0xAC00;
  const initialIndex = Math.floor(code / (21 * 28));
  const medialIndex = Math.floor((code % (21 * 28)) / 28);
  const finalIndex = code % 28;

  const initial = INITIAL_CONSONANTS[initialIndex];
  const medial = MEDIAL_VOWELS[medialIndex];
  const final = finalIndex > 0 ? FINAL_CONSONANTS[finalIndex] : undefined;

  return {
    syllable: char,
    initial,
    medial,
    final,
  };
}

/**
 * Decomposes an entire word into syllable breakdowns
 */
export function decomposeWord(word: string): SyllableDecomposition[] {
  return Array.from(word).map(char => decomposeSyllable(char));
}

/**
 * Composes initial, medial, and optional final consonants into a single syllable
 */
export function composeSyllable(initial: string, medial: string, final?: string): string {
  const iIdx = INITIAL_CONSONANTS.indexOf(initial);
  const mIdx = MEDIAL_VOWELS.indexOf(medial);
  const fIdx = final ? FINAL_CONSONANTS.indexOf(final) : 0;

  if (iIdx === -1 || mIdx === -1) {
    return initial + medial + (final || '');
  }

  const code = 0xAC00 + (iIdx * 21 + mIdx) * 28 + (fIdx >= 0 ? fIdx : 0);
  return String.fromCharCode(code);
}

/**
 * Formats syllable decomposition into human readable description
 * e.g., "초성(ㅅ)+중성(ㅏ) · 초성(ㄱ)+중성(ㅘ)"
 */
export function formatDecompositionText(syllables: SyllableDecomposition[]): string {
  return syllables
    .map(s => {
      let text = `초성(${s.initial})+중성(${s.medial})`;
      if (s.final) {
        text += `+종성(${s.final})`;
      }
      return text;
    })
    .join(' · ');
}

/**
 * Formats simple slash separated phonemes for preview
 * e.g. "ㅅ, ㅏ / ㄱ, ㅘ"
 */
export function formatPhonemeList(syllables: SyllableDecomposition[]): string {
  return syllables
    .map(s => {
      const parts = [s.initial, s.medial];
      if (s.final) parts.push(s.final);
      return parts.join(', ');
    })
    .join(' / ');
}
