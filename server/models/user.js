const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"]
    },

    role: {
      type: String,
      required: true,
      enum: ["donor", "receiver", "volunteer", "admin"],
      default: "donor"
    },

    // Volunteer payment details (UPI id and/or QR image as a data URL)
    upiId: {
      type: String,
      trim: true,
      default: ""
    },

    upiQr: {
      type: String,
      default: ""
    },

    // Receiver-specific information
    organisationName: {
      type: String,
      trim: true,
      default: ""
    },

    receiverType: {
      type: String,
      enum: ["orphanage", "old_age_home", "slum_area", ""],
      default: ""
    },

    address: {
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
      }
    },

    capacity: {
      plates: {
        type: Number,
        min: 0,
        default: 0
      },
      kg: {
        type: Number,
        min: 0,
        default: 0
      },
      packets: {
        type: Number,
        min: 0,
        default: 0
      },
      boxes: {
        type: Number,
        min: 0,
        default: 0
      }
    },

    expectedDeliveryMinutes: {
      type: Number,
      min: 1,
      default: 60
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isVerified: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Receiver-specific validation
userSchema.pre("validate", function () {
  if (this.role === "receiver") {

    if (!this.organisationName) {
      this.invalidate(
        "organisationName",
        "Organisation name is required for receivers"
      );
    }

    if (!this.receiverType) {
      this.invalidate(
        "receiverType",
        "Receiver type is required"
      );
    }

    if (!this.address || !this.address.area) {
      this.invalidate(
        "address.area",
        "Area is required for receivers"
      );
    }

    if (!this.address || !this.address.city) {
      this.invalidate(
        "address.city",
        "City is required for receivers"
      );
    }

    if (!this.address || !this.address.state) {
      this.invalidate(
        "address.state",
        "State is required for receivers"
      );
    }
  }
});

module.exports = mongoose.model("user", userSchema);