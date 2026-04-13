import "./globals.css";
import PWARegistration from "@/components/PWARegistration";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata = {
  title: "Lini HRIS - Enterprise Edition",
  description: "Modern HRIS Web Application for Enterprise Management",
  manifest: "/manifest.json",
  themeColor: "#00AEEF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lini HRIS",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
