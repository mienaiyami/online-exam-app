import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function InstructorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) {
        redirect("/");
    }
    if (!session.user.roles.includes("instructor")) {
        return <div>You are not authorized to access this page</div>;
    }
    return children;
}
