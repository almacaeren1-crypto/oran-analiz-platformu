export async function getLastMatches(teamId: number) {
  const API_KEY = process.env.API_FOOTBALL_KEY;

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?team=${teamId}&last=5`,
      {
        headers: {
          "x-apisports-key": API_KEY || "",
        },
        next: { revalidate: 300 },
      }
    );

    const data = await res.json();
    return data.response;
  } catch (e) {
    return null;
  }
}
