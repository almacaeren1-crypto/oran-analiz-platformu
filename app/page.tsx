type FixtureItem = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type ApiFootballResponse = {
  response?: FixtureItem[];
  errors?: Record<string, string>;
};

function getTodayDateInTurkey() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(now); // YYYY-MM-DD
}

function formatKickoff(dateString: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function groupByLeague(matches: FixtureItem[]) {
  return matches.reduce<Record<string, FixtureItem[]>>((acc, match) => {
    const key = `${match.league.name} (${match.league.country})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});
}

async function getTodayMatches() {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return {
      matches: [] as FixtureItem[],
      error:
        "API_FOOTBALL_KEY tanımlı değil. Vercel Environment Variables kısmına eklenmeli.",
    };
  }

  const date = getTodayDateInTurkey();

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${date}&timezone=Europe/Istanbul`,
      {
        method: "GET",
        headers: {
          "x-apisports-key": apiKey,
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      return {
        matches: [] as FixtureItem[],
        error: `API hatası: ${response.status} ${response.statusText}`,
      };
    }

    const data: ApiFootballResponse = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      return {
        matches: [] as FixtureItem[],
        error: `API hata cevabı: ${JSON.stringify(data.errors)}`,
      };
    }

    return {
      matches: data.response ?? [],
      error: null as string | null,
    };
  } catch (error) {
    return {
      matches: [] as FixtureItem[],
      error: "Veri çekilirken beklenmeyen bir hata oluştu.",
    };
  }
}

export default async function HomePage() {
  const { matches, error } = await getTodayMatches();
  const grouped = groupByLeague(matches);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-emerald-400">
            Canlı API Entegrasyonu
          </p>
          <h1 className="text-4xl font-bold md:text-6xl">Oran Analiz Platformu</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Günün Maçları bölümü artık API-Football üzerinden gerçek veri çekmeye hazır.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Günün Maçları</h2>
          <span className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
            {matches.length} maç
          </span>
        </div>

        {error ? (
          <div className="mb-8 rounded-2xl border border-red-800 bg-red-950/40 p-5 text-red-200">
            <p className="font-semibold">Bağlantı uyarısı</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : null}

        {!error && matches.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
            Bugün için maç bulunamadı.
          </div>
        ) : null}

        <div className="space-y-10">
          {Object.entries(grouped).map(([leagueName, leagueMatches]) => (
            <div key={leagueName}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-emerald-400">
                  {leagueName}
                </h3>
                <span className="text-sm text-slate-400">
                  {leagueMatches.length} maç
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {leagueMatches.map((match) => {
                  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(
                    match.fixture.status.short
                  );

                  const isFinished = ["FT", "AET", "PEN"].includes(
                    match.fixture.status.short
                  );

                  return (
                    <article
                      key={match.fixture.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg transition hover:border-emerald-500"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                          Saat: {formatKickoff(match.fixture.date)}
                        </p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isLive
                              ? "bg-red-500/20 text-red-300"
                              : isFinished
                              ? "bg-slate-700 text-slate-200"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {isLive
                            ? `${match.fixture.status.elapsed ?? ""}' CANLI`
                            : match.fixture.status.long}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={match.teams.home.logo}
                              alt={match.teams.home.name}
                              className="h-8 w-8 rounded-full bg-white object-contain p-1"
                            />
                            <span className="font-medium">{match.teams.home.name}</span>
                          </div>
                          <span className="text-2xl font-bold text-emerald-400">
                            {match.goals.home ?? "-"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={match.teams.away.logo}
                              alt={match.teams.away.name}
                              className="h-8 w-8 rounded-full bg-white object-contain p-1"
                            />
                            <span className="font-medium">{match.teams.away.name}</span>
                          </div>
                          <span className="text-2xl font-bold text-cyan-400">
                            {match.goals.away ?? "-"}
                          </span>
                        </div>
                      </div>

                      <p className="mt-5 text-sm text-slate-300">
                        Durum: {match.fixture.status.long}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
