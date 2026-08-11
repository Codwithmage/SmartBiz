// src/features/reports/pages/ReportsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useBusiness } from "../../../context/BusinessContext";
import { fetchReportData } from "../services/reportsService";
import { exportToCSV } from "../utils/exportUtils";
import { getDateRangePreset } from "../utils/dateUtils";

const REPORT_TABS = [
  { id: "sales", label: "Sales Report" },
  { id: "expenses", label: "Expense Report" },
  { id: "profit", label: "Profit & Loss" },
  { id: "inventory", label: "Inventory Valuation" },
];

export default function ReportsPage() {
  const { business } = useBusiness();
  const [activeTab, setActiveTab] = useState("sales");
  const [preset, setPreset] = useState("this_month");
  
  const initialDates = getDateRangePreset("this_month");
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);

  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);

    const { data, summary: pnlSummary, error } = await fetchReportData({
      businessId: business.id,
      reportType: activeTab,
      startDate,
      endDate,
    });

    if (!error) {
      setReportData(data);
      if (pnlSummary) setSummary(pnlSummary);
    }
    setLoading(false);
  }, [business?.id, activeTab, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setPreset(val);
    if (val !== "custom") {
      const dates = getDateRangePreset(val);
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  };

  const handleExport = () => {
    if (!reportData.length) return;
    exportToCSV(reportData, `${activeTab}_report_${startDate}_to_${endDate}.csv`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Track and export business performance metrics.</p>
        </div>

        <button
          onClick={handleExport}
          disabled={!reportData.length || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-lg shadow transition text-sm flex items-center justify-center gap-2"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-2 overflow-x-auto">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-gray-700">Date Range:</label>
          <select
            value={preset}
            onChange={handlePresetChange}
            className="border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading report data...</div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No records found for the selected period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium uppercase text-xs">
                <tr>
                  {Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="px-6 py-3">
                      {key.replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-6 py-4 text-gray-700 whitespace-nowrap">
                        {typeof val === "number" ? val.toLocaleString() : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}