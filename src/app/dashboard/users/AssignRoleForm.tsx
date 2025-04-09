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
    const utils = api.useUtils();
    const userRoles = api.user.getCurrentUserRoles.useQuery(undefined, {
        select(data) {
            return data.map((role) => role.role);
        },
    });

    const assignRole = api.user.assignRole.useMutation({
        onSuccess: (data) => {
            router.refresh();
            toast.success(data.message ?? "Role assigned successfully");
            void utils.user.invalidate();
        },
        onError: (error) => {
            toast.error(error.message ?? "Failed to assign role");
        },
    });
    const removeRole = api.user.removeRole.useMutation({
        onSuccess: (data) => {
            router.refresh();
            toast.success("Role removed successfully");
            void utils.user.invalidate();
        },
        onError: (error) => {
            toast.error(error.message ?? "Failed to remove role");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userRoles.data?.includes(selectedRole)) {
            console.log("Removing role");
            removeRole.mutate({
                userId,
                role: selectedRole,
            });
        } else {
            assignRole.mutate({
                userId,
                role: selectedRole,
            });
        }
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
            {userRoles.data?.includes(selectedRole) ? (
                <Button type="submit" disabled={removeRole.isPending}>
                    {removeRole.isPending ? "Removing..." : "Remove Role"}
                </Button>
            ) : (
                <Button type="submit" disabled={assignRole.isPending}>
                    {assignRole.isPending ? "Assigning..." : "Assign Role"}
                </Button>
            )}
        </form>
    );
}
