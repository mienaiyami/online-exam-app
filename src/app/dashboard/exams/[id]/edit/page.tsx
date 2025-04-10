"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamDetailsForm } from "@/app/dashboard/exams/_components/exam-details-form";
import type { ExamFormValues } from "@/app/dashboard/exams/create/schema";

export default function EditExamPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const examId = parseInt(params.id, 10);

    const { data: exam, isLoading } = api.exam.getById.useQuery(
        { examId },
        {
            enabled: !isNaN(examId),
            refetchOnWindowFocus: false,
        },
    );

    const updateExamMutation = api.exam.updateExam.useMutation({
        onSuccess: () => {
            toast.success("Exam updated successfully");
            router.push(`/dashboard/exams/${examId}`);
        },
        onError: (error) => {
            toast.error(`Failed to update exam: ${error.message}`);
        },
    });

    const handleExamSubmit = (data: ExamFormValues) => {
        if (!exam) return;

        updateExamMutation.mutate({
            examId,
            ...data,
        });
    };

    if (isLoading) {
        return (
            <div className="container flex h-96 items-center justify-center">
                <p>Loading exam details...</p>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="container py-10">
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <h2 className="text-xl font-medium">Exam not found</h2>
                    <p className="mt-2 text-muted-foreground">
                        {
                            "The exam you're trying to edit doesn't exist or you don't have access to it."
                        }
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard/exams">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Exams
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const defaultValues: ExamFormValues = {
        title: exam.title,
        description: exam.description ?? "",
        timeLimit: exam.timeLimit,
        availableFrom: exam.availableFrom ?? undefined,
        availableTo: exam.availableTo ?? undefined,
    };

    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-6 flex items-center">
                <Button asChild variant="ghost" size="sm" className="mr-4">
                    <Link href={`/dashboard/exams/${examId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Exam
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Edit Exam
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Update the details for {exam.title}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Exam Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <ExamDetailsForm
                        onSubmit={handleExamSubmit}
                        defaultValues={defaultValues}
                        submitLabel="Update Exam"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
