import mongoose from "mongoose";

const messageRatingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messageIndex: {
    type: Number,
    required: true
  },
  messageTimestamp: {
    type: Date,
    required: true
  },
  rating: {
    type: String,
    enum: ["up", "down", "bookmarked"],
    required: true
  },
  type: {
    type: String,
    enum: ["rating", "bookmark"],
    default: "rating"
  },
  messageContent: {
    type: String,
    required: true
  },
  messageRole: {
    type: String,
    enum: ["user", "assistant"],
    required: true
  }
}, { 
  timestamps: true,
  // Add indexes for better performance
  indexes: [
    { userId: 1, sessionId: 1, messageIndex: 1, messageTimestamp: 1 },
    { userId: 1, rating: 1 },
    { sessionId: 1 }
  ]
});

// Ensure unique rating per message per user
messageRatingSchema.index(
  { userId: 1, sessionId: 1, messageIndex: 1, messageTimestamp: 1 },
  { unique: true }
);

const MessageRating = mongoose.model("MessageRating", messageRatingSchema);

export default MessageRating;