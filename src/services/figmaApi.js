const API_URL =
  import.meta.env.VITE_FIGMA_API_URL ||
  "http://localhost:3000";

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
      `Invalid API response (${response.status}).`
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
   GET ALL FIGMA FILES
========================================================= */

export async function getFigmaFiles() {
  return apiRequest(
    `${API_URL}/figma/files`
  );
}


/* =========================================================
   SEARCH ALL FIGMA FILES
========================================================= */

export async function searchFigmaAssets(
  query,
  options = {}
) {
  if (!query?.trim()) {
    throw new Error(
      "Search query is required."
    );
  }

  const params = new URLSearchParams();

  params.set(
    "q",
    query.trim()
  );

  if (options.limit !== undefined) {
    params.set(
      "limit",
      String(options.limit)
    );
  }

  if (options.preview !== undefined) {
    params.set(
      "preview",
      String(options.preview)
    );
  }

  if (options.type) {
    params.set(
      "type",
      options.type
    );
  }

  if (options.fileKey) {
    params.set(
      "fileKey",
      options.fileKey
    );
  }

  if (options.pageName) {
    params.set(
      "pageName",
      options.pageName
    );
  }

  return apiRequest(
    `${API_URL}/figma/search-all?${params.toString()}`
  );
}


/* =========================================================
   GET SINGLE FIGMA ASSET
========================================================= */

export async function getFigmaAsset(
  fileKey,
  nodeId
) {
  if (!fileKey || !nodeId) {
    throw new Error(
      "Figma file key and node ID are required."
    );
  }

  return apiRequest(
    `${API_URL}/figma/asset?fileKey=${encodeURIComponent(
      fileKey
    )}&nodeId=${encodeURIComponent(
      nodeId
    )}`
  );
}


/* =========================================================
   GET FIGMA PREVIEW
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


export {
  API_URL
};