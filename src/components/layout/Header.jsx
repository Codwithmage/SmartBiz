import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../features/auth/services/authService";

function Header({ onMenuToggle }) {
  const { user } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <header className="flex items-center justify-between bg-white px-6 py-4 shadow">

      <div className="flex items-center gap-4">

        <button
          onClick={onMenuToggle}
          className="text-2xl md:hidden"
        >
          ☰
        </button>

        <h1 className="text-2xl font-bold text-blue-600">
          Smart Biz
        </h1>

      </div>

      <div className="flex items-center gap-4">

        <span className="hidden text-gray-600 sm:block">
          {user?.email}
        </span>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>

      </div>

    </header>
  );
}

export default Header;