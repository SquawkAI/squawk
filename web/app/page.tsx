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
              Empower Your Teaching with AI.
            </h1>

            <p
              className="
                mx-auto lg:mx-0
                text-slate-700
                text-[clamp(1.0625rem,3.5vw,1.5rem)]
              "
            >
              Squawk turns your lectures, notes, and course materials into an
              AI-powered teaching assistant — helping students get answers faster
              while freeing you to focus on teaching.
            </p>

            <div className="flex justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/projects">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* DEMO SECTION */}
      <section id="product" className="w-full bg-white px-6 sm:px-8 md:px-10 lg:px-16 xl:px-24 py-24">
        <div className="max-w-6xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900">
            See How Squawk Supports Your Students
          </h2>
          <p className="mt-5 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how Squawk transforms your course materials into an
            on-demand AI assistant, helping students review concepts, find answers,
            and stay engaged — without adding extra work for you.
          </p>

          {/* Video */}
          <div className="mt-12 relative w-full max-w-6xl mx-auto aspect-video rounded-xl overflow-hidden shadow-xl border border-gray-200">
            <video
              src="/demo.mp4"
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
            />
          </div>
        </div>
      </section>

      <section className="w-full bg-white px-6 sm:px-8 md:px-10 lg:px-16 xl:px-24 py-28">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900">
              Turn Your Content Into Conversations
            </h2>
            <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
              Upload documents, slides, images, and videos. Squawk builds an assistant that answers
              questions using your materials—securely and accurately.
            </p>
          </div>

          {/* Rows */}
          <div className="mt-24 space-y-40"> {/* increased spacing between rows */}
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              {/* more gap between media & text */}
              <div>
                <Image
                  src="/files.png"
                  alt="Custom Content Integration Demo"
                  width={960}
                  height={700}
                  className="w-full h-auto rounded-xl border border-gray-200 shadow-sm"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-4xl font-semibold text-gray-900">
                  Custom Content Integration
                </h3>
                <p className="mt-5 text-gray-600 text-lg">
                  Upload your own lectures, PDFs, and media. Squawk creates a private knowledge base
                  tailored to your course.
                </p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1 text-center md:text-left">
                <h3 className="text-4xl font-semibold text-gray-900">
                  Natural Conversations
                </h3>
                <p className="mt-5 text-gray-600 text-lg">
                  Students ask questions in plain English. Squawk responds with citations from your content.
                </p>
              </div>
              <div className="order-1 md:order-2">
                <Image
                  src="/conversation.png"
                  alt="Natural Conversation Demo"
                  width={960}
                  height={700}
                  className="w-full h-auto rounded-xl border border-gray-200 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              {/* more gap between media & text */}
              <div>
                <Image
                  src="/share.png"
                  alt="Custom Content Integration Demo"
                  width={960}
                  height={700}
                  className="w-full h-auto rounded-xl border border-gray-200 shadow-sm"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-4xl font-semibold text-gray-900">
                  Effortless Integration
                </h3>
                <p className="mt-5 text-gray-600 text-lg">
                  Share a link or embed the assistant in your LMS or site—no complex setup required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how_it_works" className="w-full bg-white px-6 sm:px-8 md:px-10 lg:px-16 xl:px-24 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              We do the heavy lifting so you don’t have to.
            </p>
          </div>

          {/* Steps */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-full h-56 sm:h-64 rounded-3xl flex items-center justify-center text-gray-500">
                <Image
                  src="/upload.png"
                  alt="Upload Demo"
                  width={960}
                  height={500}
                  className="w-full h-auto rounded-xl border border-gray-200 shadow-sm"
                />
              </div>
              <h3 className="mt-8 text-2xl sm:text-3xl font-semibold text-gray-900">
                Upload Your Content
              </h3>
              <p className="mt-3 text-gray-600">
                Add lectures, PDFs, slides, and videos. We process and organize everything automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-full h-56 sm:h-64 rounded-3xl flex items-center justify-center ">
                <Image
                  src="/processing.png"
                  alt="Processing Demo"
                  width={960}
                  height={500}
                  className="w-full h-auto rounded-xl border border-gray-200 shadow-sm"
                />
              </div>
              <h3 className="mt-8 text-2xl sm:text-3xl font-semibold text-gray-900">
                Let Us Build Your Agent
              </h3>
              <p className="mt-3 text-gray-600">
                Squawk turns your materials into a smart assistant that answers with context.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-full h-56 sm:h-64 rounded-3xl flex items-center justify-center text-gray-500">
                <Image
                  src="/share.png"
                  alt="Processing Demo"
                  width={960}
                  height={500}
                  className="w-full h-auto rounded-xl border border-gray-200 shadow-sm"
                />
              </div>
              <h3 className="mt-8 text-2xl sm:text-3xl font-semibold text-gray-900">
                Add It To Your Site
              </h3>
              <p className="mt-3 text-gray-600">
                Copy a link or embed in your LMS or website—no coding required.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="w-full bg-white px-6 sm:px-8 md:px-10 lg:px-16 xl:px-24 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900">
              Secure By Design
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Your content and student interactions are protected with industry-standard encryption
              at rest and in transit. Squawk is built with privacy and security at the core.
            </p>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Card 1 */}
            <div className="text-center md:text-left">
              <div className="w-full flex justify-center">
                <div className="w-16 h-16 mx-auto md:mx-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 text-2xl font-bold">
                  🔒
                </div>
              </div>
              <h3 className="mt-6 text-center text-xl font-semibold text-gray-900">
                End-to-End Encryption
              </h3>
              <p className="mt-3 text-center text-gray-600">
                All documents and conversations are encrypted in transit (TLS) and at rest (AES-256).
              </p>
            </div>

            {/* Card 2 */}
            <div className="text-center md:text-left">
              <div className="w-full flex justify-center">
                <div className="w-16 h-16 mx-auto md:mx-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 text-2xl font-bold">
                  🛡️
                </div>
              </div>
              <h3 className="mt-6 text-center text-xl font-semibold text-gray-900">
                Private & Controlled Access
              </h3>
              <p className="mt-3 text-center text-gray-600">
                Only you and your students can access your assistant. Data is never shared or used
                to train external models.
              </p>
            </div>

            {/* Card 3 */}
            <div className="text-center md:text-left ">
              <div className="w-full flex justify-center">
                <div className="w-16 h-16 mx-auto md:mx-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 text-2xl font-bold">
                  ✅
                </div>
              </div>
              <h3 className="mt-6 text-xl text-center font-semibold text-gray-900">
                FERPA & GDPR Ready
              </h3>
              <p className="mt-3 text-center text-gray-600">
                Squawk follows strict compliance practices to protect student data and meet
                educational privacy requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
