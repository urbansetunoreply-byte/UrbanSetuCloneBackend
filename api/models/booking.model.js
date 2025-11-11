import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  date: Date,
  time: String,
  message: String,
  listingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing',
    required: true 
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purpose: {
    type: String,
    enum: ["buy", "rent"],
    required: true
  },
  propertyName: {
    type: String,
    required: true
  },
  propertyDescription: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: [
      "pending", "accepted", "rejected", "deletedByAdmin",
      "cancelledByBuyer", "cancelledBySeller", "cancelledByAdmin", "completed", "noShow", "outdated"
    ],
    default: "pending"
  },
  cancelReason: String,
  cancelledBy: {
    type: String,
    enum: ["buyer", "seller", "admin", "rootadmin"]
  },
  adminNote: String,
  completedAt: Date,
  noShow: { type: Boolean, default: false },
  noShowNote: String,
  permanentlyDeleted: { type: Boolean, default: false },
  outdatedEmailSent: { type: Boolean, default: false },
  adminComment: {
    type: String,
    default: ""
  },
  comments: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      senderEmail: String,
      message: String,
      originalMessage: String, // Preserve original content when deleted
      originalImageUrl: String, // Preserve original image URL when deleted
      timestamp: { type: Date, default: Date.now },
      status: { type: String, default: "sent" },
      readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      deleted: { type: Boolean, default: false },
      deletedBy: String, // Email of who deleted the message
      deletedAt: Date, // When the message was deleted
      edited: { type: Boolean, default: false },
      editedAt: { type: Date },
      replyTo: { type: mongoose.Schema.Types.ObjectId, default: null },
      // New: per-user local deletion persistence
      removedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      // Message delivery and read timestamps
      deliveredAt: { type: Date, default: null },
      readAt: { type: Date, default: null },
      // Starred messages tracking
      starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      // Image message support
      imageUrl: { type: String, default: null },
      // Video message support
      videoUrl: { type: String, default: null },
      // Document message support
      documentUrl: { type: String, default: null },
      documentName: { type: String, default: null },
      documentMimeType: { type: String, default: null },
      // Audio message support
      audioUrl: { type: String, default: null },
      audioName: { type: String, default: null },
      audioMimeType: { type: String, default: null },
      type: { type: String, enum: ['text', 'image', 'video', 'document', 'audio'], default: 'text' },
      // Message pinning functionality
      pinned: { type: Boolean, default: false },
      pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      pinnedAt: { type: Date, default: null },
      pinExpiresAt: { type: Date, default: null },
      pinDuration: { type: String, enum: ['24hrs', '7days', '30days', 'custom'], default: null },
      // Message reactions
      reactions: [
        {
          emoji: { type: String, required: true },
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          userName: { type: String, required: true },
          timestamp: { type: Date, default: Date.now }
        }
      ],
    }
  ],
  chat: [
    {
      sender: String, // 'user' or 'admin'
      message: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  visibleToBuyer: { type: Boolean, default: true },
  visibleToSeller: { type: Boolean, default: true },
  archivedByAdmin: { type: Boolean, default: false },
  archivedByBuyer: { type: Boolean, default: false },
  archivedBySeller: { type: Boolean, default: false },
  archivedAt: {
    type: Date
  },
  reinitiationCount: { type: Number, default: 0 },
  buyerReinitiationCount: { type: Number, default: 0 },
  sellerReinitiationCount: { type: Number, default: 0 },
  reinitiationHistory: [
    {
      date: Date,
      time: String,
      message: String,
      timestamp: { type: Date, default: Date.now },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],
  buyerChatClearedAt: { type: Date, default: null },
  sellerChatClearedAt: { type: Date, default: null },
  // Chat lock functionality
  buyerChatLocked: { type: Boolean, default: false },
  sellerChatLocked: { type: Boolean, default: false },
  buyerChatPassword: { type: String, default: null },
  sellerChatPassword: { type: String, default: null },
  // Temporary access tracking (doesn't persist - only for current session)
  buyerChatAccessGranted: { type: Boolean, default: false },
  sellerChatAccessGranted: { type: Boolean, default: false },
  // Payment status tracking
  paymentConfirmed: { type: Boolean, default: false },
  // Smart email notification tracking
  buyerLastEmailSentAt: { type: Date, default: null },
  sellerLastEmailSentAt: { type: Date, default: null },
  buyerUnreadMessageCount: { type: Number, default: 0 },
  sellerUnreadMessageCount: { type: Number, default: 0 },
});

const booking = mongoose.model("Booking", bookingSchema);

export default booking;
