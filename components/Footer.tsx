import React from 'react';
import Link from "next/link";

const Footer: React.FC = () => {
    return (
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
    )
}

export default Footer;