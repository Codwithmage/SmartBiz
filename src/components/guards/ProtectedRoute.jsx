import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";

function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  allowNoBusiness = false, 
  fallbackPath = "/dashboard" 
}) {
  const { user, role, loading: authLoading } = useAuth();
  const { business, loading: businessLoading } = useBusiness();

  // 1. Show loading indicator while session/business resolves
  if (authLoading || businessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <h1 className="text-sm font-semibold text-gray-600">Loading application...</h1>
        </div>
      </div>
    );
  }

  // 2. Redirect to Login only if NO authenticated user session exists
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. Handle accounts with no linked business
  if (!business && !allowNoBusiness) {
    if (role === "OWNER") {
      return <Navigate to="/create-business" replace />;
    }
    // Prevent redirecting back to "/" which causes the instant logout feeling
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h2 className="text-xl font-bold text-gray-800">No Business Assigned</h2>
        <p className="mt-2 text-gray-600">Your account is not linked to an active business yet. Please contact your manager.</p>
      </div>
    );
  }

  // 4. Role Authorization Check
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

export default ProtectedRoute;