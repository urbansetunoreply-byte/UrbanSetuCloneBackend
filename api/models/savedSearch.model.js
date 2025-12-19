import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        default: 'My Search'
    },
    criteria: {
        location: { type: String, required: true }, // e.g., "Mumbai", "Andheri"
        type: { type: String, enum: ['sale', 'rent'] }, // Matches Listing.type ('sale' or 'rent')
        minPrice: Number,
        maxPrice: Number,
        bedrooms: Number,
        propertyType: String // Apartment, Villa, etc.
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'instant'],
        default: 'daily'
    },
    lastAlertSentAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);

export default SavedSearch;
