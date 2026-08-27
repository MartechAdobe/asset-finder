import { useEffect, useMemo, useState } from "react";

import {
  getFolders,
  createFolder,
  uploadFile,
} from "../services/githubApi";

export default function GitHubUpload() {
  // =========================================================
  // GITHUB FOLDER STATE
  // =========================================================

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  const [currentPath, setCurrentPath] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // Folder search
  const [folderSearch, setFolderSearch] =
    useState("");

  // =========================================================
  // FILE STATE
  // =========================================================

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [dragging, setDragging] =
    useState(false);

  // =========================================================
  // COMMIT STATE
  // =========================================================

  const [commitMessage, setCommitMessage] =
    useState("");

  // =========================================================
  // UPLOAD STATE
  // =========================================================

  const [uploading, setUploading] =
    useState(false);

  const [uploadSuccess, setUploadSuccess] =
    useState("");

  const [uploadError, setUploadError] =
    useState("");

  // =========================================================
  // CREATE FOLDER STATE
  // =========================================================

  const [showCreateFolder, setShowCreateFolder] =
    useState(false);

  const [newFolderName, setNewFolderName] =
    useState("");

  const [creatingFolder, setCreatingFolder] =
    useState(false);

  // =========================================================
  // LOAD GITHUB FOLDER
  // =========================================================

  async function loadFolder(path = "") {
    try {
      setLoading(true);
      setError("");

      const data =
        await getFolders(path);

      setFolders(
        Array.isArray(data?.folders)
          ? data.folders
          : []
      );

      setFiles(
        Array.isArray(data?.files)
          ? data.files
          : []
      );

      setCurrentPath(
        data?.current_path || path
      );
    } catch (err) {
      console.error(
        "Folder loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load GitHub folder."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadFolder("");
  }, []);

  // =========================================================
  // OPEN FOLDER
  // =========================================================

  function openFolder(path) {
    setFolderSearch("");

    setUploadSuccess("");
    setUploadError("");

    loadFolder(path);
  }

  // =========================================================
  // BACK
  // =========================================================

  function goBack() {
    if (!currentPath) {
      return;
    }

    setFolderSearch("");

    const parts =
      currentPath
        .split("/")
        .filter(Boolean);

    parts.pop();

    const parentPath =
      parts.join("/");

    loadFolder(parentPath);
  }

  // =========================================================
  // FILE SELECT
  // =========================================================

  function selectFile(file) {
    if (!file) {
      return;
    }

    setSelectedFile(file);

    setUploadSuccess("");
    setUploadError("");
  }

  // =========================================================
  // FILE INPUT
  // =========================================================

  function handleFileInput(event) {
    const file =
      event.target.files?.[0];

    selectFile(file);

    event.target.value = "";
  }

  // =========================================================
  // DRAG / DROP
  // =========================================================

  function handleDragOver(event) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();

    setDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    selectFile(file);
  }

  // =========================================================
  // BREADCRUMBS
  // =========================================================

  const breadcrumbs =
    useMemo(() => {
      if (!currentPath) {
        return [];
      }

      return currentPath
        .split("/")
        .filter(Boolean);
    }, [currentPath]);

  function openBreadcrumb(index) {
    setFolderSearch("");

    const path =
      breadcrumbs
        .slice(
          0,
          index + 1
        )
        .join("/");

    loadFolder(path);
  }

  function goToRoot() {
    setFolderSearch("");

    setUploadSuccess("");
    setUploadError("");

    loadFolder("");
  }

  // =========================================================
  // FILTER CURRENT FOLDER LIST
  // =========================================================

  const filteredFolders =
    useMemo(() => {
      const search =
        folderSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return folders;
      }

      return folders.filter(
        (folder) => {
          const name =
            String(
              folder?.name || ""
            ).toLowerCase();

          const path =
            String(
              folder?.path || ""
            ).toLowerCase();

          return (
            name.includes(search) ||
            path.includes(search)
          );
        }
      );
    }, [
      folders,
      folderSearch,
    ]);

  // =========================================================
  // FILE -> BASE64
  // =========================================================

  function fileToBase64(file) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const result =
            reader.result;

          if (
            typeof result !==
            "string"
          ) {
            reject(
              new Error(
                "Unable to read selected file."
              )
            );

            return;
          }

          const commaIndex =
            result.indexOf(",");

          const base64 =
            commaIndex >= 0
              ? result.slice(
                  commaIndex + 1
                )
              : result;

          resolve(base64);
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Unable to read selected file."
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  }

  // =========================================================
  // CREATE FOLDER
  // =========================================================

  async function handleCreateFolder() {
    const folderName =
      newFolderName.trim();

    if (!folderName) {
      return;
    }

    if (
      folderName.includes("/") ||
      folderName.includes("\\")
    ) {
      setUploadError(
        "Folder name cannot contain / or \\."
      );

      return;
    }

    try {
      setCreatingFolder(true);

      setUploadSuccess("");
      setUploadError("");

      const folderPath =
        currentPath
          ? `${currentPath}/${folderName}`
          : folderName;

      const result =
        await createFolder({
          path: folderPath,
          message:
            `Create folder ${folderName}`,
        });

      console.log(
        "CREATE FOLDER RESPONSE:",
        result
      );

      setUploadSuccess(
        result.message ||
          `Folder "${folderName}" created successfully.`
      );

      setNewFolderName("");

      setShowCreateFolder(false);

      setFolderSearch("");

      await loadFolder(
        currentPath
      );
    } catch (err) {
      console.error(
        "Create folder failed:",
        err
      );

      setUploadError(
        err.message ||
          "Unable to create folder."
      );
    } finally {
      setCreatingFolder(false);
    }
  }

  // =========================================================
  // UPLOAD FILE
  // =========================================================

  async function handleUpload() {
    setUploadSuccess("");
    setUploadError("");

    if (!selectedFile) {
      setUploadError(
        "Please choose a file first."
      );

      return;
    }

    if (!currentPath) {
      setUploadError(
        "Please select a destination folder."
      );

      return;
    }

    try {
      setUploading(true);

      const base64 =
        await fileToBase64(
          selectedFile
        );

      const targetPath =
        `${currentPath}/${selectedFile.name}`;

      console.log(
        "Uploading:",
        targetPath
      );

      const result =
        await uploadFile({
          path: targetPath,
          content: base64,
          message:
            commitMessage.trim() ||
            `Add ${selectedFile.name}`,
        });

      console.log(
        "UPLOAD RESPONSE:",
        result
      );

      setUploadSuccess(
        result.message ||
          "File uploaded successfully."
      );

      await loadFolder(
        currentPath
      );

      setSelectedFile(null);
      setCommitMessage("");
    } catch (err) {
      console.error(
        "Upload failed:",
        err
      );

      setUploadError(
        err.message ||
          "Unable to upload file."
      );
    } finally {
      setUploading(false);
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <section className="github-upload-page">

      {/* PAGE HEADER */}
      <div className="github-upload-heading">
        <p className="eyebrow">
          GITHUB ASSET UPLOAD
        </p>

        <h2>
          Upload directly to Adobe.
        </h2>

        <p>
          Choose any folder in the Adobe
          repository, including nested folders.
        </p>
      </div>

      {/* DROP ZONE */}
      <div
        className={
          dragging
            ? "github-dropzone dragging"
            : "github-dropzone"
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="github-drop-icon">
          +
        </div>

        <h3>
          Drop your asset here
        </h3>

        <p>
          PNG, JPG, HTML, newsletter or other files
        </p>

        <label className="github-browse-button">
          Choose file

          <input
            type="file"
            hidden
            onChange={handleFileInput}
          />
        </label>
      </div>

      {/* SELECTED FILE */}
      {selectedFile && (
        <div className="github-selected-file">

          <div>
            <span>
              Selected file
            </span>

            <strong>
              {selectedFile.name}
            </strong>

            <small>
              {(
                selectedFile.size / 1024
              ).toFixed(1)}
              {" KB"}
            </small>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedFile(null)
            }
          >
            Remove
          </button>

        </div>
      )}

      {/* DESTINATION */}
      <div className="github-destination">

        {/* SECTION HEADER */}
        <div className="github-section-title-row">

          <div>
            <h3>
              Upload destination
            </h3>

            <span>
              MartechAdobe / Adobe
            </span>
          </div>

          <button
            type="button"
            className="github-new-folder-button"
            onClick={() => {
              setShowCreateFolder(true);
              setUploadError("");
              setUploadSuccess("");
            }}
          >
            <span>+</span>
            New folder
          </button>

        </div>

        {/* CREATE FOLDER */}
        {showCreateFolder && (
          <div className="github-new-folder">

            <div className="github-new-folder-title">
              Create new folder
            </div>

            <div className="github-new-folder-current">
              Parent:
              {" "}
              <strong>
                Adobe/
                {currentPath
                  ? `${currentPath}/`
                  : ""}
              </strong>
            </div>

            <div className="github-new-folder-row">

              <input
                type="text"
                value={newFolderName}
                onChange={(event) =>
                  setNewFolderName(
                    event.target.value
                  )
                }
                placeholder="Folder name"
                autoFocus
                disabled={creatingFolder}
              />

              <button
                type="button"
                onClick={
                  handleCreateFolder
                }
                disabled={
                  creatingFolder ||
                  !newFolderName.trim()
                }
              >
                {creatingFolder
                  ? "Creating..."
                  : "Create"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreateFolder(
                    false
                  );

                  setNewFolderName("");

                  setUploadError("");
                }}
                disabled={creatingFolder}
              >
                Cancel
              </button>

            </div>

          </div>
        )}

        {/* LOCATION */}
        <div className="github-location-bar">

          <div className="github-location-icon">
            📁
          </div>

          <div className="github-location-content">
            <span>
              Current location
            </span>

            <strong>
              {currentPath
                ? `Adobe / ${currentPath}`
                : "MartechAdobe / Adobe"}
            </strong>
          </div>

          {currentPath && (
            <button
              type="button"
              className="github-root-button"
              onClick={goToRoot}
            >
              Root
            </button>
          )}

        </div>

        {/* FOLDER TOOLBAR */}
        <div className="github-folder-toolbar">

          <div className="github-folder-search">

            <span className="github-folder-search-icon">
              ⌕
            </span>

            <input
              type="text"
              value={folderSearch}
              onChange={(event) =>
                setFolderSearch(
                  event.target.value
                )
              }
              placeholder="Search folders..."
              aria-label="Search folders"
            />

            {folderSearch && (
              <button
                type="button"
                className="github-folder-search-clear"
                onClick={() =>
                  setFolderSearch("")
                }
                aria-label="Clear folder search"
              >
                ×
              </button>
            )}

          </div>

          <div className="github-folder-count">
            {filteredFolders.length}{" "}
            {filteredFolders.length === 1
              ? "folder"
              : "folders"}
          </div>

        </div>

        {/* BREADCRUMB */}
        <div className="github-breadcrumb">

          <button
            type="button"
            onClick={goToRoot}
            className={
              !currentPath
                ? "active"
                : ""
            }
          >
            Adobe
          </button>

          {breadcrumbs.map(
            (part, index) => (
              <div
                className="github-breadcrumb-item"
                key={`${part}-${index}`}
              >

                <span>
                  /
                </span>

                <button
                  type="button"
                  onClick={() =>
                    openBreadcrumb(index)
                  }
                  className={
                    index ===
                    breadcrumbs.length - 1
                      ? "active"
                      : ""
                  }
                >
                  {part}
                </button>

              </div>
            )
          )}

        </div>

        {/* FOLDER BROWSER */}
        <div className="github-folder-browser">

          {currentPath && (
            <button
              type="button"
              className="github-back-button"
              onClick={goBack}
            >
              ← Back
            </button>
          )}

          {loading ? (

            <div className="github-folder-loading">
              <div className="folder-loading-spinner" />
              <span>
                Loading folders...
              </span>
            </div>

          ) : error ? (

            <div className="github-folder-error">
              {error}
            </div>

          ) : filteredFolders.length ===
            0 ? (

            <div className="github-folder-empty">

              <div className="github-folder-empty-icon">
                ⌕
              </div>

              <h4>
                No folders found
              </h4>

              <p>
                {folderSearch
                  ? `No folders match "${folderSearch}".`
                  : "This location has no subfolders."}
              </p>

              {folderSearch && (
                <button
                  type="button"
                  onClick={() =>
                    setFolderSearch("")
                  }
                >
                  Clear search
                </button>
              )}

            </div>

          ) : (

            <div className="github-folder-list">

             {filteredFolders.map((folder) => (
  <button
    key={folder.path}
    type="button"
    className="folder-card"
    onClick={() => handleFolderClick(folder)}
  >
    <span className="folder-icon-wrap" aria-hidden="true">
      <svg
        className="folder-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 6.5C3 5.67 3.67 5 4.5 5H9L11 7H19.5C20.33 7 21 7.67 21 8.5V17.5C21 18.33 20.33 19 19.5 19H4.5C3.67 19 3 18.33 3 17.5V6.5Z"
          fill="currentColor"
        />
      </svg>
    </span>

    <span className="folder-card-content">
      <span
        className="folder-card-name"
        title={folder.name}
      >
        {folder.name}
      </span>

      <span className="folder-card-type">
        Folder
      </span>
    </span>

    <span className="folder-card-arrow" aria-hidden="true">
      →
    </span>
  </button>
))}

            </div>

          )}

          {/* EXISTING FILES */}
          {files.length > 0 && (
            <div className="github-existing-files">

              <h4>
                Existing files
              </h4>

              {files.map(
                (file) => (
                  <div
                    className="github-existing-file"
                    key={
                      file.path ||
                      file.name
                    }
                  >
                    <span>
                      📄
                    </span>

                    <span>
                      {
                        file.name ||
                        file.path
                      }
                    </span>
                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

      {/* COMMIT MESSAGE */}
      <div className="github-commit-section">

        <label>
          Commit message
        </label>

        <input
          type="text"
          value={commitMessage}
          onChange={(event) =>
            setCommitMessage(
              event.target.value
            )
          }
          placeholder="Add asset"
          disabled={uploading}
        />

      </div>

      {/* DESTINATION PREVIEW */}
      <div className="github-selected-path">

        <span>
          Destination
        </span>

        <strong>
          {currentPath
            ? `Adobe/${currentPath}/${
                selectedFile?.name || ""
              }`
            : "Select a destination folder"}
        </strong>

      </div>

      {/* MESSAGES */}
      {uploadSuccess && (
        <div className="github-upload-success">
          ✓ {uploadSuccess}
        </div>
      )}

      {uploadError && (
        <div className="github-upload-error">
          {uploadError}
        </div>
      )}

      {/* UPLOAD */}
      <button
        type="button"
        className="github-upload-button"
        onClick={handleUpload}
        disabled={
          uploading ||
          !selectedFile ||
          !currentPath
        }
      >
        {uploading
          ? "Uploading..."
          : "Upload to GitHub"}
      </button>

    </section>
  );
}