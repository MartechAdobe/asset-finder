import { useEffect, useMemo, useState } from "react";

const API_URL =
  "https://adobe-github-api.akshanshdogra.workers.dev";

export default function GitHubUpload() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  const [currentPath, setCurrentPath] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [commitMessage, setCommitMessage] = useState("");

  const [dragging, setDragging] = useState(false);

  async function loadFolder(path = "") {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/folders?path=${encodeURIComponent(path)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load folder."
        );
      }

      setFolders(data.folders || []);
      setFiles(data.files || []);
      setCurrentPath(path);
    } catch (err) {
      console.error("Folder loading error:", err);

      setError(
        err.message || "Unable to load GitHub folders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFolder("");
  }, []);

  function openFolder(path) {
    loadFolder(path);
  }

  function goBack() {
    if (!currentPath) return;

    const parts = currentPath
      .split("/")
      .filter(Boolean);

    parts.pop();

    loadFolder(parts.join("/"));
  }

  function selectFile(file) {
    if (!file) return;

    setSelectedFile(file);
  }

  function handleFileInput(event) {
    selectFile(event.target.files?.[0]);

    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    selectFile(
      event.dataTransfer.files?.[0]
    );
  }

  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];

    return currentPath
      .split("/")
      .filter(Boolean);
  }, [currentPath]);

  function openBreadcrumb(index) {
    const path = breadcrumbs
      .slice(0, index + 1)
      .join("/");

    loadFolder(path);
  }

  return (
    <section className="github-upload-page">

      <div className="github-upload-heading">
        <p className="eyebrow">
          GITHUB ASSET UPLOAD
        </p>

        <h2>
          Upload directly to Adobe.
        </h2>

        <p>
          Choose any folder in the Adobe repository,
          including nested folders.
        </p>
      </div>


      {/* FILE UPLOAD */}

      <div
        className={
          dragging
            ? "github-dropzone dragging"
            : "github-dropzone"
        }

        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}

        onDragLeave={() => {
          setDragging(false);
        }}

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
                selectedFile.size /
                1024
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

        <div className="github-section-title">
          <h3>
            Upload destination
          </h3>

          <span>
            MartechAdobe / Adobe
          </span>
        </div>


        {/* BREADCRUMB */}

        <div className="github-breadcrumb">

          <button
            type="button"
            onClick={() =>
              loadFolder("")
            }
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
                key={`${part}-${index}`}
                className="github-breadcrumb-item"
              >
                <span>
                  /
                </span>

                <button
                  type="button"
                  onClick={() =>
                    openBreadcrumb(index)
                  }
                >
                  {part}
                </button>
              </div>
            )
          )}
        </div>


        {/* FOLDER VIEW */}

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
            <div className="github-folder-status">
              Loading folders...
            </div>
          ) : error ? (
            <div className="github-folder-error">
              {error}
            </div>
          ) : folders.length ? (
            <div className="github-folder-list">

              {folders.map(
                (folder) => (
                  <button
                    type="button"
                    key={folder.path}
                    className={
                      currentPath ===
                      folder.path
                        ? "github-folder selected"
                        : "github-folder"
                    }
                    onClick={() =>
                      openFolder(
                        folder.path
                      )
                    }
                  >
                    <span className="github-folder-icon">
                      📁
                    </span>

                    <span className="github-folder-name">
                      {folder.name}
                    </span>

                    <span className="github-folder-arrow">
                      →
                    </span>
                  </button>
                )
              )}

            </div>
          ) : (
            <div className="github-folder-status">
              No subfolders in this location.
            </div>
          )}


          {files.length > 0 && (
            <div className="github-existing-files">

              <h4>
                Existing files
              </h4>

              {files.map(
                (file) => (
                  <div
                    key={file.path}
                    className="github-existing-file"
                  >
                    <span>
                      📄
                    </span>

                    <span>
                      {file.name}
                    </span>
                  </div>
                )
              )}

            </div>
          )}

        </div>
      </div>


      {/* COMMIT */}

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
          placeholder="Add new asset"
        />

      </div>


      {/* SELECTED PATH */}

      <div className="github-selected-path">

        <span>
          Destination
        </span>

        <strong>
          Adobe/
          {currentPath
            ? `${currentPath}/`
            : ""}
        </strong>

      </div>


      {/* UPLOAD */}

      <button
        type="button"
        className="github-upload-button"

        disabled={
          !selectedFile ||
          !currentPath ||
          !commitMessage
        }
      >
        Upload to GitHub
      </button>

    </section>
  );
}