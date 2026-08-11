import BaseField from "./BaseField";

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
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
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
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
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </BaseField>
  );
}

export default SelectField;