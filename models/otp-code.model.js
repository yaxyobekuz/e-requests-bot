import mongoose from "mongoose";

const otpCodeSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800, // MongoDB TTL: auto-delete after 30 minutes
  },
});

export const OtpCode = mongoose.model("OtpCode", otpCodeSchema);
