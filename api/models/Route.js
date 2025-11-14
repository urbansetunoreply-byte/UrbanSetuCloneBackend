import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  stops: [{
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && 
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    }
  }],
  route: {
    type: mongoose.Schema.Types.Mixed, // Store the complete route data from Mapbox
    required: true
  },
  travelMode: {
    type: String,
    enum: ['driving', 'walking', 'cycling', 'driving-traffic'],
    default: 'driving'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better performance
routeSchema.index({ userId: 1, timestamp: -1 });
routeSchema.index({ userId: 1, name: 1 });
routeSchema.index({ isPublic: 1, timestamp: -1 });

// Virtual for route distance
routeSchema.virtual('distance').get(function() {
  return this.route?.distance || 0;
});

// Virtual for route duration
routeSchema.virtual('duration').get(function() {
  return this.route?.duration || 0;
});

// Method to get route summary
routeSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    stopsCount: this.stops.length,
    distance: this.distance,
    duration: this.duration,
    travelMode: this.travelMode,
    timestamp: this.timestamp,
    isPublic: this.isPublic
  };
};

// Static method to find routes by user
routeSchema.statics.findByUser = function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to find public routes
routeSchema.statics.findPublic = function(limit = 50) {
  return this.find({ isPublic: true })
    .populate('userId', 'username firstName lastName')
    .sort({ timestamp: -1 })
    .limit(limit);
};

export default mongoose.model('Route', routeSchema);
