// ============================================================
// FOOD RESCUE - COMPLETE BACKEND SERVER
// File: server/server.js
// ============================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

require("dotenv").config();

dns.setServers(["8.8.8.8"]);

// ============================================================
// MODELS AND SERVICES
// ============================================================

const User = require("./models/user");
const Donation = require("./models/Donation");
const Notification = require("./models/Notification");
const Receiver = require("./models/Receiver");
const AreaDistance = require("./models/AreaDistance");
const ReceiverRequest = require("./models/ReceiverRequest");
const ReceiverInvitation = require("./models/ReceiverInvitation");

const {
  notifyMatchingReceivers
} = require("./services/receiverMatcher");

const {
  sendInvitationSms,
  notifyAfterAcceptance
} = require("./services/smsService");

const app = express();


app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000"
  ],
  credentials: true
}));


app.use(express.json({ limit: "2mb" }));

// ============================================================
// BASIC ROUTE
// ============================================================

app.get("/", (req, res) => {
  res.json({
    message: "Food Rescue API is running"
  });
});

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token is required"
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authorization token is required"
    });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        message: "Only " + role + "s can access this resource"
      });
    }

    next();
  };
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
}


// ============================================================
// REGISTER
// Only donors and volunteers can register publicly.
// ============================================================

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      role,
      upiId,
      upiQr,
      organisationName,
      receiverType,
      address,
      capacity,
      expectedDeliveryMinutes
    } = req.body;

    // A receiver organisation does not get an account. Its details go to the
    // administrator as a request, and the administrator decides.
    if (role === "receiver") {
      const reqName = String(name || "").trim();
      const reqOrg = String(organisationName || "").trim();
      const reqPhone = String(phone || "").trim();
      const reqEmail = String(email || "").toLowerCase().trim();
      const reqArea = String(address?.area || "").trim();
      const reqCity = String(address?.city || "").trim();
      const reqState = String(address?.state || "").trim();
      const cap = {
        plates: Number(capacity?.plates) || 0,
        kg: Number(capacity?.kg) || 0,
        packets: Number(capacity?.packets) || 0,
        boxes: Number(capacity?.boxes) || 0
      };

      if (
        reqName.length < 2 || !reqOrg || !reqArea || !reqCity || !reqState ||
        !/^[0-9]{10}$/.test(reqPhone) ||
        !["orphanage", "old_age_home", "slum_area"].includes(receiverType)
      ) {
        return res.status(400).json({
          message:
            "Enter the contact name, organisation name, a 10-digit phone, type and full address"
        });
      }
      if (reqEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reqEmail)) {
        return res.status(400).json({ message: "Enter a valid email address" });
      }
      if (!Object.values(cap).some((v) => v > 0)) {
        return res.status(400).json({
          message: "Enter a capacity for at least one unit"
        });
      }

      const already =
        (await Receiver.findOne({ phone: reqPhone })) ||
        (await ReceiverRequest.findOne({ phone: reqPhone, status: "PENDING" }));
      if (already) {
        return res.status(409).json({
          message:
            "An organisation with this phone number is already registered or waiting for approval"
        });
      }

      await ReceiverRequest.create({
        name: reqName,
        organisationName: reqOrg,
        phone: reqPhone,
        email: reqEmail,
        receiverType,
        address: { area: reqArea, city: reqCity, state: reqState },
        capacity: cap,
        expectedDeliveryMinutes: Number(expectedDeliveryMinutes) || 60
      });

      return res.status(201).json({
        message:
          "Your request has been sent to the administrator. If it is approved, your organisation will receive donation alerts by SMS."
      });
    }

    if (!name || !phone || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const allowedRoles = ["donor", "volunteer"];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message:
          "Admin accounts cannot be created publicly."
      });
    }

    const cleanName = String(name).trim();
    const cleanPhone = String(phone).trim();
    const cleanEmail = String(email).toLowerCase().trim();

    if (
      cleanName.length < 2 ||
      !/^[0-9]{10}$/.test(cleanPhone) ||
      !cleanEmail.includes("@") ||
      String(password).length < 8
    ) {
      return res.status(400).json({
        message:
          "Enter a valid name, 10-digit phone, email and password of at least 8 characters"
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or phone number is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(
      String(password),
      10
    );

    const cleanUpi = String(upiId || "").trim();
    const cleanQr = String(upiQr || "");

    if (role === "volunteer") {
      if (!cleanUpi && !cleanQr) {
        return res.status(400).json({
          message: "Volunteers must give a UPI ID or upload a payment QR code"
        });
      }
      if (cleanUpi && !/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(cleanUpi)) {
        return res.status(400).json({
          message: "Enter a valid UPI ID such as name@bank"
        });
      }
      if (cleanQr && (!cleanQr.startsWith("data:image/") || cleanQr.length > 400000)) {
        return res.status(400).json({
          message: "QR code must be an image smaller than about 250 KB"
        });
      }
    }

    const user = await User.create({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      role,
      ...(role === "volunteer" ? { upiId: cleanUpi, upiQr: cleanQr } : {})
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Registration failed"
    });
  }
});


// ============================================================
// LOGIN
// ============================================================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account is currently inactive. Please contact the administrator."
      });
    }

    const passwordMatch = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        organisationName: user.organisationName,
        receiverType: user.receiverType,
        address: user.address,
        capacity: user.capacity
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed"
    });
  }
});


// ============================================================
// CREATE FOOD DONATION
// ============================================================

