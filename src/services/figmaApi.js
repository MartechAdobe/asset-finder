const API_URL = "http://localhost:3000";

/* =========================================================
   COMMON API REQUEST
========================================================= */

async function apiRequest(url) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      "Unable to connect to the Figma Asset Finder API."
    );
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `API returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}


/* =========================================================
   GET FIGMA FILES
========================================================= */

export async function getFigmaFiles() {
  return apiRequest(
    `${API_URL}/figma/files`
  );
}


/* =========================================================
   SEARCH ALL FIGMA FILES
========================================================= */

export async function searchFigmaAssets(query) {
  if (!query?.trim()) {
    throw new Error(
      "Search query is required."
    );
  }

  return apiRequest(
    `${API_URL}/figma/search-all?q=${encodeURIComponent(
      query.trim()
    )}`
  );
}


/* =========================================================
   GET SINGLE FIGMA FILE
========================================================= */

export async function getFigmaFile(fileKey) {
  if (!fileKey) {
    throw new Error(
      "Figma file key is required."
    );
  }

  return apiRequest(
    `${API_URL}/figma/file?fileKey=${encodeURIComponent(
      fileKey
    )}`
  );
}


/* =========================================================
   GET FIGMA NODE PREVIEW
========================================================= */

export async function getFigmaPreview(
  fileKey,
  nodeId
) {
  if (!fileKey || !nodeId) {
    throw new Error(
      "Figma file key and node ID are required."
    );
  }

  return apiRequest(
    `${API_URL}/figma/preview?fileKey=${encodeURIComponent(
      fileKey
    )}&nodeId=${encodeURIComponent(
      nodeId
    )}`
  );
}


/* =========================================================
   API URL
========================================================= */

export {
  API_URL,
};