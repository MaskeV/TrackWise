import axios from "axios";
import * as cheerio from "cheerio";
import { getBrightDataProxyOptions } from "./proxyConfig";
import {
  extractCurrency,
  extractDescription,
  extractPrice,
  extractScoreIcon,
} from "../utils";

export async function scrapeAmazonProduct(url: string) {
  const options = getBrightDataProxyOptions();

  try {
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    const title = $("#productTitle").text().trim();
    const currentPrice = extractPrice(
      $(".priceToPay span.a-price-whole"),
      $(".a.size.base.a-color-price"),
      $(".a-button-selected .a-color-base"),
      $(".a-price.a-text-price")
    );
    const originalPrice = extractPrice(
      $("#priceblock_ourprice"),
      $(".a-price.a-text-price span.a-offscreen"),
      $("#listPrice"),
      $("#priceblock_dealprice"),
      $(".a-size-base.a-color-price")
    );
    const ratings = $("#acrCustomerReviewText").text().trim();
    const outOfStock = $(".a-color-success").text().trim() === "" ? false : true;
    const images: string =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";
    const imagesUrl = Object.keys(JSON.parse(images));
    const currency = extractCurrency($(".a-price-symbol"));
    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");
    const starIcon = extractScoreIcon(
      $(".a-size-base .a-color-base").text().trim()
    );
    const description = extractDescription($);

    return {
      url,
      title,
      currency: currency || "$",
      image: imagesUrl[0],
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      starIcon: starIcon || "",
      description,
      isOutOfStock: outOfStock,
      productReviews: ratings || "",
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    };
  } catch (error: any) {
    throw new Error(`Amazon scraping failed: ${error.message}`);
  }
}
