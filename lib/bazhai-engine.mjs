const DIRECTIONS = [0,45,90,135,180,225,270,315];
const DIRECTION_TO_PALACE = [0,7,2,3,4,1,6,5];
const STARS = ['生气','天医','延年','伏位','绝命','五鬼','六煞','祸害'];
const TABLES = {
  0:[3,5,1,0,2,4,7,6], 1:[5,3,6,4,7,0,2,1],
  2:[1,6,3,2,0,7,4,5], 3:[0,4,2,3,1,5,6,7],
  4:[2,7,0,1,3,6,5,4], 5:[4,0,7,5,6,3,1,2],
  6:[7,2,4,6,5,1,3,0], 7:[6,1,5,7,4,2,0,3]
};

export function calculateBazhaiDemo(facingDegree) {
  const sitting = ((Number(facingDegree) + 180) % 360 + 360) % 360;
  const anchor = DIRECTION_TO_PALACE[Math.round(sitting / 45) % 8];
  const table = TABLES[anchor];
  return DIRECTIONS.map((bearing, index) => ({ bearing, label: `${bearing}°`, star: STARS[table[index]], basis: '通用演示' }));
}
