
const AI_API_URL = (
  import.meta.env.VITE_AI_API_URL ||
  "https://asset-finder-ai.akshanshdogra.workers.dev"
).replace(/\/+$/, "");

export async function parseSearchQuery(query) {
  const response = await fetch(
    `${AI_API_URL}/parse-query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const responseText = await response.text();

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `AI Worker returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      `AI search failed with HTTP ${response.status}.`
    );
  }

  return data;
}