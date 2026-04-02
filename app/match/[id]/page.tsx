import { calculatePrediction } from "@/lib/predictor";

const API_BASE = "https://v3.football.api-sports.io";

async function apiFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY || "",
    },
    cache: "no-store",
  });

  const data = await res.json();
  return data.response || [];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function teamFormScore(matches: any[], teamId: number) {
  let points = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let overCount = 0;
  let bttsCount = 0;

  for (const match of matches) {
    const isHome = match.teams.home.id === teamId;
    const gf = isHome ? match.goals.home ?? 0 : match.goals.away ?? 0;
    const ga = isHome ? match.goals.away ?? 0 : match.goals.home ?? 0;

    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) points += 3;
    else if (gf === ga) points += 1;

    if ((match.goals.home ?? 0) + (match.goals.away ?? 0) > 2) overCount += 1;
    if ((match.goals.home ?? 0) > 0 && (match.goals.away ?? 0) > 0) bttsCount += 1;
  }

  return {
    points,
    avgFor: matches.length ? goalsFor / matches.length : 0,
    avgAgainst: matches.length ? goalsAgainst / matches.length : 0,
    overRate: matches.length ? overCount / matches.length : 0,
    bttsRate: matches.length ? bttsCount / matches.length : 0,
  };
}

function makePrematchPrediction(homeStats: any, awayStats: any) {
  const homePower =
    homeStats.points * 1.8 +
    homeStats.avgFor * 2.4 -
    homeStats.avgAgainst * 1.2 +
    1.5;

  const awayPower =
    awayStats.points * 1.8 +
    awayStats.avgFor * 2.4 -
    awayStats.avgAgainst * 1.2;

  const rawTotal = Math.max(homePower + awayPower, 1);

  let homeWin = (homePower / rawTotal) * 100;
  let awayWin = (awayPower / rawTotal) * 100;

  const gap = Math.abs(homePower - awayPower);
  let draw = clamp(30 - gap * 2.5, 18, 30);

  const remain = 100 - draw;
  const ratio = Math.max(homeWin + awayWin, 1);

  homeWin = (homeWin / ratio) * remain;
  awayWin = (awayWin / ratio) * remain;

  const over25 = clamp(
    ((homeStats.overRate + awayStats.overRate) / 2) * 100,
    25,
    80
  );

  const kgVar = clamp(
    ((homeStats.bttsRate + awayStats.bttsRate) / 2) * 100,
    20,
    75
  );

  return {
    homeWin: Math.round(homeWin),
    draw: Math.round(draw),
    awayWin: Math.round(awayWin),
    over25: Math.round(over25),
    kgVar: Math.round(kgVar),
  };
}

export default async function MatchDetailPage({ params }: any) {
  const matchId = params.id;

  const matchResponse = await apiFetch(`/fixtures?id=${matchId}`);
  const match = matchResponse[0];

  if (!match) {
    return <div className="p-6 text-red-500">Maç bulunamadı</div>;
  }

  const homeGoals = match.goals.home || 0;
  const awayGoals = match.goals.away || 0;
  const status = match.fixture.status.short;

  let prediction = calculatePrediction(homeGoals, awayGoals);
  let yorum = "Maç dengede gidiyor.";
  let extraInfo = "";

  if (status === "NS") {
    const [homeLast, awayLast] = await Promise.all([
      apiFetch(`/fixtures?team=${match.teams.home.id}&last=5`),
      apiFetch(`/fixtures?team=${match.teams.away.id}&last=5`),
    ]);

    const homeStats = teamFormScore(homeLast, match.teams.home.id);
    const awayStats = teamFormScore(awayLast, match.teams.away.id);

    prediction = makePrematchPrediction(homeStats, awayStats);

    if (prediction.homeWin > prediction.awayWin + 12) {
      yorum = "Ev sahibi form avantajıyla maça bir adım önde başlıyor.";
    } else if (prediction.awayWin > prediction.homeWin + 12) {
      yorum = "Deplasman ekibi son form verilerine göre daha güçlü görünüyor.";
    } else {
      yorum = "Taraf bahsi dengeli görünüyor, beraberlik riski dikkat çekiyor.";
    }

    extraInfo = `Ev sahibi son 5 maç puanı: ${homeStats.points} | Deplasman son 5 maç puanı: ${awayStats.points}`;
  } else {
    if (homeGoals > awayGoals) {
      yorum = "Ev sahibi daha baskın oynuyor.";
    } else if (awayGoals > homeGoals) {
      yorum = "Deplasman daha etkili.";
    } else {
      yorum = "Maç dengede gidiyor.";
    }

    extraInfo = `Canlı/oynanmış maç modu aktif.`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-2">
        {match.teams.home.name} vs {match.teams.away.name}
      </h1>

      <p>Lig: {match.league.name}</p>
      <p>Skor: {homeGoals} - {awayGoals}</p>
      <p>Durum: {match.fixture.status.long}</p>

      <div className="mt-6 p-4 rounded-xl bg-slate-800">
        <h2 className="text-green-400 mb-2">Maç Analizi</h2>
        <p>{yorum}</p>
        <p className="mt-2 text-sm text-slate-400">{extraInfo}</p>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-slate-800">
        <h2 className="text-green-400 mb-2">Yapay Tahmin Motoru</h2>

        <div className="flex justify-between">
          <span>MS1 %{prediction.homeWin}</span>
          <span>X %{prediction.draw}</span>
          <span>MS2 %{prediction.awayWin}</span>
        </div>

        <div className="flex justify-between mt-2">
          <span>2.5 Üst %{prediction.over25}</span>
          <span>KG Var %{prediction.kgVar}</span>
        </div>
      </div>
    </div>
  );
}
