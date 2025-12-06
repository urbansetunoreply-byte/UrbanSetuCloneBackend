import React from "react";
import { FaHome, FaUniversity, FaMoneyCheckAlt, FaTruckMoving, FaFileAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import AdHighperformanceBanner from "../components/AdHighperformanceBanner"; // your ad component
import { usePageTitle } from "../hooks/usePageTitle";

export default function Offers() {
  usePageTitle("Exclusive Offers - UrbanSetu");
  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12">
      <div className="max-w-5xl mx-auto px-4">

        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          🏦 Best Real Estate Offers & Home Loan Deals
        </h1>

        {/* Bank Home Loan Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaUniversity className="text-blue-600" />
            Home Loan Offers from Top Banks
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464" target="_blank" rel="noreferrer"
              className="border p-4 rounded-lg hover:bg-blue-50 transition flex items-center gap-2">
              <FaMoneyCheckAlt className="text-green-600" /> SBI Home Loan Deals
            </a>

            <a href="https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464" target="_blank" rel="noreferrer"
              className="border p-4 rounded-lg hover:bg-blue-50 transition flex items-center gap-2">
              <FaMoneyCheckAlt className="text-red-600" /> HDFC Home Loan Offers
            </a>

            <a href="https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464" target="_blank" rel="noreferrer"
              className="border p-4 rounded-lg hover:bg-blue-50 transition flex items-center gap-2">
              <FaMoneyCheckAlt className="text-blue-500" /> ICICI Bank Home Loan
            </a>

            <a href="https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464" target="_blank" rel="noreferrer"
              className="border p-4 rounded-lg hover:bg-blue-50 transition flex items-center gap-2">
              <FaMoneyCheckAlt className="text-purple-600" /> Axis Bank Home Loan
            </a>
          </div>
        </div>

        {/* NoBroker / Services */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaTruckMoving className="text-orange-500" />
            Property Related Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464" target="_blank" rel="noreferrer"
              className="border p-4 rounded-lg hover:bg-yellow-50 transition flex items-center gap-2">
              ✅ Packers & Movers Deals
            </a>

            <a href="https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464" target="_blank" rel="noreferrer"
              className="border p-4 rounded-lg hover:bg-yellow-50 transition flex items-center gap-2">
              📜 Rental Agreement & Documentation
            </a>
          </div>
        </div>

        {/* Adsterra Banner */}
        <div className="mb-6 text-center">
          <AdHighperformanceBanner />
        </div>

        {/* Smartlink CTA */}
        <div className="bg-blue-600 text-white text-center p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-2">🔥 Check Limited-Time Real Estate Deals</h3>
          <a
            href="https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold"
            target="_blank"
            rel="noreferrer"
          >
            Explore Deals Now →
          </a>
        </div>
      </div>
    </div>
  );
}
