"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AssignRoleForm } from "./assign-role-form";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2, Search, UserIcon, X, Filter } from "lucide-react";
import { type RouterOutputs } from "@/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type User = RouterOutputs["user"]["search"][number];

type UserCardProps = {
    user: User;
};

function UserCard({ user }: UserCardProps) {
    return (
        <Card className="w-full">
            <CardContent className="flex h-full flex-col justify-between gap-2 p-4">
                <div className="flex items-center gap-2">
                    {user.image ? (
                        <Avatar>
                            <AvatarImage src={user.image} />
                            <AvatarFallback>
                                <UserIcon className="h-8 w-8 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <UserIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    <span className="font-medium">{user.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                    {user.email}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                        <Badge
                            key={`${user.id}-${role}`}
                            variant="secondary"
                            className="text-xs"
                        >
                            {role}
                        </Badge>
                    ))}
                </div>
                <AssignRoleForm userId={user.id} />
            </CardContent>
        </Card>
    );
}

export function UserSearch() {
    const [query, setQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<
        "admin" | "instructor" | "student" | "all"
    >("all");
    const debouncedQuery = useDebounce(query, 500);

    const {
        data: users,
        isLoading,
        error,
    } = api.user.search.useQuery(
        {
            query: debouncedQuery,
            role: selectedRole,
        },
        {
            enabled: debouncedQuery.length > 0 || selectedRole !== undefined,
        },
    );

    const handleRoleChange = (value: string) => {
        if (value === "") {
            setSelectedRole("all");
        } else {
            setSelectedRole(value as "admin" | "instructor" | "student");
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center">
                    <Input
                        type="text"
                        placeholder="Search users by email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="max-w-sm"
                        ref={(node) => {
                            if (node) {
                                node.focus();
                            }
                        }}
                    />
                    {query && (
                        <Button
                            variant="ghost"
                            className="relative right-8 size-8"
                            onClick={() => setQuery("")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                        value={selectedRole}
                        onValueChange={handleRoleChange}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="instructor">
                                Instructor
                            </SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading && (
                <Card className="mt-4">
                    <CardContent className="flex items-center justify-center p-6">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                            Loading users...
                        </span>
                    </CardContent>
                </Card>
            )}

            {!isLoading && users?.length === 0 && (query || selectedRole) && (
                <Card>
                    <CardContent className="select-none p-6 text-center text-sm text-muted-foreground">
                        No users found
                        {` matching "${query}"`}
                        {selectedRole && ` with role "${selectedRole}"`}
                    </CardContent>
                </Card>
            )}

            {error && (
                <Card>
                    <CardContent className="select-none p-6 text-center text-sm text-muted-foreground">
                        Error loading users
                    </CardContent>
                </Card>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
                {users?.map((user) => <UserCard key={user.id} user={user} />)}
            </div>
        </div>
    );
}
