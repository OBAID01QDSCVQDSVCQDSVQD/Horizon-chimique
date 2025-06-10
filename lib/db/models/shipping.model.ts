import mongoose, { Schema, model, models } from "mongoose";

const ShippingInfoSchema = new Schema({
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  address: String,
  city: String,
  postalCode: String,
  country: String,
}, { timestamps: true });

export const ShippingInfo = models.ShippingInfo || model("ShippingInfo", ShippingInfoSchema);
