import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin?callbackUrl=/exam");
    }

    return (
        <div className="min-h-screen">
            <main>{children}</main>
        </div>
    );
}
