import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LandingNavbar from "../components/LandingNavbar";
import heroImage from "../../../assets/pos-retail_1.webp"; // Local asset import
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Building2,
  Target,
  Sparkles,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user has already visited the landing page on this device
    const hasVisitedBefore = localStorage.getItem("has_visited_landing");

    if (hasVisitedBefore) {
      // Returning user -> bypass landing page and go straight to login
      navigate("/login", { replace: true });
    } else {
      // First-time visitor -> set flag so future visits skip landing
      localStorage.setItem("has_visited_landing", "true");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans scroll-smooth">
      {/* Landing Page Specific Animated Header */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 bg-blue-100/80 border border-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-6">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Smart All-In-One Business Solution</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Manage Sales, Inventory & Staff in One Unified Place
            </h1>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">
              Empower cashiers, managers, and business owners with real-time POS tracking, automated inventory alerts, expense management, and detailed analytics.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition text-center flex items-center justify-center space-x-2"
              >
                <span>Log In to Your Business</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-base px-6 py-3.5 rounded-xl transition text-center"
              >
                Register Business
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl">
              <img
                src={heroImage}
                alt="Smart Biz POS Checkout"
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
                onError={(e) => {
                  e.target.src = "https://placehold.co/800x600/2563eb/white?text=Smart+Biz+POS";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-4 sm:p-6">
                <div className="text-white space-y-1">
                  <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">
                    Real-time POS
                  </p>
                  <p className="text-base sm:text-lg font-bold">Fast & Intuitive Cashier Checkout</p>
                </div>
              </div>
            </div>

            {/* Floating Metric Badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-6 bg-white p-3 sm:p-4 rounded-xl shadow-xl border border-slate-100 flex items-center space-x-3"
            >
              <div className="bg-emerald-100 p-2 sm:p-2.5 rounded-lg text-emerald-600">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Daily Tracked Sales</p>
                <p className="text-sm sm:text-lg font-bold text-slate-900">100% Automated</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Everything Your Business Needs to Scale
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Designed for retail stores, supermarkets, service providers, and multi-staff teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              whileHover={{ y: -6 }}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm transition"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-5">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">POS & Checkout</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Streamline transactions with rapid sales logging, quick receipts, and multi-payment option tracking.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm transition"
            >
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 mb-5">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Inventory Control</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track products, manage services, organize categories, and receive low-stock alerts before items run out.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm transition"
            >
              <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Role Permissions</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Assign customized access levels for Cashiers, Managers, and Owners with invitation links.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
              Keep Total Visibility Over Your Profits & Expenses
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Smart Biz simplifies tracking financial health. Monitor revenue stats, categorize daily business expenses, and generate detailed reports instantly.
            </p>

            <ul className="space-y-3">
              {[
                "Instant reports on sales revenue and operational expenses.",
                "Categorized inventory and service breakdown.",
                "Seamless team access with role-based security.",
              ].map((point, index) => (
                <li key={index} className="flex items-start space-x-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-4"
          >
            <div className="flex items-center space-x-3 text-blue-600 mb-2">
              <BarChart3 className="w-8 h-8" />
              <h4 className="text-lg font-bold text-slate-900">Real-Time Insights</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Stay ahead of business decisions with automated end-of-day summaries, tracking cash flows across every staff shift.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Integrated About Us Section */}
      <section id="about" className="py-16 md:py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-400/30 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              <span>About Smart Biz</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
              Built to Simplify Operations for Modern Growing Businesses
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed text-sm sm:text-base">
              Smart Biz was created to eliminate friction in daily business operations. Whether you run a storefront or manage multiple staff roles, our goal is to give business owners total control over inventory, sales analytics, and staff activities without unnecessary complexity.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600/30 p-2.5 rounded-lg text-blue-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Our Mission</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    To provide accessible, real-time management tools for modern merchants.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-emerald-600/30 p-2.5 rounded-lg text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Scalable Architecture</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Easily expand from one store to multi-branch team setups.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-700/60 shadow-xl space-y-6"
          >
            <h3 className="text-lg sm:text-xl font-bold text-white">Why Businesses Choose Smart Biz</h3>
            <ul className="space-y-4">
              {[
                "Instant cross-device synchronization between cashiers & management.",
                "Granular user permissions tailored specifically for Owners, Managers, & Cashiers.",
                "Structured reporting that eliminates end-of-day calculation errors.",
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="py-14 sm:py-16 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Manage Your Business Smarter?</h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm sm:text-base">
            Sign in to access your dashboard or start onboarding your business in minutes.
          </p>
          <div className="pt-2 flex justify-center space-x-4">
            <Link
              to="/login"
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3.5 rounded-xl shadow-md transition"
            >
              Log In Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 text-center text-sm border-t border-slate-900">
        <p>© {new Date().getFullYear()} Smart Biz. All rights reserved.</p>
      </footer>
    </div>
  );
}