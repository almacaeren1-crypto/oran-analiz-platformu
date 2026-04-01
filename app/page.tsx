// ⚠️ SADELEŞTİRİLMİŞ VE DAHA AKILLI TAHMİN MOTORU

// (kodu çok uzun olduğu için burada optimize edilmiş versiyon veriyorum)

const API_BASE = "https://v3.football.api-sports.io";

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function fetchAPI(url: string) {
  const key = process.env.API_FOOTBALL_KEY!;
  const res = await fetch(API_BASE + url, {
    headers: { "x-apisports-key": key },
    next: { revalidate: 300 },
  });
  return res.json();
}

// 🔥 FORM ANALİZİ
function formScore(matches: any[], teamId: number) {
  let score = 0;
  let goals = 0;
  let conceded = 0;

  matches.forEach((m) => {
    const isHome = m.teams.home.id === teamId;
    const gf = isHome ? m.goals.home : m.goals.away;
    const ga = isHome ? m.goals.away : m.goals.home;

    goals += gf;
    conceded += ga;

    if (gf > ga) score += 3;
    else if (gf === ga) score += 1;
  });

  return {
    score,
    attack: goals / 5,
    defense: conceded / 5,
  };
}

// 🔥 GELİŞMİŞ TAHMİN
function predict(home: any, away: any) {
  let homePower =
    home.score * 1.5 +
    home.attack * 2.5 -
    home.defense * 1.2 +
    2; // home bonus

  let awayPower =
    away.score * 1.5 +
    away.attack * 2.5 -
    away.defense * 1.2;

  const total = homePower + awayPower;

  let ms1 = (homePower / total) * 100;
  let ms2 = (awayPower / total) * 100;

  let draw = 100 - (ms1 + ms2);

  // beraberliği dengeli tut
  draw = Math.max(18, Math.min(32, draw));

  // normalize
  const remain = 100 - draw;
  const ratio = ms1 + ms2;

  ms1 = (ms1 / ratio) * remain;
  ms2 = (ms2 / ratio) * remain;

  // gol tahmini
  const over = Math.min(80, Math.max(30, (home.attack + away.attack) * 25));
  const btts = Math.min(75, Math.max(25, (home.attack + away.attack) * 20));

  return {
    ms1: Math.round(ms1),
    draw: Math.round(draw),
    ms2: Math.round(ms2),
    over: Math.round(over),
    btts: Math.round(btts),
  };
}

export default async function Page() {
  const today = getToday();
  const data = await fetchAPI(`/fixtures?date=${today}`);

  const matches = data.response;

  const upcoming = matches.filter((m: any) => m.fixture.status.short === "NS");
  const live = matches.filter((m: any) =>
    ["1H", "2H", "HT"].includes(m.fixture.status.short)
  );

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-3xl mb-6">Oran Analiz Platformu</h1>

      {/* 🔴 CANLI */}
      <h2 className="text-red-400 text-xl mb-3">
        Canlı ({live.length})
      </h2>

      {live.map((m: any) => (
        <div key={m.fixture.id} className="mb-3 p-3 bg-gray-800 rounded">
          {m.teams.home.name} - {m.teams.away.name}
          <div className="text-red-400">
            {m.fixture.status.elapsed}' CANLI
          </div>
          <div className="text-xl">
            {m.goals.home} - {m.goals.away}
          </div>
        </div>
      ))}

      {/* 🔵 GÜNÜN MAÇLARI */}
      <h2 className="text-blue-400 text-xl mt-8 mb-3">
        Günün Maçları ({upcoming.length})
      </h2>

      {await Promise.all(
        upcoming.slice(0, 8).map(async (m: any) => {
          const homeData = await fetchAPI(
            `/fixtures?team=${m.teams.home.id}&last=5`
          );
          const awayData = await fetchAPI(
            `/fixtures?team=${m.teams.away.id}&last=5`
          );

          const homeForm = formScore(homeData.response, m.teams.home.id);
          const awayForm = formScore(awayData.response, m.teams.away.id);

          const p = predict(homeForm, awayForm);

          return (
            <div
              key={m.fixture.id}
              className="mb-4 p-4 bg-gray-800 rounded"
            >
              <div className="font-bold">
                {m.teams.home.name} - {m.teams.away.name}
              </div>

              <div className="text-sm text-gray-400 mb-2">
                Saat: {new Date(m.fixture.date).toLocaleTimeString("tr-TR")}
              </div>

              <div className="bg-gray-900 p-3 rounded">
                <div className="text-green-400 text-sm mb-2">
                  Yapay Tahmin Motoru
                </div>

                <div className="flex justify-between text-center">
                  <div>MS1 %{p.ms1}</div>
                  <div>X %{p.draw}</div>
                  <div>MS2 %{p.ms2}</div>
                </div>

                <div className="flex justify-between mt-2 text-center">
                  <div>2.5 Üst %{p.over}</div>
                  <div>KG Var %{p.btts}</div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
