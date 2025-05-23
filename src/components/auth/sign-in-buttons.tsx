"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github, User } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/input";

export function SignInButton() {
    return (
        <>
            {/* <Button
                onClick={() => signIn("github", { redirectTo: "/dashboard" })}
                className="flex items-center gap-2"
            >
                <Github className="h-5 w-5" />
                Sign in with GitHub
            </Button>
            <Button
                onClick={() => signIn("google", { redirectTo: "/dashboard" })}
                className="flex items-center gap-2"
            >
                <svg
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 128 128"
                >
                    <path
                        fill="currentColor"
                        d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.33 74.33 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.16 36.16 0 0 1-13.93 5.5a41.29 41.29 0 0 1-15.1 0A37.16 37.16 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.31 38.31 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.28 34.28 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.22 61.22 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38"
                    />
                </svg>
                Sign in with Google
            </Button> */}
            <Button
                onClick={() => signIn(undefined, { redirectTo: "/dashboard" })}
                className="flex items-center gap-2"
            >
                <User className="h-5 w-5" />
                Sign in
            </Button>
        </>
    );
}
