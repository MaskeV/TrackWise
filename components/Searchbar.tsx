"use client";
import { scrapeAndStoreProduct } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Searchbar() {
  const allowedDomains = [
    "amazon.com",
    "amazon.in",
    "flipkart.com",
    "ebay.com",
    "walmart.com",
    "snapdeal.com",
    "udemy.com",
  ];

  const isValidEcommerceURL = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return allowedDomains.some((domain) => parsedUrl.hostname.includes(domain));
    } catch (error) {
      return false;
    }
  };

  const [searchPrompt, setSearchPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidLink = isValidEcommerceURL(searchPrompt);
    if (!isValidLink)
      return alert("Please provide a valid Amazon Product Link");

    try {
      setIsLoading(true);
      const product: string | undefined = await scrapeAndStoreProduct(searchPrompt);
      if (product) {
        router.push(product);
      } else {
        alert("Failed to scrape product. Please try a different URL.");
      }
    } catch (error) {
      console.error("Scraping error:", error);
      alert("Something went wrong. Check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="flex flex-wrap gap-4 mt-12" onSubmit={handleSubmit}>
      <input
        type="text"
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        placeholder="Enter product link (Amazon, Flipkart, etc.)"
        className="searchbar-input"
      />

      <button
        type="submit"
        className="searchbar-btn"
        disabled={searchPrompt === ""}
      >
        {isLoading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
