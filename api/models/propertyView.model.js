import mongoose from 'mongoose';

const propertyViewSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    viewerId: { type: String, required: true }, // userId or hashed(ip+ua)
  },
  { timestamps: true }
);

// Optional unique index to prevent duplicates within short windows when concurrently created
propertyViewSchema.index({ propertyId: 1, viewerId: 1, createdAt: -1 });

export default mongoose.model('PropertyView', propertyViewSchema);


