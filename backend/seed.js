const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");

async function seed() {
  try {

    // connect mongodb
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // hash password
    const hashedPassword = await bcrypt.hash("hospital123", 10);

    // create staff
    await User.insertMany([
      {
        name: "Dr Khan",
        email: "dr.khan@khan.com",
        password:hashedPassword,
        role: "doctor",
        phone: "1234567890",
        department: "Cardiology"
      },
      {
        name: "Dr Sharma",
        email: "dr.sharma@khan.com",
        password:hashedPassword,
        role: "doctor",
        phone: "1234567891",
        department: "Neurology"
      },
      {
        name: "Reception",
        email: "reception@khan.com",
        password:hashedPassword,
        role: "receptionist",
        phone: "1234567892"
      }
    ]);

    console.log("Staff seeded successfully");
    process.exit();

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

seed();