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

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-10">Oran Analiz Platformu</h1>

      <div className="space-y-12">
        {/* CANLI */}
        <section>
          <h2 className="text-2xl text-red-400 mb-4">
            🔴 Canlı Maçlar ({liveMatches.length})
          </h2>

          <div className="grid gap-4">
            {liveMatches.length === 0 ? (
              <div className="p-4 bg-slate-800 rounded-xl text-slate-300">
                Şu anda canlı maç yok.
              </div>
            ) : (
              liveMatches.map((m: any) => (
                <div key={m.fixture.id} className="p-4 bg-slate-800 rounded-xl">
                  <div className="font-semibold">
                    {m.teams.home.name} - {m.teams.away.name}
                  </div>
                  <div className="text-red-400">
                    {m.fixture.status.elapsed ?? ""}' CANLI
                  </div>
                  <div className="text-xl font-bold">
                    {m.goals.home ?? 0} - {m.goals.away ?? 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* GÜNÜN MAÇLARI */}
        <section>
          <h2 className="text-2xl text-blue-400 mb-4">
            🔵 Günün Maçları ({upcomingMatches.length})
          </h2>

          <div className="grid gap-4">
            {upcomingMatches.length === 0 ? (
              <div className="p-4 bg-slate-800 rounded-xl text-slate-300">
                Bugün başlayacak maç bulunamadı.
              </div>
            ) : (
              upcomingMatches.map((m: any) => (
                <div key={m.fixture.id} className="p-4 bg-slate-800 rounded-xl">
                  <div className="font-semibold">
                    {m.teams.home.name} - {m.teams.away.name}
                  </div>
                  <div className="text-gray-400">
                    Saat:{" "}
                    {new Date(m.fixture.date).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* BİTMİŞ */}
        <section>
          <h2 className="text-2xl text-gray-400 mb-4">
            ⚫ Bitmiş Maçlar ({finishedMatches.length})
          </h2>

          <div className="grid gap-4">
            {finishedMatches.length === 0 ? (
              <div className="p-4 bg-slate-800 rounded-xl text-slate-300">
                Bugün bitmiş maç yok.
              </div>
            ) : (
              finishedMatches.map((m: any) => (
                <div key={m.fixture.id} className="p-4 bg-slate-800 rounded-xl">
                  <div className="font-semibold">
                    {m.teams.home.name} - {m.teams.away.name}
                  </div>
                  <div className="text-xl font-bold">
                    {m.goals.home ?? 0} - {m.goals.away ?? 0}
                  </div>
                  <div className="text-gray-400">
                    Durum: {m.fixture.status.long}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
