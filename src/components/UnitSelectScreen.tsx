import React, { useState, useEffect } from 'react';
import { ExamUnit, LearnerProfile } from '../types';

interface UnitSelectScreenProps {
  student: LearnerProfile;
  units: ExamUnit[];
  onSelectUnit: (unit: ExamUnit) => void;
  onLogout: () => void;
}

export const UnitSelectScreen: React.FC<UnitSelectScreenProps> = ({
  student,
  units,
  onSelectUnit,
  onLogout,
}) => {
  // 교사가 등록(게시)한 단원만 필터링 (isPublished === true)
  const publishedUnits = units.filter((u) => u.isPublished);

  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    publishedUnits[0]?.id || ''
  );

  // publishedUnits가 바뀔 때 선택 단원 갱신
  useEffect(() => {
    if (publishedUnits.length > 0 && !publishedUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(publishedUnits[0].id);
    }
  }, [publishedUnits, selectedUnitId]);

  const selectedUnit = publishedUnits.find((u) => u.id === selectedUnitId) || publishedUnits[0];

  const currentDateFormatted = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());

  const getButtonText = (unit: ExamUnit) => {
    if (unit.status === 'completed') {
      return `${unit.unitNumber}단원 재응시 (오답 복습 및 다시 풀기)`;
    }
    return `${unit.unitNumber}단원 시험 시작하기`;
  };

  return (
    <div className="w-full max-w-[760px] mx-auto px-4 sm:px-6 py-6 sm:py-10 select-none">
      <div className="w-full max-w-[680px] mx-auto flex flex-col gap-6 pb-12">
        {/* Top Identity Card / Student Profile Header */}
        <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0c2340] flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-sm">
              {student.name.slice(0, 1)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[17px] font-bold text-[#0c2340] tracking-tight">
                  {student.name}
                </span>
                {student.englishName && (
                  <span className="text-[13px] text-[#64748b]">({student.englishName})</span>
                )}
                <span className="bg-[#f0f9ff] text-[#0369a1] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#bae6fd]">
                  {student.courseClass || student.gradeClass}
                </span>
                {student.nationality && (
                  <span className="bg-[#f8fafc] text-[#475569] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#e2e8f0]">
                    {student.nationality}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#64748b] mt-0.5">
                학번: {student.studentId} · {student.institution || '대진대학교 국제교류원 한국어교육센터'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1 text-[#64748b] hover:text-[#0c2340] transition-colors text-[12px] font-semibold py-1.5 px-3 rounded-lg hover:bg-[#f1f5f9] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>로그아웃</span>
          </button>
        </div>

        {/* Title & Guidance Header */}
        <div className="flex flex-col gap-1.5 px-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0284c7]/10 text-[#0284c7] text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] animate-pulse" />
              대진대 세종한국어 단어 평가
            </span>
            <span className="text-[12px] text-[#64748b] font-medium">{currentDateFormatted}</span>
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#0c2340] tracking-tight">
            응시할 세종한국어 단원을 선택하세요
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#64748b]">
            선생님께서 등록 및 게시하신 세종한국어 단어 시험 목록입니다. 목표 단원을 선택하여 시험을 시작하세요.
          </p>
        </div>

        {/* Condition: No Published Units by Teacher */}
        {publishedUnits.length === 0 ? (
          <div className="w-full bg-white rounded-2xl p-8 sm:p-12 border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#64748b]">
              <span className="material-symbols-outlined text-[32px]">folder_off</span>
            </div>
            <h3 className="text-[17px] font-bold text-[#0c2340]">
              현재 교사가 등록한 시험 단원이 없습니다
            </h3>
            <p className="text-[13px] text-[#64748b] max-w-md leading-relaxed">
              선생님께서 상단 우측 [교사용 관리] 메뉴에서 세종한국어 단원을 등록하고 [게시하기]를 켜면 여기에 즉시 나타납니다.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0c2340] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                로그인 화면으로 돌아가기
              </button>
            </div>
          </div>
        ) : (
          /* Published Units List */
          <div className="flex flex-col gap-3.5">
            {publishedUnits.map((unit) => {
              const isSelected = selectedUnitId === unit.id;
              const isCompleted = unit.status === 'completed';

              return (
                <div
                  key={unit.id}
                  onClick={() => setSelectedUnitId(unit.id)}
                  className={`group relative cursor-pointer block rounded-2xl transition-all border ${
                    isSelected
                      ? 'bg-white border-[#0284c7] shadow-md -translate-y-0.5 ring-1 ring-[#0284c7]'
                      : isCompleted
                      ? 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                      : 'bg-white border-[#e2e8f0] hover:border-[#94a3b8] hover:shadow-sm'
                  } p-4 sm:p-5 overflow-hidden`}
                >
                  {/* Active Selection Indicator bar on left */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 bg-[#0284c7] transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {unit.status === 'in_progress' ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0284c7]/15 text-[#0284c7] text-[11px] font-bold">
                              <span className="material-symbols-outlined text-[14px]">play_circle</span>
                              진행 중
                            </span>
                            <span className="text-[11px] font-medium text-[#64748b]">교사 등록 단원</span>
                          </>
                        ) : unit.status === 'completed' ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#dcfce7] text-[#15803d] text-[11px] font-bold">
                              <span className="material-symbols-outlined text-[14px] text-[#15803d]">verified</span>
                              응시 완료 · {unit.score ?? 100}점
                            </span>
                            <span className="text-[11px] font-medium text-[#64748b]">오답 복습 가능</span>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#f1f5f9] text-[#0c2340] text-[11px] font-bold">
                              응시 가능
                            </span>
                            <span className="text-[11px] font-medium text-[#64748b]">교사 배정 완료</span>
                          </>
                        )}
                        {unit.level && (
                          <span className="text-[10px] bg-[#f8fafc] text-[#64748b] px-1.5 py-0.5 rounded border border-[#e2e8f0]">
                            {unit.level}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-[17px] font-bold transition-colors ${
                          isSelected
                            ? 'text-[#0c2340]'
                            : isCompleted
                            ? 'text-[#475569]'
                            : 'text-[#0c2340] group-hover:text-[#0284c7]'
                        }`}
                      >
                        {unit.title}
                      </h3>

                      {/* Meta Specification Tags */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[#475569] text-[12px]">
                        {isCompleted ? (
                          <>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px] text-[#64748b]">event_available</span>
                              완료일시: {unit.completedAt || '2026.04.10 14:20'}
                            </span>
                            <span className="flex items-center gap-1 text-[#0284c7] font-semibold">
                              <span className="material-symbols-outlined text-[15px]">refresh</span>
                              재시험 및 오답 복습 가능
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px] text-[#64748b]">format_list_numbered</span>
                              문항 수: <strong>{unit.questionCount}문항</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px] text-[#64748b]">timer</span>
                              제한 시간: <strong>문항당 {unit.timePerQuestionSeconds}초</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px] text-[#64748b]">translate</span>
                              출제 단어: {unit.wordsSummary}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Radio Selection Disc */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 shrink-0 transition-colors shadow-sm ${
                        isSelected
                          ? 'bg-[#0284c7] text-white'
                          : 'bg-[#f1f5f9] text-transparent group-hover:bg-[#e2e8f0]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Exam Precautions Callout Box */}
        {publishedUnits.length > 0 && (
          <div className="w-full bg-[#f8fafc] rounded-2xl p-4 sm:p-5 flex items-start gap-3 border border-[#e2e8f0] shadow-sm">
            <span className="material-symbols-outlined text-[#f59e0b] text-[20px] mt-0.5 shrink-0">
              notifications_active
            </span>
            <div className="flex flex-col gap-1 text-[#0c2340]">
              <span className="text-[13px] font-bold text-[#0c2340]">세종한국어 단어 시험 주의사항</span>
              <p className="text-[12px] sm:text-[13px] text-[#475569] leading-relaxed">
                <strong>[시험 시작하기]</strong>를 누르면 문항별 타이머가 시작됩니다.
                단어의 초성·중성·종성 자모음을 차례대로 결합하여 정답을 완성하세요.
                제출 완료 시 대진대학교 성적 서버로 자동 전송됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Action CTAs */}
        {selectedUnit && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelectUnit(selectedUnit)}
              className="w-full h-[54px] rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white flex items-center justify-center gap-2 font-bold text-[15px] transition-all transform active:translate-y-0.5 shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>{getButtonText(selectedUnit)}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 text-[#64748b] hover:text-[#0c2340] py-2 px-4 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>수강생 로그인 화면으로 돌아가기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

