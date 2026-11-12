// Marks three existing organisations as the default organisations.
// They are suggested when a donation matches nobody.
// Run once:  node markDefaultReceivers.js
const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

const Receiver = require("./models/Receiver");

dns.setServers(["8.8.8.8"]);

const DEFAULT_NAMES = [
  "Indian Disciples Mission (IDM) Orphanages",
  "Samruddhi Old Age Home",
  "Care Service Foundation"
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  await Receiver.updateMany({}, { $set: { isDefaultFallback: false } });

  const result = await Receiver.updateMany(
    { organisationName: { $in: DEFAULT_NAMES } },
    {
      $set: {
        isDefaultFallback: true,
        isActive: true,
        isVerified: true,
        smsConsent: true
      }
    }
  );

  const defaults = await Receiver.find({ isDefaultFallback: true }).select(
    "organisationName receiverType"
  );

  console.log("Default organisations set:", result.modifiedCount);
  defaults.forEach((r) =>
    console.log(" -", r.organisationName, `(${r.receiverType})`)
  );

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
});