app.post(
  "/api/donations",
  authenticateToken,
  requireRole("donor"),
  async (req, res) => {
    try {
      const {
        foodName,
        category,
        foodType,
        quantity,
        quantityUnit,
        preparedAt,
        expiresAt,
        donorArea,
        city,
        pincode,
        donorAddress,
        searchRadius,
        receiverTypes,
        pickupMethod,
        safetyConfirmed
      } = req.body;

      if (
        !foodName ||
        !category ||
        !foodType ||
        quantity === undefined ||
        quantity === null ||
        !quantityUnit ||
        !preparedAt ||
        !expiresAt ||
        !donorArea ||
        !city ||
        searchRadius === undefined ||
        !pickupMethod
      ) {
        return res.status(400).json({
          message: "Please provide all required donation fields"
        });
      }

      if (
        !Number.isFinite(Number(quantity)) ||
        Number(quantity) <= 0
      ) {
        return res.status(400).json({
          message: "Quantity must be greater than zero"
        });
      }

      if (
        !Number.isFinite(Number(searchRadius)) ||
        Number(searchRadius) < 1
      ) {
        return res.status(400).json({
          message: "Search radius must be at least 1"
        });
      }

      if (!["veg", "non_veg"].includes(foodType)) {
        return res.status(400).json({
          message: "Invalid food type"
        });
      }

      if (
        !["kg", "packets", "plates", "boxes"].includes(quantityUnit)
      ) {
        return res.status(400).json({
          message: "Invalid quantity unit"
        });
      }

      if (
        !["receiver_pickup", "volunteer"].includes(pickupMethod)
      ) {
        return res.status(400).json({
          message: "Invalid pickup method"
        });
      }

      if (
        !Array.isArray(receiverTypes) ||
        receiverTypes.length === 0
      ) {
        return res.status(400).json({
          message: "Select at least one receiver type"
        });
      }

      const preparedDate = new Date(preparedAt);
      const expiryDate = new Date(expiresAt);

      if (
        Number.isNaN(preparedDate.getTime()) ||
        Number.isNaN(expiryDate.getTime()) ||
        expiryDate <= new Date() ||
        expiryDate <= preparedDate
      ) {
        return res.status(400).json({
          message: "Enter valid preparation and future expiry times"
        });
      }

      if (safetyConfirmed !== true) {
        return res.status(400).json({
          message: "Please confirm the food safety declaration"
        });
      }

      const donation = await Donation.create({
        donorId: req.user.userId,
        foodName: String(foodName).trim(),
        category: String(category).trim(),
        foodType,
        quantity: Number(quantity),
        quantityUnit,
        preparedAt: preparedDate,
        expiresAt: expiryDate,
        safetyConfirmed: true,
        donorArea: String(donorArea).trim(),
        city: String(city).trim(),
        pincode: pincode ? String(pincode).trim() : "",
        donorAddress: donorAddress ? String(donorAddress).trim() : "",
        searchRadius: Number(searchRadius),
        receiverTypes,
        pickupMethod,
        status: "AVAILABLE"
      });

      let matchingReceiverCount = 0;
      let developmentInvitationLinks = [];
      let matchedOrganisations = [];
      let usedFallback = false;
      let smsSummary = { attempted: 0, sent: 0, failed: 0 };

      try {
       const result = await notifyMatchingReceivers(donation);

        // Text every matched organisation their secure accept/decline link.
        smsSummary = await sendInvitationSms(
          donation,
          result?.invitationsForDelivery || []
        );

matchingReceiverCount = result?.count || 0;
usedFallback = Boolean(result?.usedFallback);

// Names and distances only: no phone numbers and no tokens.
matchedOrganisations = (result?.invitationsForDelivery || []).map(
  (item) => ({
    name: item.receiverName,
    distanceKm: item.distanceKm,
    isDefault: Boolean(result?.usedFallback)
  })
);

// Invitation links are returned only in development mode.
if (process.env.NODE_ENV === "development") {
  developmentInvitationLinks = (
    result?.invitationsForDelivery || []
  ).map((item) => ({
    receiverName: item.receiverName,
    distanceKm: item.distanceKm,
    invitationUrl:
      `${process.env.CLIENT_URL}/receiver-invitation/${item.rawToken}`
  }));
}
      } catch (notificationError) {
        console.error(
          "RECEIVER MATCHING ERROR:",
          notificationError
        );
      }

return res.status(201).json({
  message: "Food donation created successfully",
  donation,
  matchingReceiverCount,
  matchedOrganisations,
  usedFallback,
  smsSummary,

  ...(process.env.NODE_ENV === "development"
    ? { developmentInvitationLinks }
    : {})
});
    } catch (error) {
      console.error("CREATE DONATION ERROR:", error);

      return res.status(500).json({
        message: "Failed to create donation"
      });
    }
  }
);

// ============================================================
// DONOR - MY DONATIONS
// ============================================================

app.get(
  "/api/donations/my",
  authenticateToken,
  requireRole("donor"),
  async (req, res) => {
    try {
      const donations = await Donation.find({
        donorId: req.user.userId
      })
        .populate("acceptedBy", "name phone email")
        .populate("acceptedReceiverId", "name organisationName phone")
        .populate("volunteerId", "name phone email upiId upiQr")
        .sort({ createdAt: -1 });

      return res.json({
        count: donations.length,
        donations
      });
    } catch (error) {
      console.error("DONOR DONATIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch donations"
      });
    }
  }
);

// ============================================================
// GET ONE DONATION
// ============================================================

app.get(
  "/api/donations/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const donation = await Donation.findById(req.params.id)
        .populate("donorId", "name phone email")
        .populate("acceptedBy", "name phone email")
        .populate("acceptedReceiverId", "name organisationName phone address")
        .populate("volunteerId", "name phone email upiId upiQr");

      if (!donation) {
        return res.status(404).json({
          message: "Donation not found"
        });
      }

      const isAdmin = req.user.role === "admin";

      const isDonor =
        donation.donorId?._id.toString() === req.user.userId;

      const isReceiver =
        donation.acceptedBy?._id.toString() === req.user.userId;

      const isVolunteer =
        donation.volunteerId?._id.toString() === req.user.userId;

      if (!isAdmin && !isDonor && !isReceiver && !isVolunteer) {
        return res.status(403).json({
          message: "You cannot access this donation"
        });
      }

      return res.json({ donation });
    } catch (error) {
      console.error("GET DONATION ERROR:", error);

      return res.status(400).json({
        message: "Unable to fetch donation"
      });
    }
  }
);

// ============================================================
// LEGACY RECEIVER - MATCHED DONATIONS
// ============================================================

