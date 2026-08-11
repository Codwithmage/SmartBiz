function CategorySelect({
  value,
  onChange,
  categories = [],
  error,
  required,
}) {
  return (
    <div>
      <label htmlFor="categoryId" className="block text-sm font-medium mb-1">
        Category {required && "*"}
      </label>
      <select
        id="categoryId"
        name="categoryId"
        value={value || ""}
        onChange={onChange}
        className="w-full border p-2 rounded-md"
        required={required}
      >
        <option value="">-- Select Category --</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name || cat.category_name || "Unnamed Category"}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default CategorySelect;