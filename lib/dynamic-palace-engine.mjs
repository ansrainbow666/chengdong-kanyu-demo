export function dynamicPalaceLayout({ mode = 'houtian', rotation = 0 } = {}) {
  const numbers = [4,9,2,3,5,7,8,1,6];
  const palaces = ['巽','离','坤','震','中','兑','艮','坎','乾'];
  const trigrams = mode === 'xiantian'
    ? ['兑','乾','巽','离','中','坎','震','坤','艮']
    : palaces;
  return {
    mode: mode === 'xiantian' ? 'xiantian' : 'houtian',
    rotation: ((Number(rotation) % 360) + 360) % 360,
    cells: numbers.map((number, index) => ({ number, palace: palaces[index], trigram: trigrams[index] }))
  };
}
