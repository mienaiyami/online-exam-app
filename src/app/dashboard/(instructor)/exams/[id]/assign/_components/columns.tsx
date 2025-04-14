"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export type Student = {
    id: string;
    name: string | null;
    email: string;
    roles: {
        userId: string;
        role: "admin" | "instructor" | "student";
    }[];
    selected?: boolean;
};

export const columns: ColumnDef<Student>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                <ArrowUpDown />
                Name
            </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("name") || "Unnamed"}</div>,
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                <ArrowUpDown />
                Email
            </Button>
        ),
        cell: ({ row }) => (
            <div className="lowercase">{row.getValue("email")}</div>
        ),
    },
    {
        id: "roles",
        header: "Roles",
        cell: ({ row }) => {
            const student = row.original;
            return (
                <div className="flex gap-1">
                    {student.roles.map((role) => (
                        <Badge
                            key={role.userId}
                            variant="secondary"
                            className="capitalize"
                        >
                            {role.role}
                        </Badge>
                    ))}
                </div>
            );
        },
    },
];
