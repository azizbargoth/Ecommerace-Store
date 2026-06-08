import jwt from "jsonwebtoken";
import { validationResult, matchedData } from "express-validator";
import User from "../models/User.js";

// ─── Helper: generate JWT ───────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ─── Helper: send token response ───────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
};

// ─── @route   POST /api/auth/register ──────────────────────────────────────
// ─── @access  Public ───────────────────────────────────────────────────────
export const register = async (req, res) => {
  // 1. Validate request body
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { username,name, email, password ,age} = req.body;

    // 2. Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // 3. Create user (password hashed via pre-save hook in model)
    //console.log("Creating user with data:", { username, email });
    // const user = new User(req.body);
    // await user.save();
   const user = await User.create({ username, name, email, password, age});
    // 4. Return token + user profile
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
};

// ─── @route   POST /api/auth/login ─────────────────────────────────────────
// ─── @access  Public ───────────────────────────────────────────────────────
export const login = async (req, res) => {
  // 1. Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { email, password } = req.body;

    // 2. Find user and explicitly select password (excluded by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 3. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 4. Return token + user profile
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

// ─── @route   GET /api/auth/me ──────────────────────────────────────────────
// ─── @access  Private (requires JWT) ───────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.user is attached by the protect middleware
    res.status(200).json({
      success: true,
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile.",
    });
  }
};

// ─── @route   POST /api/auth/logout ────────────────────────────────────────
// ─── @access  Private ──────────────────────────────────────────────────────
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully. Please discard your token client-side.",
  });
};
