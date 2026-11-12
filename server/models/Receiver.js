const mongoose = require("mongoose");

const receiverSchema = new mongoose.Schema(
  {
    // Contact person
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Organisation details
    organisationName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },

    receiverType: {
      type: String,
      enum: ["orphanage", "old_age_home", "slum_area"],
      required: true
    },

    // Admin-saved organisation address
    address: {
      area: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      }
    },

    // Food receiving capacity
    capacity: {
      plates: {
        type: Number,
        default: 0,
        min: 0
      },
      kg: {
        type: Number,
        default: 0,
        min: 0
      },
      packets: {
        type: Number,
        default: 0,
        min: 0
      },
      boxes: {
        type: Number,
        default: 0,
        min: 0
      }
    },

    expectedDeliveryMinutes: {
      type: Number,
      required: true,
      min: 1
    },

    // Admin verification
    isActive: {
      type: Boolean,
      default: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    // Default organisations are suggested when a donation matches nobody
    isDefaultFallback: {
      type: Boolean,
      default: false
    },

    // SMS permission
    smsConsent: {
      type: Boolean,
      default: false
    },

    smsConsentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Receiver matching index
receiverSchema.index({
  "address.city": 1,
  receiverType: 1,
  isActive: 1,
  isVerified: 1
});

// SMS eligibility index
receiverSchema.index({
  phone: 1,
  smsConsent: 1,
  isActive: 1
});

module.exports = mongoose.model("Receiver", receiverSchema);