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
        data.folders || []
      );

      setFiles(
        data.files || []
      );

      setCurrentPath(
        data.current_path || path
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


    const parts =
      currentPath
        .split("/")
        .filter(Boolean);


    parts.pop();


    const parentPath =
      parts.join("/");


    loadFolder(
      parentPath
    );

  }


  // =========================================================
  // FILE SELECT
  // =========================================================

  function selectFile(file) {

    if (!file) {
      return;
    }


    setSelectedFile(
      file
    );

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

    const path =
      breadcrumbs
        .slice(
          0,
          index + 1
        )
        .join("/");


    loadFolder(path);

  }


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


          /*
           * FileReader gives:
           *
           * data:image/png;base64,XXXXX
           *
           * We only send XXXXX to the Worker.
           */

          const commaIndex =
            result.indexOf(",");


          const base64 =
            commaIndex >= 0
              ? result.slice(
                  commaIndex + 1
                )
              : result;


          resolve(
            base64
          );

        };


        reader.onerror = () => {

          reject(
            new Error(
              "Unable to read selected file."
            )
          );

        };


        reader.readAsDataURL(
          file
        );

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


    /*
     * Prevent folder names containing
     * path separators.
     */

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

          path:
            folderPath,

          message:
            `Create folder ${folderName}`

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


      /*
       * Refresh the current location.
       */

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


      /*
       * Convert the local file to base64.
       */

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

          path:
            targetPath,

          content:
            base64,

          message:
            commitMessage.trim() ||
            `Add ${selectedFile.name}`

        });


      console.log(
        "UPLOAD RESPONSE:",
        result
      );


      setUploadSuccess(
        result.message ||
        "File uploaded successfully."
      );


      /*
       * Refresh folder contents so the
       * uploaded file appears immediately.
       */

      await loadFolder(
        currentPath
      );


      /*
       * Clear selected file after
       * successful upload.
       */

      setSelectedFile(
        null
      );


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


      {/* =====================================================
          HEADER
      ====================================================== */}

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


      {/* =====================================================
          DROP ZONE
      ====================================================== */}

      <div
        className={
          dragging
            ? "github-dropzone dragging"
            : "github-dropzone"
        }

        onDragOver={
          handleDragOver
        }

        onDragLeave={
          handleDragLeave
        }

        onDrop={
          handleDrop
        }
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
            onChange={
              handleFileInput
            }
          />

        </label>

      </div>


      {/* =====================================================
          SELECTED FILE
      ====================================================== */}

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
              setSelectedFile(
                null
              )
            }
          >
            Remove
          </button>

        </div>

      )}


      {/* =====================================================
          DESTINATION
      ====================================================== */}

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

              setShowCreateFolder(
                true
              );

              setUploadError("");
              setUploadSuccess("");

            }}
          >
            + New folder
          </button>

        </div>


        {/* ===================================================
            CREATE FOLDER FORM
        ================================================== */}

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
                value={
                  newFolderName
                }

                onChange={(event) =>
                  setNewFolderName(
                    event.target.value
                  )
                }

                placeholder="Folder name"

                autoFocus

                disabled={
                  creatingFolder
                }
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

                disabled={
                  creatingFolder
                }
              >
                Cancel
              </button>

            </div>

          </div>

        )}


        {/* ===================================================
            BREADCRUMB
        ================================================== */}

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
                    openBreadcrumb(
                      index
                    )
                  }
                >
                  {part}
                </button>

              </div>

            )
          )}

        </div>


        {/* ===================================================
            FOLDER BROWSER
        ================================================== */}

        <div className="github-folder-browser">


          {currentPath && (

            <button
              type="button"
              className="github-back-button"

              onClick={
                goBack
              }
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

                    key={
                      folder.path
                    }

                    className={
                      "github-folder"
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


          {/* =================================================
              EXISTING FILES
          ================================================== */}

          {files.length > 0 && (

            <div className="github-existing-files">

              <h4>
                Existing files
              </h4>


              {files.map(
                (file) => (

                  <div
                    key={
                      file.path
                    }

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


      {/* =====================================================
          SUCCESS / ERROR
      ====================================================== */}

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


      {/* =====================================================
          COMMIT MESSAGE
      ====================================================== */}

      <div className="github-commit-section">

        <label>
          Commit message
        </label>


        <input
          type="text"

          value={
            commitMessage
          }

          onChange={(event) =>
            setCommitMessage(
              event.target.value
            )
          }

          placeholder="Add new asset"

          disabled={
            uploading
          }
        />

      </div>


      {/* =====================================================
          DESTINATION
      ====================================================== */}

      <div className="github-selected-path">

        <span>
          Destination
        </span>


        <strong>

          Adobe/

          {currentPath
            ? `${currentPath}/`
            : "Select a folder"}

        </strong>

      </div>


      {/* =====================================================
          UPLOAD
      ====================================================== */}

      <button
        type="button"

        className="github-upload-button"

        disabled={
          !selectedFile ||
          !currentPath ||
          uploading
        }

        onClick={
          handleUpload
        }
      >

        {uploading
          ? "Uploading..."
          : "Upload to GitHub"}

      </button>


    </section>
  );
}