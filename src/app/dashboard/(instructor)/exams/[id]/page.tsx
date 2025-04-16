"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Calendar,
    Clock,
    Pencil,
    Trash2,
    ArrowLeft,
    Users,
} from "lucide-react";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StrictDeleteAlert } from "../_components/strict-delete-alert";
import { useFinalizeExam } from "../_hooks/finalize-exam";
import { useDeleteQuestion } from "../_hooks/delete-question";
import { cleanHtmlForDisplay } from "@/lib/utils";
import { RichTextPreview } from "@/components/ui/tiptap/rich-text-preview";

export default function ExamDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const examId = Number(params.id);

    const [deleteQuestionId, setDeleteQuestionId] = React.useState<
        number | null
    >(null);
    const utils = api.useUtils();

    const { data: exam, isLoading } = api.exam.getById.useQuery(
        { examId },
        {
            enabled: !isNaN(examId),
            retry: false,
        },
    );
    const { mutate: finalizeExam } = useFinalizeExam();

    const handleFinalize = () => {
        if (!exam) return;
        if (exam.questions.length === 0) {
            toast.error("Please add at least one question to the exam.");
            return;
        }

        finalizeExam({
            examId: exam.id,
        });
    };

    const deleteExamMutation = api.exam.deleteExam.useMutation({
        onSuccess: async () => {
            toast.success("Exam deleted successfully");
            void utils.exam.invalidate();
            router.push("/dashboard/exams");
        },
        onError: (error) => {
            toast.error(`Failed to delete exam: ${error.message}`);
        },
    });

    const { mutate: deleteQuestion } = useDeleteQuestion(() => {
        setDeleteQuestionId(null);
    });

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hr${hours > 1 ? "s" : ""}${
            remainingMinutes > 0 ? ` ${remainingMinutes} min` : ""
        }`;
    };

    const formatDate = (date: Date | null | undefined) => {
        if (!date) return "Not set";
        return format(new Date(date), "PPP");
    };

    const handleDeleteExam = () => {
        if (!exam) return;
        deleteExamMutation.mutate({ examId: exam.id });
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
                            "The exam you're looking for doesn't exist or you don't have access to it."
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-4">
            <div className="mb-6 flex max-w-80 flex-col gap-2 md:max-w-xl">
                <h1
                    title={exam.title}
                    className="truncate text-3xl font-bold tracking-tight"
                >
                    {exam.title}
                </h1>
                <p className="mt-1 text-muted-foreground">Exam ID: {exam.id}</p>
            </div>

            <div className="mb-8 flex flex-wrap gap-2">
                <Button asChild variant="outline">
                    <Link href={`/dashboard/exams/${exam.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Exam
                    </Link>
                </Button>

                {exam.finalized ? (
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/exams/${exam.id}/assign`}>
                            <Users className="mr-2 h-4 w-4" />
                            Assign to Students
                        </Link>
                    </Button>
                ) : (
                    <Button variant="outline" onClick={handleFinalize}>
                        Finalize Exam
                    </Button>
                )}

                <StrictDeleteAlert onDelete={handleDeleteExam} />
            </div>

            <Card className="">
                <CardHeader className="pb-4">
                    <CardTitle>Exam Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Description
                        </h3>
                        <p className="mt-1 whitespace-pre-line text-pretty">
                            {exam.description || "No description provided"}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Time Limit
                            </h3>
                            <div className="mt-1 flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{formatDuration(exam.timeLimit)}</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Availability
                            </h3>
                            <div className="mt-1 flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>
                                    {exam.availableFrom && exam.availableTo
                                        ? `${formatDate(exam.availableFrom)} to ${formatDate(exam.availableTo)}`
                                        : "No date restriction"}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="sticky top-14 z-20 mb-4 bg-background pb-4 pt-8">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">Questions</h2>
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                    >
                        <Link
                            href={`/dashboard/exams/${exam.id}/questions/reorder`}
                        >
                            Reorder Questions
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link
                            href={`/dashboard/exams/${exam.id}/questions/add`}
                        >
                            Add Question
                        </Link>
                    </Button>
                </div>
            </div>

            {exam.questions.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                    <h3 className="text-lg font-medium">No Questions</h3>
                    <p className="mt-2 text-muted-foreground">
                        {"This exam doesn't have any questions yet."}
                    </p>
                    <Button
                        asChild
                        variant="secondary"
                        className="mt-4"
                        size="sm"
                    >
                        <Link
                            href={`/dashboard/exams/${exam.id}/questions/add`}
                        >
                            Add Your First Question
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {exam.questions.map((question, index) => (
                        <Card key={question.id} className="overflow-hidden">
                            <CardHeader className="py-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                        Question {index + 1}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                        >
                                            <Link
                                                href={`/dashboard/exams/${exam.id}/questions/${question.id}/edit`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <AlertDialog
                                            open={
                                                deleteQuestionId === question.id
                                            }
                                            onOpenChange={(open) =>
                                                !open &&
                                                setDeleteQuestionId(null)
                                            }
                                        >
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        setDeleteQuestionId(
                                                            question.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Delete Question
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to
                                                        delete this question?
                                                        This action cannot be
                                                        undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() =>
                                                            deleteQuestion({
                                                                questionId:
                                                                    question.id,
                                                            })
                                                        }
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <CardDescription className="flex items-center">
                                    <span className="mr-4 font-medium">
                                        Type: {question.questionType}
                                    </span>
                                    <span className="font-medium">
                                        {question.points} point
                                        {question.points !== 1 && "s"}
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <Separator />
                            <CardContent className="z-2 relative py-4">
                                <RichTextPreview
                                    content={question.questionText}
                                    className="mb-2 rounded-md p-2 ring-1 ring-inset ring-primary/20"
                                />

                                {question.questionType === "multiple_choice" &&
                                    question.options.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium">
                                                Options:
                                            </h4>
                                            <ul className="space-y-2">
                                                {question.options.map(
                                                    (option, i) => (
                                                        <li
                                                            key={option.id}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <span className="w-4 text-sm text-muted-foreground">
                                                                {i + 1}.{" "}
                                                            </span>
                                                            <RichTextPreview
                                                                content={
                                                                    (option.isCorrect
                                                                        ? "(Correct)<br/>"
                                                                        : "") +
                                                                    option.optionText
                                                                }
                                                                className={`w-full rounded-md p-2 ring-1 ring-inset ring-primary/20 ${
                                                                    option.isCorrect
                                                                        ? "bg-primary/10"
                                                                        : ""
                                                                }`}
                                                            />
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
