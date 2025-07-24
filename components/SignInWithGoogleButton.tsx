"use client";

import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

interface Props {
    onClick?: () => void
}

const SignInWithGoogleButton: React.FC<Props> = ({ onClick }) => {
    return (
        <Button
            variant="outline"
            size={'lg'}
            className="w-full flex items-center gap-2"
            onClick={onClick}
        >
            <FcGoogle className="text-xl" />
            Sign in with Google
        </Button>
    );
}

export default SignInWithGoogleButton;