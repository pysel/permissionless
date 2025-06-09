import type { Metadata } from "next";
import { Antic } from "next/font/google";
import "./globals.css";
import WagmiProviderComp from "@/lib/wagmi-provider";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "@/lib/config";
 
const antic = Antic({ weight: "400", subsets: ["latin"] });
 
export const metadata: Metadata = {
  title: "Next.js App",
  description: "Next.js App",
};
 
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(config, (await headers()).get("cookie"));
 
  return (
    <html lang="en">
      <body className={antic.className}>
        <WagmiProviderComp initialState={initialState}>
          {children}
        </WagmiProviderComp>
      </body>
    </html>
  );
}