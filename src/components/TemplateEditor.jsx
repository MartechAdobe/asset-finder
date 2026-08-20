import { useEffect, useMemo, useState } from "react";

/*
 * Elements that normally contain user-visible content.
 * We do NOT edit TD/TR/TABLE directly because email
 * templates use tables for layout.
 */
const EDITABLE_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "A",
  "LI",
  "SPAN",
  "BUTTON",
  "STRONG",
  "B",
  "EM",
  "I"
]);

const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TITLE",
  "META",
  "HEAD"
]);


/* =========================================================
   FIND EDITABLE TEXT NODES
   ========================================================= */

function getEditableTextNodes(html) {
  const parser = new DOMParser();

  const doc = parser.parseFromString(
    html,
    "text/html"
  );

  const walker = doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT
  );

  const records = [];

  let node;

  while ((node = walker.nextNode())) {

    const parent = node.parentElement;

    if (!parent) {
      continue;
    }

    const parentTag =
      parent.tagName.toUpperCase();

    /*
     * Never touch scripts/styles/etc.
     */
    if (
      IGNORED_TAGS.has(parentTag)
    ) {
      continue;
    }

    /*
     * Ignore whitespace-only nodes.
     */
    const text =
      node.textContent
        .replace(/\s+/g, " ")
        .trim();

    if (!text) {
      continue;
    }

    /*
     * Ignore tiny technical values.
     */
    if (text.length < 2) {
      continue;
    }

    /*
     * Ignore template variables.
     */
    if (
      text.includes("{{") ||
      text.includes("}}") ||
      text.includes("<%") ||
      text.includes("%>")
    ) {
      continue;
    }

    /*
     * Determine a useful label.
     */
    let label = parentTag;

    if (
      /^H[1-6]$/.test(parentTag)
    ) {
      label = "HEADING";
    } else if (
      parentTag === "P"
    ) {
      label = "PARAGRAPH";
    } else if (
      parentTag === "A"
    ) {
      label = "LINK / CTA";
    } else if (
      parentTag === "LI"
    ) {
      label = "LIST ITEM";
    } else if (
      parentTag === "BUTTON"
    ) {
      label = "BUTTON";
    } else if (
      parentTag === "SPAN"
    ) {
      label = "TEXT";
    } else if (
      parentTag === "STRONG" ||
      parentTag === "B"
    ) {
      label = "BOLD TEXT";
    } else if (
      parentTag === "EM" ||
      parentTag === "I"
    ) {
      label = "ITALIC TEXT";
    } else if (
      parentTag === "TD" ||
      parentTag === "TH"
    ) {
      label = "TABLE TEXT";
    }

    records.push({
      id: records.length,
      tag: parentTag.toLowerCase(),
      label,
      text,
      originalText: node.textContent
    });
  }

  return records;
}


/* =========================================================
   APPLY EDITS WITHOUT DESTROYING HTML
   ========================================================= */

