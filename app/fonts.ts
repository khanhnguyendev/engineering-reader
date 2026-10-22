import { Inter, JetBrains_Mono } from "next/font/google";

// One font setup for every root <html>: the locale layout and the root 404.
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${jetbrains.variable}`;
