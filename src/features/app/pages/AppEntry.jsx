import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { useBusiness } from "../../../context/BusinessContext";

function AppEntry() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { businessLoading, loadBusiness } = useBusiness();

  const userId = user?.id;

  useEffect(() => {
    async function initializeApp() {
      // Wait until AuthContext is done initializing
      if (authLoading) return;

      if (!userId) {
        console.log("No authenticated user found. Redirecting to login.");
        navigate("/", { replace: true });
        return;
      }

      try {
        console.log("Loading business for user:", userId);
        const businessData = await loadBusiness(userId);
        console.log("Business response:", businessData);

        const hasValidBusiness =
          businessData &&
          !Array.isArray(businessData) &&
          typeof businessData === "object" &&
          Boolean(businessData.id);

        if (hasValidBusiness) {
          console.log("Business found. Redirecting to Dashboard.");
          navigate("/dashboard", { replace: true });
        } else {
          console.log("No business found. Redirecting to Create Business.");
          navigate("/create-business", { replace: true });
        }
      } catch (error) {
        console.error("AppEntry initialization error:", error);
        navigate("/create-business", { replace: true });
      }
    }

    initializeApp();
  }, [userId, authLoading, navigate, loadBusiness]);

  if (authLoading || businessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <h1 className="text-sm font-semibold text-gray-600">
            Loading Smart Biz...
          </h1>
        </div>
      </div>
    );
  }

  return null;
}

export default AppEntry;