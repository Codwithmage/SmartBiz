import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import AuthLayout from "../../../components/layout/AuthLayout";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

import { registerUser } from "../services/authService";
import { useNotification } from "../../notifications/context/NotificationContext";
import supabase from "../../../supabase/SupabaseClient";

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();

  const token = searchParams.get("token"); // Invite token from TeamPage link

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [invitationData, setInvitationData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Check if user is registering via an Invitation Link
  useEffect(() => {
    async function verifyInviteToken() {
      if (!token) return;

      const { data, error } = await supabase
        .from("invitations")
        .select("email, business_id, role")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        showNotification({
          type: "error",
          message: "Invalid or expired invitation link.",
        });
        return;
      }

      setInvitationData(data);
      if (data.email) setEmail(data.email);
    }

    verifyInviteToken();
  }, [token, showNotification]);

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showNotification({
        type: "error",
        message: "All fields are required.",
      });
      return;
    }

    if (password !== confirmPassword) {
      showNotification({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    setLoading(true);

    // Determine Role & Business ID (If invited: use invitation details; otherwise default to OWNER)
    const assignedRole = invitationData ? invitationData.role : "OWNER";
    const assignedBusinessId = invitationData ? invitationData.business_id : null;

    // 2. Register user in Supabase Auth
    const { data, error } = await registerUser({
      fullName,
      email,
      password,
      role: assignedRole,
      businessId: assignedBusinessId,
    });

    if (error) {
      setLoading(false);
      showNotification({
        type: "error",
        message: error.message,
      });
      return;
    }

    // 3. Upsert user profile with assigned business_id and role
    if (data?.user?.id) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: email.trim().toLowerCase(),
        role: assignedRole,
        business_id: assignedBusinessId,
      });

      // Optional: Delete consumed invitation token
      if (token) {
        await supabase.from("invitations").delete().eq("token", token);
      }
    }

    setLoading(false);

    showNotification({
      type: "success",
      message: invitationData
        ? "Account created and joined team successfully!"
        : "Account created successfully!",
    });

    // 4. Redirect staff to POS/Sales or Owner to Create Business
    if (assignedBusinessId) {
      navigate(assignedRole === "CASHIER" ? "/sales" : "/dashboard", { replace: true });
    } else {
      navigate("/create-business", { replace: true });
    }
  };

  return (
    <AuthLayout subtitle={invitationData ? "Join Business Team" : "Create Account"}>
      <form onSubmit={handleRegister}>
        {invitationData && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
            You are registering as a <strong>{invitationData.role}</strong>.
          </div>
        )}

        <Input
          id="fullName"
          label="Full Name"
          placeholder="Enter your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          disabled={!!invitationData?.email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="Create password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Register;