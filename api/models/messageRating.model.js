import mongoose from "mongoose";

const messageRatingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
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
  },
  // Optional feedback text (reason/details) when rating is 'down'
  feedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  // Add indexes for better performance
  indexes: [
    { userId: 1, sessionId: 1, messageIndex: 1, messageTimestamp: 1, type: 1 },
    { userId: 1, rating: 1 },
    { userId: 1, type: 1 },
    { sessionId: 1 }
  ]
});

// Ensure unique rating/bookmark per message per user per type
messageRatingSchema.index(
  { userId: 1, sessionId: 1, messageIndex: 1, messageTimestamp: 1, type: 1 },
  { unique: true }
);

const MessageRating = mongoose.model("MessageRating", messageRatingSchema);

export default MessageRating;