import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { FaCity, FaChartLine, FaBuilding, FaSearchDollar, FaArrowUp, FaArrowDown, FaMapMarkerAlt, FaFire } from 'react-icons/fa';
import { usePageTitle } from '../hooks/usePageTitle';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const MarketTrends = () => {
    usePageTitle('Market Trends - Real Estate Insights | UrbanSetu');

    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [cityData, setCityData] = useState(null);
    const [loadingCity, setLoadingCity] = useState(false);

    // Fetch Initial Overview Data
    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await fetch('/api/market/overview');
                const data = await res.json();
                if (data.success) {
                    setOverview(data.data);
                }

                const cityRes = await fetch('/api/market/cities');
                const cityData = await cityRes.json();
                if (cityData.success) {
                    setCities(cityData.data);
                    if (cityData.data.length > 0) {
                        setSelectedCity(cityData.data[0]); // Default to first city
                    }
                }
            } catch (error) {
                console.error("Error fetching market data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOverview();
    }, []);

    // Fetch City Specific Data
    useEffect(() => {
        if (!selectedCity) return;

        const fetchCityData = async () => {
            setLoadingCity(true);
            try {
                const res = await fetch(`/api/market/city/${selectedCity}`);
                const data = await res.json();
                if (data.success) {
                    setCityData(data.data);
                }
            } catch (error) {
                console.error("Error fetching city data:", error);
            } finally {
                setLoadingCity(false);
            }
        };
        fetchCityData();
    }, [selectedCity]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">

            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight"
                    >
                        UrbanSetu Market Trends
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto mb-10"
                    >
                        Live real estate insights to help you buy, sell, and invest smarter.
                    </motion.p>

                    {/* Quick Stats Cards */}
                    {overview && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                            <StatsCard
                                icon={<FaBuilding />}
                                label="Total Active Listings"
                                value={overview.totalListings}
                                subtext="Properties live now"
                            />
                            <StatsCard
                                icon={<FaSearchDollar />}
                                label="Avg. Market Price"
                                value={`₹${(overview.avgPrice / 100000).toFixed(1)} L`}
                                subtext="Across all regions"
                            />
                            <StatsCard
                                icon={<FaChartLine />}
                                label="New Projects"
                                value={overview.newProjects}
                                subtext="Added this month"
                            />
                            <StatsCard
                                icon={<FaFire />}
                                label="Top Demand Area"
                                value={overview.topAreas[0]?.area || "N/A"}
                                subtext={overview.topAreas[0]?.city || ""}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* City Analysis Section */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <FaCity className="text-blue-600" />
                        City Market Overview
                    </h2>

                    {/* City Selector */}
                    <div className="mt-4 md:mt-0 relative">
                        <label className="mr-3 font-medium text-gray-600 dark:text-gray-400">Select City:</label>
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            {cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loadingCity ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                ) : cityData ? (
                    <div className="space-y-12">

                        {/* City Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase">Avg. Price in {selectedCity}</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹{cityData.summary.avgPrice.toLocaleString()}</p>
                                <span className="text-green-500 text-sm font-medium flex items-center mt-2 gap-1">
                                    <FaArrowUp /> Trending Stable
                                </span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase">Demand Score</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{cityData.summary.demandScore} <span className="text-sm font-normal text-gray-500">/ 100</span></p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(cityData.summary.demandScore, 100)}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase">Total Listings</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{cityData.summary.totalListings}</p>
                                <p className="text-gray-500 text-sm mt-2">Active properties on market</p>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Demand vs Price by Area */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
                            >
                                <h3 className="text-xl font-bold mb-6">Price vs Listings by Area</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={cityData.areas.slice(0, 8)}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis dataKey="name" fontSize={12} tick={{ fill: '#6b7280' }} />
                                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" fontSize={12} tick={{ fill: '#6b7280' }} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} tick={{ fill: '#6b7280' }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend />
                                            <Bar yAxisId="right" dataKey="listings" name="Active Listings" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                            <Bar yAxisId="left" dataKey="avgPrice" name="Avg Price (₹)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Property Type Distribution */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
                            >
                                <h3 className="text-xl font-bold mb-6">Property Type Distribution</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={cityData.propertyTypes}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {cityData.propertyTypes.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        </div>

                        {/* Top Areas List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
                        >
                            <h3 className="text-xl font-bold mb-6">🔥 Hot Markets in {selectedCity}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm uppercase">
                                            <th className="py-3 px-4">Area Name</th>
                                            <th className="py-3 px-4">Price / Unit (Avg)</th>
                                            <th className="py-3 px-4">Price Range</th>
                                            <th className="py-3 px-4">Active Listings</th>
                                            <th className="py-3 px-4">Demand</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cityData.areas.map((area, idx) => (
                                            <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="py-4 px-4 font-semibold text-blue-600 dark:text-blue-400">{area.name}</td>
                                                <td className="py-4 px-4 font-medium">₹{area.avgPrice.toLocaleString()}</td>
                                                <td className="py-4 px-4 text-gray-500 dark:text-gray-400 text-sm">{area.priceRange}</td>
                                                <td className="py-4 px-4">{area.listings}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                                                        ${area.popularity > 200 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}
                                                    `}>
                                                        {area.popularity > 200 ? <FaFire /> : null}
                                                        {area.popularity > 200 ? 'High' : 'Moderate'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>

                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        Select a city to view detailed trends.
                    </div>
                )}
            </div>

            {/* Global Price Trends Chart */}
            {overview && overview.priceTrends && overview.priceTrends.length > 0 && (
                <section className="bg-white dark:bg-gray-800 py-16">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold mb-2">Platform-Wide Price Index</h2>
                            <p className="text-gray-500 dark:text-gray-400">Average property price trends over the last 6 months across UrbanSetu</p>
                        </div>

                        <div className="h-96 w-full max-w-5xl mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={overview.priceTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(val) => `₹${val / 1000}k`} />
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => `₹${value.toLocaleString()}`}
                                    />
                                    <Area type="monotone" dataKey="price" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>
            )}

            {/* Insights Section */}
            <section className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <FaBuilding className="text-9xl" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">💡 UrbanSetu Insights</h3>
                    <ul className="space-y-4 relative z-10">
                        <li className="flex items-start gap-3">
                            <div className="bg-white/20 p-2 rounded-lg mt-1"><FaArrowUp className="text-sm" /></div>
                            <div>
                                <h4 className="font-semibold text-lg">Rental Yields Rising</h4>
                                <p className="text-indigo-200 text-sm">Average rental yields in metro areas have increased by 0.5% this quarter due to high demand.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="bg-white/20 p-2 rounded-lg mt-1"><FaMapMarkerAlt className="text-sm" /></div>
                            <div>
                                <h4 className="font-semibold text-lg">Suburban Shift</h4>
                                <p className="text-indigo-200 text-sm">More buyers are moving to peripheral areas looking for larger homes and gated communities.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="bg-white/20 p-2 rounded-lg mt-1"><FaChartLine className="text-sm" /></div>
                            <div>
                                <h4 className="font-semibold text-lg">Digital Viewing Surge</h4>
                                <p className="text-indigo-200 text-sm">Properties with verified video tours are getting 3x more inquiries than image-only listings.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-3xl p-8 border border-yellow-200 dark:border-yellow-800/30 flex flex-col justify-center items-center text-center">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Invest?</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
                        Use our data to find the perfect property that matches your investment goals.
                    </p>
                    <div className="flex gap-4">
                        <a href="/search" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Explore Properties
                        </a>
                        <a href="/agents" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 font-semibold py-3 px-8 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                            Find an Agent
                        </a>
                    </div>
                </div>
            </section>

        </div>
    );
};

const StatsCard = ({ icon, label, value, subtext }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/20"
    >
        <div className="text-2xl text-blue-300 mb-2 flex justify-center">{icon}</div>
        <div className="text-2xl md:text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-xs md:text-sm text-blue-100 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-xs text-blue-200/70 mt-1">{subtext}</div>
    </motion.div>
);

export default MarketTrends;
