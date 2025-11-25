import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css/bundle";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import ListingItem from "../components/ListingItem";
import ContactSupportWrapper from '../components/ContactSupportWrapper';
import GeminiAIWrapper from '../components/GeminiAIWrapper';
import { usePageTitle } from '../hooks/usePageTitle';
import { FaHome, FaSearch, FaHeart, FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaShieldAlt, FaAward, FaUsers, FaChartLine, FaLightbulb, FaRocket, FaGem, FaQuoteLeft, FaQuoteRight, FaCheckCircle, FaClock, FaHandshake, FaGlobe, FaMobile, FaDesktop, FaTablet, FaInfoCircle } from "react-icons/fa";
import AdsterraBanner from "../components/AdsterraBanner";
import AdHighperformanceBanner from "../components/AdHighperformanceBanner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PublicHome() {
  // Set page title
  usePageTitle("Find Your Dream Home - Smart Real Estate Platform");
  
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [recommendedListings, setRecommendedListings] = useState([]);
  const [trendingListings, setTrendingListings] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSliderVisible, setIsSliderVisible] = useState(false);
  const [stats, setStats] = useState({ properties: 0, users: 0, transactions: 0, satisfaction: 0 });
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isFeaturesVisible, setIsFeaturesVisible] = useState(false);
  const [isTestimonialsVisible, setIsTestimonialsVisible] = useState(false);
  const [isHowItWorksVisible, setIsHowItWorksVisible] = useState(false);
  const [isPlatformVisible, setIsPlatformVisible] = useState(false);
  const [isCTAVisible, setIsCTAVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isParallaxActive, setIsParallaxActive] = useState(false);
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?offer=true&visibility=public`); // removed &limit=6
        const data = await res.json();
        setOfferListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching offer listings", error);
        setOfferListings([]);
      }
    };

    const fetchRentListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?type=rent&visibility=public`); // removed &limit=6
        const data = await res.json();
        setRentListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching rent listings", error);
        setRentListings([]);
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?type=sale&visibility=public`); // removed &limit=6
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

  // Trigger slider visibility animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSliderVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setIsParallaxActive(window.scrollY > 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const section = entry.target.dataset.section;
          switch (section) {
            case 'hero':
              setIsHeroVisible(true);
              break;
            case 'features':
              setIsFeaturesVisible(true);
              break;
            case 'testimonials':
              setIsTestimonialsVisible(true);
              break;
            case 'how-it-works':
              setIsHowItWorksVisible(true);
              break;
            case 'platform':
              setIsPlatformVisible(true);
              break;
            case 'cta':
              setIsCTAVisible(true);
              break;
            default:
              break;
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
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
        setIsStatsVisible(true);
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Set mock data if API fails
        setStats({
          properties: 1250,
          users: 5000,
          transactions: 2500,
          satisfaction: 98
        });
        setIsStatsVisible(true);
      }
    };
    fetchStats();
  }, []);

  // Fetch recommended listings
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/recommended?limit=6`);
        if (!res.ok) return;
        const data = await res.json();
        setRecommendedListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching recommended listings", error);
        setRecommendedListings([]);
      }
    };
    fetchRecommended();
  }, []);

  // Fetch trending listings (highly watchlisted properties)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        console.log("Fetching trending listings...");
        const res = await fetch(`${API_BASE_URL}/api/watchlist/top-watched?limit=6`);
        console.log("Trending API response status:", res.status);
        if (!res.ok) {
          console.log("Trending API not ok, status:", res.status);
          return;
        }
        const data = await res.json();
        console.log("Trending listings data:", data);
        setTrendingListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching trending listings", error);
        // Set some mock trending data for testing
        setTrendingListings([
          { _id: 'mock1', name: 'Trending Property 1', type: 'sale', regularPrice: 500000 },
          { _id: 'mock2', name: 'Trending Property 2', type: 'rent', regularPrice: 25000 },
          { _id: 'mock3', name: 'Trending Property 3', type: 'sale', regularPrice: 750000 }
        ]);
      }
    };
    fetchTrending();
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
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative text-center py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden"
        data-section="hero"
        style={{
          transform: `translateY(${isParallaxActive ? -20 : 0}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"
            style={{
              left: `${mousePosition.x * 0.1}px`,
              top: `${mousePosition.y * 0.1}px`,
              transform: 'translate(-50%, -50%)'
            }}
          />
          <div 
            className="absolute w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl animate-bounce"
            style={{
              right: `${mousePosition.x * 0.05}px`,
              bottom: `${mousePosition.y * 0.05}px`,
              transform: 'translate(50%, 50%)'
            }}
          />
        </div>

        <div className={`relative z-10 transition-all duration-1000 px-4 ${isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 animate-pulse px-2">
            Find Your Dream Home
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 animate-pulse px-2" style={{ animationDelay: '0.2s' }}>
            Discover the best homes at unbeatable prices
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Link 
              to="/search" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 sm:px-8 sm:py-4 rounded-xl shadow-2xl hover:bg-gray-100 hover:scale-105 transition-all duration-300"
            >
              <FaRocket className="text-lg sm:text-xl" />
              <span className="text-sm sm:text-base">Start Exploring</span>
            </Link>
            <Link 
              to="/about" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white font-bold px-6 py-3 sm:px-8 sm:py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              <FaInfoCircle className="text-lg sm:text-xl" />
              <span className="text-sm sm:text-base">Learn More</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className={`max-w-6xl mx-auto px-4 py-8 sm:py-12 transition-all duration-1000 ${isStatsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 drop-shadow-lg">Our Impact in Numbers</h2>
          <p className="text-gray-700 text-base sm:text-lg font-medium">Trusted by thousands of users worldwide</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center bg-gradient-to-br from-blue-600/80 to-purple-600/80 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-blue-400/30 hover:from-blue-500/90 hover:to-purple-500/90 transition-all duration-300 hover:scale-105 shadow-xl">
            <FaHome className="text-2xl sm:text-4xl text-yellow-300 mx-auto mb-2 sm:mb-4 drop-shadow-lg" />
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">{stats.properties.toLocaleString()}+</div>
            <div className="text-white text-sm sm:text-base font-semibold">Properties</div>
          </div>
          <div className="text-center bg-gradient-to-br from-green-600/80 to-teal-600/80 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-green-400/30 hover:from-green-500/90 hover:to-teal-500/90 transition-all duration-300 hover:scale-105 shadow-xl">
            <FaUsers className="text-2xl sm:text-4xl text-blue-300 mx-auto mb-2 sm:mb-4 drop-shadow-lg" />
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">{stats.users.toLocaleString()}+</div>
            <div className="text-white text-sm sm:text-base font-semibold">Happy Users</div>
          </div>
          <div className="text-center bg-gradient-to-br from-purple-600/80 to-pink-600/80 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-purple-400/30 hover:from-purple-500/90 hover:to-pink-500/90 transition-all duration-300 hover:scale-105 shadow-xl">
            <FaChartLine className="text-2xl sm:text-4xl text-green-300 mx-auto mb-2 sm:mb-4 drop-shadow-lg" />
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">{stats.transactions.toLocaleString()}+</div>
            <div className="text-white text-sm sm:text-base font-semibold">Transactions</div>
          </div>
          <div className="text-center bg-gradient-to-br from-orange-600/80 to-red-600/80 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-orange-400/30 hover:from-orange-500/90 hover:to-red-500/90 transition-all duration-300 hover:scale-105 shadow-xl">
            <FaStar className="text-2xl sm:text-4xl text-yellow-300 mx-auto mb-2 sm:mb-4 drop-shadow-lg" />
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">{stats.satisfaction}%</div>
            <div className="text-white text-sm sm:text-base font-semibold">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16" data-section="features">
        <div className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${isFeaturesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 animate-pulse">Why Choose UrbanSetu?</h2>
          <p className="text-gray-600 text-base sm:text-lg animate-pulse px-2" style={{ animationDelay: '0.2s' }}>Discover the features that make us the preferred choice for real estate</p>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 transition-all duration-1000 ${isFeaturesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <FaSearch className="text-lg sm:text-2xl text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Smart Search</h3>
            <p className="text-gray-600 text-sm sm:text-base">AI-powered search with advanced filters to find your perfect property</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <FaShieldAlt className="text-lg sm:text-2xl text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Secure Transactions</h3>
            <p className="text-gray-600 text-sm sm:text-base">Bank-level security for all your real estate transactions</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <FaAward className="text-lg sm:text-2xl text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Verified Properties</h3>
            <p className="text-gray-600 text-sm sm:text-base">All properties are verified and quality-checked by our experts</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <FaRocket className="text-lg sm:text-2xl text-orange-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Fast Processing</h3>
            <p className="text-gray-600 text-sm sm:text-base">Quick approval and processing for all your real estate needs</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <FaHeart className="text-lg sm:text-2xl text-teal-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">24/7 Support</h3>
            <p className="text-gray-600 text-sm sm:text-base">Round-the-clock customer support for all your queries</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <FaGem className="text-lg sm:text-2xl text-pink-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Premium Experience</h3>
            <p className="text-gray-600 text-sm sm:text-base">Luxury real estate experience with exclusive properties</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 bg-gradient-to-r from-blue-50 to-purple-50" data-section="testimonials">
        <div className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${isTestimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 animate-pulse">What Our Users Say</h2>
          <p className="text-gray-600 text-base sm:text-lg animate-pulse px-2" style={{ animationDelay: '0.2s' }}>Real stories from satisfied customers</p>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 transition-all duration-1000 ${isTestimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                <FaQuoteLeft className="text-blue-600 text-sm sm:text-base" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Sarah Johnson</h4>
                <p className="text-gray-600 text-xs sm:text-sm">Property Buyer</p>
              </div>
            </div>
            <p className="text-gray-700 italic text-sm sm:text-base">"UrbanSetu made finding my dream home so easy! The AI recommendations were spot-on and saved me weeks of searching."</p>
            <div className="flex items-center mt-3 sm:mt-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-xs sm:text-sm animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                <FaQuoteLeft className="text-green-600 text-sm sm:text-base" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Michael Chen</h4>
                <p className="text-gray-600 text-xs sm:text-sm">Real Estate Agent</p>
              </div>
            </div>
            <p className="text-gray-700 italic text-sm sm:text-base">"The platform's analytics and tools have revolutionized how I manage my listings. My sales have increased by 40%!"</p>
            <div className="flex items-center mt-3 sm:mt-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-xs sm:text-sm animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                <FaQuoteLeft className="text-purple-600 text-sm sm:text-base" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Emily Rodriguez</h4>
                <p className="text-gray-600 text-xs sm:text-sm">Property Investor</p>
              </div>
            </div>
            <p className="text-gray-700 italic text-sm sm:text-base">"The secure transaction system and verified properties give me complete confidence in every investment decision."</p>
            <div className="flex items-center mt-3 sm:mt-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-xs sm:text-sm animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Photo Slider Gallery */}
      {allSliderImages.length > 0 && (
        <div className={`my-12 mx-auto max-w-6xl px-4 transition-all duration-1000 ease-out animate-slider-fade-in ${
          isSliderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Slider Header */}
          <div className="text-center mb-6 animate-slider-slide-up">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Properties</h2>
            <p className="text-gray-600">Explore our handpicked selection of premium homes</p>
          </div>

          {/* Main Slider Container */}
          <div className="relative group animate-slider-scale-in">
            {/* Enhanced Swiper */}
            <Swiper
              ref={swiperRef}
              modules={[Autoplay, Pagination, EffectFade]}
              pagination={{
                clickable: true,
                dynamicBullets: true,
                renderBullet: function (index, className) {
                  return `<span class="${className} w-3 h-3 bg-white/60 hover:bg-white transition-all duration-300"></span>`;
                },
              }}
              autoplay={{ 
                delay: 4000, 
                disableOnInteraction: false,
                pauseOnMouseEnter: true
              }}
              loop={true}
              effect="fade"
              fadeEffect={{
                crossFade: true
              }}
              speed={800}
              onSlideChange={handleSlideChange}
              className="rounded-2xl shadow-2xl overflow-hidden hover:animate-slider-glow"
            >
              {allSliderImages.map((image, idx) => (
                <SwiperSlide key={`${image.listingId}-${idx}`} className="relative">
                  <div className="relative h-80 md:h-96 lg:h-[500px] overflow-hidden" style={{
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                    willChange: 'transform'
                  }}>
                    <img 
                      src={image.url} 
                      className="w-full h-full object-cover gallery-image-crisp" 
                      alt={image.title}
                      loading="eager"
                      decoding="sync"
                      fetchpriority="high"
                      style={{
                        imageRendering: 'optimize-contrast',
                        WebkitImageRendering: '-webkit-optimize-contrast',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                        filter: 'contrast(1.1) brightness(1.05) saturate(1.05)',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    />
                    {/* Image Overlay with Property Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent animate-overlay-fade-in">
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-xl md:text-2xl font-bold mb-2 animate-text-slide-up">
                          {image.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm md:text-base">
                          <span className="bg-blue-600 px-3 py-1 rounded-full font-semibold animate-price-pulse">
                            ₹{image.price?.toLocaleString('en-IN') || 'Contact for Price'}
                          </span>
                          <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm animate-type-badge">
                            {image.type?.charAt(0).toUpperCase() + image.type?.slice(1) || 'Property'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>



            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out animate-progress-fill"
                style={{ 
                  width: `${((currentSlideIndex + 1) / allSliderImages.length) * 100}%`,
                  '--progress-width': `${((currentSlideIndex + 1) / allSliderImages.length) * 100}%`
                }}
              />
            </div>

            {/* Thumbnail Navigation */}
            <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-2">
              {allSliderImages.slice(0, 8).map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-110 animate-thumbnail-bounce ${
                    currentSlideIndex === idx 
                      ? 'border-blue-500 ring-2 ring-blue-300' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <img 
                    src={image.url} 
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Listings Section */}
      <div className="max-w-6xl w-full mx-auto px-2 sm:px-4 md:px-8 py-8 overflow-x-hidden">
        {/* Offer Listings */}
        {offerListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up delay-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700 animate-slide-in-left">🔥 Exclusive Offers</h2>
              <Link to="/search?offer=true" className="text-blue-600 hover:underline">View All Offers</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {offerListings.map((listing) => (
                <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl" key={listing._id}>
                  <ListingItem listing={listing} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rent Listings */}
        {rentListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up delay-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700 animate-slide-in-left delay-200">🏡 Homes for Rent</h2>
              <Link to="/search?type=rent" className="text-blue-600 hover:underline">View All Rentals</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {rentListings.map((listing) => (
                <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl" key={listing._id}>
                  <ListingItem listing={listing} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sale Listings */}
        {saleListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up delay-1000">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700 animate-slide-in-left delay-400">🏠 Homes for Sale</h2>
              <Link to="/search?type=sale" className="text-blue-600 hover:underline">View All Sales</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {saleListings.map((listing) => (
                <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl" key={listing._id}>
                  <ListingItem listing={listing} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16" data-section="how-it-works">
        <div className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${isHowItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 animate-pulse">How It Works</h2>
          <p className="text-gray-600 text-base sm:text-lg animate-pulse px-2" style={{ animationDelay: '0.2s' }}>Simple steps to find your perfect property</p>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 transition-all duration-1000 ${isHowItWorksVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaSearch className="text-2xl sm:text-3xl text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">1. Search</h3>
            <p className="text-gray-600 text-sm sm:text-base">Use our smart filters to find properties that match your criteria</p>
          </div>
          
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHeart className="text-2xl sm:text-3xl text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">2. Save</h3>
            <p className="text-gray-600 text-sm sm:text-base">Save your favorite properties and get notifications about price changes</p>
          </div>
          
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPhone className="text-2xl sm:text-3xl text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">3. Connect</h3>
            <p className="text-gray-600 text-sm sm:text-base">Contact sellers directly through our secure messaging system</p>
          </div>
          
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHandshake className="text-2xl sm:text-3xl text-orange-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">4. Deal</h3>
            <p className="text-gray-600 text-sm sm:text-base">Complete your transaction with our secure payment system</p>
          </div>
        </div>
      </div>

      {/* Platform Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 bg-gradient-to-r from-gray-50 to-blue-50" data-section="platform">
        <div className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${isPlatformVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 animate-pulse">Multi-Platform Access</h2>
          <p className="text-gray-600 text-base sm:text-lg animate-pulse px-2" style={{ animationDelay: '0.2s' }}>Access UrbanSetu from any device, anywhere</p>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 transition-all duration-1000 ${isPlatformVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaDesktop className="text-3xl text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Desktop</h3>
            <p className="text-gray-600">Full-featured experience on your computer</p>
          </div>
          
          <div className="text-center bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaMobile className="text-3xl text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Mobile</h3>
            <p className="text-gray-600">Optimized for smartphones and tablets</p>
          </div>
          
          <div className="text-center bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FaTablet className="text-3xl text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Tablet</h3>
            <p className="text-gray-600">Perfect for browsing on the go</p>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16" data-section="cta">
        <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-center text-white transition-all duration-1000 ${isCTAVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 animate-pulse">Ready to Find Your Dream Home?</h2>
          <p className="text-lg sm:text-xl mb-8 animate-pulse" style={{ animationDelay: '0.2s' }}>Join thousands of satisfied customers who found their perfect property with UrbanSetu</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/search" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-xl shadow-2xl hover:bg-gray-100 hover:scale-105 transition-all duration-300"
            >
              <FaRocket className="text-xl" />
              <span>Start Searching Now</span>
            </Link>
            <Link 
              to="/sign-up" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              <FaUsers className="text-xl" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
      {/* 🔔 Ads Section */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-center text-xs text-gray-500 mb-2">🔔 Ads by Adsterra</p>
        <AdsterraBanner />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-center text-xs text-gray-500 mb-2">🔔 Sponsored — Powered by Adsterra</p>
        <AdHighperformanceBanner />
      </div>

      <ContactSupportWrapper />
      <GeminiAIWrapper />
      
    </div>
  );
} 
