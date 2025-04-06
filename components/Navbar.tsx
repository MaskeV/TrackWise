"use client"; // Make sure to mark the component as a client component

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Define the type for navIcon objects
interface NavIcon {
  src: string;
  alt: string;
  link: string;
}

export default function Navbar() {
  const [activeIcon, setActiveIcon] = useState<string | null>(null); // Track active icon

  const navIcons: NavIcon[] = [
    { src: "/assets/icons/search.svg", alt: "search", link: "/search" },
    { src: "/assets/icons/black-heart.svg", alt: "heart", link: "/favorites" },
    { src: "/assets/icons/user.svg", alt: "user", link: "./pages/account" },
  ];

  // Function to handle active state change
  const handleIconClick = (icon: string) => {
    setActiveIcon(icon);
  };

  return (
    <header className="w-full">
      <nav className="nav">
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/assets/icons/logo.svg"
            width={27}
            height={27}
            alt="logo"
          />
          <p className="nav-logo">
            <span className="text-primary">TrackWise</span>
          </p>
        </Link>
        <div className="flex items-center gap-5">
          {navIcons.map((icon) => (
            <Link href={icon.link} key={icon.alt}>
              <div
                onClick={() => handleIconClick(icon.alt)} // Set active icon
                className={`icon ${activeIcon === icon.alt ? "active" : ""}`} // Apply active class
              >
                <Image
                  src={icon.src}
                  alt={icon.alt}
                  width={28}
                  height={28}
                  className={`object-contain ${activeIcon === icon.alt ? "active-icon" : ""}`} // Apply active class to the image
                />
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
