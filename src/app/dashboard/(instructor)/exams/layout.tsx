import type { ReactNode } from "react";
import ExamHeader from "./_components/header";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

type ExamsLayoutProps = {
    children: ReactNode;
};

export default async function ExamsLayout({ children }: ExamsLayoutProps) {
    const session = await auth();
    if (!session) {
        redirect("/");
    }
    if (
        !session.user.roles.includes("instructor") ||
        !session.user.roles.includes("admin")
    ) {
        return <div>You are not authorized to access this page</div>;
    }
    return (
        <div className="flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-background">
                <ExamHeader />
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}
