const crypto = require("crypto");

const Receiver = require("../models/Receiver");
const ReceiverInvitation = require("../models/ReceiverInvitation");
const AreaDistance = require("../models/AreaDistance");

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================
// GET DISTANCE BETWEEN TWO AREAS
// ============================================================

async function getAreaDistance(city, fromArea, toArea) {
  if (!city || !fromArea || !toArea) {
    return null;
  }

  if (normalize(fromArea) === normalize(toArea)) {
    return 0;
  }

  const cityRegex = new RegExp(
    "^" + escapeRegex(city.trim()) + "$",
    "i"
  );

  const fromRegex = new RegExp(
    "^" + escapeRegex(fromArea.trim()) + "$",
    "i"
  );

  const toRegex = new RegExp(
    "^" + escapeRegex(toArea.trim()) + "$",
    "i"
  );

  const record = await AreaDistance.findOne({
    city: cityRegex,
    $or: [
      { fromArea: fromRegex, toArea: toRegex },
      { fromArea: toRegex, toArea: fromRegex }
    ]
  });

  return record ? Number(record.distanceKm) : null;
}

// ============================================================
// CHECK RECEIVER TYPE
// ============================================================

function receiverTypeMatches(donation, receiver) {
  const types = Array.isArray(donation.receiverTypes)
    ? donation.receiverTypes.map(normalize)
    : [];

  const receiverType = normalize(receiver.receiverType);

  return (
    types.includes("all") ||
    types.includes(receiverType)
  );
}

// ============================================================
// CHECK RECEIVER CAPACITY
// ============================================================

function capacityMatches(donation, receiver) {
  const quantity = Number(donation.quantity);
  const unit = normalize(donation.quantityUnit);

  const capacity = Number(receiver.capacity?.[unit]);

  return (
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(capacity) &&
    capacity > 0 &&
    quantity <= capacity
  );
}

// ============================================================
// CHECK FOOD EXPIRY AND DELIVERY TIME
// ============================================================

function deliveryTimeMatches(donation, receiver) {
  if (!donation.expiresAt) {
    return false;
  }

  const expiry = new Date(donation.expiresAt).getTime();

  const expectedMinutes = Number(
    receiver.expectedDeliveryMinutes
  );

  const remainingMinutes =
    (expiry - Date.now()) / 60000;

  return (
    Number.isFinite(expiry) &&
    Number.isFinite(expectedMinutes) &&
    expectedMinutes > 0 &&
    remainingMinutes >= expectedMinutes
  );
}

// ============================================================
// FIND MATCHING PREDEFINED ORGANISATIONS
// ============================================================

async function findExactMatchingReceivers(donation) {
  if (!donation) {
    return [];
  }

  const city = String(donation.city || "").trim();
  const donorArea = String(donation.donorArea || "").trim();
  const radius = Number(donation.searchRadius);

  if (
    !city ||
    !donorArea ||
    !Number.isFinite(radius) ||
    radius < 0
  ) {
    console.warn(
      "RECEIVER MATCHING: Invalid donation location or radius."
    );

    return [];
  }

  const cityRegex = new RegExp(
    "^" + escapeRegex(city) + "$",
    "i"
  );

  // Only use predefined, active, verified organisations
  // that have explicitly consented to SMS notifications.

  const receivers = await Receiver.find({
    isActive: true,
    isVerified: true,
    smsConsent: true,
    "address.city": cityRegex
  });

  console.log("----------------------------------");
  console.log("RECEIVER MATCHING STARTED");
  console.log("CITY:", city);
  console.log("DONOR AREA:", donorArea);
  console.log("SEARCH RADIUS:", radius, "km");
  console.log("ELIGIBLE ORGANISATIONS:", receivers.length);

  const matches = [];

  for (const receiver of receivers) {
    const label =
      receiver.organisationName || receiver.name;

    // 1. Receiver type
    if (!receiverTypeMatches(donation, receiver)) {
      console.log("EXCLUDED - TYPE:", label);
      continue;
    }

    // 2. Capacity
    if (!capacityMatches(donation, receiver)) {
      console.log("EXCLUDED - CAPACITY:", label);
      continue;
    }

    // 3. Expiry and delivery time
    if (!deliveryTimeMatches(donation, receiver)) {
      console.log("EXCLUDED - EXPIRY/TIME:", label);
      continue;
    }

    // 4. Receiver area
    const receiverArea = String(
      receiver.address?.area || ""
    ).trim();

    if (!receiverArea) {
      console.log("EXCLUDED - AREA MISSING:", label);
      continue;
    }

    // 5. Distance
    const distanceKm = await getAreaDistance(
      city,
      donorArea,
      receiverArea
    );

    if (
      distanceKm === null ||
      !Number.isFinite(distanceKm)
    ) {
      console.log(
        "EXCLUDED - AREA DISTANCE NOT FOUND:",
        label
      );
      continue;
    }

    // 6. Search radius
    if (distanceKm > radius) {
      console.log(
        "EXCLUDED - OUTSIDE RADIUS:",
        label,
        distanceKm
      );
      continue;
    }

    matches.push({
      receiver,
      distanceKm
    });

    console.log(
      "ORGANISATION MATCHED:",
      label,
      distanceKm,
      "km"
    );
  }

  console.log("TOTAL MATCHES:", matches.length);
  console.log("RECEIVER MATCHING COMPLETED");
  console.log("----------------------------------");

  return matches;
}

