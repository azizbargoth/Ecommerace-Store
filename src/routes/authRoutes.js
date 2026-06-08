import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// ─── Validation rules ───────────────────────────────────────────────────────
const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name in body is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

// ─── Routes ─────────────────────────────────────────────────────────────────
// Public
router.post("/register", registerValidation, register);
router.post("/login",    loginValidation,    login);

// Private (JWT required)
router.get("/me",     protect, getMe);
router.post("/logout", protect, logout);

export default router;
