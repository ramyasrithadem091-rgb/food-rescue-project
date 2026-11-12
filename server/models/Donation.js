const mongoose = require("mongoose");

// NOTE: server.js saves many more fields than the old schema declared
// (volunteerId, acceptedAt, deliveryAddress, pincode, ...). Mongoose
// silently drops fields that are not in the schema, so volunteer
// assignment and the receiver's delivery address were never stored.
// Also, the user model is registered as "user" (lowercase), so refs
// to "User" made populate() fail.

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },

    foodName: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    foodType: {
      type: String,
      enum: ["veg", "non_veg"],
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.1
    },

    quantityUnit: {
      type: String,
      enum: ["kg", "packets", "plates", "boxes"],
      required: true
    },

    preparedAt: {
      type: Date,
      required: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    safetyConfirmed: {
      type: Boolean,
      default: false
    },

    // Donor pickup location
    donorArea: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    pincode: {
      type: String,
      default: "",
      trim: true
    },

    // Optional full street address / landmark for the volunteer
    donorAddress: {
      type: String,
      default: "",
      trim: true
    },

    searchRadius: {
      type: Number,
      default: 10,
      min: 1
    },

    receiverTypes: {
      type: [String],
      default: ["all"]
    },

    pickupMethod: {
      type: String,
      enum: ["volunteer", "receiver_pickup"],
      default: "volunteer"
    },

    description: {
      type: String,
      default: "",
      trim: true
    },

    status: {
      type: String,
      default: "AVAILABLE"
    },

    // Receiver that accepted (invitation flow)
    acceptedReceiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receiver",
      default: null
    },

    // Legacy receiver-as-user flow
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null
    },

    acceptedAt: {
      type: Date,
      default: null
    },

    receiverContactName: {
      type: String,
      default: "",
      trim: true
    },

    receiverContactPhone: {
      type: String,
      default: "",
      trim: true
    },

    // Delivery address confirmed by the receiver on acceptance
    deliveryAddress: {
      area: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      pincode: { type: String, default: "", trim: true }
    },

    // Volunteer
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null
    },

    // Volunteer delivery fee, entered by the volunteer after delivery
    deliveryAmount: { type: Number, min: 0, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["NOT_REQUESTED", "PENDING", "PAID"],
      default: "NOT_REQUESTED"
    },
    paidAt: { type: Date, default: null },

    volunteerAssignedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Donation", donationSchema);