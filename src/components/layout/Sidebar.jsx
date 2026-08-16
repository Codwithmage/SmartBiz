import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // <-- Updated path

function Sidebar({ menuOpen, setMenuOpen }) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const timeoutRef = useRef(null);
  const location = useLocation();
  const { role } = useAuth();

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  // Helper check for role access
  const hasAccess = (allowedRoles) => allowedRoles.includes(role);

  // Hover handlers with 200ms grace delay for inventory dropdown
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setInventoryOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setInventoryOpen(false);
    }, 200);
  };

  const handleInventoryClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setInventoryOpen((prev) => !prev);
  };

  return (
    <>
      <aside
        className={`
          fixed left-0 top-0 z-20 h-full w-64 bg-white p-5 shadow
          transform transition-transform duration-300
          ${menuOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:min-h-screen md:translate-x-0
        `}
      >
        {/* Header & Role Badge */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-blue-600">Smart Bizz</h2>
            {role && (
              <span className="inline-block text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded mt-1 uppercase tracking-wide">
                Role: {role}
              </span>
            )}
          </div>
          <button onClick={closeMobileMenu} className="text-xl md:hidden">
            ✕
          </button>
        </div>

        <nav className="space-y-4">
          {/* Dashboard — OWNER, MANAGER */}
          {hasAccess(["OWNER", "MANAGER"]) && (
            <Link
              to="/dashboard"
              onClick={closeMobileMenu}
              className={`block transition-colors ${
                location.pathname === "/dashboard"
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Dashboard
            </Link>
          )}

          {/* Inventory Dropdown — OWNER, MANAGER, CASHIER */}
          {hasAccess(["OWNER", "MANAGER", "CASHIER"]) && (
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={handleInventoryClick}
                className="flex w-full items-center justify-between text-gray-700 hover:text-blue-600 cursor-pointer"
              >
                <span
                  className={
                    location.pathname.startsWith("/inventory")
                      ? "text-blue-600 font-medium"
                      : ""
                  }
                >
                  Inventory
                </span>
                <span
                  className={`transform transition-transform duration-200 text-xs ${
                    inventoryOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* Animated Accordion Container */}
              <div
                className={`grid transition-all duration-200 ease-in-out ${
                  inventoryOpen
                    ? "grid-rows-[1fr] opacity-100 mt-3"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden ml-4 space-y-3">
                  <Link
                    to="/inventory"
                    onClick={closeMobileMenu}
                    className={`block transition-colors ${
                      location.pathname === "/inventory"
                        ? "text-blue-600 font-medium"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Overview
                  </Link>

                  <Link
                    to="/inventory/products"
                    onClick={closeMobileMenu}
                    className={`block transition-colors ${
                      location.pathname === "/inventory/products"
                        ? "text-blue-600 font-medium"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Products
                  </Link>

                  <Link
                    to="/inventory/services"
                    onClick={closeMobileMenu}
                    className={`block transition-colors ${
                      location.pathname === "/inventory/services"
                        ? "text-blue-600 font-medium"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Services
                  </Link>

                  <Link
                    to="/inventory/categories"
                    onClick={closeMobileMenu}
                    className={`block transition-colors ${
                      location.pathname.startsWith("/inventory/categories")
                        ? "text-blue-600 font-medium"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Categories
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Sales / POS — OWNER, MANAGER, CASHIER */}
          {hasAccess(["OWNER", "MANAGER", "CASHIER"]) && (
            <Link
              to="/sales"
              onClick={closeMobileMenu}
              className={`block transition-colors ${
                location.pathname === "/sales"
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Sales
            </Link>
          )}

          {/* Expenses — OWNER, MANAGER, CASHIER */}
          {hasAccess(["OWNER", "MANAGER", "CASHIER"]) && (
            <Link
              to="/expenses"
              onClick={closeMobileMenu}
              className={`block transition-colors ${
                location.pathname === "/expenses"
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Expenses
            </Link>
          )}

          {/* Reports — OWNER ONLY */}
          {hasAccess(["OWNER"]) && (
            <Link
              to="/reports"
              onClick={closeMobileMenu}
              className={`block transition-colors ${
                location.pathname === "/reports"
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Reports
            </Link>
          )}

          {/* Team Management — OWNER ONLY */}
          {hasAccess(["OWNER"]) && (
            <Link
              to="/team"
              onClick={closeMobileMenu}
              className={`block transition-colors ${
                location.pathname === "/team"
                  ? "text-blue-600 font-medium"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Team
            </Link>
          )}

          {/* Settings — OWNER ONLY */}
          {hasAccess(["OWNER"]) && (
            <Link
              to="/settings"
              onClick={closeMobileMenu}
              className={`block font-medium pt-2 border-t transition-colors ${
                location.pathname === "/settings"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Settings
            </Link>
          )}
        </nav>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {menuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-10 bg-black/40 md:hidden"
        />
      )}
    </>
  );
}

export default Sidebar;