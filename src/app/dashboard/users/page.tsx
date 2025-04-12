import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { UserSearch } from "./_components/user-search";

export default async function UsersPage() {
    const session = await auth();
    if (!session?.user.roles.includes("admin")) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">User Management</h1>
            <UserSearch />
        </div>
    );
}
