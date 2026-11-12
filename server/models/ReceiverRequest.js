const mongoose = require("mongoose");

// A receiver organisation that asked to join. The administrator decides.
const receiverRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    organisationName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    email: { type: String, trim: true, lowercase: true, default: "" },

    receiverType: {
      type: String,
      enum: ["orphanage", "old_age_home", "slum_area"],
      required: true
    },

    address: {
      area: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true }
    },

    capacity: {
      plates: { type: Number, default: 0, min: 0 },
      kg: { type: Number, default: 0, min: 0 },
      packets: { type: Number, default: 0, min: 0 },
      boxes: { type: Number, default: 0, min: 0 }
    },

    expectedDeliveryMinutes: { type: Number, default: 60, min: 1 },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },

    reviewNote: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Receiver", default: null }
  },
  { timestamps: true }
);

receiverRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ReceiverRequest", receiverRequestSchema);