app.get(
  "/api/receiver/donations",
  authenticateToken,
  requireRole("receiver"),
  async (req, res) => {
    try {
      const notifications = await Notification.find({
        receiverId: req.user.userId,
        isActive: true
      }).select("donationId");

      const donationIds = notifications
        .filter((item) => item.donationId)
        .map((item) => item.donationId);

      const donations = await Donation.find({
        _id: { $in: donationIds },
        status: { $in: ["AVAILABLE", "NOTIFIED"] },
        expiresAt: { $gt: new Date() }
      })
        .populate("donorId", "name phone email")
        .sort({ createdAt: -1 });

      return res.json({
        count: donations.length,
        donations
      });
    } catch (error) {
      console.error("RECEIVER DONATIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch receiver donations"
      });
    }
  }
);

// ============================================================
// LEGACY RECEIVER - ACCEPT DONATION
// ============================================================

app.post(
  "/api/receiver/donations/:id/accept",
  authenticateToken,
  requireRole("receiver"),
  async (req, res) => {
    try {
      const { pickupMethod } = req.body;

      if (!["receiver_pickup", "volunteer"].includes(pickupMethod)) {
        return res.status(400).json({
          message: "Select a valid pickup method"
        });
      }

      const donationId = req.params.id;

      const notification = await Notification.findOne({
        receiverId: req.user.userId,
        donationId,
        isActive: true
      });

      if (!notification) {
        return res.status(403).json({
          message: "This donation was not assigned to your account"
        });
      }

      const currentDonation = await Donation.findById(donationId);

      if (!currentDonation) {
        return res.status(404).json({
          message: "Donation not found"
        });
      }

      if (currentDonation.expiresAt <= new Date()) {
        return res.status(400).json({
          message: "This donation has expired"
        });
      }

      if (currentDonation.pickupMethod !== pickupMethod) {
        return res.status(400).json({
          message:
            currentDonation.pickupMethod === "volunteer"
              ? "This donation requires volunteer pickup"
              : "This donation requires receiver pickup"
        });
      }

      const newStatus =
        pickupMethod === "volunteer"
          ? "VOLUNTEER_REQUESTED"
          : "ALLOCATED";

      const donation = await Donation.findOneAndUpdate(
        {
          _id: donationId,
          status: { $in: ["AVAILABLE", "NOTIFIED"] },
          acceptedBy: null,
          acceptedReceiverId: null,
          expiresAt: { $gt: new Date() }
        },
        {
          $set: {
            acceptedBy: req.user.userId,
            acceptedAt: new Date(),
            status: newStatus
          }
        },
        { new: true }
      );

      if (!donation) {
        return res.status(409).json({
          message: "This donation has already been accepted or is no longer available"
        });
      }

      await Notification.updateMany(
        { donationId },
        { $set: { isActive: false } }
      );

      return res.json({
        message:
          pickupMethod === "volunteer"
            ? "Donation accepted. A volunteer request is now available."
            : "Donation accepted successfully.",
        donation
      });
    } catch (error) {
      console.error("RECEIVER ACCEPT ERROR:", error);

      return res.status(500).json({
        message: "Failed to accept donation"
      });
    }
  }
);

// ============================================================
// LEGACY RECEIVER - ACCEPTED DONATIONS
// ============================================================

app.get(
  "/api/receiver/accepted",
  authenticateToken,
  requireRole("receiver"),
  async (req, res) => {
    try {
      const donations = await Donation.find({
        acceptedBy: req.user.userId
      })
        .populate("donorId", "name phone email")
        .populate("volunteerId", "name phone email")
        .sort({ acceptedAt: -1 });

      return res.json({
        count: donations.length,
        donations
      });
    } catch (error) {
      console.error("RECEIVER ACCEPTED ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch accepted donations"
      });
    }
  }
);

// ============================================================
// VOLUNTEER - AVAILABLE REQUESTS
// ============================================================

app.get(
  "/api/volunteer/donations",
  authenticateToken,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const donations = await Donation.find({
        pickupMethod: "volunteer",
        status: "VOLUNTEER_REQUESTED",
        volunteerId: null,
        expiresAt: { $gt: new Date() }
      })
        .populate("donorId", "name")
        .populate("acceptedBy", "name")
        .populate("acceptedReceiverId", "name organisationName address")
        .sort({ acceptedAt: -1 });

      return res.json({
        count: donations.length,
        donations
      });
    } catch (error) {
      console.error("VOLUNTEER REQUESTS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch volunteer requests"
      });
    }
  }
);

// ============================================================
// VOLUNTEER - ACCEPT REQUEST
// ============================================================

app.post(
  "/api/volunteer/donations/:id/accept",
  authenticateToken,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const donation = await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          pickupMethod: "volunteer",
          status: "VOLUNTEER_REQUESTED",
          volunteerId: null,
          expiresAt: { $gt: new Date() }
        },
        {
          $set: {
            volunteerId: req.user.userId,
            volunteerAssignedAt: new Date(),
            status: "VOLUNTEER_ASSIGNED"
          }
        },
        { new: true }
      );

      if (!donation) {
        return res.status(409).json({
          message: "This request is no longer available"
        });
      }

      return res.json({
        message: "Volunteer request accepted",
        donation
      });
    } catch (error) {
      console.error("VOLUNTEER ACCEPT ERROR:", error);

      return res.status(500).json({
        message: "Failed to accept volunteer request"
      });
    }
  }
);

// ============================================================
// VOLUNTEER - MY ASSIGNED DONATIONS
// ============================================================

app.get(
  "/api/volunteer/my-donations",
  authenticateToken,
  requireRole("volunteer"),
  async (req, res) => {
    try {
      const donations = await Donation.find({
        volunteerId: req.user.userId
      })
        .populate("donorId", "name")
        .populate("acceptedBy", "name")
        .populate("acceptedReceiverId", "name organisationName address")
        .sort({ volunteerAssignedAt: -1 });

      return res.json({
        count: donations.length,
        donations
      });
    } catch (error) {
      console.error("VOLUNTEER MY DONATIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch assigned donations"
      });
    }
  }
);

// ============================================================
// VOLUNTEER - STATUS TRANSITION HELPER
// ============================================================

