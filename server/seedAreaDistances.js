const mongoose = require("mongoose");
const dns = require("dns");

require("dotenv").config();

const AreaDistance = require("./models/AreaDistance");

// areaData.js lives next to this file in most setups; fall back to ./data.
let areaData;
try {
  areaData = require("./areaData");
} catch (error) {
  areaData = require("./data/areaData");
}

dns.setServers(["8.8.8.8"]);

// ============================================================
// DEMO DISTANCES - NOT verified road distances.
//
// The matcher needs a distance record for every (donor area,
// receiver area) pair in the same city. The old seed only had a
// few pairs, so almost every receiver was excluded with
// "AREA DISTANCE NOT FOUND". This builds the full table for every
// area in areaData.js using fixed demo values (2-10 km, same area
// = 0). Replace with real distances (Google Distance Matrix API or
// manual entries) before real use.
// ============================================================

function buildDistances() {
  const records = [];

  for (const [city, areas] of Object.entries(areaData)) {
    for (let i = 0; i < areas.length; i++) {
      // Same area = 0 km
      records.push({
        city,
        fromArea: areas[i],
        toArea: areas[i],
        distanceKm: 0
      });

      for (let j = i + 1; j < areas.length; j++) {
        records.push({
          city,
          fromArea: areas[i],
          toArea: areas[j],
          // Deterministic demo value between 2 and 10 km
          distanceKm: 2 + ((i * 3 + j * 5) % 9)
        });
      }
    }
  }

  return records;
}

async function seedDistances() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    const distances = buildDistances();

    // Add or update records without deleting existing records.
    // The matcher checks both directions, so one direction is enough.
    for (const distance of distances) {
      await AreaDistance.updateOne(
        {
          city: distance.city,
          fromArea: distance.fromArea,
          toArea: distance.toArea
        },
        { $set: distance },
        { upsert: true }
      );
    }

    console.log(`${distances.length} distance records added or updated.`);
    console.log("Existing distance records were preserved.");
  } catch (error) {
    console.error("AREA DISTANCE SEED ERROR:", error);
  } finally {
    await mongoose.connection.close();
  }
}

seedDistances();