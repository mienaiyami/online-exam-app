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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Time from "./_components/Time";

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
            },
        );

    const { mutate: saveResponse } = api.examSession.saveResponse.useMutation({
        onSuccess: () => {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(null), 1500);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save response");
            setSaveSuccess(false);
            setTimeout(() => setSaveSuccess(null), 1500);
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

        setIsSaving(true);
        const response = userResponses[currentQuestion.id];
        if (!response) return;

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
        if (currentQuestion && userResponses[currentQuestion.id]) {
            saveCurrentResponse();
        }

        const autoSaveInterval = setInterval(() => {
            if (currentQuestion && userResponses[currentQuestion.id]) {
                saveCurrentResponse();
            }
        }, 30_000);

        return () => clearInterval(autoSaveInterval);
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
            <div className="container py-10">
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
        <div className="container flex min-h-[calc(100vh-4rem)] select-none flex-col pb-10 pt-6">
            <div className="sticky top-0 z-10 mb-6 flex items-center justify-between bg-background py-2">
                <h1 className="text-2xl font-bold tracking-tight">
                    {sessionLoading ? (
                        <Skeleton className="h-8 w-64" />
                    ) : (
                        sessionData?.exam.title || "Exam Session"
                    )}
                </h1>

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
                <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                    <div className="hidden lg:block">
                        <div className="sticky top-24 rounded-lg border bg-card p-4 shadow-sm">
                            <h2 className="mb-4 font-medium">Questions</h2>
                            <div className="grid grid-cols-5 gap-2">
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
                                            "h-10 w-10 p-0",
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

                            <div className="mt-8 flex flex-col gap-3">
                                <Button
                                    variant="outline"
                                    className="gap-2"
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
                    </div>

                    <div className="flex flex-col">
                        {currentQuestion ? (
                            <>
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Question {currentQuestionIndex + 1}{" "}
                                            of {questions.length}
                                        </span>
                                        <h2 className="text-xl font-semibold">
                                            {currentQuestion.points > 1
                                                ? `${currentQuestion.points} points`
                                                : `${currentQuestion.points} point`}
                                        </h2>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1 lg:hidden"
                                        onClick={saveCurrentResponse}
                                        disabled={
                                            isSaving ||
                                            !userResponses[currentQuestion.id]
                                        }
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : saveSuccess === true ? (
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <Save className="h-3 w-3" />
                                        )}
                                        <span className="sr-only md:not-sr-only">
                                            Save
                                        </span>
                                    </Button>
                                </div>

                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle
                                            className="text-lg font-medium"
                                            dangerouslySetInnerHTML={{
                                                __html: currentQuestion.questionText,
                                            }}
                                        />
                                        <CardDescription>
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
                                    </CardHeader>

                                    <CardContent>
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
                                                    className="space-y-3"
                                                >
                                                    {currentQuestion.options.map(
                                                        (option) => (
                                                            <Label
                                                                key={option.id}
                                                                htmlFor={`option-${option.id}`}
                                                                className="flex cursor-pointer flex-row items-start gap-2 rounded-md border border-input p-2"
                                                            >
                                                                <RadioGroupItem
                                                                    id={`option-${option.id}`}
                                                                    value={option.id.toString()}
                                                                />
                                                                <span
                                                                    className=""
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: option.optionText,
                                                                    }}
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
                                                className="min-h-24"
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

                                <div className="mt-auto flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={goToPrevQuestion}
                                        disabled={currentQuestionIndex === 0}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="flex lg:hidden">
                                        {questions.length > 3 ? (
                                            <select
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={currentQuestionIndex}
                                                onChange={(e) =>
                                                    setCurrentQuestionIndex(
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ),
                                                    )
                                                }
                                            >
                                                {questions.map((q, index) => (
                                                    <option
                                                        key={q.id}
                                                        value={index}
                                                    >
                                                        Question {index + 1}
                                                        {userResponses[q.id]
                                                            ? " ✓"
                                                            : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="flex gap-1">
                                                {questions.map((q, index) => (
                                                    <Button
                                                        key={q.id}
                                                        variant={
                                                            index ===
                                                            currentQuestionIndex
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        size="sm"
                                                        className={cn(
                                                            "h-9 w-9 p-0",
                                                            userResponses[
                                                                q.id
                                                            ] &&
                                                                "border-green-500",
                                                        )}
                                                        onClick={() =>
                                                            setCurrentQuestionIndex(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        {index + 1}
                                                        {userResponses[
                                                            q.id
                                                        ] && (
                                                            <div className="absolute -right-1 -top-1 size-2 rounded-full bg-green-500"></div>
                                                        )}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="lg:hidden">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                setConfirmSubmit(true)
                                            }
                                        >
                                            Submit
                                        </Button>
                                    </div>

                                    <Button
                                        className="gap-2"
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
