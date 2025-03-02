"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

export function AssignRoleForm({ userId }: { userId: string }) {
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "instructor" | "student"
  >("student");
  const router = useRouter();

  const assignRole = api.user.assignRole.useMutation({
    onSuccess: () => {
      router.refresh();
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <select
        value={selectedRole}
        onChange={(e) =>
          setSelectedRole(e.target.value as "admin" | "instructor" | "student")
        }
        className="rounded-md border border-gray-300 px-3 py-2"
      >
        <option value="student">Student</option>
        <option value="instructor">Instructor</option>
        <option value="admin">Admin</option>
      </select>

      <Button type="submit" disabled={assignRole.isPending}>
        {assignRole.isPending ? "Assigning..." : "Assign Role"}
      </Button>
    </form>
  );
}
