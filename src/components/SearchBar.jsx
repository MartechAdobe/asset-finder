import { useState } from "react";

export default function SearchBar({
  onSearch,
  loading
}) {
  const [query, setQuery] = useState("");

  const handleSubmit = event => {
    event.preventDefault();

    if (!query.trim()) return;

    onSearch(query.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="search-form"
    >
      <div className="search-input-wrapper">
        <span className="search-icon">⌕</span>

        <input
          value={query}
          onChange={event =>
            setQuery(event.target.value)
          }
          placeholder="Search templates, events, assets..."
        />

        {query && (
          <button
            type="button"
            className="clear-button"
            onClick={() => setQuery("")}
          >
            ×
          </button>
        )}
      </div>

      <button
        type="submit"
        className="search-button"
        disabled={loading}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}