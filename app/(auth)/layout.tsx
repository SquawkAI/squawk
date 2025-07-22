import { ReactNode } from "react";
import Image from "next/image";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-white text-gray-900 font-sans">
            <Navbar />

            {/* HERO */}
            <main
                className="
          flex-grow flex items-start
          pt-14 md:pt-20 lg:pt-24
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
                            src="/auth-graphic.png"
                            alt="Illustration"
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

                    {/* Form block */}
                    <div className="flex-1 space-y-8 text-center lg:text-left order-2 lg:order-1">
                        <h1
                            className="
                font-semibold leading-tight tracking-tight
                text-[clamp(2.25rem,5.5vw,3.75rem)]
                lg:text-7xl xl:text-[3.75rem]
              "
                        >
                            Sign into Squawk
                        </h1>

                        { children }
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}