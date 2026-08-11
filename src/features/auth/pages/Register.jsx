import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../../components/layout/AuthLayout";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { registerUser } from "../services/authService";
import { useNotification } from "../../notifications/context/NotificationContext";

function Register() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    let isValid = true;

    if (!fullName.trim()) {
      setFullNameError("Full name is required.");
      isValid = false;
    }
    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    }
    if (!password.trim()) {
      setPasswordError("Password is required.");
      isValid = false;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    }
    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);

    const { data, error } = await registerUser({
      fullName,
      email,
      password,
    });

    setLoading(false);

    if (error) {
      showNotification({
        type: "error",
        message: error.message,
      });
      return;
    }

    // Active session created: Navigate directly to business creation
    if (data?.session) {
      showNotification({
        type: "success",
        message: "Account created! Let's set up your business.",
      });
      navigate("/create-business", { replace: true });
    } else {
      // Fallback if Email Confirmation is enabled in Supabase Dashboard
      showNotification({
        type: "info",
        message: "Account created! Please check your email to confirm your account before logging in.",
      });
      navigate("/", { replace: true });
    }
  };

  return (
    <AuthLayout subtitle="Create your account">
      <form onSubmit={handleRegister}>
        <Input
          id="fullName"
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setFullNameError("");
          }}
          error={fullNameError}
        />

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
          placeholder="Create a password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError("");
          }}
          error={passwordError}
        />

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setConfirmPasswordError("");
          }}
          error={confirmPasswordError}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </Button>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="font-semibold text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Register;