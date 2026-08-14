import { NavLink } from "react-router-dom";

export default function InventorySubNav() {
  const tabs = [
    { name: "Overview", path: "/inventory" },
    { name: "Products", path: "/inventory/products" },
    { name: "Services", path: "/inventory/services" },
    { name: "Categories", path: "/inventory/categories" },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-6 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === "/inventory"}
            className={({ isActive }) =>
              `py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? "border-purple-600 text-purple-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}