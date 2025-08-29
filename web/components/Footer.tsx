import React from 'react';
import Link from "next/link";

const Footer: React.FC = () => {
    return (
        <footer className="w-full border-t border-border">
            <div className="mx-auto py-4 px-6 md:px-12">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SquawkAI. All rights reserved.</p>
                    <div className="flex justify-center gap-4">
                        <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
                        <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
                        <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;