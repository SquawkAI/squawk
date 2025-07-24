"use client";

import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export function SignInWithGoogleButton() {
    return (
        <Button
            variant="outline"
            size={'lg'}
            className="w-full flex items-center gap-2"
        >
            <FcGoogle className="text-xl" />
            Sign in with Google
        </Button>
    );
}
