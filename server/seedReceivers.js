const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

const Receiver = require("./models/Receiver");

dns.setServers(["8.8.8.8"]);

const receivers = [
  // =========================================================
  // WARANGAL - ORPHANAGES
  // =========================================================

  {
    name: "Thadem Ramyasri",
    organisationName: "Indian Disciples Mission (IDM) Orphanages",
    phone: "7815908207",
    receiverType: "orphanage",

    address: {
      area: "NGO's Colony",
      city: "Warangal",
      state: "Telangana"
    },

    capacity: {
      plates: 20,
      kg: 20,
      packets: 20,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  {
    name: "Naredla Deepthi",
    organisationName: "Sahrudaya Anadha Ashramam",
    phone: "8500732554",
    receiverType: "orphanage",

    address: {
      area: "Bhopalpatnam",
      city: "Warangal",
      state: "Telangana"
    },

    capacity: {
      plates: 30,
      kg: 30,
      packets: 30,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  {
    name: "Kanaparthi Nikitha",
    organisationName: "Oasis Orphanage",
    phone: "9441321352",
    receiverType: "orphanage",

    address: {
      area: "Parkal Road",
      city: "Warangal",
      state: "Telangana"
    },

    capacity: {
      plates: 40,
      kg: 40,
      packets: 40,
      boxes: 0
    },

    expectedDeliveryMinutes: 120
  },

  // =========================================================
  // WARANGAL - OLD AGE HOMES
  // =========================================================

  {
    name: "Samruddhi Old Age Home",
    organisationName: "Samruddhi Old Age Home",
    phone: "7815908207",
    receiverType: "old_age_home",

    address: {
      area: "Keerthi Nagar Colony",
      city: "Warangal",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 0,
      boxes: 0
    },

    expectedDeliveryMinutes: 120
  },

  {
    name: "Varahi Old Age Home",
    organisationName: "Varahi Old Age Home",
    phone: "7993116057",
    receiverType: "old_age_home",

    address: {
      area: "Powers Colony",
      city: "Warangal",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 0,
      boxes: 0
    },

    expectedDeliveryMinutes: 120
  },

  {
    name: "Care Service Foundation",
    organisationName: "Care Service Foundation",
    phone: "8500732554",
    receiverType: "old_age_home",

    address: {
      area: "LB Nagar Kashibugga",
      city: "Warangal",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 0,
      boxes: 0
    },

    expectedDeliveryMinutes: 120
  },

  {
    name: "Kanakadhurga Old Age Home",
    organisationName: "Kanakadhurga Old Age Home",
    phone: "7815908207",
    receiverType: "old_age_home",

    address: {
      area: "Keerthi Nagar Colony",
      city: "Warangal",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 0,
      boxes: 0
    },

    expectedDeliveryMinutes: 120
  },

  // =========================================================
  // HANAMKONDA - OLD AGE HOMES
  // =========================================================

  {
    name: "Thadem Ramyasri",
    organisationName: "Varahi Old Age Homes",
    phone: "7815908207",
    receiverType: "old_age_home",

    address: {
      area: "Subedhari",
      city: "Hanamkonda",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  {
    name: "Pendem Chithra",
    organisationName: "Load Old Age Homes",
    phone: "7993116057",
    receiverType: "old_age_home",

    address: {
      area: "Anand Nagar",
      city: "Hanamkonda",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  {
    name: "Nikitha",
    organisationName: "St. Ann's Home for Old Physically",
    phone: "9441321352",
    receiverType: "old_age_home",

    address: {
      area: "Fatima Nagar",
      city: "Hanamkonda",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  // =========================================================
  // HANAMKONDA - ORPHANAGES
  // =========================================================

  {
    name: "Thadem Ramyasri",
    organisationName: "Oasis Orphanages",
    phone: "7815908207",
    receiverType: "orphanage",

    address: {
      area: "Parimala Colony",
      city: "Hanamkonda",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  {
    name: "Pendem Chithra",
    organisationName: "Athidhi Orphanages",
    phone: "7993116057",
    receiverType: "orphanage",

    address: {
      area: "Reddy Colony",
      city: "Hanamkonda",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  {
    name: "Nikitha",
    organisationName: "Karunalayam Orphan Age",
    phone: "9441321352",
    receiverType: "orphanage",

    address: {
      area: "Dharmasagar",
      city: "Hanamkonda",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  // =========================================================
  // KAZIPET - ORPHANAGES
  // =========================================================

  {
    name: "Thadem Ramyasri",
    organisationName: "Divine Mercy Home",
    phone: "7815908207",
    receiverType: "orphanage",

    address: {
      area: "Fathima Nagar",
      city: "Kazipet",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  {
    name: "Pendem Chithra",
    organisationName: "Missionaries of the Poor",
    phone: "7993116057",
    receiverType: "orphanage",

    address: {
      area: "NIT Post",
      city: "Kazipet",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  },

  {
    name: "Nikitha",
    organisationName: "Glorious Foundation",
    phone: "9441321352",
    receiverType: "orphanage",

    address: {
      area: "Balaji Nagar",
      city: "Kazipet",
      state: "Telangana"
    },

    capacity: {
      plates: 100,
      kg: 100,
      packets: 100,
      boxes: 0
    },

    expectedDeliveryMinutes: 60
  }
];

async function seedReceivers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    // Remove old receiver records
    await Receiver.deleteMany({});

    // The matcher only picks receivers that are active, verified AND have
    // consented to SMS. Without these flags nobody ever matched, so no SMS
    // was ever attempted. These phone numbers are your own test numbers;
    // for real organisations, set smsConsent only after they agree.
    const consentTime = new Date();

    const receiversToInsert = receivers.map((receiver) => ({
      ...receiver,
      isActive: true,
      isVerified: true,
      smsConsent: true,
      smsConsentAt: consentTime
    }));

    // Insert new receiver records
    await Receiver.insertMany(receiversToInsert);

    console.log(`${receivers.length} receivers inserted.`);
    console.log("Receiver seeding completed.");

    await mongoose.connection.close();
  } catch (error) {
    console.error("RECEIVER SEED ERROR:", error);
    process.exit(1);
  }
}

seedReceivers();