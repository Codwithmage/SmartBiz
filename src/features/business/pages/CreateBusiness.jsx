import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

import { createBusiness } from "../services/businessService";
import { useBusiness } from "../../../context/BusinessContext";
import { useNotification } from "../../notifications/context/NotificationContext";

function CreateBusiness() {
  const navigate = useNavigate();
  const { refreshBusiness } = useBusiness();
  const { showNotification } = useNotification();

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!businessName.trim()) {
      showNotification({
        type: "error",
        message: "Business name is required.",
      });
      return;
    }

    setLoading(true);

    const { error } = await createBusiness({
      businessName,
      category,
      phone,
      email,
      businessType,
      currency,
      address,
    });

    if (error) {
      setLoading(false);
      showNotification({
        type: "error",
        message: error.message || "Failed to create business.",
      });
      return;
    }

    // Refresh global business context so state updates immediately
    await refreshBusiness();

    setLoading(false);

    showNotification({
      type: "success",
      message: "Business created successfully!",
    });

    // Navigate directly to Dashboard
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow">
        <h1 className="mb-2 text-3xl font-bold">Create Your Business</h1>
        <p className="mb-6 text-gray-600">
          Tell us about your business to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="businessName"
            label="Business Name"
            placeholder="Enter business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />

          <Input
            id="category"
            label="Category"
            placeholder="e.g Electronics, Fashion, Food"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <Input
            id="businessType"
            label="Business Type"
            placeholder="e.g Retail, Wholesale"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          />

          <Input
            id="phone"
            label="Phone Number"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            id="email"
            label="Business Email"
            type="email"
            placeholder="Enter business email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            id="currency"
            label="Currency"
            placeholder="NGN"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />

          <Input
            id="address"
            label="Business Address"
            placeholder="Enter business address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Business"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default CreateBusiness;