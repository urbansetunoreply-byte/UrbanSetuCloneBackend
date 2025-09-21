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
import { FaHome, FaSearch, FaHeart, FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaShieldAlt, FaAward, FaUsers, FaChartLine, FaLightbulb, FaRocket, FaGem, FaQuoteLeft, FaQuoteRight, FaCheckCircle, FaClock, FaHandshake, FaGlobe, FaMobile, FaDesktop, FaTablet } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [recommendedListings, setRecommendedListings] = useState([]);
  const [trendingListings, setTrendingListings] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSliderVisible, setIsSliderVisible] = useState(false);
  const [stats, setStats] = useState({ properties: 0, users: 0, transactions: 0, satisfaction: 0 });
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const swiperRef = useRef(null);
  const navigate = useNavigate();
  const isUser = window.location.pathname.startsWith('/user');
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?offer=true`); // removed &limit=6
        const data = await res.json();
        setOfferListings(data);
      } catch (error) {
        console.error("Error fetching offer listings", error);
      }
    };

    const fetchRentListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?type=rent`); // removed &limit=6
        const data = await res.json();
        setRentListings(data);
      } catch (error) {
        console.error("Error fetching rent listings", error);
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listing/get?type=sale`); // removed &limit=6
        const data = await res.json();
        setSaleListings(data);
      } catch (error) {
        console.error("Error fetching sale listings", error);
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
      }
    };
    fetchRecommended();
  }, [currentUser?._id]);

  // Fetch trending listings (highly watchlisted properties)
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/watchlist/top-watched?limit=6`);
        if (!res.ok) return;
        const data = await res.json();
        setTrendingListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching trending listings", error);
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
          fetch(`${API_BASE_URL}/api/listing/get`),
          fetch(`${API_BASE_URL}/api/user/stats`),
          fetch(`${API_BASE_URL}/api/booking/stats`)
        ]);
        
        const [propertiesData, usersData, transactionsData] = await Promise.all([
          propertiesRes.json(),
          usersRes.json(),
          transactionsRes.json()
        ]);
        
        setStats({
          properties: Array.isArray(propertiesData) ? propertiesData.length : 0,
          users: usersData?.totalUsers || 0,
          transactions: transactionsData?.totalTransactions || 0,
          satisfaction: 98 // Mock satisfaction rate
        });
        
        // Trigger stats animation
        setTimeout(() => setIsStatsVisible(true), 500);
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Set default stats
        setStats({ properties: 1250, users: 5000, transactions: 2500, satisfaction: 98 });
        setTimeout(() => setIsStatsVisible(true), 500);
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
  const allSliderImages = offerListings.flatMap(listing =>
    (listing.imageUrls || []).map((img, idx) => ({
      url: img,
      listingId: listing._id,
      title: listing.name || 'Featured Property',
      price: listing.offer && listing.discountPrice ? listing.discountPrice : listing.regularPrice,
      type: listing.type
    }))
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-fade-in-down">
        {currentUser && (
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md shadow-sm text-base sm:text-lg font-semibold animate-fade-in"
            >
              {(() => {
                const name = currentUser.firstName || currentUser.username || currentUser.name || currentUser.fullName || 'Friend';
                const hour = new Date().getHours();
                const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                const emoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
                return `${greet}, ${name}! ${emoji}`;
              })()}
            </span>
          </div>
        )}
        <h1 className="text-4xl font-extrabold animate-fade-in">Find Your Dream Home</h1>
        <p className="mt-2 text-lg animate-fade-in delay-200">Discover the best homes at unbeatable prices</p>
        <Link to="/search" className="mt-4 inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-gray-200 hover:scale-105 transition-all animate-fade-in-up delay-300">
          Start Exploring
        </Link>
      </div>

      {/* Statistics Section */}
      <div className={`max-w-6xl mx-auto px-4 py-12 transition-all duration-1000 ${isStatsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Impact in Numbers</h2>
          <p className="text-white/90 text-lg">Trusted by thousands of users worldwide</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 shadow-lg">
            <FaHome className="text-4xl text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
            <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{stats.properties.toLocaleString()}+</div>
            <div className="text-white text-base font-semibold">Properties</div>
          </div>
          <div className="text-center bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 shadow-lg">
            <FaUsers className="text-4xl text-blue-400 mx-auto mb-4 drop-shadow-lg" />
            <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{stats.users.toLocaleString()}+</div>
            <div className="text-white text-base font-semibold">Happy Users</div>
          </div>
          <div className="text-center bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 shadow-lg">
            <FaChartLine className="text-4xl text-green-400 mx-auto mb-4 drop-shadow-lg" />
            <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{stats.transactions.toLocaleString()}+</div>
            <div className="text-white text-base font-semibold">Transactions</div>
          </div>
          <div className="text-center bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 shadow-lg">
            <FaStar className="text-4xl text-purple-400 mx-auto mb-4 drop-shadow-lg" />
            <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{stats.satisfaction}%</div>
            <div className="text-white text-base font-semibold">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Choose UrbanSetu?</h2>
          <p className="text-gray-600 text-lg">Discover the features that make us the preferred choice for real estate</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <FaSearch className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart Search</h3>
            <p className="text-gray-600">AI-powered search with advanced filters to find your perfect property</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <FaShieldAlt className="text-2xl text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure Transactions</h3>
            <p className="text-gray-600">Bank-level security for all your real estate transactions</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FaAward className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Verified Properties</h3>
            <p className="text-gray-600">All properties are verified and quality-checked by our experts</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <FaRocket className="text-2xl text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Fast Processing</h3>
            <p className="text-gray-600">Quick approval and processing for all your real estate needs</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
              <FaHeart className="text-2xl text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">24/7 Support</h3>
            <p className="text-gray-600">Round-the-clock customer support for all your queries</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <FaGem className="text-2xl text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Premium Experience</h3>
            <p className="text-gray-600">Luxury real estate experience with exclusive properties</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">What Our Users Say</h2>
          <p className="text-gray-600 text-lg">Real stories from satisfied customers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <FaQuoteLeft className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Sarah Johnson</h4>
                <p className="text-gray-600 text-sm">Property Buyer</p>
              </div>
            </div>
            <p className="text-gray-700 italic">"UrbanSetu made finding my dream home so easy! The AI recommendations were spot-on and saved me weeks of searching."</p>
            <div className="flex items-center mt-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-sm" />
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <FaQuoteLeft className="text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Michael Chen</h4>
                <p className="text-gray-600 text-sm">Real Estate Agent</p>
              </div>
            </div>
            <p className="text-gray-700 italic">"The platform's analytics and tools have revolutionized how I manage my listings. My sales have increased by 40%!"</p>
            <div className="flex items-center mt-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-sm" />
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <FaQuoteLeft className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Emily Rodriguez</h4>
                <p className="text-gray-600 text-sm">Property Investor</p>
              </div>
            </div>
            <p className="text-gray-700 italic">"The secure transaction system and verified properties give me complete confidence in every investment decision."</p>
            <div className="flex items-center mt-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-yellow-400 text-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
          <p className="text-gray-600 text-lg">Simple steps to find your perfect property</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaSearch className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Search</h3>
            <p className="text-gray-600">Use our AI-powered search to find properties that match your criteria</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Verify</h3>
            <p className="text-gray-600">All properties are verified and quality-checked by our experts</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHandshake className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Connect</h3>
            <p className="text-gray-600">Connect with property owners and schedule viewings</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHome className="text-2xl text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">4. Secure</h3>
            <p className="text-gray-600">Complete secure transactions with our protected payment system</p>
          </div>
        </div>
      </div>

      {/* Platform Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Multi-Platform Access</h2>
          <p className="text-gray-600 text-lg">Access UrbanSetu from any device, anywhere</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <FaDesktop className="text-5xl text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Desktop</h3>
            <p className="text-gray-600">Full-featured experience with advanced analytics and management tools</p>
          </div>
          
          <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <FaMobile className="text-5xl text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Mobile</h3>
            <p className="text-gray-600">On-the-go access with push notifications and location-based search</p>
          </div>
          
          <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <FaTablet className="text-5xl text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Tablet</h3>
            <p className="text-gray-600">Perfect balance of portability and functionality for property viewing</p>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Dream Property?</h2>
          <p className="text-xl mb-8 text-blue-100">Join thousands of satisfied users and discover your perfect home today</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search" className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg shadow-lg hover:bg-gray-100 hover:scale-105 transition-all">
              Start Searching
            </Link>
            <Link to="/about" className="bg-transparent border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-all">
              Learn More
            </Link>
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
        {/* Recommended Listings (signed-in only) */}
        {currentUser && recommendedListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700">✨ Recommended for You</h2>
              <Link to={isUser ? "/user/search" : "/search"} className="text-blue-600 hover:underline">See More</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {recommendedListings.map((listing) => (
                <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl" key={listing._id}>
                  <ListingItem listing={listing} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Listings (Popular/Highly Watchlisted) */}
        {trendingListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
                <span className="text-3xl">🔥</span>
                Popular/Trending Properties
              </h2>
              <Link to={isUser ? "/user/search" : "/search"} className="text-purple-600 hover:underline">See More</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {trendingListings.map((listing) => (
                <div className="transition-transform duration-300 hover:scale-105 hover:shadow-xl" key={listing._id}>
                  <ListingItem listing={listing} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offer Listings */}
        {offerListings.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6 animate-fade-in-up delay-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700 animate-slide-in-left">🎁 Exclusive Offers</h2>
              <Link to={isUser ? "/user/search?offer=true" : "/search?offer=true"} className="text-blue-600 hover:underline">View All Offers</Link>
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
              <Link to={isUser ? "/user/search?type=rent" : "/search?type=rent"} className="text-blue-600 hover:underline">View All Rentals</Link>
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
              <Link to={isUser ? "/user/search?type=sale" : "/search?type=sale"} className="text-blue-600 hover:underline">View All Sales</Link>
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
      <GeminiAIWrapper />
      <ContactSupportWrapper />
    </div>
  );
}


