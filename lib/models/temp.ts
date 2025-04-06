import mongoose, { Schema, Document } from "mongoose";

interface User {
  email: string;
}

interface PriceHistory {
  price: number;
  date: Date;
}

interface Product extends Document {
  title: string;
  url: string;
  currentPrice: number;
  priceHistory: PriceHistory[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  users: User[];
}

const PriceHistorySchema = new Schema<PriceHistory>({
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const UserSchema = new Schema<User>({
  email: { type: String, required: true, unique: true },
});

const ProductSchema = new Schema<Product>({
  title: { type: String, required: true },
  url: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  priceHistory: [PriceHistorySchema],
  lowestPrice: { type: Number, required: true },
  highestPrice: { type: Number, required: true },
  averagePrice: { type: Number, required: true },
  users: [UserSchema],
});

const ProductModel = mongoose.model<Product>("Product", ProductSchema);
export { ProductModel };
