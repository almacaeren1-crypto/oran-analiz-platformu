import Link from "next/link";
import { getTodayMatches } from "@/lib/api";

export default async function Home() {
  const { matches } = await getTodayMatches();

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Oran Analiz Platformu</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((match: any) => (
          <Link
            key={match.fixture.id}
            href={`/match/${match.fixture.id}`}
            className="block rounded-xl border border-slate-700 bg-slate-900 p-4 hover:bg-slate-800 transition"
          >
            <div className="font-semibold">
              {match.teams.home.name} - {match.teams.away.name}
            </div>

            <div className="text-sm text-slate-400 mt-2">
              Saat:{" "}
              {new Date(match.fixture.date).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
