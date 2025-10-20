// This script updates existing About documents with new fields
// Run this when the database is available

import mongoose from 'mongoose';
import About from './models/about.model.js';

const updateAboutFields = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/urbansetu');
    console.log('Connected to MongoDB');

    // Find existing About document
    let about = await About.findOne();
    
    if (!about) {
      console.log('No About document found. The API will create one with default content.');
      return;
    }

    console.log('Found existing About document, checking for missing fields...');
    
    let needsUpdate = false;
    const updateData = {};

    // Check and add vision
    if (!about.vision) {
      updateData.vision = "To become India's most trusted digital real estate network driven by AI and community insights, where every property transaction is transparent, efficient, and customer-centric.";
      needsUpdate = true;
      console.log('Adding vision field');
    }

    // Check and add coreValues
    if (!about.coreValues || about.coreValues.length === 0) {
      updateData.coreValues = [
        {
          title: "Transparency",
          description: "We believe in complete transparency in all our dealings and maintain the highest standards of trust."
        },
        {
          title: "User Trust & Data Privacy",
          description: "Your data security and privacy are our top priorities. We implement industry-leading security measures."
        },
        {
          title: "Innovation",
          description: "We continuously innovate using AI, automation, and analytics to provide the best technology solutions."
        },
        {
          title: "Fair Marketplace",
          description: "We ensure a fair and equal platform for all users, promoting ethical practices in real estate."
        },
        {
          title: "Verified Listings & Secure Transactions",
          description: "Every listing is verified, and all transactions are secure and protected."
        }
      ];
      needsUpdate = true;
      console.log('Adding coreValues field');
    }

    // Check and add howItWorks
    if (!about.howItWorks) {
      updateData.howItWorks = {
        buyers: {
          title: "For Buyers & Renters",
          steps: [
            "Browse verified properties with AI-powered recommendations",
            "Use advanced filters and map view to find your perfect home",
            "Add properties to wishlist or watchlist for easy tracking",
            "Book appointments and chat with property owners in real-time",
            "Make informed decisions with detailed property insights"
          ]
        },
        sellers: {
          title: "For Sellers & Property Owners",
          steps: [
            "List your property with detailed information and media",
            "Track performance with comprehensive analytics dashboard",
            "Chat with potential buyers and manage inquiries",
            "Schedule and manage property visits efficiently",
            "Monitor reviews and maintain your property's reputation"
          ]
        },
        admins: {
          title: "For Administrators",
          steps: [
            "Approve and manage property listings",
            "Monitor platform activity and user interactions",
            "Analyze data insights and platform performance",
            "Manage user accounts and resolve disputes",
            "Ensure platform security and compliance"
          ]
        }
      };
      needsUpdate = true;
      console.log('Adding howItWorks field');
    }

    // Check and add journey
    if (!about.journey) {
      updateData.journey = {
        title: "Our Journey",
        story: "The idea of UrbanSetu was born from the need for a smarter, transparent real estate experience. Our team combined technology, data, and user feedback to build a platform that goes beyond listings — one that learns and adapts to user needs.",
        milestones: [
          {
            year: "2020",
            title: "Company Founded",
            description: "Started with a vision to revolutionize real estate in India"
          },
          {
            year: "2021",
            title: "1000+ Properties",
            description: "Reached our first milestone of 1000 verified listings"
          },
          {
            year: "2022",
            title: "AI Integration",
            description: "Launched AI-powered property recommendations and fraud detection"
          },
          {
            year: "2023",
            title: "10K+ Customers",
            description: "Served over 10,000 satisfied customers nationwide"
          },
          {
            year: "2024",
            title: "Mobile App Launch",
            description: "Launched our comprehensive mobile application and PWA"
          }
        ]
      };
      needsUpdate = true;
      console.log('Adding journey field');
    }

    // Check and add teamMembers
    if (!about.teamMembers || about.teamMembers.length === 0) {
      updateData.teamMembers = [
        {
          name: "Rajesh Kumar",
          role: "CEO & Founder",
          description: "Visionary leader with 15+ years in real estate technology",
          image: null
        },
        {
          name: "Priya Sharma",
          role: "CTO",
          description: "Tech expert specializing in AI and machine learning",
          image: null
        },
        {
          name: "Amit Patel",
          role: "Head of Operations",
          description: "Operations specialist ensuring smooth customer experience",
          image: null
        },
        {
          name: "Sneha Gupta",
          role: "Head of Marketing",
          description: "Marketing strategist connecting properties with people",
          image: null
        }
      ];
      needsUpdate = true;
      console.log('Adding teamMembers field');
    }

    // Check and add faqs
    if (!about.faqs || about.faqs.length === 0) {
      updateData.faqs = [
        {
          question: "What is UrbanSetu?",
          answer: "UrbanSetu is a comprehensive real estate platform that uses AI and smart technology to connect buyers, sellers, and renters. We provide verified listings, real-time chat, appointment booking, and advanced analytics to make property transactions seamless and secure."
        },
        {
          question: "Is UrbanSetu free to use?",
          answer: "Yes! UrbanSetu is completely free for buyers and renters. Property owners can list their properties for free with basic features, and we offer premium plans for advanced analytics and marketing tools."
        },
        {
          question: "How are properties verified?",
          answer: "Every property goes through our comprehensive verification process, including document verification, location verification, and fraud detection. We also use AI to analyze listing quality and authenticity."
        },
        {
          question: "How do I book a property visit?",
          answer: "Simply browse properties, click on the property you're interested in, and use our appointment booking system to schedule a visit. You can also chat with the property owner directly through our real-time messaging system."
        },
        {
          question: "Is my data secure on UrbanSetu?",
          answer: "Absolutely! We implement industry-leading security measures including data encryption, secure authentication, and regular security audits. Your personal information is protected and never shared without your consent."
        },
        {
          question: "How can I contact support?",
          answer: "You can reach our support team through email at support@urbansetu.com, use our in-app chat support, or call our helpline. We also have a comprehensive help center with detailed guides and FAQs."
        }
      ];
      needsUpdate = true;
      console.log('Adding faqs field');
    }

    // Check and add socialLinks
    if (!about.socialLinks) {
      updateData.socialLinks = {
        email: "contact@urbansetu.com",
        instagram: "https://instagram.com/urbansetu",
        x: "https://x.com/urbansetu",
        facebook: "https://facebook.com/urbansetu",
        youtube: "https://youtube.com/@urbansetu"
      };
      needsUpdate = true;
      console.log('Adding socialLinks field');
    }

    if (needsUpdate) {
      // Update the document
      about = await About.findByIdAndUpdate(
        about._id,
        { ...updateData, lastUpdated: Date.now() },
        { new: true }
      );
      console.log('Successfully updated About document with new fields');
    } else {
      console.log('About document already has all new fields');
    }

    // Verify the update
    console.log('\nVerification:');
    console.log('- Has coreValues:', !!about.coreValues, `(${about.coreValues?.length || 0} items)`);
    console.log('- Has howItWorks:', !!about.howItWorks);
    console.log('- Has journey:', !!about.journey, `(${about.journey?.milestones?.length || 0} milestones)`);
    console.log('- Has faqs:', !!about.faqs, `(${about.faqs?.length || 0} items)`);
    console.log('- Has teamMembers:', !!about.teamMembers, `(${about.teamMembers?.length || 0} members)`);
    console.log('- Has socialLinks:', !!about.socialLinks);

  } catch (error) {
    console.error('Error updating About document:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the update
updateAboutFields();
