"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function AssignRoleForm({ userId }: { userId: string }) {
    const [selectedRole, setSelectedRole] = useState<
        "admin" | "instructor" | "student"
    >("student");
    const router = useRouter();

    const assignRole = api.user.assignRole.useMutation({
        onSuccess: () => {
            router.refresh();
            toast.success("Role assigned successfully");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        assignRole.mutate({
            userId,
            role: selectedRole,
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row"
        >
            <Select
                value={selectedRole}
                onValueChange={(e) => setSelectedRole(e as typeof selectedRole)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select a Role"></SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                </SelectContent>
            </Select>

            <Button type="submit" disabled={assignRole.isPending}>
                {assignRole.isPending ? "Assigning..." : "Assign Role"}
            </Button>
        </form>
    );
}
