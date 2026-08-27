import { useState } from "react";

const categories = [
  "Summit",
  "Newsletter",
  "Roadshow",
  "Bootcamp",
  "Email",
  "Landing Page",
  "Template",
];

export default function CategoryFilters({
  onSelect,
}) {
  const [activeCategory, setActiveCategory] =
    useState("All");

  function handleSelect(category) {
    setActiveCategory(category);

    /*
     * "All" sends an empty query.
     * Other categories search normally.
     */
    onSelect(
      category === "All"
        ? ""
        : category
    );
  }

  return (
    <div className="categories">

      <button
        type="button"
        className={
          activeCategory === "All"
            ? "category active"
            : "category"
        }
        onClick={() =>
          handleSelect("All")
        }
      >
        All
      </button>

      {categories.map(
        (category) => (
          <button
            type="button"
            key={category}
            className={
              activeCategory === category
                ? "category active"
                : "category"
            }
            onClick={() =>
              handleSelect(category)
            }
          >
            {category}
          </button>
        )
      )}

    </div>
  );
}