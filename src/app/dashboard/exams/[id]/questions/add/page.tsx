"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionForm } from "@/app/dashboard/exams/_components/question-form";
import type { QuestionFormValues } from "@/app/dashboard/exams/create/schema";

export default function AddQuestionPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const examId = parseInt(params.id, 10);

    const { data: exam, isLoading: isExamLoading } = api.exam.getById.useQuery(
        { examId },
        {
            enabled: !isNaN(examId),
            refetchOnWindowFocus: false,
        },
    );

    const addQuestionMutation = api.exam.addQuestion.useMutation({
        onSuccess: () => {
            toast.success("Question added successfully");
            router.push(`/dashboard/exams/${examId}`);
        },
        onError: (error) => {
            toast.error(`Failed to add question: ${error.message}`);
        },
    });

    const handleQuestionSubmit = (data: QuestionFormValues) => {
        if (!exam) return;

        addQuestionMutation.mutate({
            examId,
            ...data,
        });
    };

    if (isExamLoading) {
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
                            "The exam you're trying to add a question to doesn't exist or you don't have access to it."
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

    const defaultValues: QuestionFormValues = {
        questionText: "",
        questionType: "multiple_choice",
        points: 1,
        orderIndex: exam.questions.length,
        options: [
            { optionText: "", isCorrect: false, orderIndex: 0 },
            { optionText: "", isCorrect: false, orderIndex: 1 },
        ],
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
                        Add New Question
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Exam: {exam.title}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Question Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <QuestionForm
                        onSubmit={handleQuestionSubmit}
                        defaultValues={defaultValues}
                        questionIndex={exam.questions.length}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
