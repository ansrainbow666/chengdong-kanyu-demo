export function annualCenterStar(year) {
  const value = Number(year);
  if (!Number.isInteger(value)) throw new Error('年份格式不正确');
  return ((10 - (value % 9)) % 9) + 1;
}
export function monthlyCenterStar(year, month) {
  const value = Number(month);
  if (!Number.isInteger(value) || value < 1 || value > 12) throw new Error('月份必须为 1–12');
  return ((annualCenterStar(year) - value + 9) % 9) + 1;
}
