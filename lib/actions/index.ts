"use server";
import { revalidatePath } from "next/cache";
import Product from "../models/product.models";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper/amazon";

import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;
  try {
    connectToDB();
    const scrapedProduct = await scrapeProduct(productUrl);

    if (!scrapedProduct) return;
    let product = scrapedProduct;
    const existingProduct = await Product.findOne({ url: scrapedAmazonProduct.url });
    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice },
      ];

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      };
    }
    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true }
    );
    revalidatePath(`/products/${newProduct._id}`);
    return `/products/${newProduct._id}`;
  } catch (error: any) {
    throw new Error(`Failed to create/update product${error.message}`);
  }
}
export async function getProductById(productId: string) {
  try {
    connectToDB();
    const product = await Product.findOne({ _id: productId });
    if (!product) return null;
    return product;
  } catch (error) {
    console.log(error);
  }
}
export async function getAllProducts() {
  try {
    connectToDB();
    const products = await Product.find();
    return products;
  } catch (error) {
    console.log(error);
  }
}
export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();

    const currentProduct = await Product.findById(productId);
    if (!currentProduct) return null;
    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3);
    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}
export async function addUserEmailToProduct(
  productId: string,
  userEmail: string
) {
  try {
    const product = await Product.findById(productId);

    if (!product) return;

    const userExists = product.users.some(
      (user: User) => user.email === userEmail
    );

    if (!userExists) {
      product.users.push({ email: userEmail });

      await product.save();

      const emailContent = await generateEmailBody(product, "WELCOME");

      await sendEmail(emailContent, [userEmail]);
    }
  } catch (error) {
    console.log(error);
  }
}


// import { revalidatePath } from "next/cache";
// import Product from "../models/product.models";
// import { connectToDB } from "../mongoose";
// import { scrapeProduct } from "../scraper/amazon";
// import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
// import { User } from "@/types";
// import { generateEmailBody, sendEmail } from "../nodemailer";


// type NotificationType = "WELCOME" | "PRICE_DROP" | "OTHER_NOTIFICATION";

// export async function scrapeAndStoreProduct(productUrl: string) {
//   if (!productUrl) return;
//   try {
//     connectToDB();
//     const scrapedProduct = await scrapeProduct(productUrl);

//     if (!scrapedProduct) return;

//     // Check for the existing product
//     let product = scrapedProduct;
//     const existingProduct = await Product.findOne({ url: scrapedProduct.url });

//     if (existingProduct) {
//       // Update price history
//       const updatedPriceHistory: any = [
//         ...existingProduct.priceHistory,
//         { price: scrapedProduct.currentPrice },
//       ];

//       // Check if price has decreased
//       const previousPrice = existingProduct.priceHistory[existingProduct.priceHistory.length - 1]?.price;
//       if (previousPrice && scrapedProduct.currentPrice < previousPrice) {
//         // Send email to all users who are subscribed to this product
//         const usersToNotify = existingProduct.users;
//         for (const user of usersToNotify) {
//           const emailContent = await generateEmailBody(existingProduct, "PRICE_DROP");
//           await sendEmail(emailContent, [user.email]);
//         }
//       }

//       // Update product with new data
//       product = {
//         ...scrapedProduct,
//         priceHistory: updatedPriceHistory,
//         lowestPrice: getLowestPrice(updatedPriceHistory),
//         highestPrice: getHighestPrice(updatedPriceHistory),
//         averagePrice: getAveragePrice(updatedPriceHistory),
//       };
//     }

//     const newProduct = await Product.findOneAndUpdate(
//       { url: scrapedProduct.url },
//       product,
//       { upsert: true, new: true }
//     );
//     revalidatePath(`/products/${newProduct._id}`);
//     return `/products/${newProduct._id}`;
//   } catch (error: any) {
//     throw new Error(`Failed to create/update product: ${error.message}`);
//   }
// }
