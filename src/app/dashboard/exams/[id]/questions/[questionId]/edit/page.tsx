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
import type { QuestionFormValues } from "@/app/dashboard/exams/_hooks/schema";
import { useUpdateQuestion } from "@/app/dashboard/exams/_hooks/update-question";

export default function EditQuestionPage() {
    const router = useRouter();
    const params = useParams<{ id: string; questionId: string }>();
    const examId = parseInt(params.id, 10);
    const questionId = parseInt(params.questionId, 10);

    const [isLoading, setIsLoading] = React.useState(true);
    const [question, setQuestion] = React.useState<QuestionFormValues | null>(
        null,
    );

    const { data: exam, isLoading: isExamLoading } = api.exam.getById.useQuery(
        { examId },
        {
            enabled: !isNaN(examId),
            refetchOnWindowFocus: false,
        },
    );

    const { mutate: updateQuestion } = useUpdateQuestion(() => {
        router.push(`/dashboard/exams/${examId}`);
    });

    React.useEffect(() => {
        if (exam && !isExamLoading) {
            const foundQuestion = exam.questions.find(
                (q) => q.id === questionId,
            );
            if (foundQuestion) {
                const formattedQuestion: QuestionFormValues = {
                    questionText: foundQuestion.questionText,
                    questionType: foundQuestion.questionType,
                    points: foundQuestion.points,
                    orderIndex: foundQuestion.orderIndex,
                    options:
                        foundQuestion.questionType === "multiple_choice"
                            ? foundQuestion.options.map((opt) => ({
                                  optionText: opt.optionText,
                                  isCorrect: opt.isCorrect,
                                  orderIndex: opt.orderIndex,
                                  tempId: opt.id.toString(),
                              }))
                            : undefined,
                };
                setQuestion(formattedQuestion);
            }
            setIsLoading(false);
        }
    }, [exam, questionId, isExamLoading]);

    const handleQuestionSubmit = (data: QuestionFormValues) => {
        updateQuestion({
            questionId,
            ...data,
        });
    };

    if (isExamLoading || isLoading) {
        return (
            <div className="container flex h-96 items-center justify-center">
                <p>Loading question details...</p>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="container py-10">
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <h2 className="text-xl font-medium">Exam not found</h2>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard/exams">Back to Exams</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="container py-10">
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <h2 className="text-xl font-medium">Question not found</h2>
                    <Button asChild className="mt-4">
                        <Link href={`/dashboard/exams/${examId}`}>
                            Back to Exam
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-10">
            <div className="mb-6 flex items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Edit Question
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
                        defaultValues={question}
                        questionIndex={exam.questions.findIndex(
                            (q) => q.id === questionId,
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
