import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) {
        redirect("/");
    }
    if (!session.user.roles.includes("admin")) {
        return <div>You are not authorized to access this page</div>;
    }

    return children;
}
