"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { api } from "@/trpc/react";
import { ExamDetailsForm } from "./components/exam-details-form";
import { QuestionForm } from "./components/question-form";
import type { ExamFormValues, QuestionFormValues } from "./schema";

export default function CreateExamPage() {
    const router = useRouter();
    const [step, setStep] = React.useState<"details" | "questions">("details");
    const [examId, setExamId] = React.useState<number | null>(null);
    const [questions, setQuestions] = React.useState<QuestionFormValues[]>([]);
    const [currentQuestion, setCurrentQuestion] =
        React.useState<QuestionFormValues | null>(null);
    const [examData, setExamData] = React.useState<ExamFormValues | null>(null);

    const createExamMutation = api.exam.create.useMutation({
        onSuccess: (data) => {
            setExamId(data.id);
            setStep("questions");
            toast.success("Exam details saved successfully!");
        },
        onError: (error) => {
            toast.error(`Failed to create exam: ${error.message}`);
        },
    });

    const addQuestionMutation = api.exam.addQuestion.useMutation({
        onSuccess: () => {
            toast.success("Question added successfully!");
            setCurrentQuestion(null);
        },
        onError: (error) => {
            toast.error(`Failed to add question: ${error.message}`);
        },
    });

    const handleExamDetailsSubmit = (data: ExamFormValues) => {
        setExamData(data);
        createExamMutation.mutate(data);
    };

    const handleAddNewQuestion = () => {
        if (!examId) return;

        setCurrentQuestion({
            questionText: "",
            questionType: "multiple_choice",
            points: 1,
            orderIndex: questions.length,
            options: [
                { optionText: "", isCorrect: false, orderIndex: 0 },
                { optionText: "", isCorrect: false, orderIndex: 1 },
            ],
        });
    };

    const handleQuestionSubmit = (data: QuestionFormValues) => {
        console.log({
            data,
            examId,
        });
        if (!examId) return;

        addQuestionMutation.mutate({
            examId,
            ...data,
        });

        setQuestions((prev) => [...prev, data]);
    };

    const handleFinalize = () => {
        if (questions.length === 0) {
            toast.error("Please add at least one question to the exam.");
            return;
        }

        toast.success("Exam created successfully!");
        router.push("/dashboard/exams");
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

            {step === "details" ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Exam Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ExamDetailsForm onSubmit={handleExamDetailsSubmit} />
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {examData?.title} - Questions
                            </h2>
                            <p className="text-muted-foreground">
                                {questions.length} question(s) added
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={handleAddNewQuestion}
                            >
                                Add New Question
                            </Button>
                            <Button onClick={handleFinalize}>
                                Finalize Exam
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {questions.length > 0 && (
                        <div className="space-y-6">
                            {questions.map((question, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border bg-card p-6 shadow-sm"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-medium">
                                            Question {index + 1}:{" "}
                                            {question.questionType}
                                        </h3>
                                        <div className="text-sm text-muted-foreground">
                                            {question.points} point
                                            {question.points !== 1 && "s"}
                                        </div>
                                    </div>
                                    <div className="whitespace-pre-wrap">
                                        {question.questionText}
                                    </div>
                                    {question.questionType ===
                                        "multiple_choice" &&
                                        question.options && (
                                            <div className="mt-4 space-y-2">
                                                <h4 className="text-sm font-medium">
                                                    Options:
                                                </h4>
                                                <ul className="ml-6 list-disc space-y-1">
                                                    {question.options.map(
                                                        (option, optIndex) => (
                                                            <li
                                                                key={optIndex}
                                                                className={
                                                                    option.isCorrect
                                                                        ? "font-semibold text-primary"
                                                                        : ""
                                                                }
                                                            >
                                                                {
                                                                    option.optionText
                                                                }
                                                                {option.isCorrect &&
                                                                    " (Correct)"}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    )}

                    {currentQuestion && (
                        <QuestionForm
                            onSubmit={handleQuestionSubmit}
                            questionIndex={questions.length}
                        />
                    )}

                    {questions.length === 0 && !currentQuestion && (
                        <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                            <h3 className="text-lg font-medium">
                                No Questions Added Yet
                            </h3>
                            <p className="mt-2 text-muted-foreground">
                                {` Click the "Add New Question" button to start
                                creating your exam.`}
                            </p>
                            <Button
                                onClick={handleAddNewQuestion}
                                variant="secondary"
                                className="mt-4"
                            >
                                Add First Question
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
