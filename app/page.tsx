type Fixture = {
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
    name: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type Prediction = {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  btts: number;
};

const API_BASE = "https://v3.football.api-sports.io";

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatHour(date: string) {
  return new Date(date).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

async function apiFetch(path: string) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY tanımlı değil.");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`API hatası: ${res.status}`);
  }

  return res.json();
}

async function getTodayMatches(): Promise<Fixture[]> {
  const today = getTodayInIstanbul();
  const data = await apiFetch(
    `/fixtures?date=${today}&timezone=Europe/Istanbul`
  );
  return data.response || [];
}

async function getLastTeamMatches(teamId: number): Promise<Fixture[]> {
  const data = await apiFetch(`/fixtures?team=${teamId}&last=5`);
  return data.response || [];
}

async function getHeadToHead(homeId: number, awayId: number): Promise<Fixture[]> {
  const data = await apiFetch(`/fixtures/headtohead?h2h=${homeId}-${awayId}&last=5`);
  return data.response || [];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(n: number) {
  return Math.round(n);
}

function teamFormScore(matches: Fixture[], teamId: number) {
  let points = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let overCount = 0;
  let bttsCount = 0;

  for (const match of matches) {
    const isHome = match.teams.home.id === teamId;
    const gf = isHome ? match.goals.home ?? 0 : match.goals.away ?? 0;
    const ga = isHome ? match.goals.away ?? 0 : match.goals.home ?? 0;

    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) points += 3;
    else if (gf === ga) points += 1;

    if ((match.goals.home ?? 0) + (match.goals.away ?? 0) > 2) overCount += 1;
    if ((match.goals.home ?? 0) > 0 && (match.goals.away ?? 0) > 0) bttsCount += 1;
  }

  const avgFor = matches.length ? goalsFor / matches.length : 0;
  const avgAgainst = matches.length ? goalsAgainst / matches.length : 0;

  return {
    points,
    avgFor,
    avgAgainst,
    overRate: matches.length ? overCount / matches.length : 0,
    bttsRate: matches.length ? bttsCount / matches.length : 0,
  };
}

function h2hScore(matches: Fixture[], homeId: number, awayId: number) {
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  let overCount = 0;
  let bttsCount = 0;

  for (const match of matches) {
    const homeGoals =
      match.teams.home.id === homeId
        ? match.goals.home ?? 0
        : match.goals.away ?? 0;

    const awayGoals =
      match.teams.home.id === awayId
        ? match.goals.home ?? 0
        : match.goals.away ?? 0;

    if (homeGoals > awayGoals) homeWins += 1;
    else if (homeGoals < awayGoals) awayWins += 1;
    else draws += 1;

    if ((match.goals.home ?? 0) + (match.goals.away ?? 0) > 2) overCount += 1;
    if ((match.goals.home ?? 0) > 0 && (match.goals.away ?? 0) > 0) bttsCount += 1;
  }

  return {
    homeWins,
    awayWins,
    draws,
    overRate: matches.length ? overCount / matches.length : 0,
    bttsRate: matches.length ? bttsCount / matches.length : 0,
  };
}

function makePrediction(
  homeStats: ReturnType<typeof teamFormScore>,
  awayStats: ReturnType<typeof teamFormScore>,
  h2h: ReturnType<typeof h2hScore>
): Prediction {
  const homeStrength =
    homeStats.points * 1.4 +
    homeStats.avgFor * 2.2 -
    homeStats.avgAgainst * 1.2 +
    h2h.homeWins * 0.8 +
    1.2; // home advantage

  const awayStrength =
    awayStats.points * 1.4 +
    awayStats.avgFor * 2.2 -
    awayStats.avgAgainst * 1.2 +
    h2h.awayWins * 0.8;

  const total = Math.max(homeStrength + awayStrength, 1);

  let homeWin = 100 * (homeStrength / total);
  let awayWin = 100 * (awayStrength / total);

  const gap = Math.abs(homeStrength - awayStrength);
  let draw = clamp(28 - gap * 2.2 + h2h.draws * 2, 12, 30);

  const remaining = 100 - draw;
  const ratioTotal = homeWin + awayWin || 1;

  homeWin = (homeWin / ratioTotal) * remaining;
  awayWin = (awayWin / ratioTotal) * remaining;

  const over25 =
    clamp(
      ((homeStats.overRate + awayStats.overRate + h2h.overRate) / 3) * 100,
      25,
      85
    );

  const btts =
    clamp(
      ((homeStats.bttsRate + awayStats.bttsRate + h2h.bttsRate) / 3) * 100,
      20,
      80
    );

  return {
    homeWin: round(homeWin),
    draw: round(draw),
    awayWin: round(awayWin),
    over25: round(over25),
    btts: round(btts),
  };
}

