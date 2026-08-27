import { useEffect, useState } from "react";

const API_URL =
  "https://adobe-github-api.akshanshdogra.workers.dev";

export default function SearchScope({
  value,
  onChange,
}) {
  const [folders, setFolders] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/tree`
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load repository folders."
        );
      }

      const tree =
        data?.data?.tree ||
        data?.tree ||
        [];

      const folderSet =
        new Set();

      for (const item of tree) {
        if (
          item.type !== "blob" ||
          !item.path
        ) {
          continue;
        }

        const parts =
          item.path
            .split("/")
            .filter(Boolean);

        // Remove filename
        parts.pop();

        for (
          let index = 0;
          index < parts.length;
          index++
        ) {
          const folderPath =
            parts
              .slice(
                0,
                index + 1
              )
              .join("/");

          folderSet.add(
            folderPath
          );
        }
      }

      const sortedFolders =
        Array.from(
          folderSet
        )
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          )
          .map(
            (path) => ({
              path,
              label: path,
            })
          );

      setFolders(
        sortedFolders
      );

    } catch (error) {
      console.error(
        "Folder loading failed:",
        error
      );

      setError(
        error.message ||
          "Unable to load folders."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-scope">

      <label htmlFor="search-scope">
        Search in
      </label>

      <select
        id="search-scope"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        disabled={loading}
      >
        <option value="">
          Entire repository
        </option>

        {folders.map(
          (folder) => (
            <option
              key={folder.path}
              value={folder.path}
            >
              {folder.label}
            </option>
          )
        )}
      </select>

      {loading && (
        <span className="scope-loading">
          Loading folders...
        </span>
      )}

      {error && (
        <span className="scope-error">
          Unable to load folders
        </span>
      )}

    </div>
  );
}