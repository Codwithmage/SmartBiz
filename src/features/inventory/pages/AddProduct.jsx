import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import ProductForm from "../components/ProductForm";

import { useInventory } from "../context/InventoryContext";
import { useNotification } from "../../notifications/context/NotificationContext";
import { useBusiness } from "../../../context/BusinessContext";
import { useAuth } from "../../../context/AuthContext";

function AddProduct() {
  const navigate = useNavigate();

  const {
    categories,
    loadCategories,
    createProduct,
    creatingProduct,
  } = useInventory();

  const { business } = useBusiness();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const businessId = business?.id;

  // Load categories automatically when businessId is available
  useEffect(() => {
    if (businessId) {
      loadCategories(businessId);
    }
  }, [businessId, loadCategories]);

  const handleSubmit = async (values) => {
    if (!businessId) {
      showNotification({
        type: "error",
        message: "Business ID is missing. Please refresh or select a business.",
      });
      return;
    }

    // Convert React form (camelCase) to Supabase columns (snake_case)
    const payload = {
      business_id: businessId,
      created_by: user?.id || null,
      category_id: values.categoryId || null,
      name: values.name?.trim(),
      description: values.description?.trim() || null,
      cost_price: Number(values.costPrice) || 0,
      selling_price: Number(values.sellingPrice) || 0,
      initial_quantity: Number(values.initialQuantity) || 0,
      reorder_level: Number(values.reorderLevel) || 0,
      unit: values.unit || "unit",
      barcode: values.barcode?.trim() || null,
      status: "ACTIVE",
    };

    const { error } = await createProduct(payload);

    if (error) {
      showNotification({
        type: "error",
        message: error.message || "Failed to create product.",
      });
      return;
    }

    showNotification({
      type: "success",
      message: "Product created successfully.",
    });

    navigate("/inventory");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add Product</h1>
        <p className="mt-2 text-gray-600">
          Add a new product to your inventory.
        </p>
      </div>

      <ProductForm
        categories={categories}
        loading={creatingProduct}
        onSubmit={handleSubmit}
        submitText="Create Product"
      />
    </div>
  );
}

export default AddProduct;