// ============================================================
// DEFAULT ORGANISATIONS (used only when nobody matches)
// ============================================================

const MAX_DEFAULT_ORGANISATIONS = 3;

async function findDefaultReceivers(donation) {
  const defaults = await Receiver.find({
    isDefaultFallback: true,
    isActive: true,
    isVerified: true,
    smsConsent: true
  }).limit(MAX_DEFAULT_ORGANISATIONS);

  const results = [];

  for (const receiver of defaults) {
    let distanceKm = null;

    try {
      distanceKm = await getAreaDistance(
        donation.city,
        donation.donorArea,
        receiver.address?.area
      );
    } catch (error) {
      distanceKm = null;
    }

    results.push({
      receiver,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
      isFallback: true
    });
  }

  return results;
}

// Exact matches first. If there are none, suggest the default organisations
// so the donor never sees an empty result.
async function findMatchingReceivers(donation) {
  const exact = await findExactMatchingReceivers(donation);

  if (exact.length > 0) {
    return exact;
  }

  const defaults = await findDefaultReceivers(donation || {});

  console.log(
    "NO EXACT MATCH - USING DEFAULT ORGANISATIONS:",
    defaults.length
  );

  return defaults;
}

// ============================================================
// CREATE SECURE RECEIVER INVITATIONS
// ============================================================

async function notifyMatchingReceivers(donation) {
  const matches = await findMatchingReceivers(donation);
  const usedFallback = matches.length > 0 && matches.every((m) => m.isFallback);

  let createdCount = 0;
  let existingCount = 0;

  // Keep the raw tokens in memory for the SMS integration.
  // Only their SHA-256 hashes are stored in MongoDB.

  const invitationsForDelivery = [];

  for (const { receiver, distanceKm } of matches) {
    // Check whether an invitation already exists.
    const existing = await ReceiverInvitation.findOne({
      receiverId: receiver._id,
      donationId: donation._id
    });

    if (existing) {
      existingCount++;

      console.log(
        "INVITATION ALREADY EXISTS:",
        receiver.organisationName || receiver.name
      );

      continue;
    }

    // Generate a cryptographically secure random token.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash in the database.
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Invitation expires when the food expires.
    const invitationExpiry = new Date(donation.expiresAt);

    try {
      const invitation = await ReceiverInvitation.create({
        receiverId: receiver._id,
        donationId: donation._id,
        tokenHash,
        expiresAt: invitationExpiry,
        status: "PENDING",
        smsStatus: "PENDING"
      });

      createdCount++;

      // This information is for the future SMS service.
      // Never return rawToken from a public API response.
      invitationsForDelivery.push({
        invitationId: invitation._id,
        receiverId: receiver._id,
        receiverName:
          receiver.organisationName || receiver.name,
        receiverPhone: receiver.phone,
        rawToken,
        distanceKm
      });

      console.log(
        "INVITATION CREATED:",
        receiver.organisationName || receiver.name
      );
    } catch (error) {
      // The unique receiverId + donationId index prevents
      // duplicate invitations even if two requests run together.
      if (error.code === 11000) {
        existingCount++;
        console.log("DUPLICATE INVITATION PREVENTED.");
        continue;
      }

      throw error;
    }
  }

  console.log("----------------------------------");
  console.log("MATCHED ORGANISATIONS:", matches.length);
  console.log("NEW INVITATIONS:", createdCount);
  console.log("EXISTING INVITATIONS:", existingCount);
  console.log("----------------------------------");

  return {
    count: createdCount,
    matchedReceiverCount: matches.length,
    usedFallback,
    existingCount,
    invitationsForDelivery
  };
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

module.exports = {
  getAreaDistance,
  findMatchingReceivers,
  notifyMatchingReceivers
};