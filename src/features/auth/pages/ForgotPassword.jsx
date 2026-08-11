import { Link } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout";

function ForgotPassword() {
  return (
    <AuthLayout subtitle="Reset your password">
      <form>
        {/* Email */}
        <div className="mb-6">
          <label
            htmlFor="email"
            className="mb-2 block text-gray-700"
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Reset Button */}
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Send Reset Link
        </button>

        {/* Back to Login */}
        <p className="mt-6 text-center text-gray-600">
          Remember your password?{" "}
          <Link
            to="/"
            className="font-semibold text-blue-600 hover:underline"
          >
            Back to Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;