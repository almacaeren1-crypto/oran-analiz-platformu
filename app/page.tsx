const matches = [
  {
    league: "Süper Lig",
    home: "Galatasaray",
    away: "Beşiktaş",
    time: "20:00",
    over: "72%",
    btts: "68%",
  },
  {
    league: "Premier League",
    home: "Arsenal",
    away: "Liverpool",
    time: "22:00",
    over: "64%",
    btts: "71%",
  },
  {
    league: "La Liga",
    home: "Barcelona",
    away: "Atletico Madrid",
    time: "23:00",
    over: "58%",
    btts: "61%",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-emerald-400">
            Futbol Analiz MVP
          </p>
          <h1 className="text-4xl font-bold md:text-6xl">Oran Analiz Platformu</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Günlük maçlar, temel trendler ve akıllı yorumlar için hazırlanmış ilk çalışan sürüm.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Günün Maçları</h2>
          <span className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
            Mock veri
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <article
              key={match.home + match.away}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg transition hover:border-emerald-500"
            >
              <p className="mb-3 text-sm text-emerald-400">{match.league}</p>
              <h3 className="text-xl font-semibold">
                {match.home} - {match.away}
              </h3>
              <p className="mt-2 text-slate-400">Saat: {match.time}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">2.5 Üst</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-400">{match.over}</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">KG Var</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-400">{match.btts}</p>
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-300">
                Akıllı yorum: Bu maçta tempo ve gol ihtimali ortalamanın üstünde görünüyor.
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
