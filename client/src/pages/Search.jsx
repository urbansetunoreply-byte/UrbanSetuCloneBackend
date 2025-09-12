import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ListingItem from "../components/ListingItem";
import GeminiAIWrapper from "../components/GeminiAIWrapper";
import LocationSelector from "../components/LocationSelector";
import duckImg from "../assets/duck-go-final.gif";
import ContactSupportWrapper from '../components/ContactSupportWrapper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Search() {
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        searchTerm: "",
        type: "all",
        parking: false,
        furnished: false,
        offer: false,
        sort: "createdAt",
        order: "desc",
        minPrice: "",
        maxPrice: "",
        city: "",
        state: "",
        bedrooms: "",
        bathrooms: "",
    });
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showMoreListing, setShowMoreListing] = useState(false);
    const [error, setError] = useState(null);
    const [locationFilter, setLocationFilter] = useState({ state: "", district: "", city: "" });
    const [recommendations, setRecommendations] = useState([]);
    const [smartQuery, setSmartQuery] = useState("");

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        setFormData({
            searchTerm: urlParams.get("searchTerm") || "",
            type: urlParams.get("type") || "all",
            parking: urlParams.get("parking") === "true",
            furnished: urlParams.get("furnished") === "true",
            offer: urlParams.get("offer") === "true",
            sort: urlParams.get("sort") || "createdAt",
            order: urlParams.get("order") || "desc",
            minPrice: urlParams.get("minPrice") || "",
            maxPrice: urlParams.get("maxPrice") || "",
            city: urlParams.get("city") || "",
            state: urlParams.get("state") || "",
            bedrooms: urlParams.get("bedrooms") || "",
            bathrooms: urlParams.get("bathrooms") || "",
        });
        setLocationFilter({
            state: urlParams.get("state") || "",
            district: urlParams.get("district") || "",
            city: urlParams.get("city") || "",
        });

        const fetchListings = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/api/listing/get?${urlParams.toString()}`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setListings(Array.isArray(data) ? data : []);
                setShowMoreListing(Array.isArray(data) && data.length > 8);
            } catch (error) {
                console.error("Error fetching listings:", error);
                setError("Failed to load listings. Please try again.");
                setListings([]);
                setShowMoreListing(false);
            }
            setLoading(false);
        };
        fetchListings();
    }, [location.search]);

    const handleChanges = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const natural = (formData.searchTerm || '').trim();
        const extracted = { ...formData };
        const inferStateFromCity = (city) => {
            const cityToState = {
                'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra',
                'delhi': 'Delhi', 'new delhi': 'Delhi',
                'bengaluru': 'Karnataka', 'bangalore': 'Karnataka', 'mysuru': 'Karnataka',
                'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu',
                'kolkata': 'West Bengal',
                'hyderabad': 'Telangana',
                'ahmedabad': 'Gujarat', 'surat': 'Gujarat',
                'jaipur': 'Rajasthan',
                'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh',
                'gurgaon': 'Haryana', 'gurugram': 'Haryana',
                'indore': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh',
                'patna': 'Bihar'
            };
            const key = (city||'').toLowerCase();
            return cityToState[key] || '';
        };
        const bedsMatch = natural.match(/(\d+)\s*(bhk|bed|beds)/i);
        if (bedsMatch) extracted.bedrooms = bedsMatch[1];
        const priceMatch = natural.match(/(?:under|below)\s*(\d[\d,]*)/i);
        if (priceMatch) extracted.maxPrice = priceMatch[1].replace(/,/g,'');
        const nearMatch = natural.match(/near\s+([a-zA-Z ]+)/i);
        if (nearMatch) extracted.city = nearMatch[1].trim();
        const typeMatch = natural.match(/\b(rent|sale)\b/i);
        if (typeMatch) extracted.type = typeMatch[1].toLowerCase();
        if (extracted.city && !extracted.state) extracted.state = inferStateFromCity(extracted.city);
        const states = ['andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh','jharkhand','karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal','delhi'];
        const lower = natural.toLowerCase();
        const matchedState = states.find(s => new RegExp(`(^|\\b)${s}(\\b|$)`).test(lower));
        if (matchedState) extracted.state = matchedState.replace(/\b\w/g, c => c.toUpperCase());
        const urlParams = new URLSearchParams(extracted);
        navigate(`?${urlParams.toString()}`);
    };

    const applySmartQuery = (e) => {
        e.preventDefault();
        const natural = (smartQuery || '').trim();
        if (!natural) return;
        const extracted = { ...formData };
        
        // Enhanced city to state mapping with more cities and landmarks
        const inferStateFromCity = (city) => {
            const cityToState = {
                // Maharashtra
                'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'nashik': 'Maharashtra', 
                'aurangabad': 'Maharashtra', 'solapur': 'Maharashtra', 'amravati': 'Maharashtra', 'kolhapur': 'Maharashtra',
                'sangli': 'Maharashtra', 'malegaon': 'Maharashtra', 'ulhasnagar': 'Maharashtra', 'jalgaon': 'Maharashtra',
                'akola': 'Maharashtra', 'latur': 'Maharashtra', 'dhule': 'Maharashtra', 'ahmednagar': 'Maharashtra',
                'chandrapur': 'Maharashtra', 'parbhani': 'Maharashtra', 'ichalkaranji': 'Maharashtra', 'jalna': 'Maharashtra',
                'bhusawal': 'Maharashtra', 'ambad': 'Maharashtra', 'yavatmal': 'Maharashtra', 'kamptee': 'Maharashtra',
                'gondia': 'Maharashtra', 'barshi': 'Maharashtra', 'achalpur': 'Maharashtra', 'osmanabad': 'Maharashtra',
                'nandurbar': 'Maharashtra', 'wardha': 'Maharashtra', 'udgir': 'Maharashtra', 'hinganghat': 'Maharashtra',
                
                // Delhi & NCR
                'delhi': 'Delhi', 'new delhi': 'Delhi', 'gurgaon': 'Haryana', 
                'gurugram': 'Haryana', 'faridabad': 'Haryana', 'ghaziabad': 'Uttar Pradesh',
                'sonipat': 'Haryana', 'panipat': 'Haryana', 'rohtak': 'Haryana', 'karnal': 'Haryana',
                'hisar': 'Haryana', 'ambala': 'Haryana', 'yamunanagar': 'Haryana', 'bhiwani': 'Haryana',
                'rewari': 'Haryana', 'palwal': 'Haryana', 'mahendragarh': 'Haryana', 'jind': 'Haryana',
                'kaithal': 'Haryana', 'fatehabad': 'Haryana', 'sirsa': 'Haryana', 'mewat': 'Haryana',
                
                // Karnataka
                'bengaluru': 'Karnataka', 'bangalore': 'Karnataka', 'mysuru': 'Karnataka', 'mysore': 'Karnataka', 
                'mangalore': 'Karnataka', 'hubli': 'Karnataka', 'belgaum': 'Karnataka', 'gulbarga': 'Karnataka',
                'davangere': 'Karnataka', 'bellary': 'Karnataka', 'bijapur': 'Karnataka', 'shimoga': 'Karnataka',
                'tumkur': 'Karnataka', 'raichur': 'Karnataka', 'bidar': 'Karnataka', 'hospet': 'Karnataka',
                'hassan': 'Karnataka', 'gadag': 'Karnataka', 'udupi': 'Karnataka', 'karwar': 'Karnataka',
                'chitradurga': 'Karnataka', 'kolar': 'Karnataka', 'mandya': 'Karnataka', 'chikmagalur': 'Karnataka',
                'gangavati': 'Karnataka', 'bagalkot': 'Karnataka', 'ranebennur': 'Karnataka', 'athani': 'Karnataka',
                
                // Tamil Nadu
                'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 'tiruchirapalli': 'Tamil Nadu', 
                'salem': 'Tamil Nadu', 'tirunelveli': 'Tamil Nadu', 'tiruppur': 'Tamil Nadu', 'erode': 'Tamil Nadu',
                'vellore': 'Tamil Nadu', 'thoothukkudi': 'Tamil Nadu', 'dindigul': 'Tamil Nadu', 'thanjavur': 'Tamil Nadu',
                'ranipet': 'Tamil Nadu', 'sivakasi': 'Tamil Nadu', 'karur': 'Tamil Nadu', 'udhagamandalam': 'Tamil Nadu',
                'hosur': 'Tamil Nadu', 'nagercoil': 'Tamil Nadu', 'kanchipuram': 'Tamil Nadu', 'cuddalore': 'Tamil Nadu',
                'kumbakonam': 'Tamil Nadu', 'tiruvannamalai': 'Tamil Nadu', 'pollachi': 'Tamil Nadu', 'rajapalayam': 'Tamil Nadu',
                'gudiyatham': 'Tamil Nadu', 'pudukkottai': 'Tamil Nadu', 'neyveli': 'Tamil Nadu', 'ambattur': 'Tamil Nadu',
                
                // West Bengal
                'kolkata': 'West Bengal', 'howrah': 'West Bengal', 'durgapur': 'West Bengal', 'asansol': 'West Bengal',
                'siliguri': 'West Bengal', 'malda': 'West Bengal', 'berhampore': 'West Bengal', 'habra': 'West Bengal',
                'kharagpur': 'West Bengal', 'shantipur': 'West Bengal', 'dankuni': 'West Bengal', 'dhulian': 'West Bengal',
                'ranaghat': 'West Bengal', 'haldia': 'West Bengal', 'raiganj': 'West Bengal', 'krishnanagar': 'West Bengal',
                'nabadwip': 'West Bengal', 'medinipur': 'West Bengal', 'jalpaiguri': 'West Bengal', 'balurghat': 'West Bengal',
                'basirhat': 'West Bengal', 'bankura': 'West Bengal', 'chakdaha': 'West Bengal', 'darjeeling': 'West Bengal',
                
                // Telangana
                'hyderabad': 'Telangana', 'warangal': 'Telangana', 'nizamabad': 'Telangana', 'khammam': 'Telangana',
                'karimnagar': 'Telangana', 'ramagundam': 'Telangana', 'mahbubnagar': 'Telangana', 'nalgonda': 'Telangana',
                'adilabad': 'Telangana', 'suryapet': 'Telangana', 'miryalaguda': 'Telangana', 'tadepalligudem': 'Telangana',
                'mancherial': 'Telangana', 'kothagudem': 'Telangana', 'dharmabad': 'Telangana', 'bhongir': 'Telangana',
                'bodhan': 'Telangana', 'palwancha': 'Telangana', 'mandamarri': 'Telangana', 'koratla': 'Telangana',
                'sircilla': 'Telangana', 'tandur': 'Telangana', 'siddipet': 'Telangana', 'wanaparthy': 'Telangana',
                
                // Gujarat
                'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat', 
                'bhavnagar': 'Gujarat', 'jamnagar': 'Gujarat', 'nadiad': 'Gujarat', 'porbandar': 'Gujarat',
                'anand': 'Gujarat', 'morbi': 'Gujarat', 'mahesana': 'Gujarat', 'bharuch': 'Gujarat',
                'veraval': 'Gujarat', 'navsari': 'Gujarat', 'gandhidham': 'Gujarat',
                
                // Rajasthan
                'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'udaipur': 'Rajasthan', 'kota': 'Rajasthan', 
                'bikaner': 'Rajasthan', 'ajmer': 'Rajasthan', 'bharatpur': 'Rajasthan', 'bhiwadi': 'Rajasthan',
                'alwar': 'Rajasthan', 'beawar': 'Rajasthan', 'dungarpur': 'Rajasthan', 'hindaun': 'Rajasthan',
                'gangapur': 'Rajasthan', 'laxmangarh': 'Rajasthan', 'sikar': 'Rajasthan', 'pali': 'Rajasthan',
                'tonk': 'Rajasthan', 'kishangarh': 'Rajasthan', 'banswara': 'Rajasthan', 'hanumangarh': 'Rajasthan',
                'dausa': 'Rajasthan', 'churu': 'Rajasthan', 'bundi': 'Rajasthan', 'sawai madhopur': 'Rajasthan',
                
                // Uttar Pradesh
                'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh', 
                'meerut': 'Uttar Pradesh', 'allahabad': 'Uttar Pradesh', 'bareilly': 'Uttar Pradesh', 'gorakhpur': 'Uttar Pradesh',
                'moradabad': 'Uttar Pradesh', 'aligarh': 'Uttar Pradesh', 'saharanpur': 'Uttar Pradesh', 'noida': 'Uttar Pradesh',
                'firozabad': 'Uttar Pradesh', 'jhansi': 'Uttar Pradesh', 'muzaffarnagar': 'Uttar Pradesh', 'mathura': 'Uttar Pradesh',
                'shahjahanpur': 'Uttar Pradesh', 'rampur': 'Uttar Pradesh', 'modinagar': 'Uttar Pradesh', 'hapur': 'Uttar Pradesh',
                'etawah': 'Uttar Pradesh', 'mirzapur': 'Uttar Pradesh', 'bulandshahr': 'Uttar Pradesh', 'sambhal': 'Uttar Pradesh',
                'amroha': 'Uttar Pradesh', 'hardoi': 'Uttar Pradesh', 'fatehpur': 'Uttar Pradesh', 'raebareli': 'Uttar Pradesh',
                
                // Madhya Pradesh
                'indore': 'Madhya Pradesh', 'bhopal': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh',
                'ujjain': 'Madhya Pradesh', 'sagar': 'Madhya Pradesh', 'dewas': 'Madhya Pradesh', 'satna': 'Madhya Pradesh',
                'ratlam': 'Madhya Pradesh', 'rewa': 'Madhya Pradesh', 'murwara': 'Madhya Pradesh', 'singrauli': 'Madhya Pradesh',
                'burhanpur': 'Madhya Pradesh', 'khandwa': 'Madhya Pradesh', 'morena': 'Madhya Pradesh', 'bhind': 'Madhya Pradesh',
                'vidisha': 'Madhya Pradesh', 'chhindwara': 'Madhya Pradesh', 'guna': 'Madhya Pradesh', 'shivpuri': 'Madhya Pradesh',
                'mandsaur': 'Madhya Pradesh', 'neemuch': 'Madhya Pradesh', 'pithampur': 'Madhya Pradesh', 'itarsi': 'Madhya Pradesh',
                
                // Bihar
                'patna': 'Bihar', 'gaya': 'Bihar', 'bhagalpur': 'Bihar', 'muzaffarpur': 'Bihar',
                'purnia': 'Bihar', 'darbhanga': 'Bihar', 'bihar sharif': 'Bihar', 'arrah': 'Bihar',
                'begusarai': 'Bihar', 'katihar': 'Bihar', 'munger': 'Bihar', 'chapra': 'Bihar',
                'sasaram': 'Bihar', 'hajipur': 'Bihar', 'dehri': 'Bihar', 'bettiah': 'Bihar',
                'motihari': 'Bihar', 'siwan': 'Bihar', 'kishanganj': 'Bihar', 'saharsa': 'Bihar',
                
                // Kerala
                'kochi': 'Kerala', 'thiruvananthapuram': 'Kerala', 'kozhikode': 'Kerala', 'thrissur': 'Kerala',
                'kollam': 'Kerala', 'palakkad': 'Kerala', 'alappuzha': 'Kerala', 'malappuram': 'Kerala',
                'kannur': 'Kerala', 'kasaragod': 'Kerala', 'pathanamthitta': 'Kerala', 'idukki': 'Kerala',
                'wayanad': 'Kerala', 'ernakulam': 'Kerala', 'kottayam': 'Kerala', 'tirur': 'Kerala',
                'koyilandy': 'Kerala',
                
                // Andhra Pradesh
                'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh', 'guntur': 'Andhra Pradesh', 'nellore': 'Andhra Pradesh',
                'kurnool': 'Andhra Pradesh', 'rajahmundry': 'Andhra Pradesh', 'tirupati': 'Andhra Pradesh', 'kadapa': 'Andhra Pradesh',
                'anantapur': 'Andhra Pradesh', 'chittoor': 'Andhra Pradesh', 'proddatur': 'Andhra Pradesh', 'nandyal': 'Andhra Pradesh',
                'eluru': 'Andhra Pradesh', 'ongole': 'Andhra Pradesh', 'chilakaluripet': 'Andhra Pradesh', 'kadiri': 'Andhra Pradesh',
                'adoni': 'Andhra Pradesh', 'tenali': 'Andhra Pradesh', 'chirala': 'Andhra Pradesh', 'bapatla': 'Andhra Pradesh',
                'srikakulam': 'Andhra Pradesh', 'vizianagaram': 'Andhra Pradesh', 'parvathipuram': 'Andhra Pradesh', 'bobbili': 'Andhra Pradesh',
                
                // Union Territories
                'chandigarh': 'Chandigarh', 'panchkula': 'Haryana', 'mohali': 'Punjab',
                'jammu': 'Jammu and Kashmir', 'srinagar': 'Jammu and Kashmir', 'leh': 'Ladakh',
                'kargil': 'Ladakh', 'anantnag': 'Jammu and Kashmir', 'baramulla': 'Jammu and Kashmir',
                'udhampur': 'Jammu and Kashmir', 'kathua': 'Jammu and Kashmir', 'rajouri': 'Jammu and Kashmir',
                'punch': 'Jammu and Kashmir', 'doda': 'Jammu and Kashmir', 'kishtwar': 'Jammu and Kashmir',
                'ramban': 'Jammu and Kashmir', 'reasi': 'Jammu and Kashmir', 'samba': 'Jammu and Kashmir',
                'bandipora': 'Jammu and Kashmir', 'ganderbal': 'Jammu and Kashmir', 'kulgam': 'Jammu and Kashmir',
                'pulwama': 'Jammu and Kashmir', 'shopian': 'Jammu and Kashmir', 'budgam': 'Jammu and Kashmir',
                'kupwara': 'Jammu and Kashmir', 'handwara': 'Jammu and Kashmir', 'karnah': 'Jammu and Kashmir'
            };
            const key = (city||'').toLowerCase().trim();
            return cityToState[key] || '';
        };

        // Enhanced bedroom detection
        const bedsMatch = natural.match(/(\d+)\s*(bhk|bed|beds|bedroom|bedrooms|room|rooms)/i);
        if (bedsMatch) extracted.bedrooms = bedsMatch[1];
        
        // Enhanced bathroom detection
        const bathMatch = natural.match(/(\d+)\s*(bath|baths|bathroom|bathrooms|toilet|toilets)/i);
        if (bathMatch) extracted.bathrooms = bathMatch[1];

        // Enhanced price detection with more patterns and intelligent parsing
        const pricePatterns = [
            /(?:under|below|upto|max|maximum|up to)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores|rs|rupees?)?/i,
            /(?:within|around|about|approximately|approx)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores|rs|rupees?)?/i,
            /(?:budget|budget of|my budget is|looking for)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores|rs|rupees?)?/i,
            /(?:less than|not more than|below|under)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores|rs|rupees?)?/i,
            /(?:price|cost|rent|sale price)\s*(?:is|should be|around|about)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores|rs|rupees?)?/i,
            /(?:affordable|cheap|low cost|economical)\s*(?:under|below|within)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores|rs|rupees?)?/i,
            /(?:₹|rs\.?|rupees?)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i
        ];
        
        for (const pattern of pricePatterns) {
            const priceMatch = natural.match(pattern);
            if (priceMatch) {
                extracted.maxPrice = priceMatch[1].replace(/,/g,'');
                if (priceMatch[2]) {
                    const unit = priceMatch[2].toLowerCase();
                    const val = Number(extracted.maxPrice||0);
                    if (unit==='k' || unit==='thousand') extracted.maxPrice = String(val*1000);
                    if (unit==='l' || unit==='lac' || unit==='lakh' || unit==='lakhs') extracted.maxPrice = String(val*100000);
                    if (unit==='cr' || unit==='crore' || unit==='crores') extracted.maxPrice = String(val*10000000);
                }
                break;
            }
        }

        // Enhanced minimum price detection
        const minPricePatterns = [
            /(?:above|more than|minimum|min|from)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i,
            /(?:starting from|starting at)\s*(\d[\d,]*)\s*(k|l|lac|lakh|cr|crore|thousand|lakhs|crores)?/i
        ];
        
        for (const pattern of minPricePatterns) {
            const minPriceMatch = natural.match(pattern);
            if (minPriceMatch) {
                extracted.minPrice = minPriceMatch[1].replace(/,/g,'');
                if (minPriceMatch[2]) {
                    const unit = minPriceMatch[2].toLowerCase();
                    const val = Number(extracted.minPrice||0);
                    if (unit==='k' || unit==='thousand') extracted.minPrice = String(val*1000);
                    if (unit==='l' || unit==='lac' || unit==='lakh' || unit==='lakhs') extracted.minPrice = String(val*100000);
                    if (unit==='cr' || unit==='crore' || unit==='crores') extracted.minPrice = String(val*10000000);
                }
                break;
            }
        }

        // Enhanced location detection
        const locationPatterns = [
            /(?:near|close to|around)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
            /(?:in|at|from)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
            /(?:located in|situated in)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i,
            /(?:area|locality|neighborhood)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.)/i
        ];
        
        for (const pattern of locationPatterns) {
            const locationMatch = natural.match(pattern);
            if (locationMatch) {
                const location = locationMatch[1].trim();
                // Check if it's a city or landmark
                if (location.length > 2 && !/^(the|a|an|and|or|but|in|on|at|to|for|of|with|by)$/i.test(location)) {
                    extracted.city = location;
                    break;
                }
            }
        }

        // Auto-infer state from city
        if (extracted.city && !extracted.state) {
            extracted.state = inferStateFromCity(extracted.city);
        }

        // Enhanced state detection
        const states = ['andhra pradesh','arunachal pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana','himachal pradesh','jharkhand','karnataka','kerala','madhya pradesh','maharashtra','manipur','meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil nadu','telangana','tripura','uttar pradesh','uttarakhand','west bengal','delhi','chandigarh','jammu and kashmir','ladakh'];
        const lower = natural.toLowerCase();
        const matchedState = states.find(s => new RegExp(`(^|\\b)${s}(\\b|$)`).test(lower));
        if (matchedState) extracted.state = matchedState.replace(/\b\w/g, c => c.toUpperCase());

        // Enhanced property type detection
        const typePatterns = [
            /\b(rent|rental|renting|for rent|to rent)\b/i,
            /\b(sale|sell|selling|for sale|to sell|buy|buying|purchase|purchasing)\b/i,
            /\b(lease|leasing|leased)\b/i
        ];
        
        for (const pattern of typePatterns) {
            const typeMatch = natural.match(pattern);
            if (typeMatch) {
                const type = typeMatch[1].toLowerCase();
                if (/rent|lease/.test(type)) extracted.type = 'rent';
                else if (/sale|buy|purchase/.test(type)) extracted.type = 'sale';
                break;
            }
        }

        // Enhanced amenities detection with more comprehensive patterns
        const amenityPatterns = {
            parking: [
                /(?:with|having|includes?)\s+parking/i,
                /parking\s+(?:available|included|provided|space)/i,
                /(?:car\s+)?parking/i,
                /garage/i,
                /(?:covered|open)\s+parking/i,
                /(?:two|2)\s+wheelers?\s+parking/i,
                /(?:four|4)\s+wheelers?\s+parking/i,
                /vehicle\s+parking/i,
                /parking\s+lot/i,
                /parking\s+space/i
            ],
            furnished: [
                /(?:fully\s+)?furnished/i,
                /(?:with|having|includes?)\s+furniture/i,
                /furniture\s+(?:included|provided|available)/i,
                /(?:semi\s+)?furnished/i,
                /(?:partially\s+)?furnished/i,
                /(?:well\s+)?furnished/i,
                /(?:beautifully\s+)?furnished/i,
                /(?:modern\s+)?furniture/i,
                /(?:wooden\s+)?furniture/i,
                /(?:ready\s+to\s+move\s+in|rtmi)/i
            ],
            unfurnished: [
                /unfurnished/i,
                /(?:without|no)\s+furniture/i,
                /bare\s+apartment/i,
                /(?:empty|vacant)\s+apartment/i,
                /(?:not\s+)?furnished/i,
                /(?:without\s+)?furniture/i
            ],
            offer: [
                /(?:special\s+)?offer/i,
                /discount/i,
                /deal/i,
                /promotion/i,
                /(?:reduced|lower)\s+price/i,
                /(?:cheap|affordable|budget)/i,
                /(?:best\s+)?deal/i,
                /(?:great\s+)?offer/i,
                /(?:limited\s+time\s+)?offer/i,
                /(?:exclusive\s+)?offer/i,
                /(?:flash\s+)?sale/i,
                /(?:clearance\s+)?sale/i
            ],
            // New amenity patterns
            balcony: [
                /(?:with|having)\s+balcony/i,
                /balcony/i,
                /(?:private\s+)?balcony/i,
                /(?:beautiful\s+)?balcony/i
            ],
            garden: [
                /(?:with|having)\s+garden/i,
                /garden/i,
                /(?:private\s+)?garden/i,
                /(?:beautiful\s+)?garden/i,
                /(?:rooftop\s+)?garden/i
            ],
            security: [
                /(?:with|having)\s+security/i,
                /security/i,
                /(?:24\s*\/\s*7\s+)?security/i,
                /(?:gated\s+)?security/i,
                /(?:cctv\s+)?security/i,
                /(?:round\s+the\s+clock\s+)?security/i
            ],
            lift: [
                /(?:with|having)\s+lift/i,
                /lift/i,
                /elevator/i,
                /(?:modern\s+)?lift/i
            ],
            ac: [
                /(?:with|having)\s+ac/i,
                /(?:air\s+conditioning|air\s+conditioner)/i,
                /(?:central\s+)?ac/i,
                /(?:split\s+)?ac/i
            ]
        };

        // Check for parking
        if (amenityPatterns.parking.some(pattern => pattern.test(natural))) {
            extracted.parking = true;
        } else if (/no\s+parking|without\s+parking/i.test(natural)) {
            extracted.parking = false;
        }

        // Check for furnished/unfurnished
        if (amenityPatterns.furnished.some(pattern => pattern.test(natural))) {
            extracted.furnished = true;
        } else if (amenityPatterns.unfurnished.some(pattern => pattern.test(natural))) {
            extracted.furnished = false;
        }

        // Check for offers
        if (amenityPatterns.offer.some(pattern => pattern.test(natural))) {
            extracted.offer = true;
        }

        // Property size detection
        const sizePatterns = [
            /(?:small|compact|studio|1\s*bhk)/i,
            /(?:medium|2\s*bhk|3\s*bhk)/i,
            /(?:large|big|4\s*bhk|5\s*bhk)/i,
            /(?:luxury|premium|villa|penthouse)/i
        ];

        if (/small|compact|studio|1\s*bhk/i.test(natural)) {
            extracted.bedrooms = '1';
        } else if (/medium|2\s*bhk|3\s*bhk/i.test(natural)) {
            extracted.bedrooms = '2';
        } else if (/large|big|4\s*bhk|5\s*bhk/i.test(natural)) {
            extracted.bedrooms = '4';
        }

        // Property condition detection
        if (/new|newly\s+built|recently\s+constructed/i.test(natural)) {
            // Could add a condition filter if needed
        } else if (/old|aged|renovated|refurbished/i.test(natural)) {
            // Could add a condition filter if needed
        }

        // Urgency detection
        if (/urgent|immediate|asap|quick|fast/i.test(natural)) {
            extracted.sort = 'createdAt';
            extracted.order = 'desc';
        }

        const urlParams = new URLSearchParams(extracted);
        navigate(`?${urlParams.toString()}`);
    };

    const showMoreListingClick = async () => {
        try {
            const urlParams = new URLSearchParams(location.search);
            urlParams.set("startIndex", listings.length);
            const res = await fetch(`${API_BASE_URL}/api/listing/get?${urlParams.toString()}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setListings((prev) => [...prev, ...data]);
                setShowMoreListing(data.length >= 8);
            }
        } catch (error) {
            console.error("Error fetching more listings:", error);
        }
    };

    const handleLocationChange = (loc) => {
        setLocationFilter(loc);
        setFormData((prev) => ({ ...prev, state: loc.state, district: loc.district, city: loc.city }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading properties...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-4 sm:py-6 lg:py-10 px-2 sm:px-4 md:px-8">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6 relative">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-700 mb-4 sm:mb-6 text-center drop-shadow">
                    Explore Properties
                </h3>
                {/* Enhanced Smart (NLP) Search - Desktop Optimized */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-6 rounded-xl mb-6 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3 lg:mb-4">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <label className="text-base lg:text-lg font-semibold text-blue-800">Smart Search (Natural Language)</label>
                    </div>
                    <form onSubmit={applySmartQuery} className="space-y-3 lg:space-y-4">
                        <div className="relative">
                            <input
                              value={smartQuery}
                              onChange={(e) => setSmartQuery(e.target.value)}
                              placeholder="e.g., 2BHK under 15k near Delhi Metro, furnished with parking"
                              className="w-full p-3 lg:p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-base lg:text-lg"
                            />
                            <div className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2">
                                <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 lg:px-6 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold text-sm lg:text-base">
                                    Search
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 lg:gap-2">
                            <span className="text-xs lg:text-sm text-gray-600">Try:</span>
                            {[
                                "3BHK under 25L in Mumbai",
                                "2BHK with parking in Bangalore", 
                                "Furnished apartment near metro",
                                "Budget house for rent in Pune"
                            ].map((suggestion, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setSmartQuery(suggestion)}
                                    className="text-xs bg-white border border-blue-300 text-blue-700 px-2 lg:px-3 py-1 rounded-full hover:bg-blue-50 transition-colors duration-200"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </form>
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="bg-gray-100 p-4 lg:p-6 rounded-lg mb-6"
                >
                    {/* First Row - Search and Sort */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        <input
                            type="text"
                            name="searchTerm"
                            placeholder="Search..."
                            value={formData.searchTerm}
                            onChange={handleChanges}
                            className="p-3 border rounded-lg w-full text-sm lg:text-base"
                        />

                        <select
                            name="sort_order"
                            onChange={(e) => {
                                const [sort, order] = e.target.value.split("_");
                                setFormData((prev) => ({
                                    ...prev,
                                    sort,
                                    order,
                                }));
                            }}
                            value={`${formData.sort}_${formData.order}`}
                            className="p-3 border rounded-lg w-full text-sm lg:text-base"
                        >
                            <option value="regularPrice_desc">Price high to low</option>
                            <option value="regularPrice_asc">Price low to high</option>
                            <option value="createdAt_desc">Latest</option>
                            <option value="createdAt_asc">Oldest</option>
                        </select>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center justify-center gap-2 text-sm lg:text-base"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" /></svg>
                            Search
                        </button>
                    </div>

                    {/* Location Selector */}
                    <div className="mb-4">
                        <LocationSelector value={locationFilter} onChange={handleLocationChange} mode="search" />
                    </div>

                    {/* Second Row - Type and Filters */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {/* Property Type */}
                        <div className="flex flex-wrap gap-3 lg:gap-4">
                            <label className="flex items-center gap-2 text-sm lg:text-base">
                                <input
                                    type="radio"
                                    name="type"
                                    value="all"
                                    checked={formData.type === "all"}
                                    onChange={handleChanges}
                                    className="w-4 h-4"
                                />
                                All
                            </label>
                            <label className="flex items-center gap-2 text-sm lg:text-base">
                                <input
                                    type="radio"
                                    name="type"
                                    value="rent"
                                    checked={formData.type === "rent"}
                                    onChange={handleChanges}
                                    className="w-4 h-4"
                                />
                                Rent
                            </label>
                            <label className="flex items-center gap-2 text-sm lg:text-base">
                                <input
                                    type="radio"
                                    name="type"
                                    value="sale"
                                    checked={formData.type === "sale"}
                                    onChange={handleChanges}
                                    className="w-4 h-4"
                                />
                                Sale
                            </label>
                        </div>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-3 lg:gap-4">
                            <label className="flex items-center gap-2 text-sm lg:text-base">
                                <input
                                    type="checkbox"
                                    name="parking"
                                    onChange={handleChanges}
                                    checked={formData.parking}
                                    className="w-4 h-4"
                                />
                                Parking
                            </label>
                            <label className="flex items-center gap-2 text-sm lg:text-base">
                                <input
                                    type="checkbox"
                                    name="furnished"
                                    onChange={handleChanges}
                                    checked={formData.furnished}
                                    className="w-4 h-4"
                                />
                                Furnished
                            </label>
                            <label className="flex items-center gap-2 text-sm lg:text-base">
                                <input
                                    type="checkbox"
                                    name="offer"
                                    onChange={handleChanges}
                                    checked={formData.offer}
                                    className="w-4 h-4"
                                />
                                Offer
                            </label>
                        </div>
                    </div>

                    {/* Third Row - Advanced Filters */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        <input
                            type="number"
                            name="minPrice"
                            placeholder="Min Price"
                            value={formData.minPrice}
                            onChange={handleChanges}
                            className="p-3 border rounded-lg w-full text-sm lg:text-base"
                            min={0}
                        />
                        <input
                            type="number"
                            name="maxPrice"
                            placeholder="Max Price"
                            value={formData.maxPrice}
                            onChange={handleChanges}
                            className="p-3 border rounded-lg w-full text-sm lg:text-base"
                            min={0}
                        />
                        <input
                            type="number"
                            name="bedrooms"
                            placeholder="Bedrooms"
                            value={formData.bedrooms}
                            onChange={handleChanges}
                            className="p-3 border rounded-lg w-full text-sm lg:text-base"
                            min={1}
                        />
                        <input
                            type="number"
                            name="bathrooms"
                            placeholder="Bathrooms"
                            value={formData.bathrooms}
                            onChange={handleChanges}
                            className="p-3 border rounded-lg w-full text-sm lg:text-base"
                            min={1}
                        />
                    </div>
                </form>


                {/* Listings Display */}
                <div className="mt-4 sm:mt-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Search Results</h2>
                    {loading && <p className="text-center text-base sm:text-lg font-semibold text-blue-600 animate-pulse">Loading properties...</p>}
                    {error && <p className="text-center text-red-600 text-base sm:text-lg mb-4">{error}</p>}
                    {!loading && !error && listings.length === 0 && (
                      <div className="text-center py-6 sm:py-8">
                        <img src={duckImg} alt="No listings found" className="w-48 h-48 sm:w-72 sm:h-72 object-contain mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">No Properties Found</h3>
                        <p className="text-gray-500 mb-4 text-sm sm:text-base">Try adjusting your search criteria or filters</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                        {listings && listings.map((listing) => (
                            <ListingItem key={listing._id} listing={listing} />
                        ))}
                    </div>
                    {showMoreListing && (
                        <div className="flex justify-center mt-4 sm:mt-6">
                        <button
                            type="button"
                            onClick={showMoreListingClick}
                            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold text-sm sm:text-base"
                        >
                            Show More Properties
                        </button>
                        </div>
                    )}
                </div>
                {recommendations.length > 0 && (
                  <div className="mt-8 sm:mt-10">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Recommended for you</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                      {recommendations.map((l) => (
                        <ListingItem key={l._id} listing={l} />
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
