const API_URL =
  "https://adobe-github-api.akshanshdogra.workers.dev";

/* =========================================================
   COMMON API REQUEST
========================================================= */

async function apiRequest(
  url,
  options = {}
) {
  let response;

  try {
    response = await fetch(
      url,
      options
    );
  } catch (error) {
    throw new Error(
      "Unable to connect to the GitHub API Worker."
    );
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Worker returned an invalid response (${response.status}).`
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
   SEARCH REPOSITORY
========================================================= */

export async function searchRepository(
  query,
  folder = ""
) {
  const params =
    new URLSearchParams();

  if (query?.trim()) {
    params.set(
      "q",
      query.trim()
    );
  }

  if (folder?.trim()) {
    params.set(
      "path",
      folder.trim()
    );
  }

  return apiRequest(
    `${API_URL}/search?${params.toString()}`
  );
}


/* =========================================================
   GET FILE
========================================================= */

export async function getFile(
  path
) {
  return apiRequest(
    `${API_URL}/file?path=${encodeURIComponent(
      path
    )}`
  );
}


/* =========================================================
   GET RAW FILE
========================================================= */

export async function getRawFile(
  path
) {
  return apiRequest(
    `${API_URL}/raw?path=${encodeURIComponent(
      path
    )}`
  );
}


/* =========================================================
   GET REPOSITORY
========================================================= */

export async function getRepository() {
  return apiRequest(
    `${API_URL}/repo`
  );
}


/* =========================================================
   GET FOLDERS
========================================================= */

export async function getFolders(
  path = ""
) {
  return apiRequest(
    `${API_URL}/folders?path=${encodeURIComponent(
      path
    )}`
  );
}


/* =========================================================
   CREATE FOLDER
========================================================= */

export async function createFolder({
  path,
  message = "Create folder",
}) {
  if (!path?.trim()) {
    throw new Error(
      "Folder path is required."
    );
  }

  return apiRequest(
    `${API_URL}/create-folder`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        path: path.trim(),
        message,
      }),
    }
  );
}


/* =========================================================
   UPLOAD FILE
========================================================= */

export async function uploadFile({
  path,
  content,
  message = "Upload asset",
}) {
  if (!path?.trim()) {
    throw new Error(
      "File path is required."
    );
  }

  if (!content) {
    throw new Error(
      "File content is required."
    );
  }

  return apiRequest(
    `${API_URL}/upload`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        path: path.trim(),
        contentBase64: content,
        message,
      }),
    }
  );
}


/* =========================================================
   API URL
========================================================= */

export {
  API_URL,
};