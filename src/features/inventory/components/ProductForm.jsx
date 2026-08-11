import { useEffect, useState } from "react";

import FormSection from "./FormSection";
import TextField from "./form/TextField";
import NumberField from "./form/NumberField";
import TextAreaField from "./form/TextAreaField";
import CategorySelect from "./form/CategorySelect";
import UnitSelect from "./form/UnitSelect";
import SubmitButton from "./form/SubmitButton";

import { validateProduct } from "../validators/productValidator";
import productInitialValues from "../utils/productInitialValues";

function ProductForm({
  initialValues = productInitialValues,
  categories = [],
  onSubmit,
  loading = false,
  submitText = "Save Product",
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleUnitChange = (event) => {
    const value = event.target.value;

    if (value === "__CUSTOM__") {
      setValues((previous) => ({
        ...previous,
        unit: "",
        customUnit: "",
      }));
      return;
    }

    setValues((previous) => ({
      ...previous,
      unit: value,
      customUnit: "",
    }));
  };

  const handleCustomUnitChange = (event) => {
    setValues((previous) => ({
      ...previous,
      customUnit: event.target.value,
      unit: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Safely fallback to an empty object if validateProduct returns undefined or null
    const validationErrors = validateProduct(values) || {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title="Basic Information"
        description="Enter the main details about this product."
      >
        <TextField
          id="name"
          name="name"
          label="Product Name"
          value={values.name}
          onChange={handleChange}
          placeholder="Enter product name"
          error={errors.name}
          required
        />

        <CategorySelect
          value={values.categoryId}
          onChange={handleChange}
          categories={categories}
          error={errors.categoryId}
          required
        />

        <TextAreaField
          id="description"
          name="description"
          label="Description"
          value={values.description}
          onChange={handleChange}
          placeholder="Product description"
          error={errors.description}
        />
      </FormSection>

      <FormSection
        title="Pricing"
        description="Set the buying and selling prices for this product."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <NumberField
            id="costPrice"
            name="costPrice"
            label="Cost Price"
            value={values.costPrice}
            onChange={handleChange}
            placeholder="0.00"
            error={errors.costPrice}
          />

          <NumberField
            id="sellingPrice"
            name="sellingPrice"
            label="Selling Price"
            value={values.sellingPrice}
            onChange={handleChange}
            placeholder="0.00"
            error={errors.sellingPrice}
            required
          />
        </div>
      </FormSection>

      <FormSection
        title="Inventory"
        description="Configure stock quantity and measurement details."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <NumberField
            id="initialQuantity"
            name="initialQuantity"
            label="Initial Quantity"
            value={values.initialQuantity}
            onChange={handleChange}
            placeholder="0"
            error={errors.initialQuantity}
            step="1"
            required
          />

          <NumberField
            id="reorderLevel"
            name="reorderLevel"
            label="Reorder Level"
            value={values.reorderLevel}
            onChange={handleChange}
            placeholder="0"
            error={errors.reorderLevel}
            step="1"
          />
        </div>

        <UnitSelect
          value={values.unit}
          customUnit={values.customUnit}
          onUnitChange={handleUnitChange}
          onCustomUnitChange={handleCustomUnitChange}
          error={errors.unit}
        />

        <TextField
          id="barcode"
          name="barcode"
          label="Barcode"
          value={values.barcode}
          onChange={handleChange}
          placeholder="Optional barcode"
          error={errors.barcode}
        />
      </FormSection>

      <div className="pt-4">
        <SubmitButton loading={loading} loadingText="Saving Product...">
          {submitText}
        </SubmitButton>
      </div>
    </form>
  );
}

export default ProductForm;