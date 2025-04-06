import { scrapeAmazonProduct } from "./amazonScraper";
// import { scrapeFlipkartProduct } from "./flipkartScraper";
// import { scrapeUdemyCourse } from "./udemyScraper";




export async function scrapeProduct(url: string) {
  if (!url) return;

  const hostname = new URL(url).hostname;

  if (hostname.includes("amazon")) {
    return await scrapeAmazonProduct(url);}
  // } else if (hostname.includes("flipkart")) {
  //   return await scrapeFlipkartProduct(url);
  // else if (hostname.includes("udemy")) { // ✅ new support for Udemy
  //   return await scrapeUdemyCourse(url);
  // }
   else {
    throw new Error("Unsupported website (only Amazon, Flipkart, Udemy supported)");
  }
}