async function updateVolunteerDonation({
  req,
  res,
  currentStatus,
  nextStatus,
  timestampField,
  successMessage
}) {
  try {
    const update = {
      status: nextStatus
    };

    if (timestampField) {
      update[timestampField] = new Date();
    }

    const donation = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        volunteerId: req.user.userId,
        status: currentStatus
      },
      { $set: update },
      { new: true }
    );

    if (!donation) {
      return res.status(409).json({
        message:
          "Donation not found, not assigned to you, or status transition is invalid"
      });
    }

    return res.json({
      message: successMessage,
      donation
    });
  } catch (error) {
    console.error("VOLUNTEER STATUS ERROR:", error);

    return res.status(500).json({
      message: "Failed to update donation status"
    });
  }
}

// ============================================================
// VOLUNTEER - PICKUP
// ============================================================

app.patch(
  "/api/volunteer/donations/:id/pickup",
  authenticateToken,
  requireRole("volunteer"),
  async (req, res) => {
    return updateVolunteerDonation({
      req,
      res,
      currentStatus: "VOLUNTEER_ASSIGNED",
      nextStatus: "PICKED_UP",
      timestampField: "pickedUpAt",
      successMessage: "Food picked up successfully"
    });
  }
);

// ============================================================
// VOLUNTEER - OUT FOR DELIVERY
// ============================================================

app.patch(
  "/api/volunteer/donations/:id/out-for-delivery",
  authenticateToken,
  requireRole("volunteer"),
  async (req, res) => {
    return updateVolunteerDonation({
      req,
      res,
      currentStatus: "PICKED_UP",
      nextStatus: "OUT_FOR_DELIVERY",
      successMessage: "Donation marked out for delivery"
    });
  }
);

// ============================================================
// VOLUNTEER - DELIVERED (with delivery amount)
// ============================================================

app.patch(
  "/api/volunteer/donations/:id/delivered",
  authenticateToken,
  requireRole("volunteer"),
  async (req, res) => {
    const amount = Number(req.body?.amount);

    if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
      return res.status(400).json({
        message: "Enter the delivery amount in rupees (0 or more)"
      });
    }

    try {
      const donation = await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          volunteerId: req.user.userId,
          status: "OUT_FOR_DELIVERY"
        },
        {
          $set: {
            status: "DELIVERED",
            deliveredAt: new Date(),
            deliveryAmount: amount,
            paymentStatus: amount > 0 ? "PENDING" : "NOT_REQUESTED"
          }
        },
        { new: true }
      );

      if (!donation) {
        return res.status(409).json({
          message:
            "Donation not found, not assigned to you, or status transition is invalid"
        });
      }

      return res.json({
        message: "Donation delivered successfully",
        donation
      });
    } catch (error) {
      console.error("VOLUNTEER DELIVERED ERROR:", error);
      return res.status(500).json({ message: "Failed to update donation status" });
    }
  }
);

// ============================================================
// VOLUNTEER - OWN PAYMENT PROFILE
// ============================================================

app.get(
  "/api/volunteer/profile",
  authenticateToken,
  requireRole("volunteer"),
  async (req, res) => {
    const user = await User.findById(req.user.userId).select(
      "name phone email upiId upiQr"
    );
    return res.json({ profile: user });
  }
);

app.put(
  "/api/volunteer/profile",
  authenticateToken,
  requireRole("volunteer"),
  async (req, res) => {
    const upiId = String(req.body?.upiId || "").trim();
    const upiQr = String(req.body?.upiQr || "");

    if (!upiId && !upiQr) {
      return res.status(400).json({
        message: "Give a UPI ID or upload a payment QR code"
      });
    }
    if (upiId && !/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(upiId)) {
      return res.status(400).json({ message: "Enter a valid UPI ID such as name@bank" });
    }
    if (upiQr && (!upiQr.startsWith("data:image/") || upiQr.length > 400000)) {
      return res.status(400).json({
        message: "QR code must be an image smaller than about 250 KB"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { upiId, upiQr } },
      { new: true }
    ).select("name phone email upiId upiQr");

    return res.json({ message: "Payment details saved", profile: user });
  }
);

// ============================================================
// DONOR - MARK VOLUNTEER PAYMENT AS PAID
// ============================================================

app.patch(
  "/api/donations/:id/payment-paid",
  authenticateToken,
  requireRole("donor"),
  async (req, res) => {
    try {
      const donation = await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          donorId: req.user.userId,
          status: { $in: ["DELIVERED", "COMPLETED"] },
          paymentStatus: "PENDING"
        },
        { $set: { paymentStatus: "PAID", paidAt: new Date() } },
        { new: true }
      );

      if (!donation) {
        return res.status(409).json({
          message: "No pending payment found for this donation"
        });
      }

      return res.json({ message: "Payment marked as paid", donation });
    } catch (error) {
      console.error("PAYMENT ERROR:", error);
      return res.status(500).json({ message: "Failed to update payment" });
    }
  }
);

// ============================================================
// ADMIN - DASHBOARD
// ============================================================

app.get(
  "/api/admin/dashboard",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalDonors,
        totalReceivers,
        totalVolunteers,
        totalAdmins,
        totalDonations,
        availableDonations,
        completedDonations,
        pendingDonations,
        volunteerRequests,
        recentUsers,
        recentDonations
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "donor" }),
        Receiver.countDocuments(),
        User.countDocuments({ role: "volunteer" }),
        User.countDocuments({ role: "admin" }),
        Donation.countDocuments(),
        Donation.countDocuments({
          status: { $in: ["AVAILABLE", "NOTIFIED"] },
          expiresAt: { $gt: new Date() }
        }),
        Donation.countDocuments({
          status: { $in: ["DELIVERED", "COMPLETED"] }
        }),
        Donation.countDocuments({
          status: {
            $in: [
              "ALLOCATED",
              "PICKUP_PENDING",
              "VOLUNTEER_REQUESTED",
              "VOLUNTEER_ASSIGNED",
              "PICKED_UP",
              "OUT_FOR_DELIVERY"
            ]
          }
        }),
        Donation.countDocuments({
          status: "VOLUNTEER_REQUESTED"
        }),
        User.find()
          .select("name phone email role createdAt")
          .sort({ createdAt: -1 })
          .limit(10),
        Donation.find()
          .populate("donorId", "name phone email")
          .populate("acceptedBy", "name phone email")
          .populate("acceptedReceiverId", "name organisationName")
          .populate("volunteerId", "name phone email upiId")
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

      return res.json({
        // The AdminDashboard page reads this flat "stats" object.
        // Without it the page crashed with "Cannot read properties of undefined".
        stats: {
          totalUsers,
          donors: totalDonors,
          receivers: totalReceivers,
          volunteers: totalVolunteers,
          totalDonations,
          availableDonations,
          volunteerRequests,
          completedDonations,
          pendingReceiverRequests: await ReceiverRequest.countDocuments({
            status: "PENDING"
          })
        },
        users: {
          total: totalUsers,
          donors: totalDonors,
          receivers: totalReceivers,
          volunteers: totalVolunteers,
          admins: totalAdmins
        },
        donations: {
          total: totalDonations,
          available: availableDonations,
          completed: completedDonations,
          pending: pendingDonations,
          volunteerRequests
        },
        recentUsers,
        recentDonations
      });
    } catch (error) {
      console.error("ADMIN DASHBOARD ERROR:", error);

      return res.status(500).json({
        message: "Failed to load admin dashboard"
      });
    }
  }
);

