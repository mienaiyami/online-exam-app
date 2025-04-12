"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
    return (
        <Button
            onClick={() => signOut({ redirectTo: "/" })}
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-2"
        >
            <LogOut className="h-4 w-4" />
            Sign out
        </Button>
    );
}
