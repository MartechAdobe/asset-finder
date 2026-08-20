import TemplateCard from "./TemplateCard";

export default function Results({
  results,
  query,
  loading,
  onPreview,
  onEdit,
  thumbnailHtml
}) {

  // Initial state
  if (!query) {
    return (
      <div className="empty-state">

        <div className="empty-icon">
          ⌕
        </div>

        <h2>
          Search the Adobe repository
        </h2>

        <p>
          Find HTML templates, newsletters,
          summit assets, landing pages and more.
        </p>

      </div>
    );
  }


  // SEARCHING STATE
  if (loading) {
    return (
      <section className="results-section">

        <div className="results-header">

          <div>
            <p className="eyebrow">
              SEARCHING REPOSITORY
            </p>

            <h2>
              Finding templates...
            </h2>
          </div>

        </div>


        <div className="results-grid">

          {[1, 2, 3, 4].map(item => (
            <div
              className="template-card skeleton-card"
              key={item}
            >

              {/* Thumbnail skeleton */}
              <div className="skeleton-thumbnail" />

              {/* Content skeleton */}
              <div className="skeleton-content">

                <div className="skeleton-line title" />

                <div className="skeleton-line" />

                <div className="skeleton-line short" />

                <div className="skeleton-buttons">

                  <div className="skeleton-button" />

                  <div className="skeleton-button small" />

                </div>

              </div>

            </div>
          ))}

        </div>

      </section>
    );
  }


  // NO RESULTS STATE
  if (!results.length) {
    return (
      <div className="empty-state">

        <div className="empty-icon">
          ∅
        </div>

        <h2>
          No results found
        </h2>

        <p>
          Try a different keyword or template name.
        </p>

      </div>
    );
  }


  // RESULTS
  return (
    <section className="results-section">

      <div className="results-header">

        <div>

          <p className="eyebrow">
            SEARCH RESULTS
          </p>

          <h2>
            Results for "{query}"
          </h2>

        </div>

        <span className="result-count">
          {results.length} files
        </span>

      </div>


      <div className="results-grid">

        {results.map((template, index) => (

         <TemplateCard
  key={`${template.sha}-${index}`}
  template={template}
  onPreview={onPreview}
  onEdit={onEdit}
  thumbnailHtml={
    thumbnailHtml?.[template.path]
  }
/>

        ))}

      </div>

    </section>
  );
}