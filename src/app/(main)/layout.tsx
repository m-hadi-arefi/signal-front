import { Navbar } from "@/components/layout/Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08080f]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-8">
        {children}
      </main>
    </div>
  );
}
