"use client";

import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem,
    FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import SignInWithGoogleButton from "@/components/SignInWithGoogleButton";

/* ─────── Schema ─────── */
const signInFormSchema = z.object({
    email: z.string().email("Enter a valid email").trim(),
    password: z.string()
});

export default function SignIn() {
    const form = useForm<z.infer<typeof signInFormSchema>>({
        resolver: zodResolver(signInFormSchema),
        defaultValues: { email: "", password: "" },
    });

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/dashboard" })
    }
    
    function onSubmit(values: z.infer<typeof signInFormSchema>) {
        console.log(values)
    }

    return (
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

            <SignInWithGoogleButton onClick={handleGoogleSignIn} />

            {/* ——— Form ——— */}
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit((v) => onSubmit(v))}
                    className="space-y-6 px-2"
                >
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="johndoe@gmail.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full font-bold">
                        Sign In
                    </Button>

                    {/* Links */}
                    <div className="flex flex-col sm:flex-row justify-between text-sm">
                        <Link href="/forgotpassword" className="text-blue-600 hover:underline">
                            Forgot password?
                        </Link>
                        <span className="mt-2 sm:mt-0">
                            Don’t have an account?
                            <Link href="/signup" className="text-blue-600 hover:underline px-1">
                                Sign Up
                            </Link>
                        </span>
                    </div>
                </form>
            </Form>
        </div>
    );
}
