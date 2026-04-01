import { getTodayMatches } from "@/lib/api";
import { formatKickoff } from "@/lib/utils";

export default async function Home() {
  const { matches, error } = await getTodayMatches();

  if (error) {
    return <div className="p-10 text-red-500">Hata: {error}</div>;
  }

  // 🔴 CANLI
  const liveMatches = matches.filter((m) =>
    ["1H", "HT", "2H", "ET", "P"].includes(m.fixture.status.short)
  );

  // 🔵 BAŞLAMAMIŞ
  const upcomingMatches = matches.filter(
    (m) => m.fixture.status.short === "NS"
  );

  // ⚫ BİTMİŞ
  const finishedMatches = matches.filter((m) =>
    ["FT", "AET", "PEN"].includes(m.fixture.status.short)
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">

      <h1 className="text-3xl font-bold mb-10">
        Oran Analiz Platformu
      </h1>

      <div className="space-y-12">

        {/* 🔴 CANLI */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-red-400">
            🔴 Canlı Maçlar ({liveMatches.length})
          </h2>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {liveMatches.map((match) => (
              <article key={match.fixture.id} className="rounded-2xl border border-red-500 bg-slate-900 p-6">
                <h3 className="font-semibold">
                  {match.teams.home.name} - {match.teams.away.name}
                </h3>

                <p className="mt-2 text-red-400">
                  {match.fixture.status.elapsed}' CANLI
                </p>

                <p className="mt-3 text-xl font-bold">
                  {match.goals.home} - {match.goals.away}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* 🔵 GÜNÜN MAÇLARI */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-blue-400">
            🔵 Günün Maçları ({upcomingMatches.length})
          </h2>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {upcomingMatches.map((match) => (
              <article key={match.fixture.id} className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
                <h3 className="font-semibold">
                  {match.teams.home.name} - {match.teams.away.name}
                </h3>

                <p className="mt-2 text-slate-400">
                  Saat: {formatKickoff(match.fixture.date)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ⚫ BİTMİŞ */}
        <section>
          <h2 className="mb-4 text-2xl font-bold text-gray-400">
            ⚫ Bitmiş Maçlar ({finishedMatches.length})
          </h2>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {finishedMatches.map((match) => (
              <article key={match.fixture.id} className="rounded-2xl border border-gray-600 bg-slate-900 p-6">
                <h3 className="font-semibold">
                  {match.teams.home.name} - {match.teams.away.name}
                </h3>

                <p className="mt-3 text-xl font-bold">
                  {match.goals.home} - {match.goals.away}
                </p>
              </article>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
