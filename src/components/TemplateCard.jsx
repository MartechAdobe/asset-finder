export default function TemplateCard({
  template,
  onPreview,
  onEdit,
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
    title={fileName}
    className="html-thumbnail"
    sandbox=""
  />
) : extension === "HTML" ? (
  <div className="thumbnail-loading">
    <span>Loading preview...</span>
  </div>
) : template.type === "image" && template.raw_url ? (
  <img
    src={template.raw_url}
    alt={fileName}
    className="image-thumbnail"
    loading="lazy"
  />
) : (
  <div className="template-icon">FILE</div>
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

  {extension === "HTML" && (

    <button
      className="edit-button"
      onClick={() =>
        onEdit(template)
      }
    >
      Edit Content
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