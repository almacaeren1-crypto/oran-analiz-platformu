import { calculatePrediction } from "@/lib/predictor";

async function getMatch(id: string) {
  const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${id}`, {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY || "",
    },
    cache: "no-store",
  });

  const data = await res.json();
  return data.response[0];
}

export default async function MatchPage({ params }: { params: { id: string } }) {
  const match = await getMatch(params.id);

  if (!match) {
    return <div className="p-6 text-red-500">Maç bulunamadı</div>;
  }

  const homeGoals = match.goals.home || 0;
  const awayGoals = match.goals.away || 0;

  const prediction = calculatePrediction(homeGoals, awayGoals);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-2">
        {match.teams.home.name} vs {match.teams.away.name}
      </h1>

      <p>Lig: {match.league.name}</p>
      <p>Skor: {homeGoals} - {awayGoals}</p>
      <p>Durum: {match.fixture.status.long}</p>

      {/* ANALİZ */}
      <div className="mt-6 p-4 rounded-xl bg-slate-800">
        <h2 className="text-green-400 mb-2">Maç Analizi</h2>
        <p>
          {homeGoals > awayGoals
            ? "Ev sahibi daha baskın oynuyor."
            : awayGoals > homeGoals
            ? "Deplasman daha etkili."
            : "Maç dengede gidiyor."}
        </p>
      </div>

      {/* TAHMİN */}
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
