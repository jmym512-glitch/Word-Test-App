import React, { useState } from 'react';
import { ExamUnit } from '../types';
import { formatDecompositionText } from '../lib/hangul';

interface VocabBookModalProps {
  units: ExamUnit[];
  onClose: () => void;
  onStartUnit: (unit: ExamUnit) => void;
}

export const VocabBookModal: React.FC<VocabBookModalProps> = ({
  units,
  onClose,
  onStartUnit,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const currentUnit = units.find((u) => u.id === selectedUnitId) || units[0];

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
            className="mt-2 px-5 py-2 bg-[#0c2340] text-white text-xs font-bold rounded-xl"
          >
            단원 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 sm:px-6 py-6 sm:py-10 select-none">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0f9ff] text-[#0284c7] text-xs font-bold self-start mb-1 border border-[#bae6fd]">
              <span className="material-symbols-outlined text-[14px]">menu_book</span>
              <span>대진대학교 세종한국어 어휘 카드</span>
            </div>
            <h1 className="text-[24px] font-extrabold text-[#0c2340] tracking-tight">
              단원별 세종한국어 필수 어휘장
            </h1>
            <p className="text-[13px] text-[#64748b]">
              단어의 자모음 결합 구조, 표준 발음 청취 및 실생활 예문을 미리 학습할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onStartUnit(currentUnit)}
            className="h-11 px-5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>이 단원 시험 응시</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Unit Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUnitId(u.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedUnitId === u.id
                  ? 'bg-[#0c2340] text-white shadow-sm'
                  : 'bg-white text-[#475569] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
              }`}
            >
              {u.unitNumber}단원 ({u.words.length}단어)
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentUnit.words.map((item) => {
            const decompStr = formatDecompositionText(item.syllables);
            const isPlaying = playingWord === item.word;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f8fafc] shrink-0 border border-[#e2e8f0]">
                    <img
                      src={item.imageUrl}
                      alt={item.word}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-[20px] font-extrabold text-[#0c2340]">{item.word}</h3>
                        {item.partOfSpeech && (
                          <span className="text-[10px] bg-[#f0f9ff] text-[#0284c7] font-bold px-1.5 py-0.5 rounded border border-[#bae6fd]">
                            {item.partOfSpeech}
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
                      <span className="text-[11px] text-[#64748b] mt-1 bg-[#f8fafc] p-1.5 rounded-lg border border-[#e2e8f0] line-clamp-2">
                        {item.exampleSentence}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phoneme breakdown tag */}
                <div className="bg-[#f8fafc] rounded-xl p-2.5 text-[11px] text-[#475569] font-mono border border-[#e2e8f0] flex items-center justify-between">
                  <span>자모 결합: {decompStr}</span>
                  <span className="text-[10px] text-[#94a3b8] font-sans">
                    {item.syllables.length}음절
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

