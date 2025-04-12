import type { ReactNode } from "react";
import ExamHeader from "./_components/header";

type ExamsLayoutProps = {
    children: ReactNode;
};

export default async function ExamsLayout({ children }: ExamsLayoutProps) {
    return (
        <div className="flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-background">
                <ExamHeader />
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}
