"use client";

import * as React from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { api } from "@/trpc/react";
import { ExamDetailsForm } from "../_components/exam-details-form";
import type { ExamFormValues } from "../_hooks/schema";
import { useRouter } from "next/navigation";

export default function CreateExamPage() {
    const utils = api.useUtils();
    const router = useRouter();
    const createExamMutation = api.exam.create.useMutation({
        onSuccess: (data) => {
            router.push(`/dashboard/exams/${data.id}`);
            void utils.exam.invalidate();
            toast.success("Exam details saved successfully!");
        },
        onError: (error) => {
            toast.error(`Failed to create exam: ${error.message}`);
        },
    });

    const handleExamDetailsSubmit = (data: ExamFormValues) => {
        createExamMutation.mutate(data);
    };

    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Create New Exam
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Create a new exam and add questions for your students.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Exam Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <ExamDetailsForm onSubmit={handleExamDetailsSubmit} />
                </CardContent>
            </Card>
        </div>
    );
}
