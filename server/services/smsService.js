// ============================================================
// FOOD RESCUE - SMS SERVICE
// File: server/services/smsService.js
//
// Providers (set SMS_PROVIDER in .env):
//   console   - default. Prints the SMS in the server terminal. No account needed.
//   twilio    - needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and
//               TWILIO_FROM (or TWILIO_MESSAGING_SERVICE_SID).
//   fast2sms  - needs FAST2SMS_API_KEY (optional FAST2SMS_ROUTE, default "q").
//
// Uses Node's built-in fetch, so no new npm package is required.
// ============================================================

const REQUEST_TIMEOUT_MS = 10000;

// ------------------------------------------------------------
// Phone helpers
// ------------------------------------------------------------

function tenDigitIndianNumber(phone) {
  let digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return /^[6-9][0-9]{9}$/.test(digits) ? digits : null;
}

function toE164India(phone) {
  const ten = tenDigitIndianNumber(phone);
  return ten ? "+91" + ten : null;
}

// ------------------------------------------------------------
// Providers
// ------------------------------------------------------------

async function sendViaConsole(phone, message) {
  console.log("==================== SMS (console mode) ====================");
  console.log("TO:", phone);
  console.log(message);
  console.log("============================================================");

  return { ok: true, provider: "console" };
}

async function sendViaTwilio(phone, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const serviceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!sid || !token || (!from && !serviceSid)) {
    return {
      ok: false,
      provider: "twilio",
      error:
        "Twilio is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM are required)"
    };
  }

  const to = toE164India(phone);

  if (!to) {
    return { ok: false, provider: "twilio", error: "Invalid phone number" };
  }

  const body = new URLSearchParams({ To: to, Body: message });

  if (serviceSid) {
    body.set("MessagingServiceSid", serviceSid);
  } else {
    body.set("From", from);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      provider: "twilio",
      error: data.message || `Twilio HTTP ${response.status}`
    };
  }

  return { ok: true, provider: "twilio", id: data.sid };
}

async function sendViaFast2Sms(phone, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      provider: "fast2sms",
      error: "FAST2SMS_API_KEY is not set"
    };
  }

  const number = tenDigitIndianNumber(phone);

  if (!number) {
    return { ok: false, provider: "fast2sms", error: "Invalid phone number" };
  }

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      route: process.env.FAST2SMS_ROUTE || "q",
      message,
      language: "english",
      flash: 0,
      numbers: number
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.return === false) {
    const reason = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;

    return {
      ok: false,
      provider: "fast2sms",
      error: reason || `Fast2SMS HTTP ${response.status}`
    };
  }

  return { ok: true, provider: "fast2sms", id: data.request_id };
}

// ------------------------------------------------------------
// Main send function. Never throws: returns { ok, provider, error? }
// ------------------------------------------------------------

async function sendSms(phone, message) {
  const provider = String(process.env.SMS_PROVIDER || "console").toLowerCase();

  try {
    let result;

    if (provider === "twilio") {
      result = await sendViaTwilio(phone, message);
    } else if (provider === "fast2sms") {
      result = await sendViaFast2Sms(phone, message);
    } else {
      result = await sendViaConsole(phone, message);
    }

    if (!result.ok) {
      console.error(
        `SMS FAILED [${result.provider}] to ${phone}:`,
        result.error
      );
    }

    return result;
  } catch (error) {
    console.error(`SMS ERROR [${provider}] to ${phone}:`, error.message);
    return { ok: false, provider, error: error.message };
  }
}

// ------------------------------------------------------------
// Message builders
// ------------------------------------------------------------

function formatTime(date) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function buildInvitationMessage(donation, item) {
  const clientUrl = String(
    process.env.CLIENT_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

  const link = `${clientUrl}/receiver-invitation/${item.rawToken}`;
  const type = donation.foodType === "veg" ? "Veg" : "Non-veg";
  const distance = Number.isFinite(item.distanceKm)
    ? `, ${item.distanceKm} km away`
    : "";

  return (
    `Food Rescue: ${donation.quantity} ${donation.quantityUnit} of ` +
    `${donation.foodName} (${type}) available at ${donation.donorArea}, ` +
    `${donation.city}${distance}. Use before ${formatTime(donation.expiresAt)}. ` +
    `Accept or decline: ${link}`
  );
}

function buildVolunteerMessage(donation, receiver, donorName) {
  const pickup = [
    donation.donorAddress,
    donation.donorArea,
    donation.city,
    donation.pincode
  ]
    .filter(Boolean)
    .join(", ");

  const delivery = [
    receiver.organisationName || receiver.name,
    donation.deliveryAddress?.area,
    donation.deliveryAddress?.city,
    donation.deliveryAddress?.pincode
  ]
    .filter(Boolean)
    .join(", ");

  return (
    `Food Rescue pickup request: ${donation.quantity} ${donation.quantityUnit} ` +
    `${donation.foodName}. PICKUP: ${pickup}` +
    (donorName ? ` (donor: ${donorName})` : "") +
    `. DELIVER TO: ${delivery}. ` +
    `Use before ${formatTime(donation.expiresAt)}. ` +
    `Log in to accept this request.`
  );
}

// ------------------------------------------------------------
// High level helpers used by server.js
// ------------------------------------------------------------

// 1. Donation created -> SMS every matched receiver.
async function sendInvitationSms(donation, invitations) {
  const ReceiverInvitation = require("../models/ReceiverInvitation");

  const summary = {
    attempted: 0,
    sent: 0,
    failed: 0,
    provider: String(process.env.SMS_PROVIDER || "console").toLowerCase()
  };

  for (const item of invitations || []) {
    summary.attempted++;

    const result = await sendSms(
      item.receiverPhone,
      buildInvitationMessage(donation, item)
    );

    if (result.ok) {
      summary.sent++;
    } else {
      summary.failed++;
    }

    try {
      await ReceiverInvitation.updateOne(
        { _id: item.invitationId },
        {
          $set: {
            smsStatus: result.ok ? "SENT" : "FAILED",
            smsSentAt: result.ok ? new Date() : null
          }
        }
      );
    } catch (error) {
      console.error("SMS STATUS UPDATE ERROR:", error.message);
    }
  }

  return summary;
}

// 2. Receiver accepted -> SMS volunteers (pickup + delivery addresses)
//    or, for receiver pickup, SMS the donor only.
async function notifyAfterAcceptance(donation, receiver) {
  const User = require("../models/user");

  const donor = await User.findById(donation.donorId).select("name phone");
  const receiverName = receiver.organisationName || receiver.name;

  if (donation.pickupMethod === "volunteer") {
    const volunteers = await User.find({
      role: "volunteer",
      isActive: true
    }).select("phone");

    const message = buildVolunteerMessage(donation, receiver, donor?.name);

    await Promise.allSettled(
      volunteers.map((volunteer) => sendSms(volunteer.phone, message))
    );

    console.log(
      `VOLUNTEER SMS: notified ${volunteers.length} volunteer(s) about donation ${donation._id}`
    );
  }

  if (donor?.phone) {
    const next =
      donation.pickupMethod === "volunteer"
        ? "We are finding a volunteer for pickup."
        : "They will collect it from you.";

    await sendSms(
      donor.phone,
      `Food Rescue: your donation of ${donation.foodName} was accepted by ${receiverName}. ${next}`
    );
  }
}

module.exports = {
  sendSms,
  toE164India,
  tenDigitIndianNumber,
  buildInvitationMessage,
  buildVolunteerMessage,
  sendInvitationSms,
  notifyAfterAcceptance
};