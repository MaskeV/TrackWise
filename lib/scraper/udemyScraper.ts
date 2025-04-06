// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// interface UdemyCourse {
//   title: string;
//   instructor: string;
//   rating: string;
//   students: string;
//   price: string;
//   url: string;
// }

// export async function scrapeUdemyCourse(url: string): Promise<UdemyCourse> {
//   try {
//     // Use puppeteer-extra with stealth plugin to avoid detection
//     puppeteer.use(StealthPlugin());
    
//     // Define your Bright Data (Luminati) Proxy Credentials
//     const proxyUsername = 'your_brightdata_username'; // Replace with your username
//     const proxyPassword = 'your_brightdata_password'; // Replace with your password
//     const proxyAddress = 'proxy_address'; // Replace with the proxy address (e.g., 'your_proxy_location.luminati.io')
//     const proxyPort = 'proxy_port'; // Replace with the proxy port (e.g., 22225)
    
//     const proxyURL = `http://${proxyUsername}:${proxyPassword}@${proxyAddress}:${proxyPort}`;
    
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         '--no-sandbox', 
//         '--disable-setuid-sandbox',
//         `--proxy-server=${proxyURL}`  // Pass the proxy settings here
//       ]
//     });
    
//     const page = await browser.newPage();
    
//     // Set realistic headers
//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
//     await page.setViewport({ width: 1366, height: 768 });

//     // Navigate to the course page
//     await page.goto(url, { 
//       waitUntil: 'networkidle2',
//       timeout: 30000
//     });

//     // Wait for the critical elements to load (instructor, title, price, etc.)
//     await page.waitForSelector('[data-purpose="lead-title"]', { timeout: 10000 });
//     await page.waitForSelector('[data-purpose="instructor-name"]', { timeout: 10000 });
//     await page.waitForSelector('[data-purpose="rating-number"]', { timeout: 10000 });
//     await page.waitForSelector('[data-purpose="enrollment"]', { timeout: 10000 });
//     await page.waitForSelector('[data-purpose="price-text"]', { timeout: 10000 });

//     // Extract course data
//     const course = await page.evaluate(() => {
//       const title = document.querySelector('[data-purpose="lead-title"]')?.textContent?.trim() || 'No Title';
//       const instructor = document.querySelector('[data-purpose="instructor-name"]')?.textContent?.trim() || 'No Instructor';
//       const rating = document.querySelector('[data-purpose="rating-number"]')?.textContent?.trim() || 'No Rating';
//       const students = document.querySelector('[data-purpose="enrollment"]')?.textContent?.trim() || 'No Students';
      
//       // Price can be in different elements depending on discounts
//       let price = '';
//       const priceElement = document.querySelector('[data-purpose="price-text"]') || 
//                           document.querySelector('.udlite-clp-discount-price') ||
//                           document.querySelector('.price-text--price-part--Tu6MH');
//       if (priceElement) {
//         price = priceElement.textContent?.trim() || 'No Price';
//       }

//       return {
//         title,
//         instructor,
//         rating,
//         students,
//         price
//       };
//     });

//     await browser.close();

//     return {
//       ...course,
//       url
//     };

//   } catch (error) {
//     console.error("Error scraping Udemy course:", error);
//     throw new Error(`Failed to scrape Udemy course: ${(error as Error).message}`);
//   }
// }
