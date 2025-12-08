import React from "react";
import { Link } from "react-router-dom";
import AdHighperformanceBanner from "../components/AdHighperformanceBanner";
import { usePageTitle } from "../hooks/usePageTitle";
import {
    Landmark,
    Banknote,
    Truck,
    FileText,
    ArrowRight,
    Percent,
    ShieldCheck,
    Home,
    Wallet,
    CheckCircle2
} from "lucide-react";

export default function Offers() {
    usePageTitle("Exclusive Offers - UrbanSetu");

    const bankOffers = [
        {
            name: "SBI Home Loans",
            icon: <Landmark className="w-6 h-6 text-blue-600" />,
            color: "bg-blue-50 text-blue-700 border-blue-200",
            desc: "Zero processing fee & low interest rates.",
            link: "https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464"
        },
        {
            name: "HDFC Returns",
            icon: <Banknote className="w-6 h-6 text-red-600" />,
            color: "bg-red-50 text-red-700 border-red-200",
            desc: "Special rates for women applicants.",
            link: "https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464"
        },
        {
            name: "ICICI Bank",
            icon: <Wallet className="w-6 h-6 text-orange-600" />,
            color: "bg-orange-50 text-orange-700 border-orange-200",
            desc: "Instant sanction for pre-approved customers.",
            link: "https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464"
        },
        {
            name: "Axis Bank",
            icon: <Percent className="w-6 h-6 text-purple-600" />,
            color: "bg-purple-50 text-purple-700 border-purple-200",
            desc: "Flexible tenure options up to 30 years.",
            link: "https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464"
        }
    ];

    const services = [
        {
            name: "Packers & Movers",
            icon: <Truck className="w-6 h-6 text-yellow-600" />,
            color: "bg-yellow-50 text-yellow-800 border-yellow-200",
            desc: "Safe relocation with verified partners.",
            link: "https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464"
        },
        {
            name: "Rental Agreements",
            icon: <FileText className="w-6 h-6 text-emerald-600" />,
            color: "bg-emerald-50 text-emerald-800 border-emerald-200",
            desc: "Legally valid agreements delivered to doorstep.",
            link: "https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-800 pb-20">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white relative overflow-hidden py-16 sm:py-24">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500 blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500 blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 text-sm font-semibold mb-6 animate-fade-in-down">
                        <ShieldCheck className="w-4 h-4" /> Trusted Partners Only
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight animate-fade-in-up">
                        Unlock Exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">Real Estate Deals</span>
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        From home loans with lowest interest rates to verified packers and movers, we've curated the best offers for your property journey.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 relative z-20 py-12">

                {/* Bank Offers Grid */}
                <div className="mb-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Landmark className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Home Loan Offers</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {bankOffers.map((offer, idx) => (
                            <a
                                key={idx}
                                href={offer.link}
                                target="_blank"
                                rel="noreferrer"
                                className={`group p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white ${offer.color.replace('bg-', 'hover:bg-opacity-20 ')} hover:border-transparent`} // simplified hover logic
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${offer.color}`}>
                                    {offer.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                                    {offer.name}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                    {offer.desc}
                                </p>
                                <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                                    Apply Now <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Services Section */}
                <div className="mb-12 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Essential Services</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service, idx) => (
                            <a
                                key={idx}
                                href={service.link}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-blue-100`}
                            >
                                <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${service.color}`}>
                                    {service.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                                        {service.name}
                                    </h3>
                                    <p className="text-gray-600 mb-3">{service.desc}</p>
                                    <span className="text-sm font-semibold text-blue-600 underline decoration-transparent group-hover:decoration-blue-600 transition-all">
                                        Check Rates & Availability
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Ad Banner */}
                <div className="mb-12 rounded-2xl overflow-hidden shadow-sm animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                    <AdHighperformanceBanner />
                </div>

                {/* CTA Section */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-12 text-center shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 opacity-10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-4">Don't Miss Out on Limited Time Deals!</h2>
                        <p className="text-blue-100 mb-8 text-lg">
                            Our partnered offers are updated weekly. Grab the best rates before they expire.
                        </p>
                        <a
                            href="https://www.effectivegatecpm.com/x637i8hmu?key=3428998a4e708cbdf42ec9bcfe9bc464"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-50 hover:scale-105 transition-all shadow-lg"
                        >
                            Explore All Deals <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}