import BaseField from "./BaseField";

function TextAreaField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "",
  error = "",
  required = false,
  disabled = false,
  rows = 4,
}) {
  return (
    <BaseField
      id={id}
      label={label}
      required={required}
      error={error}
    >
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full rounded-lg border px-4 py-3
          outline-none transition resize-none
          ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
          }
          ${
            disabled
              ? "cursor-not-allowed bg-gray-100"
              : "bg-white"
          }
        `}
      />
    </BaseField>
  );
}

export default TextAreaField;