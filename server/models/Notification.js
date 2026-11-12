
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Receiver is now stored in the User collection.
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },

    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "NEW_DONATION",
        "DONATION_ACCEPTED",
        "VOLUNTEER_REQUEST",
        "STATUS_UPDATE"
      ],
      default: "NEW_DONATION"
    },

    isRead: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for retrieving receiver notifications efficiently.
notificationSchema.index({
  receiverId: 1,
  isRead: 1,
  createdAt: -1
});

// Index for finding notifications related to a donation.
notificationSchema.index({
  donationId: 1,
  receiverId: 1
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
