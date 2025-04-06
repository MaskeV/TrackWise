// import axios from 'axios';

// interface FlipkartProduct {
//   title: string;
//   price: string;
//   image: string;
//   url: string;
// }


// export async function scrapeFlipkartProduct(query: string): Promise<FlipkartProduct[]> {
//   try {
//     const response = await axios.get('https://real-time-flipkart-data.p.rapidapi.com/search', {
//       params: {
//         query: query,
//         page: '1',
//         location: 'IN',
//       },
//       headers: {
//         'X-RapidAPI-Key': '881b34c30emsh337a78617622fd6p18ecc8jsna4dac2b1ee57',
//         'X-RapidAPI-Host': 'real-time-flipkart-data.p.rapidapi.com'
//       }
//     });

//     const products = response.data.data.products;

//     if (!products || products.length === 0) {
//       throw new Error('No products found.');
//     }

//     // Map the results to our FlipkartProduct type
//     const formattedProducts: FlipkartProduct[] = products.map((p: any) => ({
//       title: p.title,
//       price: p.price.formatted || 'N/A',
//       image: p.images[0] || '',
//       url: p.productUrl
//     }));

//     return formattedProducts;
//   } catch (error: any) {
//     console.error('API error:', error.message);
//     throw new Error(`Flipkart API request failed: ${error.message}`);
//   }
// }
