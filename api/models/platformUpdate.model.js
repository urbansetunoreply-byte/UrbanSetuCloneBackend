import mongoose from 'mongoose';

const platformUpdateSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['feature', 'improvement', 'fix', 'announcement'],
        default: 'feature'
    },
    tags: [{
        type: String,
        trim: true
    }],
    imageUrl: {
        type: String,
        default: ''
    },
    releaseDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for efficient querying by date
platformUpdateSchema.index({ releaseDate: -1 });

const PlatformUpdate = mongoose.model('PlatformUpdate', platformUpdateSchema);

export default PlatformUpdate;
