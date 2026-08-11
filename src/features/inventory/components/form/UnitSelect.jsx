import { useMemo } from "react";

import SelectField from "./SelectField";
import TextField from "./TextField";

const UNIT_OPTIONS = [
  { value: "Piece", label: "Piece" },
  { value: "Pack", label: "Pack" },
  { value: "Box", label: "Box" },
  { value: "Carton", label: "Carton" },
  { value: "Pair", label: "Pair" },
  { value: "Set", label: "Set" },

  { value: "Gram", label: "Gram" },
  { value: "Kilogram", label: "Kilogram" },
  { value: "Ton", label: "Ton" },

  { value: "Millilitre", label: "Millilitre" },
  { value: "Litre", label: "Litre" },
  { value: "Gallon", label: "Gallon" },

  { value: "Centimetre", label: "Centimetre" },
  { value: "Metre", label: "Metre" },
  { value: "Roll", label: "Roll" },

  { value: "__CUSTOM__", label: "Other..." },
];

function UnitSelect({
  value,
  customUnit,
  onUnitChange,
  onCustomUnitChange,
  error = "",
}) {
  const selectedValue = useMemo(() => {
    const exists = UNIT_OPTIONS.some(
      (option) => option.value === value
    );

    return exists ? value : "__CUSTOM__";
  }, [value]);

  return (
    <>
      <SelectField
        id="unit"
        label="Unit"
        value={selectedValue}
        onChange={onUnitChange}
        options={UNIT_OPTIONS}
        error={error}
      />

      {selectedValue === "__CUSTOM__" && (
        <div className="mt-4">
          <TextField
            id="customUnit"
            label="Custom Unit"
            value={customUnit}
            onChange={onCustomUnitChange}
            placeholder="e.g. Sack, Bundle, Crate"
          />
        </div>
      )}
    </>
  );
}

export default UnitSelect;