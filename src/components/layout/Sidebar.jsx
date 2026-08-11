import { useState } from "react";
import { Link } from "react-router-dom";

function Sidebar({ menuOpen, setMenuOpen }) {
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <aside
        className={`
          fixed left-0 top-0 z-20 h-full w-64 bg-white p-5 shadow
          transform transition-transform duration-300
          ${
            menuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
          md:static md:min-h-screen md:translate-x-0
        `}
      >
        <div className="mb-8 flex items-center justify-between md:hidden">
          <h2 className="text-xl font-bold text-blue-600">
            Menu
          </h2>

          <button
            onClick={closeMobileMenu}
            className="text-xl"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-4">
          <Link
            to="/dashboard"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600"
          >
            Dashboard
          </Link>

          {/* Inventory */}
          <div>
            <button
              onClick={() =>
                setInventoryOpen(!inventoryOpen)
              }
              className="flex w-full items-center justify-between text-gray-700 hover:text-blue-600"
            >
              <span>
                Inventory
              </span>

              <span>
                {inventoryOpen ? "▲" : "▼"}
              </span>
            </button>

            {inventoryOpen && (
              <div className="mt-3 ml-4 space-y-3">
                <Link
                  to="/inventory"
                  onClick={closeMobileMenu}
                  className="block text-gray-600 hover:text-blue-600"
                >
                  Overview
                </Link>

                <Link
                  to="/inventory/products"
                  onClick={closeMobileMenu}
                  className="block text-gray-600 hover:text-blue-600"
                >
                  Products
                </Link>

                <Link
                  to="/inventory/categories"
                  onClick={closeMobileMenu}
                  className="block text-gray-600 hover:text-blue-600"
                >
                  Categories
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/sales"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600"
          >
            Sales
          </Link>

          <Link
            to="/expenses"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600"
          >
            Expenses
          </Link>

          {/* Reports Link Added */}
          <Link
            to="/reports"
            onClick={closeMobileMenu}
            className="block text-gray-700 hover:text-blue-600"
          >
            Reports
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