// ============================================================
// ADMIN - ALL USERS
// ============================================================

app.get(
  "/api/admin/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const users = await User.find()
        .select("-password -upiQr")
        .sort({ createdAt: -1 });

      return res.json({
        count: users.length,
        users
      });
    } catch (error) {
      console.error("ADMIN USERS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch users"
      });
    }
  }
);

// ============================================================
// ADMIN - ALL DONATIONS
// ============================================================

app.get(
  "/api/admin/donations",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const donations = await Donation.find()
        .populate("donorId", "name phone email")
        .populate("acceptedBy", "name phone email")
        .populate("acceptedReceiverId", "name organisationName address")
        .populate("volunteerId", "name phone email upiId")
        .sort({ createdAt: -1 });

      return res.json({
        count: donations.length,
        donations
      });
    } catch (error) {
      console.error("ADMIN DONATIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch donations"
      });
    }
  }
);

// ============================================================
// ADMIN - RECEIVER ORGANISATIONS (list, add, activate or deactivate)
// ============================================================

// Adds a receiver organisation (and distances for a new area).
// On a validation problem it sends the error response itself and returns
// that response object; on success it returns { receiver, distancesAdded }.
async function addReceiverFromData(b, res) {
  {
      const name = String(b.name || "").trim();
    const organisationName = String(b.organisationName || "").trim();
    const phone = String(b.phone || "").trim();
    const receiverType = String(b.receiverType || "");
    const area = String(b.area || "").trim();
    const city = String(b.city || "").trim();
    const state = String(b.state || "Telangana").trim();
    const minutes = Number(b.expectedDeliveryMinutes) || 60;
    const capacity = {
      plates: Number(b.plates) || 0,
      kg: Number(b.kg) || 0,
      packets: Number(b.packets) || 0,
      boxes: Number(b.boxes) || 0
    };

    if (!name || !organisationName || !area || !city) {
      return res.status(400).json({
        message: "Contact name, organisation name, area and city are required"
      });
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        message: "Phone number must contain exactly 10 digits"
      });
    }
    if (!["orphanage", "old_age_home", "slum_area"].includes(receiverType)) {
      return res.status(400).json({ message: "Select a valid receiver type" });
    }
    if (!Object.values(capacity).some((v) => v > 0)) {
      return res.status(400).json({
        message: "Enter a capacity for at least one unit (plates, kg, packets or boxes)"
      });
    }
    if (minutes < 1) {
      return res.status(400).json({ message: "Delivery time must be at least 1 minute" });
    }

    const duplicate = await Receiver.findOne({
      phone,
      organisationName: new RegExp(
        `^${organisationName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      )
    });
    if (duplicate) {
      return res.status(409).json({
        message: "This organisation is already registered with that phone number"
      });
    }

    // Make sure the new area has distances to the other areas of the city.
    // If it is a new area, the admin gives its distance to one known area;
    // distances to the other areas are estimated by going through that area.
    const cityRegex = new RegExp(
      `^${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i"
    );
    const existing = await AreaDistance.find({ city: cityRegex });
    const known = new Set();
    existing.forEach((r) => {
      known.add(r.fromArea);
      known.add(r.toArea);
    });
    const areaKnown = [...known].some(
      (a) => a.toLowerCase() === area.toLowerCase()
    );

    let distancesAdded = 0;

    if (!areaKnown && known.size > 0) {
      const refArea = String(b.referenceArea || "").trim();
      const refKm = Number(b.referenceDistanceKm);
      const refMatch = [...known].find(
        (a) => a.toLowerCase() === refArea.toLowerCase()
      );

      if (!refMatch || !Number.isFinite(refKm) || refKm < 0) {
        return res.status(400).json({
          message:
            "This is a new area. Choose the nearest known area and enter the distance to it in km."
        });
      }

      const distanceBetween = (x, y) => {
        if (x.toLowerCase() === y.toLowerCase()) return 0;
        const row = existing.find(
          (r) =>
            (r.fromArea.toLowerCase() === x.toLowerCase() &&
              r.toArea.toLowerCase() === y.toLowerCase()) ||
            (r.fromArea.toLowerCase() === y.toLowerCase() &&
              r.toArea.toLowerCase() === x.toLowerCase())
        );
        return row ? row.distanceKm : null;
      };

      const docs = [];
      for (const other of known) {
        const viaRef =
          other === refMatch
            ? refKm
            : (() => {
                const d = distanceBetween(refMatch, other);
                return d === null ? null : Math.round((refKm + d) * 10) / 10;
              })();
        if (viaRef !== null) {
          docs.push({ city, fromArea: area, toArea: other, distanceKm: viaRef });
        }
      }
      if (docs.length) {
        await AreaDistance.insertMany(docs);
        distancesAdded = docs.length;
      }
    }

    const receiver = await Receiver.create({
      name,
      organisationName,
      phone,
      receiverType,
      address: { area, city, state },
      capacity,
      expectedDeliveryMinutes: minutes,
      isActive: true,
      isVerified: true,
      smsConsent: true,
      smsConsentAt: new Date()
    });

    return { receiver, distancesAdded };
  }
}

app.get(
  "/api/admin/receivers",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const receivers = await Receiver.find().sort({ createdAt: -1 });
      return res.json({ count: receivers.length, receivers });
    } catch (error) {
      console.error("ADMIN RECEIVERS ERROR:", error);
      return res.status(500).json({ message: "Failed to fetch receivers" });
    }
  }
);

