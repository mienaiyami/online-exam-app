"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Clock,
    Calendar,
    CalendarClock,
    PlayCircle,
    History,
    CheckCircle,
    XCircle,
    Loader2,
    LayoutGrid,
    LockIcon,
    ClockAlert,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { formatDuration, cn } from "@/lib/utils";

const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy h:mm a");
};

const getStatusBadge = (status: "in_progress" | "submitted" | "graded") => {
    switch (status) {
        case "in_progress":
            return (
                <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                >
                    <Clock className="mr-1 h-3 w-3" />
                    In Progress
                </Badge>
            );
        case "submitted":
            return (
                <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                >
                    <ClockAlert className="mr-1 h-3 w-3" />
                    Pending Grading
                </Badge>
            );
        case "graded":
            return (
                <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Graded
                </Badge>
            );
        default:
            return null;
    }
};

export default function MyExamsPage() {
    const [activeTab, setActiveTab] = useState<"available" | "history">(
        "available",
    );

    const { data: availableExams, isLoading: availableLoading } =
        api.exam.getAvailableExams.useQuery(undefined, {
            refetchOnMount: true,
            refetchOnWindowFocus: true,
        });

    const { data: examHistory, isLoading: historyLoading } =
        api.examSession.getUserHistory.useQuery();

    return (
        <div className="container">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Your Exams
                </h1>
                <p className="mt-2 text-muted-foreground">
                    View and take available exams or check your exam history.
                </p>
            </div>

            <Tabs
                defaultValue="available"
                value={activeTab}
                onValueChange={(value) =>
                    setActiveTab(value as "available" | "history")
                }
                className="space-y-6"
            >
                <TabsList>
                    <TabsTrigger
                        value="available"
                        className="flex items-center gap-2"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        <span>Available Exams</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex items-center gap-2"
                    >
                        <History className="h-4 w-4" />
                        <span>Exam History</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="space-y-6">
                    {availableLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="overflow-hidden">
                                    <CardHeader className="space-y-1">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-2/3" />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Skeleton className="h-9 w-full" />
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : availableExams && availableExams.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
                            {availableExams.map((exam) => (
                                <Card
                                    key={exam.id}
                                    className="relative overflow-hidden"
                                >
                                    <CardHeader className="space-y-1">
                                        <CardTitle
                                            className="line-clamp-1"
                                            title={exam.title}
                                        >
                                            {exam.title}
                                        </CardTitle>
                                        <CardDescription
                                            className="line-clamp-1"
                                            title={exam.description || ""}
                                        >
                                            {exam.description ||
                                                "No description provided"}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                Time Limit:{" "}
                                                {formatDuration(exam.timeLimit)}
                                            </span>
                                        </div>

                                        {(exam.availableFrom ||
                                            exam.availableTo) && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                                <div className="text-xs">
                                                    {exam.availableTo && (
                                                        <div>
                                                            Available until:{" "}
                                                            {formatDate(
                                                                exam.availableTo,
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter>
                                        <Button
                                            asChild
                                            className="w-full gap-2"
                                        >
                                            <Link
                                                href={`/exam/start/${exam.id}`}
                                            >
                                                <PlayCircle className="h-4 w-4" />
                                                Begin Exam
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border bg-card p-8 text-center">
                            <XCircle className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-1 text-xl font-medium">
                                No Available Exams
                            </h3>
                            <p className="text-muted-foreground">
                                You don&apos;t have any available exams at the
                                moment.
                            </p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent
                    value="history"
                    className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4"
                >
                    {historyLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <Skeleton className="h-5 w-3/4" />
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-4 w-1/4" />
                                        </div>
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-4 w-1/4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : examHistory && examHistory.length > 0 ? (
                        <div className="space-y-4">
                            {examHistory.map((session) => (
                                <Card
                                    key={session.id}
                                    className={cn(
                                        "overflow-hidden transition-colors",
                                        session.status === "in_progress" &&
                                            "border-amber-500 dark:border-amber-500",
                                    )}
                                >
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="line-clamp-1">
                                                {session.exam.title}
                                            </CardTitle>
                                            {getStatusBadge(session.status)}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    Started:{" "}
                                                    {formatDate(
                                                        session.startedAt,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    Duration:{" "}
                                                    {formatDuration(
                                                        session.exam.timeLimit,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {session.totalPoints !== null && (
                                            <div className="flex items-center gap-2 font-medium">
                                                <span>
                                                    Score: {session.totalPoints}{" "}
                                                    points
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter>
                                        {session.status === "in_progress" ? (
                                            <Button
                                                asChild
                                                className="w-full gap-2"
                                            >
                                                <Link
                                                    href={`/exam/session/${session.id}`}
                                                >
                                                    <PlayCircle className="h-4 w-4" />
                                                    Continue Exam
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button
                                                disabled
                                                variant="outline"
                                                className="w-full"
                                            >
                                                {session.status === "graded"
                                                    ? "View Results"
                                                    : "Submitted"}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border bg-card p-8 text-center">
                            <History className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-1 text-xl font-medium">
                                No Exam History
                            </h3>
                            <p className="text-muted-foreground">
                                You haven&apos;t taken any exams yet.
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
