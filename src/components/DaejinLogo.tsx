import React from 'react';
import daejinLogoImg from '../assets/daejin_logo.png';

interface DaejinLogoProps {
  className?: string;
  size?: number;
}

/**
 * 대진대학교 공식 심볼마크 로고
 * 사용자 제공 공식 로고 이미지 (전통 한옥 건물 문양 & DAEJIN UNIVERSITY & 대진대학교)
 */
export const DaejinLogo: React.FC<DaejinLogoProps> = ({
  className = 'w-14 h-14',
  size,
}) => {
  return (
    <img
      src={daejinLogoImg}
      alt="대진대학교 로고 (Daejin University Logo)"
      style={size ? { width: size, height: size } : undefined}
      className={`${className} object-contain shrink-0 select-none`}
      loading="eager"
    />
  );
};
