import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-white text-black">
      {/* Navbar */}
      <header className="w-full border-b py-6 px-6 md:px-12">
        <div className="mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/squawk-logo-large.png"
              alt="SquawkAI Logo"
              width={200}
              height={200}
              priority
            />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-base font-medium">
            <Link href="/product" className="hover:text-blue-600">Product</Link>
            <Link href="/how-it-works" className="hover:text-blue-600">How It Works</Link>
            <Link href="/pricing" className="hover:text-blue-600">Pricing</Link>
            <Link href="/security" className="hover:text-blue-600">Security</Link>
            <Link href="/blog" className="hover:text-blue-600">Blog</Link>

            <Button asChild>
              <Link href="/get-started">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

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

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-12 text-center text-sm text-slate-500 border-t">
        <div className="mx-auto space-y-2">
          <p>© {new Date().getFullYear()} SquawkAI. All rights reserved.</p>
          <div className="flex justify-center gap-4">
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
