import { calculatePrediction } from "@/lib/predictor";
import { getTeamStats, getLastMatches } from "@/lib/stats";

export default async function MatchPage({ params }: any) {
  const API_KEY = process.env.API_FOOTBALL_KEY;
  const matchId = params.id;

  let match: any = null;

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${matchId}`,
      {
        headers: {
          "x-apisports-key": API_KEY || "",
        },
        cache: "no-store",
      }
    );

    const data = await res.json();
    match = data.response?.[0];
  } catch (e) {}

  if (!match) {
    return <div className="p-6 text-red-500">Maç bulunamadı</div>;
  }

  const homeId = match.teams.home.id;
  const awayId = match.teams.away.id;
  const leagueId = match.league.id;
  const season = match.league.season;

  const homeStats = await getTeamStats(homeId, leagueId, season);
  const awayStats = await getTeamStats(awayId, leagueId, season);

  const homeMatches = await getLastMatches(homeId);
  const awayMatches = await getLastMatches(awayId);

  function getFormScore(matches: any[], teamId: number) {
    if (!matches) return 0;

    let score = 0;

    matches.forEach((m) => {
      const isHome = m.teams.home.id === teamId;
      const winner = isHome ? m.teams.home.winner : m.teams.away.winner;

      if (winner === true) score += 3;
      else if (winner === false) score += 0;
      else score += 1;
    });

    return score;
  }

  const homeForm = getFormScore(homeMatches || [], homeId);
  const awayForm = getFormScore(awayMatches || [], awayId);

  const homeGoals =
    homeStats?.goals?.for?.average?.total &&
    !isNaN(parseFloat(homeStats.goals.for.average.total))
      ? parseFloat(homeStats.goals.for.average.total)
      : 1;

  const awayGoals =
    awayStats?.goals?.for?.average?.total &&
    !isNaN(parseFloat(awayStats.goals.for.average.total))
      ? parseFloat(awayStats.goals.for.average.total)
      : 1;

  const prediction = calculatePrediction(
    homeGoals + homeForm * 0.2,
    awayGoals + awayForm * 0.2
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-4 text-2xl font-bold">
        {match.teams.home.name} vs {match.teams.away.name}
      </h1>

      <div className="mb-4 text-slate-400">Lig: {match.league.name}</div>

      <div className="mb-2">
        Skor: {match.goals.home ?? "-"} - {match.goals.away ?? "-"}
      </div>

      <div className="mb-6 text-slate-400">
        Durum: {match.fixture.status.long}
      </div>

      <div className="mb-6 rounded-xl bg-slate-900 p-4">
        <h2 className="mb-2 font-bold text-green-400">Takım İstatistikleri</h2>

        <div className="flex justify-between text-sm">
          <div>
            <div className="font-semibold">{match.teams.home.name}</div>
            <div>Gol Ort: {homeGoals}</div>
            <div>Form Puanı: {homeForm}</div>
          </div>

          <div className="text-right">
            <div className="font-semibold">{match.teams.away.name}</div>
            <div>Gol Ort: {awayGoals}</div>
            <div>Form Puanı: {awayForm}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 p-4">
        <h2 className="mb-4 font-bold text-green-400">Yapay Tahmin Motoru</h2>

        <div className="flex justify-between">
          <div>MS1 %{prediction.homeWin}</div>
          <div>X %{prediction.draw}</div>
          <div>MS2 %{prediction.awayWin}</div>
        </div>

        <div className="mt-4 flex justify-between text-sm text-slate-400">
          <div>2.5 Üst %{prediction.over25}</div>
          <div>KG Var %{prediction.kgVar}</div>
        </div>
      </div>
    </main>
  );
}
