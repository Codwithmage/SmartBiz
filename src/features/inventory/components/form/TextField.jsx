import BaseField from "./BaseField";

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "",
  error = "",
  required = false,
  disabled = false,
}) {
  return (
    <BaseField
      id={id}
      label={label}
      required={required}
      error={error}
    >
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={`
          w-full rounded-lg border px-4 py-3
          outline-none transition
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

export default TextField;