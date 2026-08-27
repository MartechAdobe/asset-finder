import { useState } from "react";

import TemplateEditor from "./components/TemplateEditor";
import SearchBar from "./components/SearchBar";
import CategoryFilters from "./components/CategoryFilters";
import Results from "./components/Results";
import PreviewModal from "./components/PreviewModal";
import ImageEditor from "./components/ImageEditor";
import GitHubUpload from "./components/GitHubUpload";
import MicrosoftLogin
  from "./components/MicrosoftLogin";

import {
  searchRepository,
  getFile,
  getFolders,
} from "./services/githubApi";

import { decodeBase64 } from "./utils/decode";

export default function App() {
  // =========================================================
  // TEMPLATE EDITOR STATE
  // =========================================================

  const [editorTemplate, setEditorTemplate] = useState(null);
  const [editorHtml, setEditorHtml] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState("");

  // =========================================================
  // SEARCH STATE
  // =========================================================

  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // THUMBNAIL STATE
  // =========================================================

  const [thumbnailHtml, setThumbnailHtml] = useState({});

  // =========================================================
  // PREVIEW STATE
  // =========================================================

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // =========================================================
  // ACTIVE PAGE
  // =========================================================

  const [activePage, setActivePage] = useState("finder");

  // =========================================================
  // TEMPORARY GITHUB FOLDER TEST
  // =========================================================

  async function testFolders() {
    console.log("=================================");
    console.log("Testing GitHub Folder API...");
    console.log("=================================");

    try {
      const data = await getFolders();

      console.log("FOLDER API RESPONSE:");
      console.log(data);

      console.log("Folders:");

      if (data?.folders) {
        data.folders.forEach((folder, index) => {
          console.log(
            `${index + 1}. ${folder.name} → ${folder.path}`
          );
        });
      }

      console.log("=================================");
      console.log("Folder API test completed.");
      console.log("=================================");
    } catch (error) {
      console.error("=================================");
      console.error("FOLDER API ERROR:");
      console.error(error);
      console.error("=================================");
    }
  }

  // =========================================================
  // SEARCH
  // =========================================================

  async function handleSearch(searchQuery) {
    setLoading(true);
    setError("");
    setQuery(searchQuery);

    // Clear previous thumbnails
    setThumbnailHtml({});

    try {
      const data = await searchRepository(searchQuery);

      const searchResults = data.results || [];

      setResults(searchResults);

      // Load thumbnails for HTML results
      loadThumbnails(searchResults);
    } catch (err) {
      console.error("Search failed:", err);

      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOAD HTML THUMBNAILS
  // =========================================================

  async function loadThumbnails(templates) {
    const htmlTemplates = templates
      .filter(
        (template) =>
          template.path &&
          template.path.toLowerCase().endsWith(".html")
      )
      .slice(0, 12);

    for (const template of htmlTemplates) {
      try {
        const data = await getFile(template.path);

        const fileData = data.data;

        if (!fileData?.content) {
          continue;
        }

        const html = decodeBase64(fileData.content);

        setThumbnailHtml((previous) => ({
          ...previous,
          [template.path]: html,
        }));
      } catch (error) {
        console.error(
          "Thumbnail failed:",
          template.path,
          error
        );
      }
    }
  }

  // =========================================================
  // EDIT TEMPLATE
  // =========================================================

  async function handleEdit(template) {
    setEditorTemplate(template);
    setEditorHtml("");
    setEditorError("");
    setEditorLoading(true);

    try {
      let html = thumbnailHtml[template.path];

      if (!html) {
        const data = await getFile(template.path);

        const fileData = data.data;

        if (!fileData?.content) {
          throw new Error(
            "This file does not contain editable HTML."
          );
        }

        html = decodeBase64(fileData.content);
      }

      setEditorHtml(html);
    } catch (error) {
      console.error("Template edit failed:", error);

      setEditorError(error.message);
    } finally {
      setEditorLoading(false);
    }
  }

  // =========================================================
  // CLOSE TEMPLATE EDITOR
  // =========================================================

  function closeEditor() {
    setEditorTemplate(null);
    setEditorHtml("");
    setEditorError("");
  }

  // =========================================================
  // PREVIEW TEMPLATE
  // =========================================================

  async function handlePreview(template) {
    setSelectedTemplate(template);
    setPreviewHtml("");
    setPreviewError("");
    setPreviewLoading(true);

    try {
      // Use already-loaded thumbnail HTML
      let html = thumbnailHtml[template.path];

      // Otherwise fetch it
      if (!html) {
        const data = await getFile(template.path);

        const fileData = data.data;

        if (!fileData?.content) {
          throw new Error(
            "This file does not contain previewable content."
          );
        }

        html = decodeBase64(fileData.content);
      }

      setPreviewHtml(html);
    } catch (err) {
      console.error("Preview failed:", err);

      setPreviewError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  // =========================================================
  // CLOSE PREVIEW
  // =========================================================

  function closePreview() {
    setSelectedTemplate(null);
    setPreviewHtml("");
    setPreviewError("");
  }

  // =========================================================
  // CATEGORY SEARCH
  // =========================================================

  function handleCategory(category) {
    if (!category) {
      return;
    }

    handleSearch(category);
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="header">

        {/* BRAND */}

        <div className="brand">

          <div className="adobe-mark">
            A
          </div>

          <div>
            <h1>
              Adobe Template Finder
            </h1>

            <span>
              MartechAdobe / Adobe
            </span>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="main-nav">

          {/* FINDER */}

          <button
            type="button"
            className={
              activePage === "finder"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("finder")
            }
          >
            Asset Finder
          </button>

          {/* IMAGE EDITOR */}

          <button
            type="button"
            className={
              activePage === "image-editor"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("image-editor")
            }
          >
            Image Editor
          </button>

          {/* GITHUB UPLOAD */}

          <button
            type="button"
            className={
              activePage === "github-upload"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("github-upload")
            }
          >
            GitHub Upload
          </button>

        </nav>

        {/* BRANCH */}

        <div className="branch">

          <span className="status-dot" />

          main

        </div>

            <MicrosoftLogin />
      </header>


      {/* =====================================================
          ASSET FINDER
      ====================================================== */}

      {activePage === "finder" && (
        <main>

          <section className="hero">

            <p className="eyebrow">
              REPOSITORY SEARCH
            </p>

            <h2>
              Find the right template.
            </h2>

            <p className="hero-description">
              Search the Adobe repository for HTML
              templates, event assets, newsletters,
              landing pages and more.
            </p>

            {/* SEARCH */}

            <SearchBar
              onSearch={handleSearch}
              loading={loading}
            />


            {/* =================================================
                TEMPORARY FOLDER TEST BUTTON
            ================================================== */}

            <button
              type="button"
              onClick={testFolders}
              style={{
                marginTop: "20px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#222",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Test GitHub Folders
            </button>


            {/* CATEGORY FILTERS */}

            <CategoryFilters
              onSelect={handleCategory}
            />

          </section>


          {/* SEARCH ERROR */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {/* SEARCH RESULTS */}

          <Results
            results={results}
            query={query}
            loading={loading}
            onPreview={handlePreview}
            onEdit={handleEdit}
            thumbnailHtml={thumbnailHtml}
          />

        </main>
      )}


      {/* =====================================================
          IMAGE EDITOR
      ====================================================== */}

      {activePage === "image-editor" && (
        <main>

          <ImageEditor />

        </main>
      )}


      {/* =====================================================
          GITHUB UPLOAD
      ====================================================== */}

      {activePage === "github-upload" && (
        <main>

          <GitHubUpload />

        </main>
      )}


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer>

        <span>
          Adobe Repository Finder
        </span>

        <a
          href="https://github.com/MartechAdobe/Adobe"
          target="_blank"
          rel="noopener noreferrer"
        >
          View repository ↗
        </a>

      </footer>


      {/* =====================================================
          PREVIEW MODAL
      ====================================================== */}

      <PreviewModal
        template={selectedTemplate}
        html={previewHtml}
        loading={previewLoading}
        error={previewError}
        onClose={closePreview}
      />


      {/* =====================================================
          EDITOR LOADING
      ====================================================== */}

      {editorLoading && (
        <div className="editor-loading">
          Loading template...
        </div>
      )}


      {/* =====================================================
          EDITOR ERROR
      ====================================================== */}

      {editorError && (
        <div className="editor-error">
          {editorError}
        </div>
      )}


      {/* =====================================================
          TEMPLATE EDITOR
      ====================================================== */}

      {editorTemplate &&
        editorHtml &&
        !editorLoading && (
          <TemplateEditor
            template={editorTemplate}
            html={editorHtml}
            onClose={closeEditor}
          />
        )}

    </div>
  );
}