import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ExamUnit, QuestionResult, WordItem } from '../types';
import { VOCAB_IMAGES, formatPartOfSpeech, getWordDisplayImage } from '../data/defaultUnits';
import { generateQuizBlocks, QuizBlock } from '../utils/quizDistractors';

interface TestSessionScreenProps {
  unit: ExamUnit;
  onFinishTest: (results: QuestionResult[], totalTimeSpent: number) => void;
  onExit: () => void;
}

export const TestSessionScreen: React.FC<TestSessionScreenProps> = ({
  unit,
  onFinishTest,
  onExit,
}) => {
  // 컨닝 방지: 학생이 시험을 시작할 때마다 단어 순서를 무작위로 셔플하고, 최대 10문항만 추출
  const shuffledWords = useMemo<WordItem[]>(() => {
    const list = [...unit.words];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    // 어휘 풀 중 최대 10문항만 무작위 추출하여 출제
    return list.slice(0, Math.min(10, list.length));
  }, [unit.id, unit.words]);

  const totalSectionSeconds = (unit.totalTimeLimitMinutes || 10) * 60;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(totalSectionSeconds);
  const [totalElapsedTime, setTotalElapsedTime] = useState<number>(0);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  const currentWordItem: WordItem = shuffledWords[currentQuestionIndex] || shuffledWords[0];
  const targetWord = currentWordItem.word;

  // 현재 문항의 힌트 블록 및 선택 상태
  const [quizBlocks, setQuizBlocks] = useState<QuizBlock[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState<string>('');

  // 채점 피드백 상태
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean>(false);

  // 문항 풀이 소요 시간
  const questionStartTimeRef = useRef<number>(Date.now());
  const isFinishedRef = useRef<boolean>(false);

  const currentQuestionIndexRef = useRef<number>(currentQuestionIndex);
  currentQuestionIndexRef.current = currentQuestionIndex;
  const currentWordItemRef = useRef<WordItem>(currentWordItem);
  currentWordItemRef.current = currentWordItem;
  const typedAnswerRef = useRef<string>(typedAnswer);
  typedAnswerRef.current = typedAnswer;
  const questionResultsRef = useRef<QuestionResult[]>(questionResults);
  questionResultsRef.current = questionResults;

  // 문항이 변경될 때마다 힌트 블록 새로 생성 및 상태 초기화
  useEffect(() => {
    const allWordStrings = shuffledWords.map((w) => w.word);
    const blocks = generateQuizBlocks(targetWord, allWordStrings);
    setQuizBlocks(blocks);
    setSelectedBlockIds([]);
    setTypedAnswer('');
    setIsAnswerChecked(false);
    setIsCorrectFeedback(false);
    questionStartTimeRef.current = Date.now();
  }, [currentQuestionIndex, targetWord, shuffledWords]);

  // 지속형 섹션 타이머 (문제가 넘어가도 누적 차감)
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalElapsedTime((prev) => prev + 1);

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isFinishedRef.current) {
            isFinishedRef.current = true;
            handleTotalTimeExpired();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 총 시간 초과 시 자동 채점 및 종료
  const handleTotalTimeExpired = () => {
    const currIdx = currentQuestionIndexRef.current;
    const currWord = currentWordItemRef.current;
    const userAns = typedAnswerRef.current.trim();
    const isCorrect = userAns === currWord.word.trim();

    const currResult: QuestionResult = {
      questionNumber: currIdx + 1,
      word: currWord.word,
      userAnswer: userAns || '(시간 초과)',
      isCorrect,
      timeSpentSeconds: Math.round((Date.now() - questionStartTimeRef.current) / 1000),
      category: currWord.category,
      syllables: currWord.syllables,
    };

    const remainingResults: QuestionResult[] = [];
    for (let i = currIdx + 1; i < shuffledWords.length; i++) {
      const w = shuffledWords[i];
      remainingResults.push({
        questionNumber: i + 1,
        word: w.word,
        userAnswer: '(시간 초과 미응시)',
        isCorrect: false,
        timeSpentSeconds: 0,
        category: w.category,
        syllables: w.syllables,
      });
    }

    const finalResults = [...questionResultsRef.current, currResult, ...remainingResults];
    alert('시험 제한 시간이 모두 경과했습니다. 현재까지 작성된 답안으로 자동 제출됩니다.');
    onFinishTest(finalResults, totalSectionSeconds);
  };

  // 힌트 블록 선택
  const handleSelectBlock = useCallback(
    (block: QuizBlock) => {
      if (isAnswerChecked) return;
      if (selectedBlockIds.includes(block.id)) return;
      if (typedAnswer.length >= targetWord.length) return;

      setSelectedBlockIds((prev) => [...prev, block.id]);
      setTypedAnswer((prev) => prev + block.char);
    },
    [isAnswerChecked, selectedBlockIds, typedAnswer.length, targetWord.length]
  );

  // 한 글자 지우기 (백스페이스)
  const handleBackspace = useCallback(() => {
    if (isAnswerChecked || typedAnswer.length === 0) return;
    setSelectedBlockIds((prev) => prev.slice(0, -1));
    setTypedAnswer((prev) => prev.slice(0, -1));
  }, [isAnswerChecked, typedAnswer.length]);

  // 전체 지우기
  const handleClearAll = useCallback(() => {
    if (isAnswerChecked) return;
    setSelectedBlockIds([]);
    setTypedAnswer('');
  }, [isAnswerChecked]);

  // 답안 제출 및 다음 문항 진행
  const handleCheckAnswer = useCallback(() => {
    if (isAnswerChecked || typedAnswer.trim().length === 0) return;

    const isCorrect = typedAnswer.trim() === targetWord.trim();
    setIsAnswerChecked(true);
    setIsCorrectFeedback(isCorrect);

    const timeSpentOnQuestion = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));

    const result: QuestionResult = {
      questionNumber: currentQuestionIndex + 1,
      word: currentWordItem.word,
      userAnswer: typedAnswer.trim(),
      isCorrect,
      timeSpentSeconds: timeSpentOnQuestion,
      category: currentWordItem.category,
      syllables: currentWordItem.syllables,
    };

    const nextResults = [...questionResults, result];
    setQuestionResults(nextResults);

    // 0.8초 후 다음 문항 또는 결과 화면으로 전환
    setTimeout(() => {
      if (currentQuestionIndex < shuffledWords.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        isFinishedRef.current = true;
        onFinishTest(nextResults, totalElapsedTime + timeSpentOnQuestion);
      }
    }, 850);
  }, [
    isAnswerChecked,
    typedAnswer,
    targetWord,
    currentQuestionIndex,
    currentWordItem,
    questionResults,
    shuffledWords.length,
    onFinishTest,
    totalElapsedTime,
  ]);

  // 물리 키보드 단축키 지원 (Backspace로 지우기, Enter로 제출)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswerChecked) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (typedAnswer.trim().length > 0) {
          handleCheckAnswer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typedAnswer, isAnswerChecked, handleBackspace, handleCheckAnswer]);

  const progressPercent = Math.round(((currentQuestionIndex + 1) / shuffledWords.length) * 100);
  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;
  const formattedTime = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;

  const displayImageUrl = getWordDisplayImage(currentWordItem.word, currentWordItem.imageUrl);
  const displayPartOfSpeech = formatPartOfSpeech(currentWordItem.partOfSpeech);
  const displayEnglishMeaning = currentWordItem.englishMeaning || currentWordItem.meaning.split('·')[0].trim();

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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eae8e3] text-[#1b1c19] rounded-full shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#45464d]">
                Stage {unit.unitNumber || 1}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#76767e]" />
              <span className="text-[13px] font-bold text-[#171f36]">
                문항 {currentQuestionIndex + 1} / {shuffledWords.length}
              </span>
            </div>

            {/* Right actions: Timer & Exit */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[13px] font-bold tracking-tight shadow-xs border transition-colors ${
                  timeLeft <= 60
                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                    : 'bg-[#f4f3ef] text-[#1b1c19] border-[#e2e0d8]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-[#0e6c4c]">
                  timer
                </span>
                <span>{formattedTime}</span>
              </div>

              <button
                type="button"
                onClick={onExit}
                title="시험 종료 및 단원 선택으로 돌아가기"
                className="w-8 h-8 rounded-full bg-[#f4f3ef] hover:bg-[#e4e2dd] border border-[#e2e0d8] text-[#5e5e66] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. 단서 카드 (Clue Card: 품사 + 영문 의미 + 글자 수 + 직관적 이미지) */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="w-full max-w-[440px] bg-white rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm flex flex-col items-center gap-3">
            {/* Top Bar: 품사 뱃지 & 영문 의미 + 글자 수 */}
            <div className="w-full flex items-center justify-between px-1">
              <span className="px-3.5 py-1.5 rounded-full bg-[#f0f9ff] text-[#0284c7] text-[13.5px] sm:text-[14px] font-black border border-[#bae6fd] tracking-tight shadow-2xs">
                {displayPartOfSpeech}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[16px] sm:text-[17px] font-black text-[#0c2340] tracking-tight">
                  Meaning: <span className="text-[#0284c7]">{displayEnglishMeaning}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] text-xs font-extrabold border border-[#e2e8f0]">
                  {targetWord.length}글자
                </span>
              </div>
            </div>

            {/* Intuitive Image Card (4:3 비율 고화질 일러스트) */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center group shadow-2xs">
              <img
                src={displayImageUrl}
                alt={displayEnglishMeaning}
                className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
            </div>
          </div>

          {/* 2. 답안 입력 트레이 (단어를 입력하세요) */}
          <div className="w-full max-w-[440px] mt-1">
            <div
              className={`w-full h-16 sm:h-18 rounded-2xl border-2 flex items-center justify-center px-4 transition-all ${
                isAnswerChecked
                  ? isCorrectFeedback
                    ? 'border-[#15803d] bg-[#f0fdf4] text-[#15803d]'
                    : 'border-[#dc2626] bg-red-50 text-[#dc2626]'
                  : typedAnswer.length > 0
                  ? 'border-[#0e6c4c] bg-white shadow-sm'
                  : 'border-[#38bdf8] bg-white/80'
              }`}
            >
              {typedAnswer.length === 0 ? (
                <span className="text-[#94a3b8] text-sm sm:text-base font-semibold">
                  단어를 입력하세요 (예: {targetWord.length}글자)
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2 tracking-widest">
                  {typedAnswer.split('').map((char, idx) => (
                    <span
                      key={idx}
                      onClick={handleBackspace}
                      title="클릭하여 마지막 글자 지우기"
                      className="text-2xl sm:text-3xl font-black text-[#0c2340] cursor-pointer hover:text-red-500 transition-colors"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. 힌트 글자 블록 영역 (터치하여 입력 & 지우기) */}
          <div className="w-full max-w-[440px] mt-2 flex flex-col gap-2.5">
            {/* Header: 라벨 & 지우기 버튼 */}
            <div className="w-full flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#64748b]">
                <span className="material-symbols-outlined text-[16px] text-[#0284c7]">
                  touch_app
                </span>
                <span>힌트 글자 블록 (터치하여 입력)</span>
              </div>

              <div className="flex items-center gap-2">
                {typedAnswer.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-[#94a3b8] hover:text-[#475569] font-semibold transition-colors cursor-pointer"
                  >
                    전체삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={typedAnswer.length === 0 || isAnswerChecked}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    typedAnswer.length > 0 && !isAnswerChecked
                      ? 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0c2340]'
                      : 'opacity-40 cursor-not-allowed text-[#94a3b8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">backspace</span>
                  <span>지우기</span>
                </button>
              </div>
            </div>

            {/* Interactive Syllable Blocks Flex / Grid */}
            <div className="w-full flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
              {quizBlocks.map((block) => {
                const isSelected = selectedBlockIds.includes(block.id);
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => handleSelectBlock(block)}
                    disabled={isSelected || isAnswerChecked}
                    className={`min-w-[56px] h-14 sm:min-w-[62px] sm:h-16 px-3 rounded-2xl font-black text-xl sm:text-2xl transition-all shadow-xs cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'opacity-25 bg-[#e2e8f0] text-[#94a3b8] border-2 border-dashed border-[#cbd5e1] scale-95 cursor-not-allowed'
                        : 'bg-white border-2 border-[#e2e8f0] hover:border-[#0284c7] hover:shadow-md active:scale-95 text-[#0c2340]'
                    }`}
                  >
                    {block.char}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 하단 Check 채점 버튼 (레퍼런스 스타일) */}
          <div className="w-full max-w-[440px] flex items-center justify-end mt-1">
            <button
              type="button"
              onClick={handleCheckAnswer}
              disabled={typedAnswer.trim().length === 0 || isAnswerChecked}
              className={`px-8 py-3 rounded-2xl font-extrabold text-sm sm:text-base flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                typedAnswer.trim().length > 0 && !isAnswerChecked
                  ? 'bg-[#0e6c4c] hover:bg-[#0b543b] text-white active:scale-95 shadow-md'
                  : 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
              }`}
            >
              <span>Check</span>
              <span className="material-symbols-outlined text-[18px]">check</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
