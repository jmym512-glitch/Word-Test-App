import React, { useState, useEffect } from 'react';
import { ExamUnit, CourseCategory, LearnerProfile } from '../types';
import {
  formatPartOfSpeech,
  getWordDisplayImage,
} from '../data/defaultUnits';

interface VocabBookModalProps {
  units: ExamUnit[];
  onClose: () => void;
  onStartUnit: (unit: ExamUnit) => void;
  onUpdateWordImage?: (word: string, newImageUrl: string) => void;
  student?: LearnerProfile | null;
}

const CATEGORY_TABS: (CourseCategory | '전체')[] = [
  '전체',
  '1A 한국어',
  '1B 한국어',
  '2A 한국어',
  '2B 한국어',
];

export const VocabBookModal: React.FC<VocabBookModalProps> = ({
  units,
  onClose,
  onStartUnit,
  student,
}) => {
  const initialCategory: CourseCategory | '전체' =
    student?.courseClass && CATEGORY_TABS.includes(student.courseClass as any)
      ? (student.courseClass as CourseCategory)
      : '전체';

  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | '전체'>(initialCategory);

  useEffect(() => {
    if (student?.courseClass && CATEGORY_TABS.includes(student.courseClass as any)) {
      setSelectedCategory(student.courseClass as CourseCategory);
    }
  }, [student?.courseClass]);

  // 대분류 카테고리로 필터링된 단원 목록
  const filteredUnits = units.filter((u) => {
    if (selectedCategory === '전체') return true;
    return (u.category || '1A 한국어') === selectedCategory;
  });

  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    filteredUnits[0]?.id || units[0]?.id || ''
  );
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const currentUnit =
    filteredUnits.find((u) => u.id === selectedUnitId) ||
    filteredUnits[0] ||
    units.find((u) => u.id === selectedUnitId) ||
    units[0];

  const handlePlayAudio = (word: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.85;
      setPlayingWord(word);
      utterance.onend = () => setPlayingWord(null);
      utterance.onerror = () => setPlayingWord(null);
      window.speechSynthesis.speak(utterance);
    } catch {
      setPlayingWord(null);
    }
  };

  if (!currentUnit || units.length === 0) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 py-12 text-center select-none">
        <div className="bg-white rounded-3xl p-8 border border-[#e2e8f0] shadow-sm flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b]">
            <span className="material-symbols-outlined text-[30px]">menu_book</span>
          </div>
          <h3 className="text-lg font-bold text-[#0c2340]">등록된 세종한국어 단어장이 없습니다</h3>
          <p className="text-xs text-[#64748b]">
            선생님께서 시험 단원을 등록하고 [게시하기]를 켜면 단어장에 어휘가 표시됩니다.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 px-5 py-2 bg-[#0c2340] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            단원 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[860px] mx-auto px-4 sm:px-6 py-6 sm:py-10 select-none relative">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0f9ff] text-[#0284c7] text-xs font-bold self-start mb-1 border border-[#bae6fd]">
              <span className="material-symbols-outlined text-[14px]">menu_book</span>
              <span>대진대학교 세종한국어 표준 어휘장</span>
            </div>
            <h1 className="text-[24px] font-extrabold text-[#0c2340] tracking-tight">
              단원별 세종한국어 필수 어휘장
            </h1>
            <p className="text-[13px] text-[#64748b]">
              단원별 핵심 어휘, 품사, 의미 및 발음을 확인하고 예문과 함께 효과적으로 학습하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onStartUnit(currentUnit)}
            className="h-11 px-5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span>이 단원 시험 응시</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab === '전체'
                ? units.length
                : units.filter((u) => (u.category || '1A 한국어') === tab).length;
            const isTabActive = selectedCategory === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab);
                  const firstOfCategory = units.find((u) =>
                    tab === '전체' ? true : (u.category || '1A 한국어') === tab
                  );
                  if (firstOfCategory) setSelectedUnitId(firstOfCategory.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isTabActive
                    ? 'bg-[#0c2340] text-white shadow-sm'
                    : 'bg-white text-[#475569] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isTabActive ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}
                >
                  {count}개 시험
                </span>
              </button>
            );
          })}
        </div>

        {/* Unit Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filteredUnits.length === 0 ? (
            <div className="text-xs text-[#64748b] py-2">
              [{selectedCategory}] 과정에 등록된 단원이 없습니다.
            </div>
          ) : (
            filteredUnits.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUnitId(u.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  currentUnit.id === u.id
                    ? 'bg-[#0284c7] text-white shadow-sm'
                    : 'bg-white text-[#475569] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
                }`}
              >
                <span>{u.title}</span>
                <span className="text-[10px] opacity-80">({u.words.length}단어)</span>
              </button>
            ))
          )}
        </div>

        {/* Vocabulary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentUnit.words.map((item) => {
            const isPlaying = playingWord === item.word;
            const displayImg = getWordDisplayImage(item.word, item.imageUrl);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-22 h-22 rounded-xl overflow-hidden bg-[#f8fafc] shrink-0 border border-[#e2e8f0] relative">
                    <img
                      src={displayImg}
                      alt={item.word}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[20px] font-extrabold text-[#0c2340]">{item.word}</h3>
                        {item.partOfSpeech && (
                          <span className="text-[11px] bg-[#f0f9ff] text-[#0284c7] font-black px-2 py-0.5 rounded-full border border-[#bae6fd]">
                            {formatPartOfSpeech(item.partOfSpeech)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayAudio(item.word)}
                        title="발음 듣기"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isPlaying
                            ? 'bg-[#0284c7] text-white'
                            : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0c2340]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">volume_up</span>
                      </button>
                    </div>

                    <p className="text-xs text-[#475569] font-semibold mt-0.5 line-clamp-1">
                      {item.englishMeaning || item.meaning}
                    </p>

                    {item.romanization && (
                      <span className="text-[11px] text-[#0284c7] font-mono mt-0.5">
                        [{item.romanization}]
                      </span>
                    )}

                    {item.exampleSentence && (
                      <span className="text-[11px] text-[#64748b] mt-1.5 bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0] line-clamp-2 leading-relaxed">
                        {item.exampleSentence}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
