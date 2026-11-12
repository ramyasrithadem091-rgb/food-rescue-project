const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dns = require("dns");

require("dotenv").config();

// Use the same DNS configuration as server.js
dns.setServers(["8.8.8.8"]);

const User = require("./models/user");

async function createAdmin() {
  try {

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    const name = "Food Rescue Admin";
    const phone = "9999999999";
    const email = "admin@foodrescue.com";
    const password = "Admin@123";

    // Check whether admin already exists
    const existingAdmin = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingAdmin) {

      console.log("Admin account already exists.");

      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);

      await mongoose.connection.close();

      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create admin
    const admin = new User({
      name,
      phone,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    console.log("");
    console.log("================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("================================");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role:", "admin");
    console.log("================================");

    await mongoose.connection.close();

  } catch (error) {

    console.error("");
    console.error("ERROR CREATING ADMIN:");
    console.error(error);
    
    await mongoose.connection.close();
  }
}

createAdmin();