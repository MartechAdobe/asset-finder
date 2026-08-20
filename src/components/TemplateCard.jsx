export default function TemplateCard({
  template,
  onPreview,
  thumbnailHtml
}) {

  const fileName =
    template.path.split("/").pop();

  const extension =
    fileName.includes(".")
      ? fileName
          .split(".")
          .pop()
          .toUpperCase()
      : "FILE";


  return (
    <article className="template-card">

      {/* ============================= */}
      {/* THUMBNAIL */}
      {/* ============================= */}

      <div
        className="template-thumbnail"
        onClick={() => {
          if (extension === "HTML") {
            onPreview(template);
          }
        }}
      >

        {extension === "HTML" && thumbnailHtml ? (

          <iframe
            srcDoc={thumbnailHtml}
            title={`Preview of ${fileName}`}
            className="thumbnail-frame"
            sandbox=""
            tabIndex="-1"
          />

        ) : extension === "HTML" ? (

          <div className="thumbnail-loading">
            <span>
              Loading preview...
            </span>
          </div>

        ) : (

          <div className="template-icon">
            FILE
          </div>

        )}


        {extension === "HTML" && (
          <div className="thumbnail-overlay">
            <span>
              Preview
            </span>
          </div>
        )}

      </div>


      {/* ============================= */}
      {/* CONTENT */}
      {/* ============================= */}

      <div className="template-content">

        <h3>
          {template.title || fileName}
        </h3>


        {template.subject && (
          <p className="template-subject">
            {template.subject}
          </p>
        )}


        <p className="template-path">
          {template.path}
        </p>


        <div className="template-meta">

          <span>
            {extension}
          </span>

          <span>
            •
          </span>

          <span>
            main
          </span>

        </div>


        <div className="template-actions">

          {extension === "HTML" && (

            <button
              className="preview-button"
              onClick={() =>
                onPreview(template)
              }
            >
              Preview
            </button>

          )}


          <a
            href={template.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="github-button"
          >
            Open GitHub ↗
          </a>

        </div>

      </div>

    </article>
  );
}