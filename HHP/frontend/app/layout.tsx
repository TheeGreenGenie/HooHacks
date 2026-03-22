import "./assets/css/main.css";
import type { Metadata } from "next";
import Navigation from "./components/Navigation";
import Notification from "./components/Notification";
import ReduxProvider from "./lib/reduxProvider";
import Footer from "./components/Footer";
import WesternBackground from "./components/WesternBackground";
import { UserProvider } from "@auth0/nextjs-auth0/client";

export const metadata: Metadata = {
  title: "Frontier Finance",
  description: "AI-powered personal finance for the frontier",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <ReduxProvider>
            <WesternBackground />
            <Navigation />
            <main style={{ position: "relative", zIndex: 0 }}>
              {children}
            </main>
            <Notification />
            <Footer />
          </ReduxProvider>
        </UserProvider>
      </body>
    </html>
  );
}
