import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { connection } from "next/server";
import SidebarLayout from "./components/SidebarLayout";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/ui/Toast";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Freelancer Invoice Manager",
  description: "Manage your clients, services, and invoices easily",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <ToastProvider>
            <SidebarLayout>{children}</SidebarLayout>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
