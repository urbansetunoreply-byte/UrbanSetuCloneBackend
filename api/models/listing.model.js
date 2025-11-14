import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    propertyNumber: {
        type: String,
        required: true
    },
    landmark: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: false
    },
    regularPrice: {
        type: Number,
        required: true
    },
    discountPrice: {
        type: Number,
        required: true
    },
    bathrooms: {
        type: Number,
        required: true
    },
    bedrooms: {
        type: Number,
        required: true
    },
    furnished: {
        type: Boolean,
        required: true
    },
    parking: {
        type: Boolean,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    offer: {
        type: Boolean,
        required: true
    },
    imageUrls: {
        type: Array,
        required: true
    },
    // Optional property videos (Cloudinary URLs or external links)
    videoUrls: {
        type: Array,
        required: false,
        default: []
    },
    locationLink: {
        type: String,
        required: false
    },
    area: {
        type: Number,
        required: false
    },
    floor: {
        type: Number,
        required: false
    },
    propertyAge: {
        type: Number,
        required: false
    },
    viewCount: {
        type: Number,
        default: 0
    },
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Review-related fields
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    totalRating: {
        type: Number,
        default: 0
    },
    
    // ESG (Environmental, Social, Governance) Fields
    esg: {
        environmental: {
            energyRating: {
                type: String,
                enum: ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'Not Rated'],
                default: 'Not Rated'
            },
            carbonFootprint: {
                type: Number,
                default: 0 // CO2 emissions in kg per year
            },
            renewableEnergy: {
                type: Boolean,
                default: false
            },
            waterEfficiency: {
                type: String,
                enum: ['Excellent', 'Good', 'Average', 'Poor', 'Not Rated'],
                default: 'Not Rated'
            },
            wasteManagement: {
                type: String,
                enum: ['Excellent', 'Good', 'Average', 'Poor', 'Not Rated'],
                default: 'Not Rated'
            },
            greenCertification: {
                type: String,
                enum: ['LEED', 'BREEAM', 'GRIHA', 'IGBC', 'None'],
                default: 'None'
            },
            solarPanels: {
                type: Boolean,
                default: false
            },
            rainwaterHarvesting: {
                type: Boolean,
                default: false
            }
        },
        social: {
            accessibility: {
                type: String,
                enum: ['Fully Accessible', 'Partially Accessible', 'Not Accessible', 'Not Rated'],
                default: 'Not Rated'
            },
            communityImpact: {
                type: Number,
                default: 0 // Community benefit score (0-100)
            },
            affordableHousing: {
                type: Boolean,
                default: false
            },
            localEmployment: {
                type: Number,
                default: 0 // Number of local jobs created
            },
            socialAmenities: {
                type: [String],
                default: []
            },
            diversityInclusion: {
                type: String,
                enum: ['Excellent', 'Good', 'Average', 'Poor', 'Not Rated'],
                default: 'Not Rated'
            }
        },
        governance: {
            transparency: {
                type: String,
                enum: ['Excellent', 'Good', 'Average', 'Poor', 'Not Rated'],
                default: 'Not Rated'
            },
            ethicalStandards: {
                type: String,
                enum: ['Excellent', 'Good', 'Average', 'Poor', 'Not Rated'],
                default: 'Not Rated'
            },
            compliance: {
                type: String,
                enum: ['Fully Compliant', 'Mostly Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Rated'],
                default: 'Not Rated'
            },
            riskManagement: {
                type: String,
                enum: ['Excellent', 'Good', 'Average', 'Poor', 'Not Rated'],
                default: 'Not Rated'
            },
            stakeholderEngagement: {
                type: String,
                enum: ['Excellent', 'Good', 'Average', 'Poor', 'Not Rated'],
                default: 'Not Rated'
            }
        },
        esgScore: {
            type: Number,
            default: 0 // Overall ESG score (0-100)
        },
        esgRating: {
            type: String,
            enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D', 'Not Rated'],
            default: 'Not Rated'
        },
        lastEsgUpdate: {
            type: Date,
            default: Date.now
        }
    }
}, { timestamps: true });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