async function buildPredictions(fixtures: Fixture[]) {
  const limited = fixtures.slice(0, 8);

  const results = await Promise.all(
    limited.map(async (fixture) => {
      try {
        const [homeMatches, awayMatches, h2hMatches] = await Promise.all([
          getLastTeamMatches(fixture.teams.home.id),
          getLastTeamMatches(fixture.teams.away.id),
          getHeadToHead(fixture.teams.home.id, fixture.teams.away.id),
        ]);

        const homeStats = teamFormScore(homeMatches, fixture.teams.home.id);
        const awayStats = teamFormScore(awayMatches, fixture.teams.away.id);
        const h2hStats = h2hScore(
          h2hMatches,
          fixture.teams.home.id,
          fixture.teams.away.id
        );

        return {
          fixtureId: fixture.fixture.id,
          prediction: makePrediction(homeStats, awayStats, h2hStats),
        };
      } catch {
        return {
          fixtureId: fixture.fixture.id,
          prediction: null,
        };
      }
    })
  );

  return new Map(results.map((item) => [item.fixtureId, item.prediction]));
}

export default async function Home() {
  let matches: Fixture[] = [];
  let loadError = "";

  try {
    matches = await getTodayMatches();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Bilinmeyen hata";
  }

  const liveMatches = matches.filter((m) =>
    ["1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(m.fixture.status.short)
  );

  const upcomingMatches = matches.filter((m) => m.fixture.status.short === "NS");
  const finishedMatches = matches.filter((m) =>
    ["FT", "AET", "PEN"].includes(m.fixture.status.short)
  );

  const predictionMap = await buildPredictions(upcomingMatches);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-10 text-3xl font-bold">Oran Analiz Platformu</h1>

        {loadError ? (
          <div className="mb-8 rounded-xl border border-red-700 bg-red-950/40 p-4 text-red-200">
            Veri alınamadı: {loadError}
          </div>
        ) : null}

        <div className="space-y-12">
          <section>
            <h2 className="mb-4 text-2xl text-red-400">
              🔴 Canlı Maçlar ({liveMatches.length})
            </h2>

            <div className="grid gap-4">
              {liveMatches.length === 0 ? (
                <div className="rounded-xl bg-slate-800 p-4 text-slate-300">
                  Şu anda canlı maç yok.
                </div>
              ) : (
                liveMatches.map((m) => (
                  <div key={m.fixture.id} className="rounded-xl bg-slate-800 p-4">
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

          <section>
            <h2 className="mb-4 text-2xl text-blue-400">
              🔵 Günün Maçları ({upcomingMatches.length})
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {upcomingMatches.length === 0 ? (
                <div className="rounded-xl bg-slate-800 p-4 text-slate-300">
                  Bugün başlayacak maç bulunamadı.
                </div>
              ) : (
                upcomingMatches.map((m, index) => {
                  const prediction = predictionMap.get(m.fixture.id);

                  return (
                    <div key={m.fixture.id} className="rounded-xl bg-slate-800 p-5">
                      <div className="mb-2 text-lg font-semibold">
                        {m.teams.home.name} - {m.teams.away.name}
                      </div>

                      <div className="mb-4 text-sm text-slate-400">
                        Saat: {formatHour(m.fixture.date)}
                      </div>

                      {prediction ? (
                        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
                          <div className="text-sm font-semibold text-emerald-400">
                            Yapay Tahmin Motoru
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-slate-800 p-2">
                              <div className="text-xs text-slate-400">MS1</div>
                              <div className="text-lg font-bold text-emerald-400">
                                %{prediction.homeWin}
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-800 p-2">
                              <div className="text-xs text-slate-400">X</div>
                              <div className="text-lg font-bold text-yellow-400">
                                %{prediction.draw}
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-800 p-2">
                              <div className="text-xs text-slate-400">MS2</div>
                              <div className="text-lg font-bold text-cyan-400">
                                %{prediction.awayWin}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="rounded-lg bg-slate-800 p-2">
                              <div className="text-xs text-slate-400">2.5 Üst</div>
                              <div className="text-lg font-bold text-pink-400">
                                %{prediction.over25}
                              </div>
                            </div>
                            <div className="rounded-lg bg-slate-800 p-2">
                              <div className="text-xs text-slate-400">KG Var</div>
                              <div className="text-lg font-bold text-orange-400">
                                %{prediction.btts}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : index < 8 ? (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
                          Bu maç için tahmin üretilemedi.
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
                          API limitini korumak için ilk 8 maç analiz ediliyor.
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl text-gray-400">
              ⚫ Bitmiş Maçlar ({finishedMatches.length})
            </h2>

            <div className="grid gap-4">
              {finishedMatches.length === 0 ? (
                <div className="rounded-xl bg-slate-800 p-4 text-slate-300">
                  Bugün bitmiş maç yok.
                </div>
              ) : (
                finishedMatches.map((m) => (
                  <div key={m.fixture.id} className="rounded-xl bg-slate-800 p-4">
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
      </div>
    </main>
  );
}
