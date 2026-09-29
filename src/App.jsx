import { useState } from "react";

import { parseSearchQuery } from "./services/aiSearchApi";

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
const [aiFilters, setAiFilters] = useState(null);

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
// AI SEARCH TEST
// =========================================================

async function testAiSearch() {
  try {
    const result = await parseSearchQuery(
      "Find 2026 summit banners for email"
    );

    console.log("AI RESULT:", result);
  } catch (error) {
    console.error("AI SEARCH ERROR:", error);
  }
}

  // =========================================================
  // TEMPORARY GITHUB FOLDER TEST
  // =========================================================

  // =========================================================
  // AI ASSET TYPE DETECTION
  // =========================================================

  function matchesAssetType(template, assetType) {
    if (!assetType) return true;

    const path = String(template.path || "").toLowerCase();
    const fileName = path.split("/").pop() || "";
    const type = String(assetType).toLowerCase().trim();

    if (type === "image" || type === "images") {
      return (
        fileName.endsWith(".png") ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".gif") ||
        fileName.endsWith(".webp") ||
        fileName.endsWith(".svg")
      );
    }

    if (type === "html" || type === "html template") {
      return (
        fileName.endsWith(".html") ||
        fileName.endsWith(".htm")
      );
    }

    if (type === "video" || type === "videos") {
      return (
        fileName.endsWith(".mp4") ||
        fileName.endsWith(".mov") ||
        fileName.endsWith(".webm") ||
        fileName.endsWith(".m4v")
      );
    }

    if (type === "banner" || type === "banners") {
      return (
        path.includes("banner") ||
        fileName.includes("banner")
      );
    }

    if (type === "template" || type === "templates") {
      return (
        fileName.endsWith(".html") ||
        fileName.endsWith(".htm") ||
        path.includes("template")
      );
    }

    if (type === "component" || type === "components") {
      return path.includes("component");
    }

    return true;
  }

 const filteredResults =
  [...results]
    .filter((template) => {

      const path =
        String(template.path || "");

      const pathSegments =
        path
          .split("/")
          .map(segment =>
            segment.trim().toLowerCase()
          );

      // =====================================================
      // AI YEAR FILTER
      // Example:
      // 2024 -> 2024/...
      // 2026 -> 2026/...
      // =====================================================

      if (aiFilters?.year) {

        const requestedYear =
          String(aiFilters.year)
            .trim()
            .toLowerCase();

        if (
          !pathSegments.includes(
            requestedYear
          )
        ) {
          return false;
        }
      }

      // =====================================================
      // AI QUARTER FILTER
      // Example:
      // FY26_Q1
      // =====================================================

      if (aiFilters?.quarter) {

        const requestedQuarter =
          String(aiFilters.quarter)
            .trim()
            .toLowerCase();

        if (
          !pathSegments.includes(
            requestedQuarter
          )
        ) {
          return false;
        }
      }

      // =====================================================
      // AI ASSET TYPE FILTER
      // =====================================================

      if (
        aiFilters?.assetType &&
        !matchesAssetType(
          template,
          aiFilters.assetType
        )
      ) {
        return false;
      }

      // =====================================================
      // EXISTING FILE TYPE FILTER
      // =====================================================

      if (fileType === "All") {
        return true;
      }

      const fileName =
        path
          .split("/")
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

    // =======================================================
    // SORT
    // =======================================================

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

  setThumbnailHtml({});

  try {
    // Parse natural-language query using AI
    const aiQuery = await parseSearchQuery(searchQuery);

    console.log("AI QUERY:", aiQuery);

    // Save AI filters
    setAiFilters(aiQuery);

    // Search GitHub using the main search term
    const data = await searchRepository(
      aiQuery.query || searchQuery,
      searchScope
    );

    const searchResults = data.results || [];

    setResults(searchResults);

    loadThumbnails(searchResults);

  } catch (err) {
    console.error("Search failed:", err);

    setError(err.message);
    setResults([]);
    setAiFilters(null);

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
    setAiFilters(null);

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
              GML Search Engine 
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

            {/* <button
  type="button"
  onClick={testAiSearch}
>
  Test AI Search
</button> */}

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