import React, { useState } from "react";
import { UserCircleIcon, Bars3Icon } from "@heroicons/react/24/solid";
import logo from "../assets/logo.png"; // Adjust the path as necessary
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 w-full bg-gradient-to-r from-blue-900 via-teal-700 to-purple-700 shadow-lg py-2 px-3 sm:py-3 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src={logo} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"/>
        <span className="text-lg sm:text-2xl font-bold text-white tracking-wide">SwayamShiksha</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-6">
        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-6">
          <a href="/" className="text-white font-medium hover:text-yellow-300 transition">Dashboard</a>
          <a href="/payments" className="text-white font-medium hover:text-yellow-300 transition">Payments</a>
          <a href="/expenses" className="text-white font-medium hover:text-yellow-300 transition">Expenses</a>
          <a href="/reports" className="text-white font-medium hover:text-yellow-300 transition">Reports</a>
        </div>
        {/* Hamburger menu for mobile only */}
        <button
          className="sm:hidden ml-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="h-8 w-8 text-white" />
        </button>
      </div>
      {/* Mobile menu dropdown - fix scroll blocking by using a portal and full-screen overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-start justify-end bg-black bg-opacity-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="mt-16 mr-2 w-56 bg-white rounded-xl shadow-2xl py-2 flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
            <a href="/" className="px-4 py-3 text-gray-800 font-medium hover:bg-blue-100 rounded transition" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="/payments" className="px-4 py-3 text-gray-800 font-medium hover:bg-blue-100 rounded transition" onClick={() => setMobileMenuOpen(false)}>Payments</a>
            <a href="/expenses" className="px-4 py-3 text-gray-800 font-medium hover:bg-blue-100 rounded transition" onClick={() => setMobileMenuOpen(false)}>Expenses</a>
            <a href="/reports" className="px-4 py-3 text-gray-800 font-medium hover:bg-blue-100 rounded transition" onClick={() => setMobileMenuOpen(false)}>Reports</a>
          </div>
        </div>
      )}
    </nav>
  );
}
