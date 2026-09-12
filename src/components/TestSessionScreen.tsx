import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExamUnit, QuestionResult, WordItem } from '../types';
import {
  INITIAL_CONSONANTS,
  MEDIAL_VOWELS,
  COMPOUND_VOWELS,
  composeSyllable,
  decomposeSyllable,
} from '../lib/hangul';

interface TestSessionScreenProps {
  unit: ExamUnit;
  onFinishTest: (results: QuestionResult[], totalTimeSpent: number) => void;
  onExit: () => void;
}

const KEYBOARD_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const KEYBOARD_VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ'];

export const TestSessionScreen: React.FC<TestSessionScreenProps> = ({
  unit,
  onFinishTest,
  onExit,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(unit.timePerQuestionSeconds || 45);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  // State of the user's composed syllables for current question
  // Array of string per syllable box, e.g. ['사', '과']
  const currentWordItem: WordItem = unit.words[currentQuestionIndex] || unit.words[0];
  const syllableCount = currentWordItem.word.length;

  const [composedSyllables, setComposedSyllables] = useState<string[]>(() =>
    Array(syllableCount).fill('')
  );
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Time taken on current question
  const questionStartTimeRef = useRef<number>(Date.now());

  // Reset syllable slots when question index changes
  useEffect(() => {
    const count = currentWordItem.word.length;
    setComposedSyllables(Array(count).fill(''));
    setActiveSlotIndex(0);
    setTimeLeft(unit.timePerQuestionSeconds || 45);
    setIsAnswerChecked(false);
    setIsCorrectFeedback(false);
    questionStartTimeRef.current = Date.now();
  }, [currentQuestionIndex, currentWordItem.word]);

  // Overall and question countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalElapsedTime((prev) => prev + 1);

      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired for this question, auto evaluate or skip
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, composedSyllables]);

  const handleTimeExpired = () => {
    if (isAnswerChecked) return;
    handleSubmitAnswer();
  };

  // Pronunciation Audio (Web Speech API)
  const handlePlaySpeech = () => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWordItem.word);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.85;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Phoneme Input Handling
  const handleInputPhoneme = useCallback(
    (phoneme: string) => {
      if (isAnswerChecked) return;

      setComposedSyllables((prev) => {
        const next = [...prev];
        const currentSlotValue = next[activeSlotIndex] || '';
        const targetSyllableDecomp = currentWordItem.syllables[activeSlotIndex];

        // Is phoneme a consonant?
        const isConsonant = KEYBOARD_CONSONANTS.includes(phoneme) || INITIAL_CONSONANTS.includes(phoneme);

        if (isConsonant) {
          if (!currentSlotValue) {
            // Empty slot: put initial consonant
            next[activeSlotIndex] = phoneme;
          } else {
            // Check if slot has a decomposed syllable
            const decomp = decomposeSyllable(currentSlotValue);
            if (!decomp.medial) {
              // Only initial consonant was there: replace with new consonant
              next[activeSlotIndex] = phoneme;
            } else if (!decomp.final) {
              // Has initial + medial (e.g. '사'), let's check if target syllable has a batchim
              if (targetSyllableDecomp && targetSyllableDecomp.final) {
                // Compose with final consonant
                next[activeSlotIndex] = composeSyllable(decomp.initial, decomp.medial, phoneme);
                // If this completed the target syllable with final, move to next slot!
                if (activeSlotIndex < syllableCount - 1) {
                  setActiveSlotIndex(activeSlotIndex + 1);
                }
              } else {
                // Target has no final batchim! This consonant belongs to the next syllable!
                if (activeSlotIndex < syllableCount - 1) {
                  const nextIndex = activeSlotIndex + 1;
                  next[nextIndex] = phoneme;
                  setActiveSlotIndex(nextIndex);
                }
              }
            } else {
              // Has final consonant already, move to next slot
              if (activeSlotIndex < syllableCount - 1) {
                const nextIndex = activeSlotIndex + 1;
                next[nextIndex] = phoneme;
                setActiveSlotIndex(nextIndex);
              }
            }
          }
        } else {
          // Phoneme is a vowel
          if (!currentSlotValue) {
            // No initial consonant: in Korean standard tests, students might type vowel directly or ㅇ is omitted
            // For friendly UX, treat as initial 'ㅇ' or just raw vowel
            next[activeSlotIndex] = phoneme;
          } else {
            const decomp = decomposeSyllable(currentSlotValue);
            if (!decomp.medial) {
              // We had initial consonant (e.g. 'ㅅ' or 'ㄱ'): compose into syllable!
              const composed = composeSyllable(decomp.initial, phoneme);
              next[activeSlotIndex] = composed;

              // If target syllable has NO final consonant (e.g. '사'), advance to next slot!
              if (targetSyllableDecomp && !targetSyllableDecomp.final && activeSlotIndex < syllableCount - 1) {
                setActiveSlotIndex(activeSlotIndex + 1);
              }
            } else if (!decomp.final) {
              // Compound vowel check: e.g. ㅗ + ㅏ -> ㅘ, ㅜ + ㅓ -> ㅝ
              const combinedKey = `${decomp.medial}${phoneme}`;
              if (COMPOUND_VOWELS[combinedKey]) {
                const newCompound = COMPOUND_VOWELS[combinedKey];
                next[activeSlotIndex] = composeSyllable(decomp.initial, newCompound);
                if (targetSyllableDecomp && !targetSyllableDecomp.final && activeSlotIndex < syllableCount - 1) {
                  setActiveSlotIndex(activeSlotIndex + 1);
                }
              }
            }
          }
        }

        return next;
      });
    },
    [activeSlotIndex, currentWordItem, isAnswerChecked, syllableCount]
  );

  // Erase one phoneme (한 음운 지우기)
  const handleBackspace = () => {
    if (isAnswerChecked) return;

    setComposedSyllables((prev) => {
      const next = [...prev];
      const current = next[activeSlotIndex];

      if (current) {
        const decomp = decomposeSyllable(current);
        if (decomp.final) {
          // Remove final consonant
          next[activeSlotIndex] = composeSyllable(decomp.initial, decomp.medial);
        } else if (decomp.medial) {
          // Remove medial vowel, revert to initial consonant
          next[activeSlotIndex] = decomp.initial;
        } else {
          // Remove initial consonant
          next[activeSlotIndex] = '';
        }
      } else if (activeSlotIndex > 0) {
        // Move back to previous slot
        setActiveSlotIndex(activeSlotIndex - 1);
      }
      return next;
    });
  };

  // Clear all
  const handleClearAll = () => {
    if (isAnswerChecked) return;
    setComposedSyllables(Array(syllableCount).fill(''));
    setActiveSlotIndex(0);
  };

  // Keyboard listeners for native input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
      } else {
        const key = e.key;
        if (KEYBOARD_CONSONANTS.includes(key) || KEYBOARD_VOWELS.includes(key)) {
          handleInputPhoneme(key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBackspace, handleInputPhoneme]);

  // Submit Answer & Move Next
  const handleSubmitAnswer = () => {
    const userAnswer = composedSyllables.join('');
    const targetAnswer = currentWordItem.word;
    const isCorrect = userAnswer.trim() === targetAnswer.trim();

    const timeSpentOnQuestion = Math.min(
      unit.timePerQuestionSeconds,
      Math.round((Date.now() - questionStartTimeRef.current) / 1000)
    );

    const questionResult: QuestionResult = {
      questionNumber: currentQuestionIndex + 1,
      word: targetAnswer,
      userAnswer: userAnswer || '(미입력)',
      isCorrect,
      timeSpentSeconds: timeSpentOnQuestion,
      category: currentWordItem.category,
      syllables: currentWordItem.syllables,
    };

    setIsAnswerChecked(true);
    setIsCorrectFeedback(isCorrect);

    // If correct, show momentary celebration state then advance
    setTimeout(() => {
      const nextResults = [...questionResults, questionResult];
      setQuestionResults(nextResults);

      if (currentQuestionIndex + 1 < unit.words.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // Test complete
        const totalDuration = totalElapsedTime + timeSpentOnQuestion;
        onFinishTest(nextResults, totalDuration);
      }
    }, 700);
  };

  const handleSkipQuestion = () => {
    const timeSpentOnQuestion = Math.min(
      unit.timePerQuestionSeconds,
      Math.round((Date.now() - questionStartTimeRef.current) / 1000)
    );

    const questionResult: QuestionResult = {
      questionNumber: currentQuestionIndex + 1,
      word: currentWordItem.word,
      userAnswer: '(건너뜀)',
      isCorrect: false,
      timeSpentSeconds: timeSpentOnQuestion,
      category: currentWordItem.category,
      syllables: currentWordItem.syllables,
    };

    const nextResults = [...questionResults, questionResult];
    setQuestionResults(nextResults);

    if (currentQuestionIndex + 1 < unit.words.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onFinishTest(nextResults, totalElapsedTime + timeSpentOnQuestion);
    }
  };

  const progressPercent = Math.round(((currentQuestionIndex + 1) / unit.words.length) * 100);
  const formattedSeconds = timeLeft < 10 ? `0${timeLeft}` : `${timeLeft}`;

  return (
    <div className="w-full max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8 select-none">
      <div className="flex flex-col w-full">
        {/* Minimal Top Test Status Bar */}
        <div className="w-full flex flex-col gap-2.5 mb-6">
          {/* Fluid Track Progress */}
          <div className="w-full h-1.5 bg-[#e4e2dd] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0e6c4c] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {/* Question Counter Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eae8e3] text-[#1b1c19] rounded-full shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#45464d]">
                단어 평가
              </span>
              <span className="w-1 h-1 rounded-full bg-[#76767e]" />
              <span className="text-[13px] font-bold text-[#171f36]">
                문제 {String(currentQuestionIndex + 1).padStart(2, '0')}{' '}
                <span className="text-[#45464d] font-normal">/ {unit.words.length}</span>
              </span>
            </div>

            {/* Right actions: Timer & Exit */}
            <div className="flex items-center gap-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full shadow-sm ${
                  timeLeft <= 10
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-[#f5f3ee] text-[#171f36]'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      timeLeft <= 10 ? 'bg-red-500' : 'bg-[#0e6c4c]'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      timeLeft <= 10 ? 'bg-red-600' : 'bg-[#0e6c4c]'
                    }`}
                  />
                </span>
                <span className="text-[11px] text-[#45464d] font-medium">남은 시간</span>
                <span className="text-[13px] font-bold tabular-nums">00:{formattedSeconds}</span>
              </div>

              <button
                type="button"
                onClick={onExit}
                title="단원 목록으로 나가기"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#76767e] hover:text-[#171f36] hover:bg-[#eae8e3] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Focus Container */}
        <div className="w-full flex flex-col items-center gap-5">
          {/* AI Illustration Card with Tactile Hanji Aesthetic */}
          <div className="relative w-full max-w-[380px] aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-md border border-[#e2e8f0] flex items-center justify-center group">
            <img
              src={currentWordItem.imageUrl}
              alt={currentWordItem.word}
              className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-105"
            />
            {/* Subtle Visual Scrim for Focus */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c2340]/40 via-transparent to-transparent pointer-events-none" />

            {/* Visual Clue Badge */}
            <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-lg bg-white/90 backdrop-blur-sm text-[#0c2340] text-[11px] font-bold shadow-sm select-none border border-black/5">
              {currentWordItem.category || '세종한국어 어휘'}
            </div>

            {/* Audio Speech Helper Button */}
            <button
              type="button"
              onClick={handlePlaySpeech}
              title="발음 듣기"
              className={`absolute bottom-2.5 left-2.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#0c2340] text-[12px] font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlayingAudio ? 'ring-2 ring-[#0284c7]' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[17px] text-[#0284c7]">
                volume_up
              </span>
              <span>발음 청취</span>
            </button>
          </div>

          {/* Adult Learner Word Helper (English Meaning, Part of Speech, Context Hint) */}
          <div className="w-full max-w-[420px] bg-white rounded-2xl p-3.5 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#f0f9ff] text-[#0284c7] text-[11px] font-bold border border-[#bae6fd]">
                {currentWordItem.partOfSpeech || '명사'}
              </span>
              <span className="text-[14px] font-bold text-[#0c2340]">
                {currentWordItem.englishMeaning || currentWordItem.meaning}
              </span>
            </div>
            {currentWordItem.clueHint && (
              <span className="text-[12px] text-[#64748b]">
                힌트: {currentWordItem.clueHint}
              </span>
            )}
            {currentWordItem.exampleSentence && (
              <div className="text-[11px] text-[#475569] bg-[#f8fafc] px-3 py-1 rounded-lg mt-0.5 border border-[#e2e8f0]">
                예문: <strong>{currentWordItem.exampleSentence}</strong>
              </div>
            )}
          </div>

          {/* Letter Blocks (Answer Syllable Trays) */}
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              {Array.from({ length: syllableCount }).map((_, idx) => {
                const char = composedSyllables[idx] || '';
                const isActive = activeSlotIndex === idx;
                const isFilled = char.length > 0;

                let boxBg = 'bg-white';
                let textColor = 'text-[#0c2340]';
                let borderStyle = 'border border-[#e2e8f0]';

                if (isAnswerChecked && isCorrectFeedback) {
                  boxBg = 'bg-[#15803d] text-white';
                  textColor = 'text-white';
                } else if (isActive) {
                  boxBg = 'bg-[#f0f9ff]';
                  borderStyle = 'border-2 border-[#0284c7] shadow-sm';
                } else if (isFilled) {
                  boxBg = 'bg-white';
                  borderStyle = 'border border-[#94a3b8] shadow-sm';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => setActiveSlotIndex(idx)}
                    className={`relative w-20 h-24 sm:w-24 sm:h-28 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${boxBg} ${borderStyle}`}
                  >
                    <span
                      className={`text-[42px] sm:text-[48px] font-bold leading-none pt-1 ${textColor} ${
                        isActive && !isFilled ? 'animate-pulse text-[#94a3b8]' : ''
                      }`}
                    >
                      {char || (isActive ? '·' : '')}
                    </span>

                    {/* Active underline indicator */}
                    {isActive && (
                      <div className="absolute bottom-3 w-7 h-1 bg-[#0284c7] rounded-full" />
                    )}

                    <span className="absolute bottom-1.5 text-[10px] sm:text-[11px] font-semibold text-[#94a3b8] tracking-wider uppercase">
                      {idx + 1}음절
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Utility Controls */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleBackspace}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#f1f5f9] active:translate-y-0.5 text-[#475569] text-[12px] font-bold transition-all border border-[#e2e8f0] shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">backspace</span>
                <span>한 음운 지우기</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#fee2e2] active:translate-y-0.5 text-[#64748b] hover:text-[#dc2626] text-[12px] font-bold transition-all border border-[#e2e8f0] shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>초기화</span>
              </button>
            </div>
          </div>

          {/* Tactile Hangul Phoneme Keypad Matrix */}
          <div className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-[#e2e8f0] flex flex-col gap-4">
            {/* Consonants Section (자음 14자) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#0c2340] tracking-wider uppercase flex items-center gap-1">
                  <span>자음 (CONSONANTS)</span>
                  <span className="text-[10px] text-[#64748b] font-normal">초성·종성 받침</span>
                </span>
                <span className="text-[11px] font-semibold text-[#64748b]">14자</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {KEYBOARD_CONSONANTS.map((consonant) => (
                  <button
                    key={consonant}
                    type="button"
                    onClick={() => handleInputPhoneme(consonant)}
                    className="h-11 sm:h-12 bg-[#f8fafc] hover:bg-[#e2e8f0] active:bg-[#0c2340] active:text-white rounded-xl text-[20px] sm:text-[22px] font-bold text-[#0c2340] flex items-center justify-center tactile-key cursor-pointer border border-[#e2e8f0] transition-colors"
                  >
                    {consonant}
                  </button>
                ))}
              </div>
            </div>

            {/* Vowels Section (모음 12자) */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#0c2340] tracking-wider uppercase flex items-center gap-1">
                  <span>모음 (VOWELS)</span>
                  <span className="text-[10px] text-[#64748b] font-normal">중성 모음</span>
                </span>
                <span className="text-[11px] font-semibold text-[#64748b]">12자</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {KEYBOARD_VOWELS.map((vowel) => (
                  <button
                    key={vowel}
                    type="button"
                    onClick={() => handleInputPhoneme(vowel)}
                    className="h-11 sm:h-12 bg-[#f8fafc] hover:bg-[#e2e8f0] active:bg-[#0c2340] active:text-white rounded-xl text-[20px] sm:text-[22px] font-bold text-[#0c2340] flex items-center justify-center tactile-key cursor-pointer border border-[#e2e8f0] transition-colors"
                  >
                    {vowel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Actions Deck */}
          <div className="w-full flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleSkipQuestion}
              className="h-12 px-5 rounded-xl bg-white hover:bg-[#f1f5f9] text-[#64748b] font-bold text-[14px] transition-all cursor-pointer border border-[#e2e8f0]"
            >
              건너뛰기
            </button>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              className={`h-12 px-8 flex-1 sm:flex-initial rounded-xl text-white font-bold text-[15px] shadow-md hover:shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isAnswerChecked && isCorrectFeedback
                  ? 'bg-[#15803d]'
                  : 'bg-[#0c2340] hover:bg-[#163a66]'
              }`}
            >
              <span>
                {isAnswerChecked && isCorrectFeedback
                  ? '정답입니다! 다음 문제로'
                  : '정답 확인 및 다음'}
              </span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
