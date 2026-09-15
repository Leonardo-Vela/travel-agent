import "./globals.css";

export const metadata = {
  title: "Travel Agent API",
  description: "Next.js + Vercel deployment for travel-agent"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
