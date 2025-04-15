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

    return children;
}
