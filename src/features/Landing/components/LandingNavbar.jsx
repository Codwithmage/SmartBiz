import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight, Menu, X } from "lucide-react";

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Animated Brand Logo */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center space-x-2"
        >
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <Link to="/" className="text-xl font-bold text-slate-900 tracking-tight">
            Smart Biz
          </Link>
        </motion.div>

        {/* Desktop Landing Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          {["Features", "Benefits", "About"].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              whileHover={{ y: -2, color: "#2563eb" }}
              transition={{ type: "spring", stiffness: 300 }}
              className="transition-colors"
            >
              {item}
            </motion.a>
          ))}
        </nav>

        {/* Desktop Landing Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/login"
            className="text-slate-700 hover:text-blue-600 font-semibold text-sm transition px-3 py-2"
          >
            Log In
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition flex items-center space-x-1"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-700 p-2 rounded-lg hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Animated Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="px-6 pt-4 pb-6 space-y-4">
              <a
                href="#features"
                onClick={() => setIsOpen(false)}
                className="block text-slate-700 hover:text-blue-600 font-medium text-base"
              >
                Features
              </a>
              <a
                href="#benefits"
                onClick={() => setIsOpen(false)}
                className="block text-slate-700 hover:text-blue-600 font-medium text-base"
              >
                Benefits
              </a>
              <a
                href="#about"
                onClick={() => setIsOpen(false)}
                className="block text-slate-700 hover:text-blue-600 font-medium text-base"
              >
                About Us
              </a>
              <div className="pt-4 border-t border-slate-100 flex flex-col space-y-3">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 font-semibold text-slate-700 border border-slate-300 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center py-2.5 font-semibold text-white bg-blue-600 rounded-xl shadow-md"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}