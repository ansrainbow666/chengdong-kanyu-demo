import { generateDemoReport } from '../lib/judgment-rules.mjs';
import { calculateFlyingStarResult } from '../lib/flying-star-engine.mjs';
import { interpretDemoResult } from '../lib/demo-interpretation-rules.mjs';

export function buildReviewLink({ baseUrl }) {
  return baseUrl;
}

export function mountReport({ root, state }) {
  const report = generateDemoReport(state);
  let flying = null;
  try {
    flying = interpretDemoResult(calculateFlyingStarResult({ buildYear: Number(state.buildYear), facingDegree: state.houseBearing, targetYear: state.flyingStarInput.targetYear, targetMonth: state.flyingStarInput.targetMonth }));
  } catch {}
  root.innerHTML = `
    <article class="report-card" aria-labelledby="report-title">
      <header class="report-header"><p class="eyebrow">PRELIMINARY REPORT</p><h2 id="report-title">澄东堪舆·初步报告</h2><p>${report.summary}</p><span>${report.disclaimer}</span></header>
      <section class="report-section"><h3>本次推演依据</h3><ul class="basis-tags">${report.basis.map(item => `<li>${item}</li>`).join('')}</ul></section>
      <section class="report-section"><h3>初步观察</h3><div class="finding-grid">${report.findings.map((item, index) => `<article class="finding"><span>0${index + 1}</span><div><h4>${item.title}</h4><p>${item.detail}</p><small>${item.status}</small></div></article>`).join('')}</div></section>
      <section class="report-section missing-section"><h3>尚需补充</h3><ul>${report.missing.map(item => `<li>${item}</li>`).join('')}</ul></section>
      ${flying ? `<section class="report-section flying-star-section"><p class="eyebrow">GENERAL DEMO V1</p><h3>玄空飞星 · 运盘／山盘／向盘</h3><p>流年与流月九星已按通用演示口径落入九宫。</p><div class="flying-grid">${flying.palaces.map(item => `<article><strong>${item.name}宫</strong><span>山 ${item.mountain} · 向 ${item.water} · 运 ${item.period}</span><span>流年 ${item.annual} · 流月 ${item.monthly}</span><small>${item.note}</small></article>`).join('')}</div><p class="report-disclaimer">${flying.disclaimer}</p></section>` : '<section class="report-section"><h3>玄空飞星</h3><p>补全建造／大修年份与宅向后生成三盘、流年和流月九宫。</p></section>'}
      <section id="review" class="expert-card">
        <img src="./assets/chengdong-avatar.jpg" alt="澄东先生">
        <div><p class="eyebrow">PROFESSIONAL REVIEW</p><h3>申请澄东先生复核</h3><p>${report.reviewAdvice}</p></div>
        <a class="primary-button" href="${buildReviewLink({ baseUrl: '#review', project: state })}">查看复核所需资料</a>
      </section>
      <footer class="report-disclaimer"><strong>${report.disclaimer}</strong><p>结果属传统文化与空间信息整理参考，不替代建筑、结构、消防、健康等专业意见。</p></footer>
    </article>`;
}
