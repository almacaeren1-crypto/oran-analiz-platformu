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
    matches = data.response || [];
  } catch (e) {
    matches = [];
  }

  const liveMatches = matches.filter((m: any) =>
    ["1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
      m.fixture.status.short
    )
  );

  const upcomingMatches = matches.filter(
    (m: any) => m.fixture.status.short === "NS"
  );

  const finishedMatches = matches.filter((m: any) =>
    ["FT", "AET", "PEN"].includes(m.fixture.status.short)
  );

  const renderCard = (match: any) => (
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
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-8 text-3xl font-bold">Oran Analiz Platformu</h1>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-2xl font-bold text-red-400">
            🔴 Canlı Maçlar ({liveMatches.length})
          </h2>
          {liveMatches.length === 0 ? (
            <div className="rounded-xl bg-slate-900 p-4 text-slate-400">
              Şu anda canlı maç yok.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {liveMatches.map(renderCard)}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-blue-400">
            🔵 Günün Maçları ({upcomingMatches.length})
          </h2>
          {upcomingMatches.length === 0 ? (
            <div className="rounded-xl bg-slate-900 p-4 text-slate-400">
              Bugün başlayacak maç bulunamadı.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingMatches.map(renderCard)}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-gray-400">
            ⚫ Bitmiş Maçlar ({finishedMatches.length})
          </h2>
          {finishedMatches.length === 0 ? (
            <div className="rounded-xl bg-slate-900 p-4 text-slate-400">
              Bugün bitmiş maç yok.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {finishedMatches.map(renderCard)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
