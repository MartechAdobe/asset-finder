const categories = [
  "Summit",
  "Newsletter",
  "Roadshow",
  "Bootcamp",
  "Email",
  "Landing Page",
  "Template"
];

export default function CategoryFilters({
  onSelect
}) {
  return (
    <div className="categories">
      <button
        className="category active"
        onClick={() => onSelect("")}
      >
        All
      </button>

      {categories.map(category => (
        <button
          key={category}
          className="category"
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}