import type { Metadata } from "next";
import MainNavigation from "../components/MainNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComplianceFlow",
  description: "ComplianceFlow application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={bodyStyle}>
        <MainNavigation />

        <div style={contentStyle}>{children}</div>
      </body>
    </html>
  );
}

const bodyStyle = {
  margin: 0,
  backgroundColor: "#f9fafb",
};

const contentStyle = {
  minHeight: "100vh",
  marginLeft: "240px",
};
