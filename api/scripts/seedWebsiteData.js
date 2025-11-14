import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import Blog from '../models/blog.model.js';
import FAQ from '../models/faq.model.js';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO || 'mongodb://localhost:27017/urbansetu');
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Sample FAQ data
const sampleFAQs = [
    {
        question: "How do I search for properties on UrbanSetu?",
        answer: "You can search for properties using our advanced search filters. Simply enter your preferred location, budget range, property type, and other criteria. Our AI-powered search will show you the most relevant properties matching your requirements.",
        category: "Property Search",
        tags: ["search", "properties", "filters"],
        priority: 10
    },
    {
        question: "What are the current property prices in Bangalore?",
        answer: "Property prices in Bangalore vary by location and type. As of 2024, 2BHK apartments range from ₹50L to ₹2Cr depending on the area. Premium locations like Koramangala and Indiranagar command higher prices, while emerging areas like Whitefield and Electronic City offer more affordable options.",
        category: "General",
        tags: ["prices", "bangalore", "market"],
        priority: 9
    },
    {
        question: "Do you provide home loan assistance?",
        answer: "Yes, we partner with leading banks and financial institutions to help you get the best home loan rates. Our team can assist with loan application, documentation, and provide guidance on various loan schemes available.",
        category: "Finance",
        tags: ["home loan", "finance", "banking"],
        priority: 8
    },
    {
        question: "How can I list my property for sale?",
        answer: "To list your property, simply create an account, go to 'List Property', fill in the property details, upload photos, and submit. Our team will verify the details and make your property live on our platform within 24 hours.",
        category: "Selling Process",
        tags: ["list property", "sell", "listing"],
        priority: 7
    },
    {
        question: "What documents do I need to buy a property?",
        answer: "Essential documents include: Identity proof (Aadhaar, PAN), Address proof, Income proof, Bank statements, Property documents (Title deed, Encumbrance certificate), and Loan documents (if taking a loan). Our legal team can guide you through the complete documentation process.",
        category: "Buying Process",
        tags: ["documents", "buying", "legal"],
        priority: 9
    }
];

// Sample Blog data
const sampleBlogs = [
    {
        title: "Top 10 Real Estate Investment Areas in Bangalore 2024",
        content: "Bangalore continues to be one of India's most promising real estate markets. Here are the top 10 areas for investment in 2024...",
        excerpt: "Discover the best areas in Bangalore for real estate investment in 2024. From established localities to emerging hotspots, find out where to invest your money for maximum returns.",
        tags: ["investment", "bangalore", "real estate", "2024"],
        category: "Investment Guide",
        author: "UrbanSetu Team"
    },
    {
        title: "Complete Guide to Home Buying Process in India",
        content: "Buying a home is one of the biggest financial decisions you'll make. Here's a complete step-by-step guide to help you navigate the home buying process in India...",
        excerpt: "A comprehensive guide covering everything from property search to possession. Learn about legal formalities, documentation, and tips for first-time home buyers.",
        tags: ["home buying", "guide", "process", "first time buyer"],
        category: "Home Buying",
        author: "UrbanSetu Team"
    },
    {
        title: "RERA Compliance: What Every Home Buyer Should Know",
        content: "The Real Estate (Regulation and Development) Act, 2016 (RERA) has brought significant changes to the real estate sector. Here's what every home buyer should know...",
        excerpt: "Understanding RERA compliance is crucial for home buyers. Learn about your rights, developer obligations, and how RERA protects your interests.",
        tags: ["RERA", "legal", "compliance", "home buyer"],
        category: "Legal",
        author: "UrbanSetu Team"
    }
];

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await FAQ.deleteMany({});
        await Blog.deleteMany({});

        // Insert sample FAQs
        await FAQ.insertMany(sampleFAQs);
        console.log('✅ Sample FAQs inserted');

        // Insert sample blogs
        await Blog.insertMany(sampleBlogs);
        console.log('✅ Sample blogs inserted');

        // Check if we have properties
        const propertyCount = await Listing.countDocuments();
        console.log(`📊 Total properties in database: ${propertyCount}`);

        console.log('🎉 Website data seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
