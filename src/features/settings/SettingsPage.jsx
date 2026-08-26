import { useState, useEffect, useCallback } from "react";
import supabase from "../../supabase/SupabaseClient";
import { useBusiness } from "../../context/BusinessContext"; // <-- Added Business Context Hook

const CURRENCY_OPTIONS = [
  { code: "NGN", label: "NGN - Nigerian Naira (₦)", symbol: "₦" },
  { code: "USD", label: "USD - US Dollar ($)", symbol: "$" },
  { code: "EUR", label: "EUR - Euro (€)", symbol: "€" },
  { code: "GBP", label: "GBP - British Pound (£)", symbol: "£" },
  { code: "GHS", label: "GHS - Ghanaian Cedi (₵)", symbol: "₵" },
  { code: "KES", label: "KES - Kenyan Shilling (KSh)", symbol: "KSh" },
  { code: "ZAR", label: "ZAR - South African Rand (R)", symbol: "R" },
];

export default function SettingsPage() {
  const { refreshBusiness } = useBusiness(); // <-- Grab refresh helper
  const [activeTab, setActiveTab] = useState("PROFILE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [user, setUser] = useState(null);
  const [businessId, setBusinessId] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });

  const [financialForm, setFinancialForm] = useState({
    currency: "NGN",
    tax_rate: "0",
    fiscal_year_start: "January",
    default_payment_method: "CASH",
  });

  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");

  const [accountForm, setAccountForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) throw new Error("User not authenticated");
      setUser(currentUser);

      let activeBusinessId = null;

      const { data: busData } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", currentUser.id)
        .maybeSingle();

      if (busData) {
        activeBusinessId = busData.id;
        setProfileForm({
          name: busData.business_name || busData.name || "",
          email: busData.email || currentUser.email || "",
          phone: busData.phone || "",
          address: busData.address || "",
          description: busData.description || "",
        });

        setFinancialForm({
          currency: busData.currency || "NGN",
          tax_rate: busData.tax_rate?.toString() || "0",
          fiscal_year_start: busData.fiscal_year_start || "January",
          default_payment_method: busData.default_payment_method || "CASH",
        });
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_id")
          .eq("id", currentUser.id)
          .maybeSingle();

        activeBusinessId = profile?.business_id || null;
        setProfileForm((prev) => ({ ...prev, email: currentUser.email || "" }));
      }

      setBusinessId(activeBusinessId);

      if (activeBusinessId) {
        const { data: catData, error: catError } = await supabase
          .from("expense_categories")
          .select("*")
          .eq("business_id", activeBusinessId)
          .order("name", { ascending: true });

        if (catError) throw catError;
        setCategories(catData || []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      setMessage({ type: "error", text: `Failed to load settings: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ----------------------------------------------------
  // SAVE PROFILE SETTINGS (SYNC BOTH NAME FIELDS & REFRESH CONTEXT)
  // ----------------------------------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        owner_id: user.id,
        name: profileForm.name,
        business_name: profileForm.name, // Write to both database fields
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        description: profileForm.description,
      };

      const { data, error } = await supabase
        .from("businesses")
        .upsert(payload, { onConflict: "owner_id" })
        .select()
        .single();

      if (error) throw error;
      if (data) setBusinessId(data.id);

      // Trigger global state refresh across all components (Sales, Receipts, etc.)
      await refreshBusiness();

      setMessage({ type: "success", text: "Business profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: `Failed to save profile: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFinancial = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        owner_id: user.id,
        currency: financialForm.currency,
        tax_rate: Number(financialForm.tax_rate || 0),
        fiscal_year_start: financialForm.fiscal_year_start,
        default_payment_method: financialForm.default_payment_method,
      };

      const { error } = await supabase
        .from("businesses")
        .upsert(payload, { onConflict: "owner_id" });

      if (error) throw error;

      await refreshBusiness();

      setMessage({ type: "success", text: "Financial preferences updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: `Failed to save financial settings: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    if (!businessId) {
      setMessage({ type: "error", text: "No active business found. Cannot assign category." });
      return;
    }

    try {
      const payload = {
        name: newCatName.trim(),
        active: true,
        business_id: businessId,
      };

      const { data, error } = await supabase
        .from("expense_categories")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) => [...prev, data]);
      setNewCatName("");
      setMessage({ type: "success", text: "Category created!" });
    } catch (err) {
      setMessage({ type: "error", text: `Failed to add category: ${err.message}` });
    }
  };

  const handleToggleCategory = async (cat) => {
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .update({ active: !cat.active })
        .eq("id", cat.id)
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) => prev.map((c) => (c.id === cat.id ? data : c)));
    } catch (err) {
      setMessage({ type: "error", text: `Failed to update category: ${err.message}` });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setMessage({ type: "success", text: "Category deleted." });
    } catch (err) {
      setMessage({ type: "error", text: `Failed to delete category: ${err.message}` });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (accountForm.newPassword !== accountForm.confirmPassword) {
      return setMessage({ type: "error", text: "Passwords do not match." });
    }

    if (accountForm.newPassword.length < 6) {
      return setMessage({ type: "error", text: "Password must be at least 6 characters." });
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: accountForm.newPassword,
      });

      if (error) throw error;

      setAccountForm({ newPassword: "", confirmPassword: "" });
      setMessage({ type: "success", text: "Password updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: `Password update failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-semibold text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Manage your business information, financial defaults, categories, and security settings.
        </p>
      </div>

      {message.text && (
        <div
          className={`rounded-lg p-3 text-xs sm:text-sm border ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`whitespace-nowrap py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeTab === "PROFILE"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Business Profile
        </button>
        <button
          onClick={() => setActiveTab("FINANCIAL")}
          className={`whitespace-nowrap py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeTab === "FINANCIAL"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Financial & Currency
        </button>
        <button
          onClick={() => setActiveTab("CATEGORIES")}
          className={`whitespace-nowrap py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeTab === "CATEGORIES"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab("ACCOUNT")}
          className={`whitespace-nowrap py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
            activeTab === "ACCOUNT"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Account & Security
        </button>
      </div>

      {activeTab === "PROFILE" && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b pb-2">
            Business Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="e.g. Acme Stores Ltd"
                className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="business@example.com"
                className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+234 800 000 0000"
                className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Physical Address
              </label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="Street name, City, State"
                className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Business Description / Tagline
            </label>
            <textarea
              rows={3}
              value={profileForm.description}
              onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
              placeholder="Short description of products or services offered..."
              className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "FINANCIAL" && (
        <form onSubmit={handleSaveFinancial} className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b pb-2">
            Financial & Reporting Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Base Operating Currency *
              </label>
              <select
                value={financialForm.currency}
                onChange={(e) => setFinancialForm({ ...financialForm, currency: e.target.value })}
                className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                This currency symbol will display across all Expenses, Sales, and Reports.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Default Payment Method
              </label>
              <select
                value={financialForm.default_payment_method}
                onChange={(e) => setFinancialForm({ ...financialForm, default_payment_method: e.target.value })}
                className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card / POS</option>
                <option value="TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={financialForm.tax_rate}
                onChange={(e) => setFinancialForm({ ...financialForm, tax_rate: e.target.value })}
                placeholder="7.5"
                className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Fiscal Year Start Month
              </label>
              <select
                value={financialForm.fiscal_year_start}
                onChange={(e) => setFinancialForm({ ...financialForm, fiscal_year_start: e.target.value })}
                className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Financial Settings"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "CATEGORIES" && (
        <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b pb-2">
            Expense Category Management
          </h2>

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Office Logistics, Software Subscriptions"
              className="flex-1 rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              + Add
            </button>
          </form>

          <div className="divide-y pt-2">
            {categories.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-500">No categories recorded yet.</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{cat.name}</p>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        cat.active ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {cat.active ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCategory(cat)}
                      className="rounded border px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      {cat.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="rounded border px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "ACCOUNT" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b pb-2">
              Account Overview
            </h2>
            <div className="text-xs sm:text-sm space-y-1">
              <p className="text-gray-500">
                Logged in as: <span className="font-semibold text-gray-900">{user?.email}</span>
              </p>
              <p className="text-gray-500">
                User ID: <span className="font-mono text-gray-700">{user?.id}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="bg-white rounded-xl border p-4 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b pb-2">
              Security & Password
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={accountForm.newPassword}
                  onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={accountForm.confirmPassword}
                  onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  className="w-full rounded-md border p-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}