import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import SidebarLayout from "./components/SidebarLayout";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          <SidebarLayout>{children}</SidebarLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
