const API_URL =
  "https://adobe-github-api.akshanshdogra.workers.dev";

async function apiRequest(url) {
  const response = await fetch(url);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      "Something went wrong"
    );
  }

  return data;
}

export async function searchRepository(query) {
  return apiRequest(
    `${API_URL}/search?q=${encodeURIComponent(query)}`
  );
}

export async function getFile(path) {
  return apiRequest(
    `${API_URL}/file?path=${encodeURIComponent(path)}`
  );
}

export async function getRepository() {
  return apiRequest(`${API_URL}/repo`);
}