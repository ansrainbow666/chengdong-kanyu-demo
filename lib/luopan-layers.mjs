export const HEAVENLY_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
export const HEXAGRAM_SEQUENCE = Array.from({ length: 64 }, (_, index) => String.fromCodePoint(0x4dc0 + index));
export const FENJIN_LABELS = Array.from({ length: 48 }, (_, index) => `${index * 7.5}°`);

export function ringsForMode(mode) {
  const comprehensive = mode === 'comprehensive';
  return { showBranches: comprehensive, showStems: comprehensive, showHexagrams: comprehensive, showFenjin: comprehensive };
}
