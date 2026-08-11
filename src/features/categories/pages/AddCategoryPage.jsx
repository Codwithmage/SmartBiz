import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCategory } from "../../../context/CategoryContext";

import CategoryForm from "../components/CategoryForm";

function AddCategoryPage() {
  const navigate = useNavigate();

  const { addCategory } = useCategory();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);

    const { error } = await addCategory(formData);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/inventory/categories");
  };

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-bold">
          Add Category
        </h1>

        <p className="text-gray-500">
          Create a new product category.
        </p>

      </div>

      <CategoryForm
        loading={loading}
        submitText="Create Category"
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate("/inventory/categories")
        }
      />

    </div>
  );
}

export default AddCategoryPage;