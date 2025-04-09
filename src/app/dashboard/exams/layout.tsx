import type { ReactNode } from "react";
import Link from "next/link";
import { PlusCircle, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExamsLayoutProps = {
    children: ReactNode;
};

export default function ExamsLayout({ children }: ExamsLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b bg-background">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <h1 className="text-lg font-semibold">Exams</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button asChild variant="default" size="sm">
                            <Link href="/dashboard/exams/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Exam
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 bg-muted/40">{children}</main>
        </div>
    );
}
