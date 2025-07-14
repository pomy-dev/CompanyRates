import { Geist, Geist_Mono } from "next/font/google";
import "./styles/globals.css";
import { DataProvider } from "./data-context";
import GlobalContextProvider from "../app-context/global-provider";
import ErrorBoundary from "./components/ui/error-boundary";
import { NotificationProvider } from "./components/ui/notification";
import { Toaster } from "./components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Rating App",
  description: "This app is for rating and suggestion for businesses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <GlobalContextProvider>
        <DataProvider>
          <NotificationProvider>
            <body
              className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
              <Toaster />
            </body>
          </NotificationProvider>
        </DataProvider>
      </GlobalContextProvider>
    </html>
  );
}
