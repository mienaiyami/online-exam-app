"use client";
import Link from "next/link";
import { PlusCircle, FileText, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
export default function ExamHeader() {
    const pathname = usePathname();
    const isEditing =
        /\/exams\/\d+\/edit$/.exec(pathname) ||
        /\/exams\/\d+\/questions\/\d+\/edit$/.exec(pathname);
    const isAddingQuestion = /\/exams\/\d+\/questions\/add$/.exec(pathname);
    return (
        <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h1 className="text-lg font-semibold">Exams</h1>
            </div>
            <div className="flex items-center gap-4">
                {/\/exams\/\d+$/.exec(pathname) && (
                    <Button asChild variant="ghost" size="sm" className="">
                        <Link href={`/dashboard/exams`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Exams
                        </Link>
                    </Button>
                )}
                {isEditing && (
                    <Button asChild variant="ghost" size="sm" className="">
                        <Link
                            href={pathname.includes("question") ? "../.." : "."}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Exam
                        </Link>
                    </Button>
                )}
                {isAddingQuestion && (
                    <Button asChild variant="ghost" size="sm" className="">
                        <Link href={`..`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Exam
                        </Link>
                    </Button>
                )}
                {pathname.endsWith("/exams") && (
                    <Button asChild variant="default" size="sm">
                        <Link href="/dashboard/exams/create">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Exam
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
