export function calculatePrediction(homeGoals: number, awayGoals: number) {

  let homeWin = 33;
  let draw = 34;
  let awayWin = 33;

  const diff = homeGoals - awayGoals;

  if (diff > 0.5) {
    homeWin = 60;
    draw = 25;
    awayWin = 15;
  } else if (diff < -0.5) {
    homeWin = 15;
    draw = 25;
    awayWin = 60;
  } else {
    homeWin = 40;
    draw = 30;
    awayWin = 30;
  }

  const total = homeGoals + awayGoals;

  const over25 = total > 2.5 ? 65 : 35;
  const kgVar = homeGoals > 0.8 && awayGoals > 0.8 ? 60 : 30;

  return {
    homeWin,
    draw,
    awayWin,
    over25,
    kgVar,
  };
}
