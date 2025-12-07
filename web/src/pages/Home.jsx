import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css/bundle";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import ListingItem from "../components/ListingItem";
import { useSelector } from "react-redux";
import ContactSupportWrapper from "../components/ContactSupportWrapper";
import GeminiAIWrapper from "../components/GeminiAIWrapper";
import { usePageTitle } from '../hooks/usePageTitle';
import {
  FaHome, FaSearch, FaHeart, FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaShieldAlt, FaAward, FaUsers, FaChartLine, FaLightbulb, FaRocket, FaGem,
  FaQuoteLeft, FaQuoteRight, FaCheckCircle, FaClock, FaHandshake, FaGlobe,
  FaMobile, FaDesktop, FaTablet, FaInfoCircle, FaArrowRight
} from "react-icons/fa";
import AdsterraBanner from "../components/AdsterraBanner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Home() {
  // Set page title
  usePageTitle("Dashboard - Find Your Dream Home");

  const { currentUser } = useSelector((state) => state.user);
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [recommendedListings, setRecommendedListings] = useState([]);
  const [trendingListings, setTrendingListings] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSliderVisible, setIsSliderVisible] = useState(false);
  const [stats, setStats] = useState({ properties: 0, users: 0, transactions: 0, satisfaction: 0 });
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  // Helper to determine if we are in user dashboard context for links
  const isUser = true; // Since this is Home.jsx, it usually implies a logged-in user context or main entry. 
  // Original code checked window.location.pathname.startsWith('/user'). 
  // But standard links work fine too. We'll use the check for flexible routing if needed.
  const linkPrefix = currentUser ? "/user" : "";

  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?offer=true&visibility=public`);
        const data = await res.json();
        setOfferListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching offer listings", error);
        setOfferListings([]);
      }
    };

    const fetchRentListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?type=rent&visibility=public`);
        const data = await res.json();
        setRentListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching rent listings", error);
        setRentListings([]);
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?type=sale&visibility=public`);
        const data = await res.json();
        setSaleListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching sale listings", error);
        setSaleListings([]);
      }
    };

    fetchOfferListings();
    fetchRentListings();
    fetchSaleListings();
  }, []);

  // Fetch recommended listings for logged-in users
  useEffect(() => {
    const fetchRecommended = async () => {
      if (!currentUser?._id) {
        setRecommendedListings([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/recommendations?userId=${currentUser._id}`);
        if (!res.ok) return;
        const data = await res.json();
        setRecommendedListings(Array.isArray(data) ? data : (data?.listings || []));
      } catch (error) {
        console.error("Error fetching recommended listings", error);
        setRecommendedListings([]);
      }
    };
    fetchRecommended();
  }, [currentUser?._id]);

  // Fetch trending listings
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/watchlist/top?limit=6`, { credentials: 'include' });
        if (!res.ok) {
          setTrendingListings([]);
          return;
        }
        const data = await res.json();
        setTrendingListings(Array.isArray(data) ? data : (data?.listings || []));
      } catch (error) {
        console.error("Error fetching trending listings", error);
        setTrendingListings([]);
      }
    };
    fetchTrending();
  }, []);

  // Trigger slider visibility animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSliderVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [propertiesRes, usersRes, transactionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/listing/count`),
          fetch(`${API_BASE_URL}/api/user/count`),
          fetch(`${API_BASE_URL}/api/bookings/count`)
        ]);

        const [propertiesData, usersData, transactionsData] = await Promise.all([
          propertiesRes.json(),
          usersRes.json(),
          transactionsRes.json()
        ]);

        setStats({
          properties: Number(propertiesData.count) || 1250,
          users: Number(usersData.count) || 5000,
          transactions: Number(transactionsData.count) || 2500,
          satisfaction: 98
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({
          properties: 1250,
          users: 5000,
          transactions: 2500,
          satisfaction: 98
        });
      }
    };
    fetchStats();
  }, []);

  const handleSlideChange = (swiper) => {
    setCurrentSlideIndex(swiper.realIndex);
  };

  const goToSlide = (index) => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(index);
    }
  };

  // Get all images from offer listings for the slider
  const allSliderImages = Array.isArray(offerListings) ? offerListings.flatMap(listing =>
    (listing.imageUrls || []).map((img, idx) => ({
      url: img,
      listingId: listing._id,
      title: listing.name || 'Featured Property',
      price: listing.offer && listing.discountPrice ? listing.discountPrice : listing.regularPrice,
      type: listing.type
    }))
  ) : [];

  return (
    <div className="bg-gray-50 min-h-screen relative overflow-hidden font-sans">
      {/* Background Animations */}
      <style>
        {`
            @keyframes blob {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0px); }
            }
            .animate-blob { animation: blob 10s infinite; }
            .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
            .animate-fade-in-delay { animation: fadeIn 0.8s ease-out 0.2s forwards; opacity: 0; }
            .animate-float { animation: float 6s ease-in-out infinite; }
            .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); }
        `}
      </style>

      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: "4s" }}></div>
        <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: "6s" }}></div>
      </div>

      <div className="relative z-10">

        {/* Hero Section */}
        <div className="relative pt-20 pb-16 lg:pt-32 lg:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">

            {/* User Greeting */}
            {currentUser && (
              <div className="mb-8 animate-fade-in flex justify-center">
                <div
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/80 backdrop-blur-lg shadow-lg border border-white/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  {(() => {
                    const name = currentUser.firstName || currentUser.username || currentUser.name || currentUser.fullName || 'Friend';
                    const hour = new Date().getHours();
                    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                    const emoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';

                    return (
                      <span className="text-lg sm:text-xl font-bold flex items-center gap-2">
                        <span className="text-gray-700">{greet},</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                          {name}!
                        </span>
                        <span className="animate-bounce inline-block ml-1 text-2xl filter drop-shadow-md">
                          {emoji}
                        </span>
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 animate-fade-in border border-blue-100 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              #1 Real Estate Platform
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 animate-fade-in-delay">
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Dream Home</span>
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 mb-10 animate-fade-in-delay" style={{ animationDelay: "0.4s" }}>
              Discover an exclusive selection of the finest properties.
              <br className="hidden md:block" />
              Smart search, verified listings, and seamless transactions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay" style={{ animationDelay: "0.6s" }}>
              <Link
                to="/search"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaRocket /> Start Exploring
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
              >
                <FaInfoCircle /> Learn More
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto animate-fade-in-delay" style={{ animationDelay: "0.8s" }}>
              {[
                { icon: FaHome, label: "Properties", value: stats.properties, color: "text-blue-500", bg: "bg-blue-50" },
                { icon: FaUsers, label: "Happy Users", value: stats.users, color: "text-green-500", bg: "bg-green-50" },
                { icon: FaChartLine, label: "Transactions", value: stats.transactions, color: "text-purple-500", bg: "bg-purple-50" },
                { icon: FaStar, label: "Satisfaction", value: `${stats.satisfaction}%`, color: "text-yellow-500", bg: "bg-yellow-50" }
              ].map((stat, index) => (
                <div key={index} className="glass-card p-6 rounded-2xl shadow-lg border border-white/50 hover:transform hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <stat.icon className={`text-2xl ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{typeof stat.value === 'number' ? stat.value.toLocaleString() + '+' : stat.value}</div>
                  <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Slider */}
        {allSliderImages.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
            <div className="flex flex-col items-center mb-8 gap-4 text-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Properties</h2>
                <p className="text-gray-600">Handpicked premium properties just for you</p>
              </div>
              <div className="flex gap-2">
                {allSliderImages.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${currentSlideIndex === idx ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-2xl relative group bg-gray-900">
              <Swiper
                ref={swiperRef}
                modules={[Autoplay, Pagination, EffectFade]}
                effect="fade"
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                speed={1000}
                loop={true}
                onSlideChange={handleSlideChange}
                className="h-[400px] md:h-[500px] lg:h-[600px] w-full"
              >
                {allSliderImages.map((image, idx) => (
                  <SwiperSlide key={idx} className="relative">
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover transform transition-transform duration-[10s] hover:scale-110"
                      style={{ animation: 'panImage 20s linear infinite alternate' }}
                    />
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      <div className="max-w-3xl animate-fade-in-up text-left">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider">
                            {image.type === 'rent' ? 'For Rent' : 'For Sale'}
                          </span>
                          {image.price && (
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/30">
                              ₹ {image.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                          {image.title}
                        </h3>
                        <Link
                          to={`/listing/${image.listingId}`}
                          className="inline-flex items-center gap-2 text-white hover:text-blue-300 font-medium mt-2 transition-colors group/link"
                        >
                          View Details <FaArrowRight className="group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}

        {/* Categories / Listings Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-16">

          {/* Recommended Listings (signed-in only) */}
          {currentUser && recommendedListings.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <span className="p-2 bg-blue-100 rounded-lg text-blue-600"><FaStar className="text-lg sm:text-xl" /></span>
                  Recommended for You
                </h2>
                <Link to={`${linkPrefix}/search`} className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors text-sm sm:text-base whitespace-nowrap">
                  See More <span className="hidden sm:inline">Recommendations</span> <FaArrowRight />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendedListings.map((listing) => (
                  <ListingItem key={listing._id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Trending Listings */}
          {(trendingListings.length > 0 || offerListings.length > 0) && (
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <span className="p-2 bg-red-100 rounded-lg text-red-600"><FaChartLine className="text-lg sm:text-xl" /></span>
                  {trendingListings.length > 0 ? 'Popular / Trending' : 'Featured Properties'}
                </h2>
                <Link to={`${linkPrefix}/search`} className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors text-sm sm:text-base whitespace-nowrap">
                  See More <FaArrowRight />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trendingListings.length > 0 ? (
                  trendingListings.map((listing) => (
                    <ListingItem key={listing._id} listing={listing} />
                  ))
                ) : (
                  offerListings.slice(0, 4).map((listing) => (
                    <ListingItem key={listing._id} listing={listing} />
                  ))
                )}
              </div>
            </section>
          )}

          {/* Offer Listings */}
          {offerListings.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <span className="p-2 bg-orange-100 rounded-lg text-orange-600"><FaGem className="text-lg sm:text-xl" /></span>
                  Exclusive Offers
                </h2>
                <Link to={`${linkPrefix}/search?offer=true`} className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors text-sm sm:text-base whitespace-nowrap">
                  View All <span className="hidden sm:inline">Offers</span> <FaArrowRight />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {offerListings.map((listing) => (
                  <ListingItem key={listing._id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Rent Listings */}
          {rentListings.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <span className="p-2 bg-green-100 rounded-lg text-green-600"><FaHome className="text-lg sm:text-xl" /></span>
                  Homes for Rent
                </h2>
                <Link to={`${linkPrefix}/search?type=rent`} className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors text-sm sm:text-base whitespace-nowrap">
                  View All <span className="hidden sm:inline">Rentals</span> <FaArrowRight />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rentListings.map((listing) => (
                  <ListingItem key={listing._id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Sale Listings */}
          {saleListings.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <span className="p-2 bg-purple-100 rounded-lg text-purple-600"><FaHome className="text-lg sm:text-xl" /></span>
                  Homes for Sale
                </h2>
                <Link to={`${linkPrefix}/search?type=sale`} className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors text-sm sm:text-base whitespace-nowrap">
                  View All <span className="hidden sm:inline">Sales</span> <FaArrowRight />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {saleListings.map((listing) => (
                  <ListingItem key={listing._id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* How It Works Section */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Your journey to a new home in 4 simple steps.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: FaSearch, title: "Search", desc: "Filter and find your dream property.", color: "text-blue-600", bg: "bg-blue-50" },
                { icon: FaHeart, title: "Save", desc: "Shortlist your favorites easily.", color: "text-green-600", bg: "bg-green-50" },
                { icon: FaPhone, title: "Connect", desc: "Contact agents or owners directly.", color: "text-purple-600", bg: "bg-purple-50" },
                { icon: FaHandshake, title: "Deal", desc: "Close the deal securely.", color: "text-orange-600", bg: "bg-orange-50" }
              ].map((step, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all duration-300">
                  <div className={`w-16 h-16 ${step.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <step.icon className={`text-2xl ${step.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-bl-full -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

            <div className="text-center mb-12 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose UrbanSetu?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">We provide a premium, secure, and seamless real estate experience tailored to your needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {[
                { icon: FaSearch, title: "Smart Search", desc: "AI-powered search filters to find exactly what you need.", color: "text-blue-600", bg: "bg-blue-50" },
                { icon: FaShieldAlt, title: "Secure & Verified", desc: "All listings are verified for your peace of mind.", color: "text-green-600", bg: "bg-green-50" },
                { icon: FaRocket, title: "Fast Processing", desc: "Quick documentation and approval process.", color: "text-purple-600", bg: "bg-purple-50" },
                { icon: FaHeart, title: "24/7 Support", desc: "Dedicated support team available round the clock.", color: "text-red-500", bg: "bg-red-50" },
                { icon: FaDesktop, title: "Cross-Platform", desc: "Seamless experience across Mobile, Tablet, and Desktop.", color: "text-indigo-600", bg: "bg-indigo-50" },
                { icon: FaGem, title: "Premium Listings", desc: "Access to exclusive luxury properties.", color: "text-amber-600", bg: "bg-amber-50" }
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300">
                  <div className={`w-12 h-12 ${feature.bg} rounded-xl flex-shrink-0 flex items-center justify-center`}>
                    <feature.icon className={`text-xl ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Multi-Platform Access */}
          <section className="py-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Access From Anywhere</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Enjoy a seamless experience across all your favorite devices.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: FaDesktop, title: "Desktop", desc: "Full-featured experience." },
                { icon: FaMobile, title: "Mobile", desc: "Optimized for your pocket." },
                { icon: FaTablet, title: "Tablet", desc: "Perfect for browsing on the go." }
              ].map((platform, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-1 transition-transform">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 text-gray-700 text-2xl">
                    <platform.icon />
                  </div>
                  <h3 className="font-bold text-gray-900">{platform.title}</h3>
                  <p className="text-sm text-gray-500">{platform.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonials */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Thousands</h2>
              <p className="text-gray-600">See what our community has to say about their experience.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Sarah Johnson", role: "Home Buyer", quote: "Found my dream apartment in just 2 days! The interface is so intuitive.", bg: "bg-blue-100", text: "text-blue-600" },
                { name: "Michael Chen", role: "Property Investor", quote: "The best platform for real estate analytics and verified listings.", bg: "bg-green-100", text: "text-green-600" },
                { name: "Emily Rodriguez", role: "Tenant", quote: "Seamless rental process. The support team was incredibly helpful.", bg: "bg-purple-100", text: "text-purple-600" }
              ].map((t, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                  <FaQuoteLeft className={`text-4xl ${t.text} opacity-20 mb-4`} />
                  <p className="text-gray-600 italic mb-6">"{t.quote}"</p>
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, starIndex) => (
                      <FaStar key={starIndex} className="text-yellow-400 text-sm animate-pulse" style={{ animationDelay: `${starIndex * 0.1}s` }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.bg} flex items-center justify-center font-bold ${t.text}`}>
                      {t.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{t.name}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] opacity-10 bg-cover bg-center"></div>
            <div className="relative z-10 px-8 py-16 md:py-24 text-center max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Your Journey?</h2>
              <p className="text-blue-100 text-lg md:text-xl mb-10">Join thousands of satisfied users who have found their perfect property with UrbanSetu.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/search" className="px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg">
                  Find a Home
                </Link>
                <Link to="/about" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-blue-700 transition-all">
                  Learn More
                </Link>
              </div>
            </div>
          </section>

          {/* Ads Section */}
          <div className="text-center py-6">
            <p className="text-xs text-gray-400 mb-2 font-mono">SPONSORED CONTENT</p>
            {/* <AdsterraBanner /> */}
          </div>
        </div>

      </div>

      <ContactSupportWrapper />
      <GeminiAIWrapper />
    </div>
  );
}
