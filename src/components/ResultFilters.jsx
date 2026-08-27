export default function ResultFilters({
  results,
  fileType,
  onFileTypeChange,
  sortBy,
  onSortChange,
}) {
  const fileTypes = [
    "All",
    "HTML",
  ];

  return (
    <div className="result-filters">

      {/* FILE TYPE */}

      <div className="result-filter">

        <label htmlFor="file-type">
          Type
        </label>

        <select
          id="file-type"
          value={fileType}
          onChange={(event) =>
            onFileTypeChange(
              event.target.value
            )
          }
        >
          {fileTypes.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            )
          )}
        </select>

      </div>


      {/* SORT */}

      <div className="result-filter">

        <label htmlFor="sort-by">
          Sort
        </label>

        <select
          id="sort-by"
          value={sortBy}
          onChange={(event) =>
            onSortChange(
              event.target.value
            )
          }
        >

          <option value="relevance">
            Relevance
          </option>

          <option value="az">
            A–Z
          </option>

          <option value="za">
            Z–A
          </option>

        </select>

      </div>


      {/* RESULT COUNT */}

      <div className="result-filter-count">

        {results.length}{" "}
        {results.length === 1
          ? "template"
          : "templates"}

      </div>

    </div>
  );
}