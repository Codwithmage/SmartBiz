import { useState, useRef } from "react";
import { Link } from "react-router-dom";

function Sidebar({ menuOpen, setMenuOpen }) {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const timeoutRef = useRef(null);

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  // Hover handlers with 200ms grace delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setInventoryOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setInventoryOpen(false);
    }, 200); // 200ms delay before closing
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
        <div className="mb-8 flex items-center justify-between md:hidden">
          <h2 className="text-xl font-bold text-blue-600">Menu</h2>
          <button onClick={closeMobileMenu} className="text-xl">
            ✕
          </button>
        </div>

        <nav className="space-y-4">
          <Link
            to="/dashboard"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600 transition-colors"
          >
            Dashboard
          </Link>

          {/* Inventory Dropdown with Hover Delay & Smooth Slide */}
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={handleInventoryClick}
              className="flex w-full items-center justify-between text-gray-700 hover:text-blue-600 cursor-pointer"
            >
              <span>Inventory</span>
              {/* Animated Arrow Rotation */}
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
                  className="block text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Overview
                </Link>

                <Link
                  to="/inventory/products"
                  onClick={closeMobileMenu}
                  className="block text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Products
                </Link>

                {/* UPDATED PATH HERE */}
                <Link
                  to="/inventory/services"
                  onClick={closeMobileMenu}
                  className="block text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Services
                </Link>

                <Link
                  to="/inventory/categories"
                  onClick={closeMobileMenu}
                  className="block text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Categories
                </Link>
              </div>
            </div>
          </div>

          <Link
            to="/sales"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600 transition-colors"
          >
            Sales
          </Link>

          <Link
            to="/expenses"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600 transition-colors"
          >
            Expenses
          </Link>

          <Link
            to="/reports"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600 transition-colors"
          >
            Reports
          </Link>

          <Link
            to="/settings"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600 font-medium pt-2 border-t transition-colors"
          >
            Settings
          </Link>
        </nav>
      </aside>

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