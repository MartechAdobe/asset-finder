import { useState } from "react";

import {
  searchFigmaAssets
} from "../services/figmaApi";

// import "../figma.css";


export default function FigmaAssetFinder() {

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searched, setSearched] =
    useState(false);


  async function handleSearch(event) {

    event?.preventDefault();

    const searchQuery =
      query.trim();

    if (!searchQuery) {
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {

      const data =
        await searchFigmaAssets(
          searchQuery,
          {
            limit: 20,
            preview: true
          }
        );

      setResults(
        data.results || []
      );

    } catch (error) {

      console.error(
        "Figma search failed:",
        error
      );

      setError(
        error.message
      );

      setResults([]);

    } finally {

      setLoading(false);

    }
  }


  function clearSearch() {

    setQuery("");
    setResults([]);
    setError("");
    setSearched(false);

  }


  return (
    <main className="figma-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="figma-hero">

        <div className="figma-eyebrow">
          FIGMA ASSET FINDER
        </div>

        <h1>
          Find design assets.
        </h1>

        <p>
          Search across your Figma files
          and quickly find the exact
          component, template or design
          asset you need.
        </p>


        <form
          className="figma-search"
          onSubmit={handleSearch}
        >

          <div className="figma-search-input">

            <span className="figma-search-icon">
              ⌕
            </span>

            <input
              type="text"
              value={query}
              placeholder="Search Figma assets..."
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              disabled={loading}
            />

            {query && (
              <button
                type="button"
                className="figma-clear"
                onClick={clearSearch}
              >
                ×
              </button>
            )}

          </div>


          <button
            type="submit"
            className="figma-search-button"
            disabled={
              loading ||
              !query.trim()
            }
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>

        </form>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="figma-error">

          <strong>
            Search failed
          </strong>

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (

        <section className="figma-loading">

          <div className="figma-spinner" />

          <p>
            Searching your Figma assets...
          </p>

        </section>

      )}


      {/* =================================================
          RESULTS
      ================================================= */}

      {!loading &&
        searched &&
        !error && (

        <section className="figma-results">

          <div className="figma-results-header">

            <div>

              <h2>
                Search results
              </h2>

              <p>
                {results.length} asset
                {results.length !== 1
                  ? "s"
                  : ""}{" "}
                found for "
                {query}"
              </p>

            </div>

          </div>


          {results.length === 0 ? (

            <div className="figma-no-results">

              <div className="figma-no-results-icon">
                ∅
              </div>

              <h3>
                No results found
              </h3>

              <p>
                Try a different keyword,
                component name or template
                title.
              </p>

            </div>

          ) : (

            <div className="figma-results-grid">

              {results.map((asset) => (

                <article
                  className="figma-card"
                  key={
                    asset.assetId ||
                    `${asset.fileKey}-${asset.nodeId}`
                  }
                >

                  {/* Preview */}

                  <div className="figma-card-preview">

                    {asset.previewUrl ? (

                      <img
                        src={asset.previewUrl}
                        alt={asset.name}
                        loading="lazy"
                      />

                    ) : (

                      <div className="figma-no-preview">
                        No preview available
                      </div>

                    )}

                  </div>


                  {/* Content */}

                  <div className="figma-card-content">

                    <div className="figma-card-type">
                      {asset.type}
                    </div>

                    <h3>
                      {asset.name}
                    </h3>


                    {asset.fileName && (

                      <div className="figma-meta">

                        <span>
                          File
                        </span>

                        <strong>
                          {asset.fileName}
                        </strong>

                      </div>

                    )}


                    {asset.pageName && (

                      <div className="figma-meta">

                        <span>
                          Page
                        </span>

                        <strong>
                          {asset.pageName}
                        </strong>

                      </div>

                    )}


                    {asset.description && (

                      <p className="figma-description">
                        {asset.description}
                      </p>

                    )}


                    <div className="figma-card-actions">

                      <a
                        href={
                          asset.figmaUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="figma-open-button"
                      >
                        Open in Figma ↗
                      </a>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      )}

    </main>
  );
}