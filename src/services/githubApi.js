const API_URL =
  "https://adobe-github-api.akshanshdogra.workers.dev";

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Worker returned an invalid response (${response.status})`
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


// ------------------------------------
// SEARCH
// ------------------------------------

export async function searchRepository(query) {
  return apiRequest(
    `${API_URL}/search?q=${encodeURIComponent(query)}`
  );
}


// ------------------------------------
// GET FILE
// ------------------------------------

export async function getFile(path) {
  return apiRequest(
    `${API_URL}/file?path=${encodeURIComponent(path)}`
  );
}


// ------------------------------------
// REPOSITORY INFO
// ------------------------------------

export async function getRepository() {
  return apiRequest(`${API_URL}/repo`);
}


// ------------------------------------
// GET FOLDERS
// ------------------------------------

export async function getFolders(path = "") {
  const url =
    path.trim().length > 0
      ? `${API_URL}/folders?path=${encodeURIComponent(path)}`
      : `${API_URL}/folders`;

  return apiRequest(url);
}


// ------------------------------------
// CREATE FOLDER
// ------------------------------------

export async function createFolder({
  path,
  message = "Create new folder"
}) {
  return apiRequest(`${API_URL}/create-folder`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      path,
      message
    })
  });
}


// ------------------------------------
// UPLOAD FILE
// ------------------------------------

export async function uploadFile({
  path,
  content,
  message = "Upload asset"
}) {
  return apiRequest(`${API_URL}/upload`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      path,
      content,
      message
    })
  });
}


// ------------------------------------
// UPDATE FILE
// ------------------------------------

export async function updateFile({
  path,
  content,
  message = "Update asset"
}) {
  return apiRequest(`${API_URL}/file`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      path,
      content,
      message
    })
  });
}