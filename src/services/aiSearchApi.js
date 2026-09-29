const AI_API_URL =
  import.meta.env.VITE_AI_API_URL ||
  "https://asset-finder-ai.akshanshdogra.workers.dev";

export async function parseSearchQuery(query) {
  const response = await fetch(
    `${AI_API_URL}/parse-query`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        query,
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      errorText || "AI search failed"
    );
  }

  return response.json();
}