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
    return (
      <div className="p-6 text-red-500">
        Maç bulunamadı
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">
        {match.teams.home.name} vs {match.teams.away.name}
      </h1>

      <div className="mb-4 text-slate-400">
        Lig: {match.league.name}
      </div>

      <div className="mb-4 text-lg">
        Skor: {match.goals.home} - {match.goals.away}
      </div>

      <div className="mb-4">
        Durum: {match.fixture.status.long}
      </div>

      <div className="mt-6 p-4 bg-slate-900 rounded-xl">
        <h2 className="text-lg font-semibold mb-2 text-green-400">
          Yapay Tahmin Motoru (yakında)
        </h2>

        <p className="text-slate-400">
          Bu alana maç analizi gelecek.
        </p>
      </div>
    </main>
  );
}
