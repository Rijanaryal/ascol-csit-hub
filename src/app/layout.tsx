import type { Metadata } from "next";
import InitialSkeleton from "./components/InitialSkeleton";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASCOL CSIT HUB | Learn, share, grow",
  description:
    "A student-led academic hub for BSc CSIT students at Amrit Science Campus, Kathmandu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <InitialSkeleton />
        {children}
      </body>
    </html>
  );
}