import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

// ─── Password strength regex ────────────────────────────────────────────────
// Requires at least one lowercase, uppercase, digit, and special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;

const userSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────────────────────
    username: {
      type: String,
      required: [true, "Username modle is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username may only contain letters, numbers, and underscores",
      ],
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // ── Contact ───────────────────────────────────────────────────────────────
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (val) => validator.isEmail(val),
        message: "Email is invalid",
      },
    },

    // ── Security ──────────────────────────────────────────────────────────────
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
      validate: {
        validator(value) {
          return PASSWORD_REGEX.test(value);
        },
        message:
          "Password must include uppercase, lowercase, a number, and a special character (!@#$%^&*)",
      },
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    age: {
      type: Number,
      default: 18,
      validate: {
        validator: (val) => Number.isInteger(val) && val > 0,
        message: "Age must be a positive whole number",
      },
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    avatar: {
      type: String,
      default: "",
    },
  isActive: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ── Tokens ────────────────────────────────────────────────────────────────
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

// ─── Pre-save: hash password (runs AFTER schema validation) ────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: verify candidate password against stored hash ─────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: safe public profile (no sensitive fields) ─────────────
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    name: this.name,
    email: this.email,
    age: this.age,
    role: this.role,
    avatar: this.avatar,
    isActive: this.isActive,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;