export default async function MatchDetailPage({ params }: any) {
  const API_KEY = process.env.API_FOOTBALL_KEY;
  const matchId = params.id;

  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?id=${matchId}`,
    {
      headers: {
        "x-apisports-key": API_KEY!,
      },
      next: { revalidate: 60 },
    }
  );

  const data = await res.json();
  const match = data.response?.[0];

  if (!match) {
    return <div className="p-6 text-red-500">Maç bulunamadı</div>;
  }

  // BASİT ANALİZ
  const homeGoals = match.goals.home ?? 0;
  const awayGoals = match.goals.away ?? 0;

  let yorum = "";

  if (homeGoals > awayGoals) {
    yorum = "Ev sahibi maçta önde ve daha etkili görünüyor.";
  } else if (awayGoals > homeGoals) {
    yorum = "Deplasman takımı üstünlük kurmuş durumda.";
  } else {
    yorum = "Maç dengede, beraberlik ihtimali yüksek.";
  }

  // BASİT TAHMİN
  const ms1 = homeGoals > awayGoals ? 70 : 40;
  const ms2 = awayGoals > homeGoals ? 70 : 30;
  const draw = 100 - ms1 - ms2;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">
        {match.teams.home.name} vs {match.teams.away.name}
      </h1>

      <div className="mb-2 text-slate-400">
        Lig: {match.league.name}
      </div>

      <div className="mb-2 text-lg">
        Skor: {homeGoals} - {awayGoals}
      </div>

      <div className="mb-4">
        Durum: {match.fixture.status.long}
      </div>

      {/* ANALİZ */}
      <div className="bg-slate-900 p-4 rounded-xl mb-4">
        <h2 className="text-green-400 font-semibold mb-2">
          Maç Analizi
        </h2>
        <p className="text-slate-300">{yorum}</p>
      </div>

      {/* TAHMİN */}
      <div className="bg-slate-900 p-4 rounded-xl">
        <h2 className="text-green-400 font-semibold mb-2">
          Yapay Tahmin Motoru
        </h2>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-slate-400">MS1</div>
            <div className="text-xl font-bold text-green-400">%{ms1}</div>
          </div>

          <div>
            <div className="text-sm text-slate-400">X</div>
            <div className="text-xl font-bold text-yellow-400">%{draw}</div>
          </div>

          <div>
            <div className="text-sm text-slate-400">MS2</div>
            <div className="text-xl font-bold text-blue-400">%{ms2}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
