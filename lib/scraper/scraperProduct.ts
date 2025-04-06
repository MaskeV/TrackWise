import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';

interface Product {
  Title: string;
  Price: number | null;
  MRP: number | null;
  Currency: string;
  Availability: string;
  Rating: number;
  Rating_Count: number;
  Category: string;
  Image_Link: string | null;
  Website: string;
}

interface ErrorMessage {
  message: string;
  status: number;
}

interface ScrapeResult {
  product: Product | null;
  error: ErrorMessage | null;
}

const currencies: Record<string, string> = {
  '₹': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP'
};

class ScraperBase {
  async getSoup(url: string): Promise<{ $: cheerio.Root | null, error: ErrorMessage | null }> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.status !== 200) {
        return { 
          $: null, 
          error: { 
            message: `Failed to fetch page: HTTP ${response.status}`, 
            status: response.status 
          } 
        };
      }
      
      const $ = cheerio.load(response.data);
      return { $, error: null };
    } catch (error) {
      return { 
        $: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error', 
          status: 500 
        } 
      };
    }
  }

  getCleanPrice(priceText: string): number {
    const numericValue = priceText.replace(/[^\d.,]/g, '')
      .replace(',', '')
      .replace('.', '');
    return parseFloat(numericValue);
  }

  async getDataFromScriptTag($: cheerio.Root, tagType: string): Promise<any> {
    const scripts = $('script[type="application/ld+json"]').toArray();
    for (const script of scripts) {
      try {
        const content = $(script).html();
        if (content) {
          const data = JSON.parse(content);
          if (data['@type'] === tagType) {
            return data;
          }
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }
}

class FlipkartScraper extends ScraperBase {
  async scrapeProduct(url: string): Promise<ScrapeResult> {
    const { $, error } = await this.getSoup(url);
    if (!$ || error) {
      return { product: null, error };
    }

    const title = $('span.B_NuCI').text().replace(/\u00A0\u00A0/g, '').trim();
    
    let priceText = $('div._30jeq3._16Jk6d').text().trim();
    const price = priceText ? this.getCleanPrice(priceText) : null;
    const currency = 'INR';

    let mrpText = $('div._3I9_wc._2p6lqe').text();
    let mrp = mrpText ? this.getCleanPrice(mrpText) : price;

    const buyNowBtn = $('button._2KpZ6l._2U9uOA.ihZ75k._3AWRsL');
    const availability = buyNowBtn.length > 0 && buyNowBtn.find('span').text().trim() === "Buy Now" 
      ? "In Stock" 
      : "Out of Stock";

    const categories = $('a._2whKao').toArray();
    let category = "Not Found";
    if (categories.length > 1) {
      category = $(categories[1]).text().trim();
    } else if (categories.length > 0) {
      category = $(categories[0]).text().trim();
    }

    const ratingNotAvailable = $('span._2dMYsv').length > 0;
    let rating = 0;
    let ratingCount = 0;

    if (!ratingNotAvailable) {
      const ratingText = $('._3LWZlK').text();
      rating = ratingText ? parseFloat(ratingText.replace(/,/g, '').trim()) : 0;

      const ratingCountText = $('._2_R_DZ').text();
      if (ratingCountText) {
        const countText = availability === 'In Stock'
          ? ratingCountText.replace('Ratings', '').replace(/,/g, '').trim().split(' ')[0]
          : ratingCountText.replace('Ratings', '').replace(/,/g, '').trim().split(' ')[0];
        
        ratingCount = parseFloat(countText);
      }
    }

    let imgLink = $('img._396cs4._2amPTt._3qGmMb').attr('src') || 
                 $('img._2r_T1I._396QI4').attr('src') || 
                 '';

    const product: Product = {
      Title: title,
      Price: price,
      MRP: mrp,
      Currency: currency,
      Availability: availability,
      Rating: rating,
      Rating_Count: ratingCount,
      Category: category,
      Image_Link: imgLink,
      Website: 'flipkart'
    };

    return { product, error: null };
  }

  async scrapePrice(url: string): Promise<number | null> {
    const { $ } = await this.getSoup(url);
    if (!$) return null;

    const priceText = $('div._30jeq3._16Jk6d').text();
    return priceText ? this.getCleanPrice(priceText) : null;
  }
}

class AmazonScraper extends ScraperBase {
  async scrapeProduct(url: string): Promise<ScrapeResult> {
    const { $, error } = await this.getSoup(url);
    if (!$ || error) {
      return { product: null, error };
    }

    const title = $('#productTitle').text().trim();

    const priceText = $('span.a-price-whole').text();
    const price = priceText ? this.getCleanPrice(priceText) : null;

    const mrpBlock = $('span.a-size-small.a-color-secondary.aok-align-center.basisPrice');
    let mrp = price;
    if (mrpBlock.length > 0) {
      const mrpText = mrpBlock.find('span.a-price.a-text-price span.a-offscreen').text();
      mrp = mrpText ? this.getCleanPrice(mrpText) : price;
    }

    const currencySymbol = $('span.a-price-symbol').text().trim();
    const currency = currencySymbol in currencies ? currencies[currencySymbol] : 'INR';

    const availabilityBlock = $('#availability');
    let availability = 'Out of Stock';
    if (availabilityBlock.length > 0) {
      const availabilitySpan = availabilityBlock.find('span.a-color-success');
      if (availabilitySpan.length > 0 && availabilitySpan.text().trim() === "In Stock") {
        availability = 'In Stock';
      }
    }

    let category = 'Not Found';
    const categoriesDiv = $('#wayfinding-breadcrumbs_feature_div');
    if (categoriesDiv.length > 0) {
      const categories = categoriesDiv.find('ul.a-unordered-list.a-horizontal.a-size-small li');
      if (categories.length > 2) {
        category = $(categories[2]).find('a').text().trim();
      }
    }

    let rating = 0;
    const ratingBlock = $('#averageCustomerReviews');
    if (ratingBlock.length > 0) {
      const ratingText = ratingBlock.find('span.a-icon-alt').text();
      if (ratingText) {
        rating = parseFloat(ratingText.replace(/,/g, '').trim().split(' ')[0]);
      }
    }

    let ratingCount = 0;
    const ratingCountText = $('#acrCustomerReviewText').text();
    if (ratingCountText) {
      ratingCount = parseFloat(ratingCountText.replace(/,/g, '').trim().split(' ')[0]);
    }

    const imgLink = $('#landingImage').attr('src') || null;

    const product: Product = {
      Title: title,
      Price: price,
      MRP: mrp,
      Currency: currency,
      Availability: availability,
      Rating: rating,
      Rating_Count: ratingCount,
      Category: category,
      Image_Link: imgLink,
      Website: 'amazon'
    };

    return { product, error: null };
  }

  async scrapePrice(url: string): Promise<number | null> {
    const { $ } = await this.getSoup(url);
    if (!$) return null;

    const priceText = $('span.a-price-whole').text();
    return priceText ? this.getCleanPrice(priceText) : null;
  }
}

class MyntraScraper extends ScraperBase {
  async scrapeProduct(url: string): Promise<ScrapeResult> {
    const { $, error } = await this.getSoup(url);
    if (!$ || error) {
      return { product: null, error };
    }

    let category = 'Not Found';
    const categories = $('div.breadcrumbs-container a.breadcrumbs-link').toArray();
    if (categories.length > 2) {
      category = $(categories[2]).text().trim();
    } else if (categories.length > 1) {
      category = $(categories[1]).text().trim();
    }

    let mrpText = $('span.pdp-mrp s').text();
    let mrp = mrpText ? this.getCleanPrice(mrpText) : null;

    let rating = 0;
    let ratingCount = 0;
    const ratingBlock = $('div.index-overallRating');
    if (ratingBlock.length > 0) {
      const ratingText = ratingBlock.find('div').first().text();
      rating = parseFloat(ratingText.replace(/,/g, '').trim().split(' ')[0]);

      const ratingCountText = ratingBlock.find('div.index-ratingsCount').text()
        .replace('Ratings', '').replace('Rating', '').trim();
      
      let multiplier = 1;
      if (ratingCountText.endsWith('k')) {
        multiplier = 1000;
        ratingCount = parseFloat(ratingCountText.slice(0, -1)) * multiplier;
      } else {
        ratingCount = parseFloat(ratingCountText);
      }
    }

    const productData = await this.getDataFromScriptTag($, 'Product');
    let title = '';
    let imgLink = '';
    let price: number | null = null;
    let currency = 'INR';
    let availability = 'Out of Stock';

    if (productData) {
      title = productData.name || '';
      imgLink = productData.image || '';
      price = productData.offers?.price ? parseFloat(productData.offers.price) : null;
      currency = productData.offers?.priceCurrency || 'INR';
      availability = productData.offers?.availability === 'InStock' ? 'In Stock' : 'Out of Stock';
    } else {
      // Fallback to HTML scraping if script data not found
      const brand = $('h1.pdp-title').text().trim();
      const name = $('h1.pdp-name').text().trim();
      title = `${brand} ${name}`.trim();

      const priceText = $('span.pdp-price strong').text();
      price = priceText ? this.getCleanPrice(priceText) : null;

      if (priceText?.includes('€')) {
        currency = 'EUR';
      } else if (priceText?.includes('$')) {
        currency = 'USD';
      }

      const imgDiv = $('div.image-grid-image').attr('style');
      if (imgDiv) {
        imgLink = imgDiv.replace('background-image: url("', '').replace('");', '');
      }

      const availabilityFlag = $('div.size-buttons-out-of-stock').length > 0;
      availability = availabilityFlag ? 'Out of Stock' : 'In Stock';
    }

    if (!mrp) {
      mrp = price;
    }

    const product: Product = {
      Title: title,
      Price: price,
      MRP: mrp,
      Currency: currency,
      Availability: availability,
      Rating: rating,
      Rating_Count: ratingCount,
      Category: category,
      Image_Link: imgLink,
      Website: 'myntra'
    };

    return { product, error: null };
  }

  async scrapePrice(url: string): Promise<number | null> {
    const { $ } = await this.getSoup(url);
    if (!$) return null;

    const productData = await this.getDataFromScriptTag($, 'Product');
    if (productData?.offers?.price) {
      return parseFloat(productData.offers.price);
    }

    // Fallback to HTML scraping
    const priceText = $('span.pdp-price strong').text();
    return priceText ? this.getCleanPrice(priceText) : null;
  }
}

class AjioScraper extends ScraperBase {
  private $: cheerio.Root | null = null;

  async getSalePrice(): Promise<number | null> {
    if (!this.$) return null;

    try {
      const salePriceText = this.$('div.promo-discounted-price.pr-promotions span').eq(1).text();
      if (salePriceText) {
        return this.getCleanPrice(salePriceText);
      }
    } catch (e) {
      try {
        const priceInfo = this.$('div.price-info.ellipsis');
        if (priceInfo.length) {
          priceInfo.find('span').remove();
          const priceText = priceInfo.text();
          return priceText ? this.getCleanPrice(priceText) : null;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async scrapeProduct(url: string): Promise<ScrapeResult> {
    const { $, error } = await this.getSoup(url);
    if (!$ || error) {
      return { product: null, error };
    }
    this.$ = $;

    const salePrice = await this.getSalePrice();
    const productData = await this.getDataFromScriptTag($, 'ProductGroup');

    let title = '';
    let imgLink = '';
    let price: number | null = null;
    let currency = 'INR';
    let availability = 'Out of Stock';
    let category = 'Not Found';

    if (productData) {
      const brand = productData.brand?.name || '';
      title = `${brand} ${productData.name || ''}`.trim();
      imgLink = productData.image || '';
      price = productData.offers?.price ? parseFloat(productData.offers.price) : null;
      currency = productData.offers?.priceCurrency || 'INR';
      const availabilityText = productData.offers?.availability?.split('/').pop() || '';
      availability = ['InStock', 'LimitedAvailability'].includes(availabilityText) 
        ? 'In Stock' 
        : 'Out of Stock';
      category = productData.category?.split('>').pop()?.trim() || 'Not Found';
    } else {
      // Fallback to HTML scraping
      const brand = $('h2.brand-name').text().trim();
      const name = $('h1.prod-name').text().trim();
      title = `${brand} ${name}`.trim();

      const priceText = $('div.prod-sp').text();
      price = priceText ? this.getCleanPrice(priceText) : null;

      const categoryItems = $('div.breadcrumb-section ul.breadcrumb-list li').toArray();
      if (categoryItems.length > 3) {
        category = $(categoryItems[3]).find('a').text().trim();
      }

      const addToBagBtn = $('div.btn-gold span').eq(1).text().trim();
      availability = addToBagBtn === 'ADD TO BAG' ? 'In Stock' : 'Out of Stock';
    }

    // Find best quality image
    const imgLinkBlocks = $('div.img-container').toArray();
    for (const block of imgLinkBlocks) {
      const currImgLink = $(block).find('img').attr('src');
      if (currImgLink?.includes('473Wx593H')) {
        imgLink = currImgLink;
        break;
      }
    }

    let mrpText = $('span.prod-cp').text();
    let mrp = mrpText ? this.getCleanPrice(mrpText) : price;

    if (salePrice !== null && (price === null || salePrice < price)) {
      price = salePrice;
    }

    const product: Product = {
      Title: title,
      Price: price,
      MRP: mrp,
      Currency: currency,
      Availability: availability,
      Rating: 0,
      Rating_Count: 0,
      Category: category,
      Image_Link: imgLink,
      Website: 'ajio'
    };

    return { product, error: null };
  }

  async scrapePrice(url: string): Promise<number | null> {
    const { $ } = await this.getSoup(url);
    if (!$) return null;
    this.$ = $;

    const salePrice = await this.getSalePrice();

    try {
      const priceText = $('div.prod-sp').text();
      const price = priceText ? this.getCleanPrice(priceText) : null;

      if (salePrice !== null && (price === null || salePrice < price)) {
        return salePrice;
      }
      return price;
    } catch (e) {
      return null;
    }
  }
}

class Scraper {
  private flipkart: FlipkartScraper;
  private amazon: AmazonScraper;
  private myntra: MyntraScraper;
  private ajio: AjioScraper;

  constructor() {
    this.flipkart = new FlipkartScraper();
    this.amazon = new AmazonScraper();
    this.myntra = new MyntraScraper();
    this.ajio = new AjioScraper();
  }

  private getWebsiteFromUrl(url: string): { website: string | null, error: ErrorMessage | null } {
    try {
      const cleanedUrl = url.replace(/\s/g, '').trim();
      const domainParts = cleanedUrl.split('/')[2].split('.');
      
      let website = domainParts[1];
      if (!cleanedUrl.split('/')[2].includes('www.')) {
        website = domainParts[0];
      }

      if (website === 'ajio' && !cleanedUrl.split('/')[2].includes('www.')) {
        return {
          website: null,
          error: {
            message: "Ajioluxe is not supported! Please check back later.",
            status: 404
          }
        };
      }

      return { website, error: null };
    } catch (e) {
      return {
        website: null,
        error: {
          message: "Invalid URL!",
          status: 404
        }
      };
    }
  }

  async scrapeProduct(url: string): Promise<ScrapeResult> {
    const { website, error } = this.getWebsiteFromUrl(url);
    if (!website || error) {
      return { product: null, error };
    }

    try {
      switch (website) {
        case 'flipkart':
          return await this.flipkart.scrapeProduct(url);
        case 'amazon':
          return await this.amazon.scrapeProduct(url);
        case 'myntra':
          return await this.myntra.scrapeProduct(url);
        case 'ajio':
          return await this.ajio.scrapeProduct(url);
        default:
          return {
            product: null,
            error: {
              message: "Entered website is not supported! Please check back later.",
              status: 404
            }
          };
      }
    } catch (e) {
      return {
        product: null,
        error: {
          message: e instanceof Error ? e.message : 'Unknown error occurred',
          status: 500
        }
      };
    }
  }

  async scrapePrice(url: string): Promise<number | null> {
    const { website } = this.getWebsiteFromUrl(url);
    if (!website) return null;

    try {
      switch (website) {
        case 'flipkart':
          return await this.flipkart.scrapePrice(url);
        case 'amazon':
          return await this.amazon.scrapePrice(url);
        case 'myntra':
          return await this.myntra.scrapePrice(url);
        case 'ajio':
          return await this.ajio.scrapePrice(url);
        default:
          return null;
      }
    } catch (e) {
      return null;
    }
  }
}

export { Scraper, FlipkartScraper, AmazonScraper, MyntraScraper, AjioScraper };
export type { Product, ErrorMessage, ScrapeResult };