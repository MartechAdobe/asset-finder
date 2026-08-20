import { useState } from "react";

import SearchBar from "./components/SearchBar";
import CategoryFilters from "./components/CategoryFilters";
import Results from "./components/Results";
import PreviewModal from "./components/PreviewModal";

import {
  searchRepository,
  getFile
} from "./services/githubApi";

import { decodeBase64 } from "./utils/decode";


export default function App() {

  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // HTML used by card thumbnails
  const [thumbnailHtml, setThumbnailHtml] = useState({});

  const [selectedTemplate, setSelectedTemplate] =
    useState(null);

  const [previewHtml, setPreviewHtml] =
    useState("");

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [previewError, setPreviewError] =
    useState("");


  async function handleSearch(searchQuery) {

    setLoading(true);
    setError("");
    setQuery(searchQuery);

    // Clear previous thumbnails
    setThumbnailHtml({});

    try {

      const data =
        await searchRepository(searchQuery);

      const searchResults =
        data.results || [];

      setResults(searchResults);

      // Load thumbnails for HTML results
      loadThumbnails(searchResults);

    } catch (err) {

      setError(err.message);
      setResults([]);

    } finally {

      setLoading(false);

    }
  }


  async function loadThumbnails(templates) {

    // Only load thumbnails for HTML files
    const htmlTemplates =
      templates
        .filter(template =>
          template.path
            .toLowerCase()
            .endsWith(".html")
        )
        .slice(0, 12);

    for (const template of htmlTemplates) {

      try {

        const data =
          await getFile(template.path);

        const fileData =
          data.data;

        if (!fileData?.content) {
          continue;
        }

        const html =
          decodeBase64(fileData.content);

        setThumbnailHtml(previous => ({
          ...previous,
          [template.path]: html
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


  async function handlePreview(template) {

    setSelectedTemplate(template);
    setPreviewHtml("");
    setPreviewError("");
    setPreviewLoading(true);

    try {

      // Use already-loaded thumbnail HTML
      // if available.
      let html =
        thumbnailHtml[template.path];

      // Otherwise fetch it.
      if (!html) {

        const data =
          await getFile(template.path);

        const fileData =
          data.data;

        if (!fileData?.content) {
          throw new Error(
            "This file does not contain previewable content."
          );
        }

        html =
          decodeBase64(fileData.content);
      }

      setPreviewHtml(html);

    } catch (err) {

      setPreviewError(err.message);

    } finally {

      setPreviewLoading(false);

    }
  }


  function closePreview() {

    setSelectedTemplate(null);
    setPreviewHtml("");
    setPreviewError("");

  }


  function handleCategory(category) {

    if (!category) {
      return;
    }

    handleSearch(category);

  }


  return (
    <div className="app">

      <header className="header">

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


        <div className="branch">

          <span className="status-dot" />

          main

        </div>

      </header>


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


          <SearchBar
            onSearch={handleSearch}
            loading={loading}
          />


          <CategoryFilters
            onSelect={handleCategory}
          />

        </section>


        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        <Results
  results={results}
  query={query}
  loading={loading}
  onPreview={handlePreview}
  thumbnailHtml={thumbnailHtml}
/>

      </main>


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


      <PreviewModal
        template={selectedTemplate}
        html={previewHtml}
        loading={previewLoading}
        error={previewError}
        onClose={closePreview}
      />

    </div>
  );
}