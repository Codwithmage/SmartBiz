function Input({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
}) {
  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="mb-2 block text-gray-700"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-4 py-3 focus:outline-none ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gray-300 focus:border-blue-500"
        }`}
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;