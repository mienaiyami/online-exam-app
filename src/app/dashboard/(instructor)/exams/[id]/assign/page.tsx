"use client";

import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { api } from "@/trpc/react";
import { StudentSearch } from "./_components/student-search";
import { BulkAssign } from "./_components/bulk-assign";

export default function AssignExamPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const examId = Number(params.id);

    const { data: exam } = api.exam.getById.useQuery(
        { examId },
        {
            enabled: !!examId,
        },
    );

    return (
        <div className="container py-8">
            <div className="mb-8 flex items-center gap-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Assign Exam
                    </h1>
                    {exam && (
                        <p className="text-muted-foreground">
                            {exam.title} (ID: {examId})
                        </p>
                    )}
                </div>
            </div>

            <Tabs defaultValue="search" className="w-full">
                <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="search">Search Students</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Assign</TabsTrigger>
                </TabsList>
                <TabsContent value="search">
                    <StudentSearch examId={examId} />
                </TabsContent>
                <TabsContent value="bulk">
                    <BulkAssign examId={examId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
