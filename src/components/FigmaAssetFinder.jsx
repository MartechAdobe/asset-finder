import { useState } from "react";

import {
  searchFigmaAssets,
} from "../services/figmaApi";

export default function FigmaAssetFinder() {

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function handleSearch() {

    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {

      const data =
        await searchFigmaAssets(
          query
        );

      setResults(
        data.results || []
      );

    } catch (err) {

      console.error(
        "Figma search failed:",
        err
      );

      setError(
        err.message
      );

    } finally {

      setLoading(false);

    }

  }


  return (
    <main>

      <section className="hero">

        <p className="eyebrow">
          FIGMA ASSET SEARCH
        </p>

        <h2>
          Find design assets.
        </h2>

        <p>
          Search across your connected
          Figma files for components,
          frames, text and other assets.
        </p>

        <div>

          <input
            type="text"
            value={query}
            placeholder="Search Figma assets..."
            onChange={(event) =>
              setQuery(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button
            type="button"
            onClick={handleSearch}
            disabled={
              loading ||
              !query.trim()
            }
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>

        </div>

      </section>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <section>

        {results.map((asset) => (

          <article
            key={asset.assetId}
          >

            {asset.previewUrl && (
              <img
                src={asset.previewUrl}
                alt={asset.name}
              />
            )}

            <h3>
              {asset.name}
            </h3>

            <p>
              File: {asset.fileName}
            </p>

            <p>
              Page: {asset.pageName}
            </p>

            <p>
              Type: {asset.type}
            </p>

            <a
              href={asset.figmaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Figma ↗
            </a>

          </article>

        ))}

      </section>

    </main>
  );
}