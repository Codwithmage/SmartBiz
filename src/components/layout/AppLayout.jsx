import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";
import { logoutUser } from "../../features/auth/services/authService";

import Sidebar from "./Sidebar";

function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearBusiness } = useBusiness();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await logoutUser();

    if (error) {
      console.error("Logout error:", error.message);
      return;
    }

    if (clearBusiness) clearBusiness();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between bg-white px-4 sm:px-6 py-4 shadow z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-2xl md:hidden focus:outline-none"
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
            Smart Biz
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-gray-600 sm:block text-sm">
            {user?.email}
          </span>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-white hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Body Wrapper */}
      <div className="flex flex-1 w-full min-w-0">
        <Sidebar
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;