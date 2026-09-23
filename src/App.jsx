import { useState } from "react";

import TemplateEditor from "./components/TemplateEditor";
import SearchBar from "./components/SearchBar";
import CategoryFilters from "./components/CategoryFilters";
import ResultFilters
  from "./components/ResultFilters";
  import SearchScope
  from "./components/SearchScope";
import Results from "./components/Results";
import PreviewModal from "./components/PreviewModal";
import ImageEditor from "./components/ImageEditor";
import GitHubUpload from "./components/GitHubUpload";
import logo from "../public/favicon.png"

import FigmaAssetFinder
  from "./components/FigmaAssetFinder";

// import MicrosoftLogin
//   from "./components/MicrosoftLogin";


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
  const [searchScope, setSearchScope] =
  useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fileType, setFileType] =
  useState("All");

const [sortBy, setSortBy] =
  useState("relevance");

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

  const filteredResults =
  [...results]
    .filter((template) => {

      if (fileType === "All") {
        return true;
      }

      const fileName =
        template.path
          ?.split("/")
          .pop()
          ?.toLowerCase() || "";

      if (fileType === "HTML") {
        return (
          fileName.endsWith(".html") ||
          fileName.endsWith(".htm")
        );
      }

      return true;
    })
    .sort((a, b) => {

      if (sortBy === "az") {
        return String(
          a.title || a.path || ""
        ).localeCompare(
          String(
            b.title || b.path || ""
          )
        );
      }

      if (sortBy === "za") {
        return String(
          b.title || b.path || ""
        ).localeCompare(
          String(
            a.title || a.path || ""
          )
        );
      }

      return (
        Number(b.score || 0) -
        Number(a.score || 0)
      );
    });

 

  // =========================================================
  // SEARCH
  // =========================================================

  async function handleSearch(searchQuery) {
    setLoading(true);
    setError("");
    setQuery(searchQuery);

    setFileType("All");
setSortBy("relevance");

    // Clear previous thumbnails
    setThumbnailHtml({});

    try {
      const data = await searchRepository(searchQuery,  searchScope);

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

        // const html = decodeBase64(fileData.content);

      const html = decodeBase64(fileData.content);

const thumbnailHtml = `
<!DOCTYPE html>
<html>
<head>

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <style>

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 0 !important;
      overflow-x: hidden !important;
      background: #ffffff !important;
    }

    * {
      box-sizing: border-box;
    }

    img {
      max-width: 100% !important;
      height: auto;
    }

    table {
      max-width: 100% !important;
    }

    body > table,
    body > div,
    body > center {
      max-width: 100% !important;
    }

  </style>

</head>

<body>

  ${html}

</body>
</html>
`;

setThumbnailHtml((previous) => ({
  ...previous,
  [template.path]: thumbnailHtml,
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

 function handleCategory(
  category
) {
  if (!category) {
    setQuery("");
    setResults([]);
    setError("");
    setThumbnailHtml({});

    setSearchScope("");

    setFileType("All");
    setSortBy("relevance");

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
            <img src={logo} alt="" width="100%"/>
          </div>

          <div>
            <h1>
              Adobe Template Finder
            </h1>

            {/* <span>
              MartechAdobe / Adobe
            </span> */}
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

          <button
  type="button"
  className={
    activePage === "figma"
      ? "nav-item active"
      : "nav-item"
  }
  onClick={() =>
    setActivePage("figma")
  }
>
  Figma Asset Finder
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

            {/* <MicrosoftLogin /> */}
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

            <SearchScope
  value={searchScope}
  onChange={(value) =>
    setSearchScope(value)
  }
/>


            {/* =================================================
                TEMPORARY FOLDER TEST BUTTON
            ================================================== */}

           


            {/* CATEGORY FILTERS */}

            <CategoryFilters
              onSelect={handleCategory}
            />

            {results.length > 0 && (
  <ResultFilters
    results={filteredResults}
    fileType={fileType}
    onFileTypeChange={setFileType}
    sortBy={sortBy}
    onSortChange={setSortBy}
  />
)}

          </section>


          {/* SEARCH ERROR */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {/* SEARCH RESULTS */}

       {query && (
  <div className="search-context">
    Searching in:{" "}
    <strong>
      {searchScope || "Entire repository"}
    </strong>
  </div>
)}

<Results
  results={filteredResults}
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

  {activePage === "figma" && (
  <FigmaAssetFinder />
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