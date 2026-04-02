import Link from "next/link";

export default async function Home() {
  const API_KEY = process.env.API_FOOTBALL_KEY;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  let matches: any[] = [];
  let errorMessage = "";

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=Europe/Istanbul`,
      {
        headers: {
          "x-apisports-key": API_KEY || "",
        },
        next: { revalidate: 60 },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      errorMessage = `API hatası: ${res.status}`;
    } else if (data.errors && Object.keys(data.errors).length > 0) {
      errorMessage = `API hata cevabı: ${JSON.stringify(data.errors)}`;
    } else {
      matches = data.response || [];
    }
  } catch (err) {
    errorMessage = "Veri çekilirken beklenmeyen hata oluştu.";
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-6 text-3xl font-bold">Oran Analiz Platformu</h1>

      <div className="mb-6 rounded-xl bg-slate-900 p-4">
        <p>Tarih: {today}</p>
        <p>Maç sayısı: {matches.length}</p>
        <p>API key var mı: {API_KEY ? "Evet" : "Hayır"}</p>
        {errorMessage ? (
          <p className="mt-2 text-red-400">Hata: {errorMessage}</p>
        ) : null}
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
          Bugün için maç verisi gelmedi.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match: any) => (
            <Link
              key={match.fixture.id}
              href={`/match/${match.fixture.id}`}
              className="block rounded-xl border border-slate-700 bg-slate-900 p-4 transition hover:bg-slate-800"
            >
              <div className="font-semibold">
                {match.teams.home.name} - {match.teams.away.name}
              </div>

              <div className="mt-2 text-sm text-slate-400">
                Saat:{" "}
                {new Date(match.fixture.date).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div className="mt-2 text-sm text-slate-500">
                Durum: {match.fixture.status.long}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
