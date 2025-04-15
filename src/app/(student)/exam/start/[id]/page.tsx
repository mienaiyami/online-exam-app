"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
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
import {
    Clock,
    CalendarClock,
    InfoIcon,
    PlayCircle,
    AlertTriangle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDuration } from "@/lib/utils";

export default function StartExamPage() {
    const params = useParams<{ id: string }>();
    const examId = Number(params.id);
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { data: exam, isLoading: examLoading } =
        api.exam.getByIdForStudent.useQuery(
            { examId },
            {
                enabled: !isNaN(examId),
                retry: 1,
            },
        );

    const { mutate: startExam, isPending: isStarting } =
        api.examSession.start.useMutation({
            onSuccess: (data) => {
                if (data?.id) {
                    router.push(`/exam/session/${data.id}`);
                }
            },
            onError: (error) => {
                toast.error(error.message || "Failed to start exam");
                setConfirmOpen(false);
            },
        });

    const handleStartExam = () => {
        setConfirmOpen(false);
        startExam({ examId });
    };

    const isAvailable =
        exam &&
        (!exam.availableFrom || new Date(exam.availableFrom) <= new Date()) &&
        (!exam.availableTo || new Date(exam.availableTo) >= new Date());

    return (
        <div className="container mx-auto py-10">
            <div className="mx-auto max-w-3xl">
                <h1 className="mb-6 text-3xl font-bold tracking-tight">
                    Exam Details
                </h1>

                {examLoading ? (
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-10 w-28" />
                        </CardFooter>
                    </Card>
                ) : exam ? (
                    <Card className="transition-all">
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                {exam.title}
                            </CardTitle>
                            <CardDescription>
                                Please review the exam details before starting
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {exam.description && (
                                <div>
                                    <h3 className="mb-2 font-medium">
                                        Description
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {exam.description}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4 rounded-lg bg-muted p-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <h3 className="font-medium">
                                            Time Limit
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDuration(exam.timeLimit)}
                                        </p>
                                    </div>
                                </div>

                                {(exam.availableFrom || exam.availableTo) && (
                                    <div className="flex items-start gap-3">
                                        <CalendarClock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <h3 className="font-medium">
                                                Availability
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {exam.availableFrom && (
                                                    <span>
                                                        From:{" "}
                                                        {format(
                                                            new Date(
                                                                exam.availableFrom,
                                                            ),
                                                            "PPp",
                                                        )}
                                                    </span>
                                                )}
                                                {exam.availableFrom &&
                                                    exam.availableTo && <br />}
                                                {exam.availableTo && (
                                                    <span>
                                                        Until:{" "}
                                                        {format(
                                                            new Date(
                                                                exam.availableTo,
                                                            ),
                                                            "PPp",
                                                        )}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <InfoIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <h3 className="font-medium">
                                            Important Information
                                        </h3>
                                        <ul className="ml-4 list-disc text-sm text-muted-foreground">
                                            <li>
                                                Once started, you cannot pause
                                                the exam
                                            </li>
                                            <li>
                                                The exam will automatically
                                                submit when the time limit is
                                                reached
                                            </li>
                                            <li>
                                                Ensure you have a stable
                                                internet connection
                                            </li>
                                            <li>
                                                Do not refresh or close the
                                                browser window during the exam
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {!isAvailable && (
                                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        <h3 className="font-medium">
                                            Exam not available
                                        </h3>
                                    </div>
                                    <p className="mt-1 text-sm">
                                        This exam is not currently available.
                                        Please check the availability dates.
                                    </p>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                className="h-10"
                                onClick={() =>
                                    router.push("/dashboard/my-exams")
                                }
                            >
                                Go to Exams
                            </Button>
                            <Button
                                onClick={() => setConfirmOpen(true)}
                                disabled={!isAvailable || isStarting}
                                className="gap-2"
                            >
                                <PlayCircle className="h-4 w-4" />
                                {isStarting ? "Starting..." : "Start Exam"}
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                        <AlertTriangle className="mx-auto mb-2 h-10 w-10" />
                        <h2 className="text-xl font-bold">Exam Not Found</h2>
                        <p className="mt-2">
                            The exam you are looking for does not exist or you
                            don&apos;t have access to it.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push("/dashboard/my-exams")}
                        >
                            Go to Exams
                        </Button>
                    </div>
                )}
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start Exam</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to start the exam. The timer will
                            begin immediately. Are you ready to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStartExam}
                            disabled={isStarting}
                        >
                            {isStarting ? "Starting..." : "Start Now"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
