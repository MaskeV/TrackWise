/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: [
      "mongoose",
      "puppeteer-extra",
      "puppeteer-extra-plugin-stealth",
      "puppeteer-extra-plugin-recaptcha",
   
    ],
  },
  images: {
    domains: ["m.media-amazon.com"],
  },
  transpilePackages: [
    "undici",
    "cheerio",

  ],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/(undici|cheerio)/,
      use: {
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env"],
        },
      },
    });
    return config;
  },
};

export default nextConfig;
  
  