const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");

async function seed() {
  try {

    // connect mongodb
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // hash passwords
    const staffPassword = await bcrypt.hash("hospital123", 10);
    const demoPassword = await bcrypt.hash("demo123", 10);

    // create staff + demo patient
    await User.insertMany([
      {
        name: "Demo Patient",
        email: "patient@demo.com",
        password: demoPassword,
        role: "patient",
        phone: "9999999999",
      },
      {
        name: "Dr Khan",
        email: "dr.khan@khan.com",
        password: staffPassword,
        role: "doctor",
        phone: "1234567890",
        department: "Cardiology"
      },
      {
        name: "Dr Sharma",
        email: "dr.sharma@khan.com",
        password: staffPassword,
        role: "doctor",
        phone: "1234567891",
        department: "Neurology"
      },
      {
        name: "Reception",
        email: "reception@khan.com",
        password: staffPassword,
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