"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function NotFound() {
    const router = useRouter();
    return (
        <div className="grid place-items-center pt-20">
            <h1 className="text-4xl font-bold tracking-tight">404</h1>
            <p className="text-xl text-muted-foreground">
                {`The page you're looking for doesn't exist.`}
            </p>
            <Button className="mt-4 w-32" onClick={() => router.back()}>
                Back
            </Button>
            <Button asChild className="mt-4 w-32">
                <Link href="/">Home</Link>
            </Button>
        </div>
    );
}
