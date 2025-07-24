"use client";

import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem,
    FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { SignInWithGoogleButton } from "@/components/SignInWithGoogleButton";

/* ─────── Schema ─────── */
const signUpFormSchema = z.object({
    email: z.email("Enter a valid email").trim(),
    password: z.string().min(8, "Min 8 characters").trim(),
});

export default function SignIn() {
    const form = useForm<z.infer<typeof signUpFormSchema>>({
        resolver: zodResolver(signUpFormSchema),
        defaultValues: { email: "", password: "" },
    });

    function onSubmit(values: z.infer<typeof signUpFormSchema>) {
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
                Sign up for free
            </h1>

            <SignInWithGoogleButton />

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
                        Sign Up
                    </Button>

                    {/* Links */}
                    <div className="flex flex-col sm:flex-row justify-between text-sm">
                        <span className="mt-2 sm:mt-0">
                            Already have an account?
                            <Link href="/signin" className="text-blue-600 hover:underline px-1">
                                Sign In
                            </Link>
                        </span>
                    </div>
                </form>
            </Form>
        </div>
    );
}
