import fetch from 'node-fetch';

const updateAboutDirect = async () => {
  try {
    console.log('Getting current About data...');
    
    // Get current About data
    const getResponse = await fetch('https://urbansetu.onrender.com/api/about');
    if (!getResponse.ok) {
      throw new Error(`Failed to get current About data: ${getResponse.status}`);
    }
    
    const currentData = await getResponse.json();
    console.log('Current About document ID:', currentData._id);
    
    // Prepare complete update data
    const updateData = {
      ...currentData, // Keep all existing data
      vision: "To become India's most trusted digital real estate network driven by AI and community insights, where every property transaction is transparent, efficient, and customer-centric.",
      coreValues: [
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
      ],
      howItWorks: {
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
      },
      journey: {
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
      },
      teamMembers: [
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
      ],
      faqs: [
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
      ],
      socialLinks: {
        email: "contact@urbansetu.com",
        instagram: "https://instagram.com/urbansetu",
        x: "https://x.com/urbansetu",
        facebook: "https://facebook.com/urbansetu",
        youtube: "https://youtube.com/@urbansetu"
      },
      lastUpdated: new Date().toISOString(),
      updatedBy: "Migration Script"
    };
    
    console.log('Updating About document with new fields...');
    console.log('This will require admin authentication. Please run this from the admin panel or use the migration endpoint when deployed.');
    
    // For now, just show what would be updated
    console.log('\nFields that would be updated:');
    console.log('- vision:', !!updateData.vision);
    console.log('- coreValues:', updateData.coreValues.length, 'items');
    console.log('- howItWorks:', !!updateData.howItWorks);
    console.log('- journey:', updateData.journey.milestones.length, 'milestones');
    console.log('- teamMembers:', updateData.teamMembers.length, 'members');
    console.log('- faqs:', updateData.faqs.length, 'items');
    console.log('- socialLinks:', !!updateData.socialLinks);
    
    console.log('\nTo update the production database, you need to:');
    console.log('1. Deploy the updated backend code to Render');
    console.log('2. Use the admin panel to update the About content');
    console.log('3. Or run the migration endpoint: POST /api/about/migrate');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

updateAboutDirect();
