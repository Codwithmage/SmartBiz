import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";

function ProtectedRoute({ children, allowNoBusiness = false }) {
  const { user, loading: authLoading } = useAuth();
  const { business, loading: businessLoading } = useBusiness();

  // 1. Wait for auth session and business data to finish resolving
  if (authLoading || businessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <h1 className="text-sm font-semibold text-gray-600">Loading...</h1>
        </div>
      </div>
    );
  }

  // 2. If user is not logged in, redirect to Login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. If user has no business and page requires one, redirect to /create-business
  if (!business && !allowNoBusiness) {
    return <Navigate to="/create-business" replace />;
  }

  return children;
}

export default ProtectedRoute;