"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Clock,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Save,
    Send,
} from "lucide-react";
import { cleanHtmlForDisplay, cn } from "@/lib/utils";
import { toast } from "sonner";
import Time from "./_components/time";
import ToggleTheme from "@/components/theme/toggle-theme";
import { RichTextPreview } from "@/components/ui/tiptap/rich-text-preview";
import { Separator } from "@/components/ui/separator";

type Response = {
    questionId: number;
    responseText?: string;
    selectedOptionId?: number;
};

export default function ExamSessionPage() {
    const params = useParams<{ id: string }>();
    const sessionId = Number(params.id);
    const router = useRouter();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userResponses, setUserResponses] = useState<
        Record<number, Response>
    >({});
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

    const {
        data: sessionData,
        isLoading: sessionLoading,
        error: sessionError,
    } = api.examSession.getActive.useQuery(
        { sessionId },
        {
            enabled: !isNaN(sessionId),
            refetchInterval: 60_000,
            retry: 1,
        },
    );

    const { data: questions, isLoading: questionsLoading } =
        api.examSession.getQuestions.useQuery(
            { sessionId },
            {
                enabled: !isNaN(sessionId),
                retry: 1,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
            },
        );

    const { mutate: saveResponse } = api.examSession.saveResponse.useMutation({
        onSuccess: () => {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(null), 3000);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save response");
            setSaveSuccess(false);
            setTimeout(() => setSaveSuccess(null), 3000);
        },
        onSettled: () => {
            setIsSaving(false);
        },
    });

    const { mutate: submitExam, isPending: isSubmitting } =
        api.examSession.submit.useMutation({
            onSuccess: () => {
                toast.success("Exam submitted successfully");
                router.push("/dashboard");
            },
            onError: (error) => {
                toast.error(error.message || "Failed to submit exam");
                setConfirmSubmit(false);
            },
        });

    useEffect(() => {
        if (sessionData?.responses) {
            const initialResponses: Record<number, Response> = {};
            sessionData.responses.forEach((response) => {
                initialResponses[response.questionId] = {
                    questionId: response.questionId,
                    responseText: response.responseText || undefined,
                    selectedOptionId: response.selectedOptionId || undefined,
                };
            });
            setUserResponses(initialResponses);
        }
    }, [sessionData]);

    const currentQuestion = questions?.[currentQuestionIndex];

    const handleResponseChange = useCallback(
        (value: string | number, type: "text" | "option") => {
            if (!currentQuestion) return;

            const questionId = currentQuestion.id;
            const updatedResponse: Response = {
                questionId,
                ...(type === "text" ? { responseText: value as string } : {}),
                ...(type === "option"
                    ? { selectedOptionId: value as number }
                    : {}),
            };

            setUserResponses((prev) => ({
                ...prev,
                [questionId]: {
                    ...prev[questionId],
                    ...updatedResponse,
                },
            }));
        },
        [currentQuestion],
    );

    const saveCurrentResponse = useCallback(() => {
        if (!currentQuestion || !userResponses[currentQuestion.id]) return;

        const response = userResponses[currentQuestion.id];
        if (!response) return;

        setIsSaving(true);
        saveResponse({
            sessionId,
            response: {
                questionId: response.questionId,
                responseText: response.responseText,
                selectedOptionId: response.selectedOptionId,
            },
        });
    }, [currentQuestion, userResponses, sessionId, saveResponse]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (currentQuestion && userResponses[currentQuestion.id]) {
            timeout = setTimeout(() => {
                saveCurrentResponse();
            }, 1000);
        }

        const autoSaveInterval = setInterval(() => {
            if (currentQuestion && userResponses[currentQuestion.id]) {
                saveCurrentResponse();
            }
        }, 30_000);

        return () => {
            clearInterval(autoSaveInterval);
            clearTimeout(timeout);
        };
    }, [currentQuestion, userResponses, saveCurrentResponse]);

    const goToNextQuestion = () => {
        if (questions && currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const goToPrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmitExam = () => {
        setConfirmSubmit(false);
        submitExam({ sessionId });
    };
    const onTimeUp = useCallback(() => {
        toast.warning("Time's up! Submitting your exam...");
        submitExam({ sessionId });
    }, [sessionId, submitExam]);

    if (sessionError) {
        return (
            <div className="container mx-auto py-10">
                <div className="mx-auto max-w-3xl rounded-md border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                    <AlertTriangle className="mx-auto mb-2 h-10 w-10" />
                    <h2 className="text-xl font-bold">Session Error</h2>
                    <p className="mt-2">
                        {sessionError.message ||
                            "There was an error loading your exam session."}
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push("/dashboard")}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full select-none flex-col p-6 pt-0">
            <div className="sticky top-0 z-10 mb-6 flex items-center justify-between border-b bg-background py-2 pt-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    {sessionLoading ? (
                        <Skeleton className="h-8 w-64" />
                    ) : (
                        sessionData?.exam.title || "Exam Session"
                    )}
                </h1>
                <ToggleTheme className="ml-auto mr-2 h-10" />
                <Time
                    startedAt={sessionData?.startedAt?.getTime() ?? 0}
                    timeLimit={sessionData?.exam.timeLimit ?? 0}
                    onTimeUp={onTimeUp}
                />
            </div>

            {sessionLoading || questionsLoading ? (
                <div className="grid flex-1 place-items-center">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-lg font-medium">
                            Loading your exam...
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Please wait while we prepare your session
                        </p>
                    </div>
                </div>
            ) : questions && questions.length > 0 ? (
                <div className="grid flex-1 grid-cols-[280px_1fr] gap-6">
                    <div></div>
                    <div className="fixed">
                        <div className="w-[280px] rounded-lg border bg-card p-2 shadow-sm">
                            <h2 className="mb-2 font-medium">Questions</h2>
                            <div className="grid grid-cols-5 gap-1">
                                {questions.map((q, index) => (
                                    <Button
                                        key={q.id}
                                        variant={
                                            index === currentQuestionIndex
                                                ? "default"
                                                : userResponses[q.id]
                                                  ? "outline"
                                                  : "secondary"
                                        }
                                        className={cn(
                                            "aspect-square w-full p-0",
                                            userResponses[q.id] &&
                                                "border-green-500",
                                        )}
                                        onClick={() =>
                                            setCurrentQuestionIndex(index)
                                        }
                                    >
                                        {index + 1}
                                    </Button>
                                ))}
                            </div>
                            <div className="my-2 text-center text-sm text-muted-foreground">
                                Attempted{" "}
                                <span className="text-foreground">
                                    {Object.keys(userResponses).length} of{" "}
                                    {questions.length}
                                </span>{" "}
                                questions
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className={`gap-2 ${
                                        saveSuccess === true
                                            ? "border-green-500 text-green-500"
                                            : ""
                                    }`}
                                    onClick={saveCurrentResponse}
                                    disabled={
                                        isSaving ||
                                        !currentQuestion ||
                                        !userResponses[currentQuestion.id]
                                    }
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : saveSuccess === true ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Response
                                </Button>

                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => setConfirmSubmit(true)}
                                >
                                    <Send className="h-4 w-4" />
                                    Submit Exam
                                </Button>
                            </div>
                        </div>
                        <div className="mt-auto flex items-center gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={goToPrevQuestion}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Previous
                            </Button>

                            <Button
                                className="w-full gap-2"
                                onClick={goToNextQuestion}
                                disabled={
                                    currentQuestionIndex ===
                                    questions.length - 1
                                }
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {currentQuestion ? (
                            <>
                                <div className="mb-2 flex items-center justify-start gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Question {currentQuestionIndex + 1} of{" "}
                                        {questions.length}
                                    </span>
                                    <span className="text-sm font-medium">
                                        [
                                        {currentQuestion.points > 1
                                            ? `${currentQuestion.points} points`
                                            : `${currentQuestion.points} point`}
                                        ]
                                    </span>
                                </div>

                                <Card className="mb-6 flex flex-col lg:grid lg:grid-cols-[1fr_1px_1fr]">
                                    <CardHeader>
                                        <RichTextPreview
                                            content={
                                                currentQuestion.questionText
                                            }
                                        />
                                    </CardHeader>
                                    <Separator className="lg:h-full" />
                                    <CardContent>
                                        <CardDescription className="my-2">
                                            {currentQuestion.questionType ===
                                                "multiple_choice" &&
                                                "Select one option"}
                                            {currentQuestion.questionType ===
                                                "short_answer" &&
                                                "Provide a short answer"}
                                            {currentQuestion.questionType ===
                                                "essay" &&
                                                "Write a detailed response"}
                                        </CardDescription>
                                        {currentQuestion.questionType ===
                                            "multiple_choice" &&
                                            currentQuestion.options && (
                                                <RadioGroup
                                                    value={
                                                        userResponses[
                                                            currentQuestion.id
                                                        ]?.selectedOptionId?.toString() ||
                                                        ""
                                                    }
                                                    onValueChange={(value) =>
                                                        handleResponseChange(
                                                            parseInt(value, 10),
                                                            "option",
                                                        )
                                                    }
                                                >
                                                    {currentQuestion.options.map(
                                                        (option) => (
                                                            <Label
                                                                key={option.id}
                                                                className={cn(
                                                                    "flex cursor-pointer flex-row items-start gap-2 rounded-md border border-input p-2",
                                                                    userResponses[
                                                                        currentQuestion
                                                                            .id
                                                                    ]
                                                                        ?.selectedOptionId ===
                                                                        option.id &&
                                                                        "border-primary",
                                                                )}
                                                            >
                                                                <RadioGroupItem
                                                                    value={option.id.toString()}
                                                                />
                                                                <RichTextPreview
                                                                    content={
                                                                        option.optionText
                                                                    }
                                                                />
                                                            </Label>
                                                        ),
                                                    )}
                                                </RadioGroup>
                                            )}

                                        {currentQuestion.questionType ===
                                            "short_answer" && (
                                            <Textarea
                                                placeholder="Enter your answer here..."
                                                className="h-40 max-h-80 min-h-24"
                                                value={
                                                    userResponses[
                                                        currentQuestion.id
                                                    ]?.responseText || ""
                                                }
                                                onChange={(e) =>
                                                    handleResponseChange(
                                                        e.target.value,
                                                        "text",
                                                    )
                                                }
                                            />
                                        )}

                                        {currentQuestion.questionType ===
                                            "essay" && (
                                            <Textarea
                                                placeholder="Write your detailed response here..."
                                                className="min-h-40"
                                                value={
                                                    userResponses[
                                                        currentQuestion.id
                                                    ]?.responseText || ""
                                                }
                                                onChange={(e) =>
                                                    handleResponseChange(
                                                        e.target.value,
                                                        "text",
                                                    )
                                                }
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <div className="grid place-items-center">
                                <p>No questions available for this exam.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid place-items-center">
                    <p>No questions available for this exam.</p>
                </div>
            )}

            <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Exam</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to submit your exam? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-2">
                        <p className="mb-4">
                            <span className="font-medium">Status:</span> You
                            have answered {Object.keys(userResponses).length} of{" "}
                            {questions?.length || 0} questions.
                        </p>

                        {questions &&
                            Object.keys(userResponses).length <
                                questions.length && (
                                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="font-medium">
                                            Warning:
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm">
                                        You have not answered all questions.
                                        Unanswered questions will be marked as
                                        zero.
                                    </p>
                                </div>
                            )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmSubmit(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleSubmitExam}
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Yes, Submit Exam
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
