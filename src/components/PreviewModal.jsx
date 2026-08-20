export default function PreviewModal({
  template,
  html,
  loading,
  error,
  onClose
}) {
  if (!template) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >

      <div className="preview-modal">

        <header className="preview-header">

          <div>
            <p className="eyebrow">
              HTML PREVIEW
            </p>

            <h2>
              {template.path.split("/").pop()}
            </h2>

            <p>
              {template.path}
            </p>
          </div>

          <button
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>

        </header>

        <div className="preview-body">

          {loading && (
            <div className="preview-loading">
              Loading template...
            </div>
          )}

          {error && (
            <div className="preview-error">
              {error}
            </div>
          )}

          {!loading && !error && html && (
            <iframe
              title="HTML Template Preview"
              srcDoc={html}
              sandbox="allow-scripts allow-forms"
            />
          )}

        </div>

      </div>

    </div>
  );
}