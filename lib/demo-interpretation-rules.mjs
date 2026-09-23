const STAR_TONE = { 1:'关注人缘与流动机会',2:'关注健康与承重空间',3:'关注争执与沟通',4:'关注学习与文书',5:'重要位置建议重点复核',6:'关注权责与执行',7:'关注口舌与金属安全',8:'关注稳定与积累',9:'关注喜庆、传播与显现' };
export function interpretDemoResult(result) {
  return { strategyVersion: result.strategyVersion, disclaimer: '当前为通用规则 Demo，仅供产品沟通；正式判断须由澄东先生结合现场与门派规则复核。', palaces: result.palaces.map(item => ({ ...item, note: STAR_TONE[item.annual] })) };
}
