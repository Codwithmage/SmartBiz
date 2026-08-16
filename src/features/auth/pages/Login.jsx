import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../../components/layout/AuthLayout";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

import { loginUser, getUserBusiness } from "../services/authService";
import { useNotification } from "../../notifications/context/NotificationContext";
import supabase from "../../../supabase/SupabaseClient";

function Login() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setEmailError("");
    setPasswordError("");

    let isValid = true;

    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);

    const { data, error } = await loginUser({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      showNotification({
        type: "error",
        message: error.message,
      });
      return;
    }

    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, business_id")
      .eq("id", data.user.id)
      .maybeSingle();

    const userRole = profile?.role || data.user?.user_metadata?.role || "CASHIER";

    // Fetch user business details
    const { data: business } = await getUserBusiness(data.user.id);

    setLoading(false);

    showNotification({
      type: "success",
      message: "Welcome back!",
    });

    // Route dynamically based on business link and user role
    if (business) {
      navigate("/dashboard", { replace: true });
    } else if (userRole === "OWNER") {
      navigate("/create-business", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <AuthLayout subtitle="Business Management System">
      <form onSubmit={handleLogin}>
        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          error={emailError}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError("");
          }}
          error={passwordError}
        />

        <div className="mb-6 text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Logging In..." : "Login"}
        </Button>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;