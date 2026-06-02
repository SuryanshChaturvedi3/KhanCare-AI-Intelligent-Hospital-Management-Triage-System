const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/jsonwebToken"); // 👈 Humara 'Compounder' (Token Maker)

// =================================================================
// @desc    Register a new user (Patient/Doctor/Admin)
// @route   POST /api/auth/register
// @access  Public
// =================================================================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role,phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role, 
    });

    // 4. Response: Agar user ban gaya, toh success message aur Token bhejo
    if (user) {
      res.status(201).json({
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: generateToken(user._id, user.role), // 🎫 Wristband (Token) turant de diya
        message: "User Registered Successfully!",
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }

  } catch (error) {
    // 5. Error Handling: Agar server fail hua (DB connect nahi hua, etc.)
    console.error("Error in Register:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// =================================================================
// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
// =================================================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      return res.status(200).json({
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: generateToken(user._id, user.role),
        message: "Login Successful",
      });
    }

    // ❗ Always return
    return res.status(401).json({ message: "Invalid email or password" });

  } catch (error) {
    console.error("Error in Login:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { registerUser, loginUser };