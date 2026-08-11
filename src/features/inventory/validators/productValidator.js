/**
 * Product Validation
 *
 * Returns an object containing validation errors.
 */

export function validateProduct(values = {}) {
  const errors = {};

  const name = values.name?.trim() || "";
  const categoryId = values.categoryId?.trim() || "";
  const unit = values.unit?.trim() || "";

  const sellingPrice = values.sellingPrice === "" ? NaN : Number(values.sellingPrice);
  const costPrice = values.costPrice === "" ? 0 : Number(values.costPrice);
  const initialQuantity = values.initialQuantity === "" ? NaN : Number(values.initialQuantity);
  const reorderLevel = values.reorderLevel === "" ? 0 : Number(values.reorderLevel);

  /*
   * Product Name
   */
  if (!name) {
    errors.name = "Product name is required.";
  } else if (name.length > 120) {
    errors.name = "Product name must be 120 characters or less.";
  }

  /*
   * Category
   */
  if (!categoryId) {
    errors.categoryId = "Please select a category.";
  }

  /*
   * Pricing
   */
  if (isNaN(sellingPrice)) {
    errors.sellingPrice = "Selling price is required.";
  } else if (sellingPrice < 0) {
    errors.sellingPrice = "Selling price cannot be negative.";
  }

  if (isNaN(costPrice) || costPrice < 0) {
    errors.costPrice = "Cost price cannot be negative.";
  }

  /*
   * Inventory & Stock
   */
  if (isNaN(initialQuantity)) {
    errors.initialQuantity = "Initial quantity is required.";
  } else if (initialQuantity < 0) {
    errors.initialQuantity = "Quantity cannot be negative.";
  }

  if (isNaN(reorderLevel) || reorderLevel < 0) {
    errors.reorderLevel = "Reorder level cannot be negative.";
  }

  /*
   * Unit
   */
  if (!unit) {
    errors.unit = "Please select or specify a unit.";
  }

  // CRITICAL: Always return the errors object
  return errors;
}