"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 font-sans">
      <Navbar />

      {/* HERO */}
      <main
        className="
          flex-grow flex items-start
          pt-14 md:pt-20 lg:pt-24
          pb-12 md:pb-16 lg:pb-20
          px-6 sm:px-8 md:px-10 lg:px-16 xl:px-24
        "
      >
        <div
          className="
            w-full max-w-screen-2xl mx-auto
            flex flex-col lg:flex-row
            items-center lg:items-start
            justify-between
            gap-8 sm:gap-12 md:gap-14 lg:gap-24 xl:gap-32
          "
        >
          {/* Illustration */}
          <div className="flex-1 flex justify-center lg:justify-end order-1 lg:order-2">
            <Image
              src="/Hero Image.svg"
              alt="AI Chat Assistant Illustration"
              priority
              width={960}
              height={700}
              className="
                w-full h-auto
                max-w-[20rem] sm:max-w-[24rem] md:max-w-[28rem]
                lg:max-w-[32rem] xl:max-w-[40rem]
              "
            />
          </div>

          {/* Copy block */}
          <div
            className="
              flex-1 space-y-6 text-center lg:text-left
              order-2 lg:order-1
              max-w-none lg:max-w-none           
            "
          >
            <h1
              className="
                font-semibold leading-tight tracking-tight
                text-[clamp(2rem,4.5vw,5.5rem)]    
                mx-auto lg:mx-0
                w-full
              "
            >
              Turn content into conversation.
            </h1>

            <p
              className="
                mx-auto lg:mx-0
                text-slate-700
                text-[clamp(1.0625rem,3.5vw,1.5rem)]
              "
            >
              A simple, secure way to turn your content into an always-available assistant.
            </p>

            <div className="flex justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/projects">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
