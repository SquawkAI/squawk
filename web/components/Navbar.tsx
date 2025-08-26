import React from 'react';
import Image from 'next/image';
import Link from "next/link";

import { Button } from "@/components/ui/button";

const Navbar: React.FC = () => {
    return (
        <header className="w-full border-b shrink-0 p-6 md:px-12">
            <div className="mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <Image
                            src="/squawk-logo-large.png"
                            alt="SquawkAI Logo"
                            priority
                            width={200}
                            height={200}
                            sizes="
                                (min-width: 1280px) 200px,
                                (min-width: 768px) 160px,
                                120px
                            "
                            className="w-[120px] md:w-[160px] xl:w-[200px] h-auto"
                        />
                    </Link>
                </div>

                <nav className="hidden lg:flex items-center gap-8 text-base font-medium">
                    <Link href="/#product" className="hover:text-blue-600">Product</Link>
                    <Link href="/#how_it_works" className="hover:text-blue-600">How It Works</Link>
                    {/* <Link href="/pricing" className="hover:text-blue-600">Pricing</Link> */}
                    <Link href="/#security" className="hover:text-blue-600">Security</Link>
                    {/* <Link href="/blog" className="hover:text-blue-600">Blog</Link> */}

                    <Button asChild>
                        <Link href="/projects">Sign In</Link>
                    </Button>
                </nav>
            </div>
        </header>
    )
}

export default Navbar;