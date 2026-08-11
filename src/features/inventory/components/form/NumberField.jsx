function NumberField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "0",
  error,
  required = false,
  step = "any",
  min = "0",
  disabled = false,
}) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="number"
        id={id}
        name={name}
        // Ensure empty state stays an empty string instead of forcing 0
        value={value === null || value === undefined ? "" : value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
        disabled={disabled}
        className={`w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? "border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:ring-blue-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default NumberField;