// Areas already known for a city (taken from the distance table)
app.get(
  "/api/admin/areas",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const city = String(req.query.city || "").trim();
      if (!city) return res.json({ areas: [] });

      const cityRegex = new RegExp(
        `^${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      );
      const rows = await AreaDistance.find({ city: cityRegex }).select(
        "fromArea toArea"
      );
      const set = new Set();
      rows.forEach((r) => {
        set.add(r.fromArea);
        set.add(r.toArea);
      });
      return res.json({ areas: [...set].sort() });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch areas" });
    }
  }
);

app.post(
  "/api/admin/receivers",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const out = await addReceiverFromData(req.body || {}, res);
      if (out === res) return;

      return res.status(201).json({
        message: "Receiver organisation added",
        receiver: out.receiver,
        distancesAdded: out.distancesAdded
      });
    } catch (error) {
      console.error("ADMIN ADD RECEIVER ERROR:", error);
      return res.status(500).json({ message: "Failed to add receiver" });
    }
  }
);

app.patch(
  "/api/admin/receivers/:id/active",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const receiver = await Receiver.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: Boolean(req.body?.isActive) } },
        { new: true }
      );
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      return res.json({ message: "Receiver updated", receiver });
    } catch (error) {
      return res.status(500).json({ message: "Failed to update receiver" });
    }
  }
);

// ============================================================
// ADMIN - RECEIVER REQUESTS (approve or reject)
// ============================================================

app.get(
  "/api/admin/receiver-requests",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const requests = await ReceiverRequest.find().sort({ createdAt: -1 });
      return res.json({ count: requests.length, requests });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch requests" });
    }
  }
);

app.post(
  "/api/admin/receiver-requests/:id/approve",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const request = await ReceiverRequest.findOne({
        _id: req.params.id,
        status: "PENDING"
      });
      if (!request) {
        return res.status(404).json({ message: "Pending request not found" });
      }

      const out = await addReceiverFromData(
        {
          name: request.name,
          organisationName: request.organisationName,
          phone: request.phone,
          receiverType: request.receiverType,
          area: request.address.area,
          city: request.address.city,
          state: request.address.state,
          expectedDeliveryMinutes: request.expectedDeliveryMinutes,
          plates: request.capacity.plates,
          kg: request.capacity.kg,
          packets: request.capacity.packets,
          boxes: request.capacity.boxes,
          referenceArea: req.body?.referenceArea,
          referenceDistanceKm: req.body?.referenceDistanceKm
        },
        res
      );
      if (out === res) return;

      request.status = "APPROVED";
      request.reviewedAt = new Date();
      request.receiverId = out.receiver._id;
      await request.save();

      return res.json({
        message: "Request approved and the organisation was added",
        receiver: out.receiver
      });
    } catch (error) {
      console.error("APPROVE REQUEST ERROR:", error);
      return res.status(500).json({ message: "Failed to approve request" });
    }
  }
);

app.post(
  "/api/admin/receiver-requests/:id/reject",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const request = await ReceiverRequest.findOneAndUpdate(
        { _id: req.params.id, status: "PENDING" },
        {
          $set: {
            status: "REJECTED",
            reviewedAt: new Date(),
            reviewNote: String(req.body?.note || "").slice(0, 300)
          }
        },
        { new: true }
      );
      if (!request) {
        return res.status(404).json({ message: "Pending request not found" });
      }
      return res.json({ message: "Request rejected", request });
    } catch (error) {
      return res.status(500).json({ message: "Failed to reject request" });
    }
  }
);

// ============================================================
// ADMIN - VOLUNTEERS
// ============================================================

app.get(
  "/api/admin/volunteers",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const volunteers = await User.find({
        role: "volunteer"
      })
        .select("name phone email role createdAt")
        .sort({ createdAt: -1 });

      return res.json({
        count: volunteers.length,
        volunteers
      });
    } catch (error) {
      console.error("ADMIN VOLUNTEERS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch volunteers"
      });
    }
  }
);

// ============================================================
// ADMIN - CHANGE USER ROLE
// Receiver organisations are managed separately.
// ============================================================

app.patch(
  "/api/admin/users/:id/role",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { role } = req.body;

      const allowedRoles = [
        "donor",
        "volunteer",
        "admin"
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role"
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      user.role = role;
      await user.save();

      return res.json({
        message: "User role updated successfully",
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("CHANGE ROLE ERROR:", error);

      return res.status(500).json({
        message: "Failed to update user role"
      });
    }
  }
);

// ============================================================
// ADMIN - DELETE USER
// ============================================================

app.delete(
  "/api/admin/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (req.params.id === req.user.userId) {
        return res.status(400).json({
          message: "You cannot delete your own admin account"
        });
      }

      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      return res.json({
        message: "User deleted successfully"
      });
    } catch (error) {
      console.error("DELETE USER ERROR:", error);

      return res.status(500).json({
        message: "Failed to delete user"
      });
    }
  }
);

// ============================================================
// ADMIN - UPDATE DONATION STATUS
// ============================================================

app.patch(
  "/api/admin/donations/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "AVAILABLE",
        "NOTIFIED",
        "ALLOCATED",
        "PICKUP_PENDING",
        "VOLUNTEER_REQUESTED",
        "VOLUNTEER_ASSIGNED",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid donation status"
        });
      }

      const donation = await Donation.findById(req.params.id);

      if (!donation) {
        return res.status(404).json({
          message: "Donation not found"
        });
      }

      donation.status = status;

      if (status === "COMPLETED") {
        donation.completedAt = new Date();
      }

      if (status === "CANCELLED") {
        donation.cancelledAt = new Date();
      }

      if (
        ["DELIVERED", "COMPLETED", "EXPIRED", "CANCELLED"].includes(status)
      ) {
        await Notification.updateMany(
          { donationId: donation._id },
          { $set: { isActive: false } }
        );

        await ReceiverInvitation.updateMany(
          {
            donationId: donation._id,
            status: "PENDING"
          },
          {
            $set: {
              status: "UNAVAILABLE",
              respondedAt: new Date()
            }
          }
        );
      }

      await donation.save();

      return res.json({
        message: "Donation status updated successfully",
        donation
      });
    } catch (error) {
      console.error("ADMIN UPDATE STATUS ERROR:", error);

      return res.status(500).json({
        message: "Failed to update donation status"
      });
    }
  }
);

// ============================================================
// ADMIN - ASSIGN VOLUNTEER
// ============================================================

app.post(
  "/api/admin/donations/:id/assign-volunteer",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { volunteerId } = req.body;

      if (!volunteerId) {
        return res.status(400).json({
          message: "Volunteer ID is required"
        });
      }

      const volunteer = await User.findOne({
        _id: volunteerId,
        role: "volunteer"
      });

      if (!volunteer) {
        return res.status(404).json({
          message: "Volunteer not found"
        });
      }

      const donation = await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          pickupMethod: "volunteer",
          status: "VOLUNTEER_REQUESTED",
          volunteerId: null,
          expiresAt: { $gt: new Date() }
        },
        {
          $set: {
            volunteerId: volunteer._id,
            volunteerAssignedAt: new Date(),
            status: "VOLUNTEER_ASSIGNED"
          }
        },
        { new: true }
      );

      if (!donation) {
        return res.status(409).json({
          message: "Donation is not an eligible volunteer request"
        });
      }

      return res.json({
        message: "Volunteer assigned successfully",
        donation
      });
    } catch (error) {
      console.error("ADMIN ASSIGN VOLUNTEER ERROR:", error);

      return res.status(500).json({
        message: "Failed to assign volunteer"
      });
    }
  }
);

// ============================================================
// LEGACY RECEIVER - GET NOTIFICATIONS
// ============================================================

app.get(
  "/api/receiver/notifications",
  authenticateToken,
  requireRole("receiver"),
  async (req, res) => {
    try {
      const notifications = await Notification.find({
        receiverId: req.user.userId,
        isActive: true
      })
        .populate("donationId")
        .sort({ createdAt: -1 });

      const unreadCount = await Notification.countDocuments({
        receiverId: req.user.userId,
        isActive: true,
        isRead: false
      });

      return res.json({
        count: notifications.length,
        unreadCount,
        notifications
      });
    } catch (error) {
      console.error("RECEIVER NOTIFICATIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to fetch receiver notifications"
      });
    }
  }
);

// ============================================================
// LEGACY RECEIVER - MARK ONE NOTIFICATION READ
// ============================================================

app.patch(
  "/api/receiver/notifications/:id/read",
  authenticateToken,
  requireRole("receiver"),
  async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          receiverId: req.user.userId
        },
        { $set: { isRead: true } },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          message: "Notification not found"
        });
      }

      return res.json({
        message: "Notification marked as read",
        notification
      });
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);

      return res.status(500).json({
        message: "Failed to update notification"
      });
    }
  }
);

// ============================================================
// LEGACY RECEIVER - MARK ALL NOTIFICATIONS READ
// ============================================================

app.patch(
  "/api/receiver/notifications/read-all",
  authenticateToken,
  requireRole("receiver"),
  async (req, res) => {
    try {
      const result = await Notification.updateMany(
        {
          receiverId: req.user.userId,
          isActive: true,
          isRead: false
        },
        { $set: { isRead: true } }
      );

      return res.json({
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error("MARK ALL NOTIFICATIONS ERROR:", error);

      return res.status(500).json({
        message: "Failed to update notifications"
      });
    }
  }
);

// ============================================================
// RECEIVER INVITATION - TOKEN HASH HELPER
// ============================================================

function hashInvitationToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
}

// ============================================================
// RECEIVER INVITATION - VIEW DONATION DETAILS
// ============================================================

app.get(
  "/api/receiver-invitations/:token",
  async (req, res) => {
    try {
      const { token } = req.params;

      if (!/^[a-fA-F0-9]{64}$/.test(token)) {
        return res.status(400).json({
          message: "Invalid invitation link."
        });
      }

      const tokenHash = hashInvitationToken(token);

      const invitation = await ReceiverInvitation.findOne({
        tokenHash
      })
        .populate("receiverId")
        .populate("donationId");

      if (!invitation) {
        return res.status(404).json({
          message: "Invitation not found."
        });
      }

      if (invitation.status !== "PENDING") {
        return res.status(409).json({
          message: "This invitation is no longer available.",
          status: invitation.status
        });
      }

      const now = new Date();

      if (invitation.expiresAt <= now) {
        invitation.status = "EXPIRED";
        await invitation.save();

        return res.status(410).json({
          message: "This invitation has expired."
        });
      }

      const receiver = invitation.receiverId;
      const donation = invitation.donationId;

      if (!receiver || !donation) {
        return res.status(404).json({
          message: "Receiver or donation details could not be found."
        });
      }

      return res.status(200).json({
        message: "Invitation details retrieved successfully.",

        invitation: {
          status: invitation.status,
          expiresAt: invitation.expiresAt
        },

        receiver: {
          name: receiver.name,
          organisationName: receiver.organisationName,
          phone: receiver.phone
        },

        deliveryAddress: {
          area: receiver.address?.area || "",
          city: receiver.address?.city || "",
          state: receiver.address?.state || "",
          pincode: receiver.address?.pincode || ""
        },

        donation: {
          foodName: donation.foodName,
          category: donation.category,
          foodType: donation.foodType,
          quantity: donation.quantity,
          quantityUnit: donation.quantityUnit,
          preparedAt: donation.preparedAt,
          expiresAt: donation.expiresAt,
          donorArea: donation.donorArea,
          city: donation.city,
          pincode: donation.pincode,
          pickupMethod: donation.pickupMethod
        }
      });
    } catch (error) {
      console.error("INVITATION DETAILS ERROR:", error);

      return res.status(500).json({
        message: "Unable to retrieve invitation details."
      });
    }
  }
);

// ============================================================
// RECEIVER INVITATION - ACCEPT OR DECLINE
// First successful organisation acceptance wins.
// ============================================================

app.post(
  "/api/receiver-invitations/:token/respond",
  async (req, res) => {
    try {
      const { token } = req.params;

      const {
        action,
        contactName,
        contactPhone,
        deliveryAddress
      } = req.body;

      if (!/^[a-fA-F0-9]{64}$/.test(token)) {
        return res.status(400).json({
          message: "Invalid invitation link."
        });
      }

      if (!["accept", "decline"].includes(action)) {
        return res.status(400).json({
          message: "Action must be accept or decline."
        });
      }

      const tokenHash = hashInvitationToken(token);

      const invitation = await ReceiverInvitation.findOne({
        tokenHash
      })
        .populate("receiverId")
        .populate("donationId");

      if (!invitation) {
        return res.status(404).json({
          message: "Invitation not found."
        });
      }

      const now = new Date();

      if (invitation.status !== "PENDING") {
        return res.status(409).json({
          message: "This invitation is no longer available.",
          status: invitation.status
        });
      }

      if (invitation.expiresAt <= now) {
        invitation.status = "EXPIRED";
        await invitation.save();

        return res.status(410).json({
          message: "This invitation has expired."
        });
      }

      const receiver = invitation.receiverId;
      const donation = invitation.donationId;

      if (!receiver || !donation) {
        return res.status(404).json({
          message: "Receiver or donation not found."
        });
      }

      const savedPhone = String(receiver.phone || "")
        .replace(/\D/g, "");

      const submittedPhone = String(contactPhone || "")
        .replace(/\D/g, "");

      if (!savedPhone || savedPhone !== submittedPhone) {
        return res.status(400).json({
          message:
            "Contact phone must match the organisation's registered phone number."
        });
      }

      // DECLINE INVITATION
      if (action === "decline") {
        const declined = await ReceiverInvitation.findOneAndUpdate(
          {
            _id: invitation._id,
            status: "PENDING",
            expiresAt: { $gt: now }
          },
          {
            $set: {
              status: "DECLINED",
              respondedAt: now
            }
          },
          { new: true }
        );

        if (!declined) {
          return res.status(409).json({
            message: "This invitation is no longer available."
          });
        }

        return res.status(200).json({
          message: "Invitation declined successfully."
        });
      }

      // ACCEPT INVITATION
      const cleanName = String(contactName || "").trim();

      const address = {
        area: String(deliveryAddress?.area || "").trim(),
        city: String(deliveryAddress?.city || "").trim(),
        state: String(deliveryAddress?.state || "").trim(),
        pincode: String(deliveryAddress?.pincode || "").trim()
      };

      if (!cleanName || cleanName.length > 100) {
        return res.status(400).json({
          message: "Please enter a valid contact name."
        });
      }

      if (!address.area || !address.city || !address.state) {
        return res.status(400).json({
          message: "Delivery area, city and state are required."
        });
      }

      if (
        address.pincode &&
        !/^[0-9]{6}$/.test(address.pincode)
      ) {
        return res.status(400).json({
          message: "Please enter a valid 6-digit delivery pincode."
        });
      }

      const newStatus =
        donation.pickupMethod === "volunteer"
          ? "VOLUNTEER_REQUESTED"
          : "ALLOCATED";

      // Atomic donation claim: only one receiver can win.
      const claimedDonation = await Donation.findOneAndUpdate(
        {
          _id: donation._id,
          status: { $in: ["AVAILABLE", "NOTIFIED"] },
          acceptedReceiverId: null,
          acceptedBy: null,
          expiresAt: { $gt: now }
        },
        {
          $set: {
            acceptedReceiverId: receiver._id,
            receiverContactName: cleanName,
            receiverContactPhone: receiver.phone,
            deliveryAddress: address,
            acceptedAt: now,
            status: newStatus
          }
        },
        { new: true }
      );

      if (!claimedDonation) {
        await ReceiverInvitation.updateOne(
          {
            _id: invitation._id,
            status: "PENDING"
          },
          {
            $set: {
              status: "UNAVAILABLE",
              respondedAt: now
            }
          }
        );

        return res.status(409).json({
          message:
            "This donation has already been accepted or is no longer available."
        });
      }

      // Mark the winning invitation as accepted.
      const acceptedInvitation =
        await ReceiverInvitation.findOneAndUpdate(
          {
            _id: invitation._id,
            status: "PENDING"
          },
          {
            $set: {
              status: "ACCEPTED",
              respondedAt: now,
              contactName: cleanName,
              contactPhone: receiver.phone,
              deliveryAddress: address
            }
          },
          { new: true }
        );

      if (!acceptedInvitation) {
        return res.status(409).json({
          message:
            "Donation was claimed, but invitation status could not be updated. Please contact the administrator."
        });
      }

      // SMS volunteers (donor pickup + receiver delivery address)
      // and the donor. Runs in the background so the receiver's
      // response is never delayed or broken by an SMS problem.
      notifyAfterAcceptance(claimedDonation, receiver).catch((error) => {
        console.error("POST-ACCEPTANCE SMS ERROR:", error);
      });

      // Other organisations can no longer accept this donation.
      await ReceiverInvitation.updateMany(
        {
          donationId: donation._id,
          _id: { $ne: invitation._id },
          status: "PENDING"
        },
        {
          $set: {
            status: "UNAVAILABLE",
            respondedAt: now
          }
        }
      );

      return res.status(200).json({
        message: "Donation accepted successfully.",
        donationId: claimedDonation._id,
        status: claimedDonation.status
      });
    } catch (error) {
      console.error("INVITATION RESPONSE ERROR:", error);

      return res.status(500).json({
        message: "Unable to process invitation response."
      });
    }
  }
);

// ============================================================
// UNKNOWN API ROUTES
// ============================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API route not found"
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {
  console.error("UNHANDLED SERVER ERROR:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    message: "Internal server error"
  });
});

// ============================================================
// ENVIRONMENT VALIDATION AND DATABASE CONNECTION
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is missing from .env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is missing from .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(
        "Food Rescue server running on http://localhost:" + PORT
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });