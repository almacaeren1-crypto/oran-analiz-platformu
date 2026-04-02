export function calculatePrediction(homeGoals: number, awayGoals: number) {
  const total = homeGoals + awayGoals;

  let homeWin = 50;
  let draw = 25;
  let awayWin = 25;

  if (homeGoals > awayGoals) {
    homeWin += 20;
    awayWin -= 15;
    draw -= 5;
  } else if (awayGoals > homeGoals) {
    awayWin += 20;
    homeWin -= 15;
    draw -= 5;
  }

  const over25 = total > 2 ? 70 : 30;
  const kgVar = homeGoals > 0 && awayGoals > 0 ? 65 : 25;

  return {
    homeWin: Math.max(homeWin, 0),
    draw: Math.max(draw, 0),
    awayWin: Math.max(awayWin, 0),
    over25,
    kgVar,
  };
}
