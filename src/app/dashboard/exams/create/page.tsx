"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { api } from "@/trpc/react";
import { ExamDetailsForm } from "../_components/exam-details-form";
import { QuestionForm } from "../_components/question-form";
import type { ExamFormValues, QuestionFormValues } from "./schema";

type QuestionWithId = QuestionFormValues & { id?: number };

export default function CreateExamPage() {
    const router = useRouter();
    const [step, setStep] = React.useState<"details" | "questions">("details");
    const [examId, setExamId] = React.useState<number | null>(null);
    const [questions, setQuestions] = React.useState<QuestionWithId[]>([]);
    const [currentQuestion, setCurrentQuestion] =
        React.useState<QuestionWithId | null>(null);
    const [examData, setExamData] = React.useState<ExamFormValues | null>(null);
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [deletingIndex, setDeletingIndex] = React.useState<number | null>(
        null,
    );

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
        onSuccess: (data) => {
            toast.success("Question added successfully!");

            setQuestions((prev) =>
                prev.map((q, index) =>
                    index === prev.length - 1 ? { ...q, id: data.id } : q,
                ),
            );

            setCurrentQuestion(null);
        },
        onError: (error) => {
            toast.error(`Failed to add question: ${error.message}`);
        },
    });

    const updateQuestionMutation = api.exam.updateQuestion.useMutation({
        onSuccess: () => {
            toast.success("Question updated successfully!");
            setEditingIndex(null);
            setCurrentQuestion(null);
        },
        onError: (error) => {
            toast.error(`Failed to update question: ${error.message}`);
        },
    });

    const deleteQuestionMutation = api.exam.deleteQuestion.useMutation({
        onSuccess: () => {
            toast.success("Question deleted successfully!");

            if (deletingIndex !== null) {
                setQuestions((prev) =>
                    prev
                        .filter((_, index) => index !== deletingIndex)
                        .map((q, index) => ({ ...q, orderIndex: index })),
                );
            }

            setDeletingIndex(null);
            setDeleteConfirmOpen(false);
        },
        onError: (error) => {
            toast.error(`Failed to delete question: ${error.message}`);
        },
    });

    const handleExamDetailsSubmit = (data: ExamFormValues) => {
        setExamData(data);
        createExamMutation.mutate(data);
    };

    const handleAddNewQuestion = () => {
        if (!examId) return;

        setEditingIndex(null);

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
        if (!examId) return;

        if (editingIndex !== null) {
            const question = questions[editingIndex];
            if (question && question.id) {
                updateQuestionMutation.mutate({
                    questionId: question.id,
                    ...data,
                });

                setQuestions((prev) => {
                    const newQuestions = [...prev];
                    newQuestions[editingIndex] = {
                        ...data,
                        id: question.id,
                    };
                    return newQuestions;
                });
            }
        } else {
            addQuestionMutation.mutate({
                examId,
                ...data,
            });

            setQuestions((prev) => [...prev, data]);
        }
    };

    const handleEditQuestion = (index: number) => {
        setEditingIndex(index);
        const questionToEdit = questions[index];
        if (questionToEdit) {
            setCurrentQuestion(questionToEdit);
        }
    };

    const handleDeleteQuestion = (index: number) => {
        setDeletingIndex(index);
        setDeleteConfirmOpen(true);
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
                                        <div className="flex items-center gap-2">
                                            <div className="mr-2 text-sm text-muted-foreground">
                                                {question.points} point
                                                {question.points !== 1 && "s"}
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleEditQuestion(index)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDeleteQuestion(index)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div
                                        className="whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{
                                            __html: question.questionText,
                                        }}
                                    ></div>
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
                            questionIndex={
                                editingIndex !== null
                                    ? editingIndex
                                    : questions.length
                            }
                            defaultValues={currentQuestion}
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

            <AlertDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Question</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this question? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deletingIndex !== null) {
                                    const question = questions[deletingIndex];
                                    if (question && question.id) {
                                        deleteQuestionMutation.mutate({
                                            questionId: question.id,
                                        });
                                    } else {
                                        setQuestions((prev) =>
                                            prev
                                                .filter(
                                                    (_, i) =>
                                                        i !== deletingIndex,
                                                )
                                                .map((q, i) => ({
                                                    ...q,
                                                    orderIndex: i,
                                                })),
                                        );
                                    }
                                    setDeleteConfirmOpen(false);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
