const API_URL =
  "https://adobe-github-api.akshanshdogra.workers.dev";

/**
 * Common API request helper
 */
async function apiRequest(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(
      "Unable to connect to the GitHub API Worker."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
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
   REPOSITORY SEARCH
   ========================================================= */

export async function searchRepository(query) {
  return apiRequest(
    `${API_URL}/search?q=${encodeURIComponent(query)}`
  );
}


/* =========================================================
   GET FILE
   ========================================================= */

export async function getFile(path) {
  return apiRequest(
    `${API_URL}/file?path=${encodeURIComponent(path)}`
  );
}


/* =========================================================
   GET RAW FILE
   ========================================================= */

export async function getRawFile(path) {
  return apiRequest(
    `${API_URL}/raw?path=${encodeURIComponent(path)}`
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
   =========================================================
   
   Example:

   getFolders()

   -> Root folders

   getFolders("ACS summit")

   -> Folders/files inside ACS summit

   getFolders("ACS summit/Asset Finder Test")

   -> Folders/files inside nested folder
   ========================================================= */

export async function getFolders(path = "") {
  return apiRequest(
    `${API_URL}/folders?path=${encodeURIComponent(path)}`
  );
}


/* =========================================================
   CREATE FOLDER
   =========================================================

   Example:

   await createFolder({
     path: "ACS summit/New Folder",
     message: "Create new folder"
   });

   ========================================================= */

export async function createFolder({
  path,
  message = "Create folder"
}) {
  if (!path || !path.trim()) {
    throw new Error(
      "Folder path is required."
    );
  }

  return apiRequest(
    `${API_URL}/create-folder`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        path: path.trim(),
        message
      })
    }
  );
}


/* =========================================================
   UPLOAD FILE
   =========================================================

   IMPORTANT:

   The Worker expects:

   contentBase64

   NOT:

   content

   Example:

   await uploadFile({
     path: "ACS summit/Test/Template.html",
     content: base64Content,
     message: "Upload template"
   });

   ========================================================= */

export async function uploadFile({
  path,
  content,
  message = "Upload asset"
}) {
  if (!path || !path.trim()) {
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
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        path: path.trim(),

        // IMPORTANT:
        // Worker expects contentBase64
        contentBase64: content,

        message
      })
    }
  );
}


/* =========================================================
   EXPORT API URL
   ========================================================= */

export { API_URL };