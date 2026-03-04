import mongoose from "mongoose";

/**
 * MongoDB ulanishini o'rnatadi
 * @param {string} uri - MongoDB URI
 */
export const connectDB = async (uri) => {
  await mongoose.connect(uri);
  console.log("MongoDB ulandi");
};
