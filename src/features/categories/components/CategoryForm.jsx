import { useState } from "react";

import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";
import Button from "../../../components/ui/Button";

function CategoryForm({
  initialValues = {
    name: "",
    description: "",
  },
  onSubmit,
  loading = false,
  submitText = "Save Category",
  cancelText = "Cancel",
  onCancel,
}) {
  const [formData, setFormData] = useState(initialValues);

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = {};

    if (!formData.name.trim()) {
      validationErrors.name =
        "Category name is required.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Card className="max-w-2xl">

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        <Input
          label="Category Name *"
          value={formData.name}
          error={errors.name}
          placeholder="Enter category name"
          onChange={(e) =>
            handleChange("name", e.target.value)
          }
        />

        <Textarea
          label="Description"
          value={formData.description}
          placeholder="Optional description"
          onChange={(e) =>
            handleChange(
              "description",
              e.target.value
            )
          }
        />

        <div className="flex justify-end gap-3">

          <Button
            variant="secondary"
            type="button"
            onClick={onCancel}
          >
            {cancelText}
          </Button>

          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : submitText}
          </Button>

        </div>

      </form>

    </Card>
  );
}

export default CategoryForm;