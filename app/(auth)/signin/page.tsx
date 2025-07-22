"use client";

import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem,
    FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/* ─────── Schema ─────── */
const schema = z.object({
    email: z.string().email("Enter a valid email").trim(),
    password: z.string().min(8, "Min 8 characters").trim(),
});

export default function SignIn() {
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((v) => console.log(v))}
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
    );
}
