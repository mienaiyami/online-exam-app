"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AssignRoleForm } from "./assign-role-form";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2, Search, UserIcon, X } from "lucide-react";
import { type RouterOutputs } from "@/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type User = RouterOutputs["user"]["search"][number];

type UserCardProps = {
    user: User;
};

function UserCard({ user }: UserCardProps) {
    return (
        <Card className="w-80">
            <CardContent className="flex flex-col gap-2 p-4">
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
                            key={`${user.id}-${role.role}`}
                            variant="secondary"
                            className="text-xs"
                        >
                            {role.role}
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
    const debouncedQuery = useDebounce(query, 500);

    const { data: users, isLoading } = api.user.search.useQuery(
        { query: debouncedQuery },
        {
            enabled: debouncedQuery.length > 0,
        },
    );

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center">
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
                {isLoading && (
                    <Loader2 className="relative right-4 size-8 animate-spin" />
                )}
            </div>

            {!isLoading && users?.length === 0 && query && (
                <Card>
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        No users found matching &quot;{query}&quot;
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {users?.map((user) => <UserCard key={user.id} user={user} />)}
            </div>
        </div>
    );
}
