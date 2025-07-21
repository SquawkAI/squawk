import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-white text-black">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow w-full px-6 py-16 md:px-12 flex items-center">
        <div className="mx-auto w-full flex flex-col md:flex-row gap-12 items-center justify-evenly">
          {/* Left */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-8xl font-semibold leading-tight text-balance">
              Turn content into <br className="hidden sm:inline" /> conversation.
            </h1>
            <p className="text-2xl text-slate-600 mx-auto md:mx-0 px-4">
              The simple, secure way to turn your content into a 24/7 interactive assistant.
            </p>
            <div className="flex justify-center md:justify-start px-4">
              <Button size="lg" asChild>
                <Link href="/get-started">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Right */}
          <div className="hidden md:flex justify-center">
            <Image
              src="/og-image.png"
              alt="AI Chat Assistant Illustration"
              width={800}
              height={500}
              className="max-w-full h-auto"
              priority
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