function replaceEditableText(
  originalHtml,
  values
) {
  const parser = new DOMParser();

  const doc = parser.parseFromString(
    originalHtml,
    "text/html"
  );

  const walker = doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT
  );

  const textNodes = [];

  let node;

  while ((node = walker.nextNode())) {

    const parent = node.parentElement;

    if (!parent) {
      continue;
    }

    const parentTag =
      parent.tagName.toUpperCase();

    if (
      IGNORED_TAGS.has(parentTag)
    ) {
      continue;
    }

    const text =
      node.textContent
        .replace(/\s+/g, " ")
        .trim();

    if (!text) {
      continue;
    }

    if (text.length < 2) {
      continue;
    }

    if (
      text.includes("{{") ||
      text.includes("}}") ||
      text.includes("<%") ||
      text.includes("%>")
    ) {
      continue;
    }

    textNodes.push(node);
  }


  /*
   * IMPORTANT:
   *
   * We change ONLY the text node.
   *
   * We never use:
   *
   * element.textContent = ...
   *
   * Therefore tables, images, links,
   * styles and nested HTML remain intact.
   */

  textNodes.forEach(
    (node, index) => {

      if (
        values[index] === undefined
      ) {
        return;
      }

      const original =
        node.textContent;

      const leading =
        original.match(/^\s*/)?.[0] || "";

      const trailing =
        original.match(/\s*$/)?.[0] || "";

      node.textContent =
        leading +
        values[index] +
        trailing;
    }
  );


  return (
    "<!DOCTYPE html>\n" +
    doc.documentElement.outerHTML
  );
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function TemplateEditor({
  template,
  html,
  onClose
}) {

  const textNodes = useMemo(
    () => getEditableTextNodes(html),
    [html]
  );


  const [values, setValues] =
    useState([]);

  const [previewHtml, setPreviewHtml] =
    useState(html);


  /*
   * Initialize editor fields.
   */

  useEffect(() => {

    setValues(
      textNodes.map(
        item => item.text
      )
    );

    setPreviewHtml(html);

  }, [html, textNodes]);


  /*
   * Update a field.
   */

  function handleChange(
    index,
    value
  ) {

    setValues(previous => {

      const updated = [
        ...previous
      ];

      updated[index] =
        value;

      return updated;

    });

  }


  /*
   * Generate preview.
   *
   * This preserves the complete
   * original HTML structure.
   */

  function updatePreview() {

    const updatedHtml =
      replaceEditableText(
        html,
        values
      );

    setPreviewHtml(
      updatedHtml
    );
  }


  /*
   * Automatically update preview
   * when content changes.
   */

  useEffect(() => {

    if (!html) {
      return;
    }

    const updatedHtml =
      replaceEditableText(
        html,
        values
      );

    setPreviewHtml(
      updatedHtml
    );

  }, [values, html]);


  /*
   * Download edited HTML.
   */

  function downloadHtml() {

    const blob =
      new Blob(
        [previewHtml],
        {
          type:
            "text/html;charset=utf-8"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const originalName =
      template.path
        .split("/")
        .pop()
        .replace(
          /\.html$/i,
          ""
        );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `${originalName}-edited.html`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      url
    );
  }


  return (

    <div
      className="editor-overlay"
      onMouseDown={event => {

        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }

      }}
    >

      <div className="editor-modal">


        {/* =================================================
            HEADER
        ================================================= */}

        <header className="editor-header">

          <div>

            <p className="eyebrow">
              HTML EDITOR
            </p>

            <h2>
              {
                template.path
                  .split("/")
                  .pop()
              }
            </h2>

            <p>
              Edit a local copy.
              The original GitHub
              file will not be changed.
            </p>

          </div>


          <button
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>

        </header>


        {/* =================================================
            BODY
        ================================================= */}

        <div className="editor-layout">


          {/* =================================================
              LEFT
          ================================================= */}

          <aside className="editor-sidebar">


            <div className="editor-sidebar-header">

              <span>
                EDITABLE CONTENT
              </span>

              <span>
                {textNodes.length}
              </span>

            </div>


            <div className="editor-fields">

              {textNodes.length === 0 && (

                <div className="editor-empty">
                  No editable text detected.
                </div>

              )}


              {textNodes.map(
                (item, index) => (

                  <div
                    className="editor-field"
                    key={item.id}
                  >

                    <label>

                      <span>
                        {item.label}
                      </span>

                      <span>
                        #{index + 1}
                      </span>

                    </label>


                    <textarea
                      value={
                        values[index] ||
                        ""
                      }
                      onChange={event =>
                        handleChange(
                          index,
                          event.target.value
                        )
                      }
                      rows={
                        item.text.length > 100
                          ? 5
                          : 2
                      }
                    />

                  </div>

                )
              )}

            </div>


            <div className="editor-actions">

              <button
                className="preview-button"
                onClick={
                  updatePreview
                }
              >
                Preview Changes
              </button>


              <button
                className="download-button"
                onClick={
                  downloadHtml
                }
              >
                Download HTML
              </button>

            </div>

          </aside>


          {/* =================================================
              RIGHT PREVIEW
          ================================================= */}

          <main className="editor-preview">

  <div className="editor-preview-header">
    <span>
      LIVE PREVIEW
    </span>

    <span>
      680px
    </span>
  </div>

  <div className="editor-preview-canvas">

    <iframe
      className="editor-preview-frame"
      title="Edited HTML Preview"
      srcDoc={previewHtml}
    />

  </div>

</main>

        </div>

      </div>

    </div>

  );
}