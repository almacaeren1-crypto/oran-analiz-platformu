import { calculatePrediction } from "@/lib/predictor";
import { getTeamStats } from "@/lib/stats";

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
    match = data.response[0];
  } catch (e) {}

  if (!match) {
    return <div className="text-red-500">Maç bulunamadı</div>;
  }

  const homeId = match.teams.home.id;
  const awayId = match.teams.away.id;
  const leagueId = match.league.id;
  const season = match.league.season;

  const homeStats = await getTeamStats(homeId, leagueId, season);
  const awayStats = await getTeamStats(awayId, leagueId, season);

  const homeGoals =
    homeStats?.goals?.for?.average?.total
      ? parseFloat(homeStats.goals.for.average.total)
      : 1;

  const awayGoals =
    awayStats?.goals?.for?.average?.total
      ? parseFloat(awayStats.goals.for.average.total)
      : 1;

  const prediction = calculatePrediction(homeGoals, awayGoals);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">
        {match.teams.home.name} vs {match.teams.away.name}
      </h1>

      <div className="mb-4 text-slate-400">
        Lig: {match.league.name}
      </div>

      <div className="mb-2">
        Skor: {match.goals.home ?? "-"} - {match.goals.away ?? "-"}
      </div>

      <div className="mb-6 text-slate-400">
        Durum: {match.fixture.status.long}
      </div>

      {/* FORM / İSTATİSTİK */}
      <div className="bg-slate-900 p-4 rounded-xl mb-6">
        <h2 className="text-green-400 font-bold mb-2">Takım İstatistikleri</h2>

        <div className="flex justify-between text-sm">
          <div>
            <div className="font-semibold">{match.teams.home.name}</div>
            <div>Gol Ort: {homeGoals}</div>
          </div>

          <div>
            <div className="font-semibold">{match.teams.away.name}</div>
            <div>Gol Ort: {awayGoals}</div>
          </div>
        </div>
      </div>

      {/* TAHMİN */}
      <div className="bg-slate-900 p-4 rounded-xl">
        <h2 className="text-green-400 font-bold mb-4">
          Yapay Tahmin Motoru
        </h2>

        <div className="flex justify-between">
          <div>MS1 %{prediction.homeWin}</div>
          <div>X %{prediction.draw}</div>
          <div>MS2 %{prediction.awayWin}</div>
        </div>

        <div className="flex justify-between mt-4 text-sm text-slate-400">
          <div>2.5 Üst %{prediction.over25}</div>
          <div>KG Var %{prediction.kgvar}</div>
        </div>
      </div>
    </main>
  );
}
