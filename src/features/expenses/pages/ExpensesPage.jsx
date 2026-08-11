import { useState, useEffect, useMemo } from "react";
import supabase from "../../../supabase/supabaseClient";

const isToday = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isThisMonth = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [expenseForm, setExpenseForm] = useState({
    title: "",
    categoryId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "CASH",
    status: "PAID",
    vendor: "",
    reference: "",
    description: "",
  });

  const [categoryNameInput, setCategoryNameInput] = useState("");

  // Helper to get category name by ID or fallback
  const getCategoryName = (catIdOrName) => {
    if (!catIdOrName) return "Uncategorized";
    const found = categories.find((c) => c.id === catIdOrName || c.name === catIdOrName);
    return found ? found.name : catIdOrName;
  };

  // ----------------------------------------------------
  // 1. FETCH DATA FROM SUPABASE
  // ----------------------------------------------------
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [expensesRes, categoriesRes] = await Promise.all([
        supabase.from("expenses").select("*").order("date", { ascending: false }),
        supabase.from("expense_categories").select("*").order("name", { ascending: true }),
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setExpenses(expensesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error("Failed to load expenses or categories:", err);
      setErrorMessage(`Database Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ----------------------------------------------------
  // 2. STATS & FILTERS
  // ----------------------------------------------------
  const overviewStats = useMemo(() => {
    let totalExpenses = 0;
    let thisMonth = 0;
    let today = 0;
    let pendingExpenses = 0;

    expenses.forEach((item) => {
      const amt = Number(item.amount || 0);
      totalExpenses += amt;
      if (isThisMonth(item.date)) thisMonth += amt;
      if (isToday(item.date)) today += amt;
      if (item.status === "PENDING") pendingExpenses += amt;
    });

    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return { totalExpenses, thisMonth, today, pendingExpenses, recentExpenses };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id?.toString().toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = filterDate ? item.date?.startsWith(filterDate) : true;
      
      const catVal = item.category_id || item.category;
      const matchesCategory =
        filterCategory === "ALL" || catVal === filterCategory || getCategoryName(catVal) === filterCategory;

      const matchesPayment =
        filterPaymentMethod === "ALL" || item.payment_method === filterPaymentMethod;

      const matchesStatus =
        filterStatus === "ALL" || item.status === filterStatus;

      return (
        matchesSearch &&
        matchesDate &&
        matchesCategory &&
        matchesPayment &&
        matchesStatus
      );
    });
  }, [expenses, searchQuery, filterDate, filterCategory, filterPaymentMethod, filterStatus, categories]);

  // ----------------------------------------------------
  // 3. SAVE / DELETE EXPENSE
  // ----------------------------------------------------
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.categoryId) {
      return alert("Please fill in all required fields.");
    }

    try {
      // Get logged-in user & business
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (businessError || !business) throw new Error("No business found for this user");

      const payload = {
        title: expenseForm.title,
        category_id: expenseForm.categoryId,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        payment_method: expenseForm.payment_method,
        status: expenseForm.status,
        vendor: expenseForm.vendor,
        reference: expenseForm.reference,
        description: expenseForm.description,
        business_id: business.id,
      };

      if (editingExpense) {
        const { data, error } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", editingExpense.id)
          .select()
          .single();

        if (error) throw error;
        setExpenses((prev) =>
          prev.map((item) => (item.id === editingExpense.id ? data : item))
        );
      } else {
        const { data, error } = await supabase
          .from("expenses")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        setExpenses((prev) => [data, ...prev]);
      }

      resetExpenseForm();
      setIsAddModalOpen(false);
      setEditingExpense(null);
    } catch (err) {
      console.error("Error saving expense:", err);
      alert(`Failed to save expense: ${err.message}`);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;

      setExpenses((prev) => prev.filter((item) => item.id !== id));
      setSelectedExpense(null);
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert(`Failed to delete expense: ${err.message}`);
    }
  };

  const resetExpenseForm = () => {
    const activeCat = categories.find((c) => c.active);
    setExpenseForm({
      title: "",
      categoryId: activeCat ? activeCat.id : "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      payment_method: "CASH",
      status: "PAID",
      vendor: "",
      reference: "",
      description: "",
    });
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title || "",
      categoryId: expense.category_id || expense.category || "",
      amount: expense.amount || "",
      date: expense.date ? expense.date.split("T")[0] : new Date().toISOString().split("T")[0],
      payment_method: expense.payment_method || "CASH",
      status: expense.status || "PAID",
      vendor: expense.vendor || "",
      reference: expense.reference || "",
      description: expense.description || "",
    });
    setSelectedExpense(null);
    setIsAddModalOpen(true);
  };

  // ----------------------------------------------------
  // 4. SAVE / TOGGLE / DELETE CATEGORY
  // ----------------------------------------------------
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryNameInput.trim()) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (businessError || !business) throw new Error("No business found for this user");

      if (editingCategory) {
        const { data, error } = await supabase
          .from("expense_categories")
          .update({ name: categoryNameInput.trim() })
          .eq("id", editingCategory.id)
          .select()
          .single();

        if (error) throw error;

        setCategories((prev) =>
          prev.map((cat) => (cat.id === editingCategory.id ? data : cat))
        );
      } else {
        const { data, error } = await supabase
          .from("expense_categories")
          .insert([
            {
              name: categoryNameInput.trim(),
              business_id: business.id,
              active: true,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setCategories((prev) => [...prev, data]);
      }

      setCategoryNameInput("");
      setEditingCategory(null);
      setIsCategoryModalOpen(false);
    } catch (err) {
      console.error("Error saving category:", err);
      alert(`Failed to save category: ${err.message}`);
    }
  };

  const toggleCategoryStatus = async (category) => {
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .update({ active: !category.active })
        .eq("id", category.id)
        .select()
        .single();

      if (error) throw error;
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? data : c))
      );
    } catch (err) {
      console.error("Error toggling category status:", err);
      alert(`Failed to update category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      console.error("Error deleting category:", err);
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-semibold text-gray-500">
          Loading expenses from database...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Header & Framework Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Monitor, record, and categorize operational business expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab("OVERVIEW")}
              className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
                activeTab === "OVERVIEW"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("ALL_EXPENSES")}
              className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
                activeTab === "ALL_EXPENSES"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Expenses
            </button>
            <button
              onClick={() => setActiveTab("CATEGORIES")}
              className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
                activeTab === "CATEGORIES"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Categories
            </button>
          </div>

          <button
            onClick={() => {
              resetExpenseForm();
              setEditingExpense(null);
              setIsAddModalOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Expenses</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
                ₦{overviewStats.totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">This Month</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-blue-600">
                ₦{overviewStats.thisMonth.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Today</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-green-600">
                ₦{overviewStats.today.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase">Pending Expenses</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-amber-600">
                ₦{overviewStats.pendingExpenses.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Expenses</h2>
              <button
                onClick={() => setActiveTab("ALL_EXPENSES")}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="divide-y">
              {overviewStats.recentExpenses.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No expenses recorded yet in database.
                </p>
              ) : (
                overviewStats.recentExpenses.map((exp) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                      <p className="text-xs text-gray-500">
                        {getCategoryName(exp.category_id || exp.category)} •{" "}
                        {exp.date ? new Date(exp.date).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ₦{Number(exp.amount).toLocaleString()}
                      </p>
                      <span
                        className={`text-[10px] font-bold uppercase rounded px-2 py-0.5 ${
                          exp.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {exp.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. ALL EXPENSES */}
      {activeTab === "ALL_EXPENSES" && (
        <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Search Expense / Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-md border p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-md border p-2 text-xs sm:text-sm focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="rounded-md border p-2 text-xs sm:text-sm focus:outline-none"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="TRANSFER">Bank Transfer</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border p-2 text-xs sm:text-sm focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                  <th className="py-3 px-3">Expense</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No matching records found in database.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-900">{exp.title}</p>
                        <p className="text-[11px] text-gray-500">{exp.vendor || "No Vendor"}</p>
                      </td>
                      <td className="py-3 px-3">{getCategoryName(exp.category_id || exp.category)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {exp.date ? new Date(exp.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-3 uppercase text-xs">{exp.payment_method}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900 whitespace-nowrap">
                        ₦{Number(exp.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            exp.status === "PAID"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedExpense(exp)}
                          className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium hover:bg-gray-100"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CATEGORIES */}
      {activeTab === "CATEGORIES" && (
        <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Expense Categories</h2>
              <p className="text-xs text-gray-500">Manage classification for company spending.</p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryNameInput("");
                setIsCategoryModalOpen(true);
              }}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              + Add Category
            </button>
          </div>

          <div className="divide-y">
            {categories.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No categories found.</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        cat.active ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {cat.active ? "Active" : "Deactivated"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCategoryStatus(cat)}
                      className="rounded border px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      {cat.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryNameInput(cat.name);
                        setIsCategoryModalOpen(true);
                      }}
                      className="rounded border px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="rounded border px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
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

      {/* 4. ADD / EDIT EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Expense Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Stationery"
                  value={expenseForm.title}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, title: e.target.value })
                  }
                  className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={expenseForm.categoryId}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, categoryId: e.target.value })
                    }
                    className="w-full rounded-md border p-2 text-sm focus:outline-none"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories
                      .filter((c) => c.active)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Amount (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: e.target.value })
                    }
                    className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, date: e.target.value })
                    }
                    className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full rounded-md border p-2 text-sm focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Vendor / Payee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vendor Name"
                    value={expenseForm.vendor}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, vendor: e.target.value })
                    }
                    className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    placeholder="Receipt / Invoice #"
                    value={expenseForm.reference}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        reference: e.target.value,
                      })
                    }
                    className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Additional context..."
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-md border px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. EXPENSE DETAILS MODAL */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Expense Details</h3>
              <button
                onClick={() => setSelectedExpense(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Title:</span>
                <span className="font-semibold text-gray-900">{selectedExpense.title}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Amount:</span>
                <span className="font-bold text-gray-900">₦{Number(selectedExpense.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium text-gray-900">{getCategoryName(selectedExpense.category_id || selectedExpense.category)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium text-gray-900">{selectedExpense.date ? new Date(selectedExpense.date).toLocaleDateString() : "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-medium uppercase text-gray-900">{selectedExpense.payment_method}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-green-100 text-green-800">
                  {selectedExpense.status}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Vendor:</span>
                <span className="font-medium text-gray-900">{selectedExpense.vendor || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Reference:</span>
                <span className="font-medium text-gray-900">{selectedExpense.reference || "N/A"}</span>
              </div>
              {selectedExpense.description && (
                <div className="pt-1">
                  <span className="text-gray-500 block mb-1">Description:</span>
                  <p className="p-2 rounded bg-gray-50 text-xs text-gray-700">{selectedExpense.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={() => handleDeleteExpense(selectedExpense.id)}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEditExpense(selectedExpense)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD / EDIT CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Utilities, Logistics..."
                  value={categoryNameInput}
                  onChange={(e) => setCategoryNameInput(e.target.value)}
                  className="w-full rounded-md border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-md border px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}