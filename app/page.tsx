import Link from "next/link";

export default async function Home() {
  const API_KEY = process.env.API_FOOTBALL_KEY;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=Europe/Istanbul`,
    {
      headers: {
        "x-apisports-key": API_KEY!,
      },
      next: { revalidate: 60 },
    }
  );

  const data = await res.json();
  const matches = data.response || [];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-6 text-3xl font-bold">Oran Analiz Platformu</h1>

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
    </main>
  );
}
