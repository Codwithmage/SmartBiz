function Textarea({
  label,
  error,
  rows = 4,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-2">

      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        className={`
          w-full rounded-lg border border-gray-300
          px-3 py-2
          focus:border-blue-500
          focus:outline-none
          focus:ring-2
          focus:ring-blue-200
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

    </div>
  );
}

export default Textarea;