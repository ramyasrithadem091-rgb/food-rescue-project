
const mongoose = require("mongoose");

const receiverInvitationSchema = new mongoose.Schema(
  {
    // Organisation receiving the invitation
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receiver",
      required: true
    },

    // Donation associated with this invitation
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true
    },

    // Store only the hashed token
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },

    // Invitation expiry
    expiresAt: {
      type: Date,
      required: true
    },

    // Invitation response status
    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "DECLINED",
        "UNAVAILABLE",
        "EXPIRED"
      ],
      default: "PENDING"
    },

    // Receiver-confirmed contact details
    contactName: {
      type: String,
      trim: true,
      default: ""
    },

    contactPhone: {
      type: String,
      trim: true,
      default: ""
    },

    // Receiver-confirmed delivery address
    deliveryAddress: {
      area: {
        type: String,
        trim: true,
        default: ""
      },

      city: {
        type: String,
        trim: true,
        default: ""
      },

      state: {
        type: String,
        trim: true,
        default: ""
      },

      pincode: {
        type: String,
        trim: true,
        default: ""
      }
    },

    respondedAt: {
      type: Date,
      default: null
    },

    smsSentAt: {
      type: Date,
      default: null
    },

    smsStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING"
    }
  },
  {
    timestamps: true
  }
);

// One invitation per receiver per donation
receiverInvitationSchema.index(
  {
    receiverId: 1,
    donationId: 1
  },
  {
    unique: true
  }
);

// Find pending invitations that have expired
receiverInvitationSchema.index({
  status: 1,
  expiresAt: 1
});

module.exports = mongoose.model(
  "ReceiverInvitation",
  receiverInvitationSchema
);
