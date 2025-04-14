"use client";

import Link from "next/link";
import { Clock, Calendar } from "lucide-react";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { api } from "@/trpc/react";
import { formatDuration } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export default function MyExamsPage() {
    const assignedExams = api.exam.getAssignedExams.useQuery(undefined, {
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });
    return (
        <div className="container">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Your Exams
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Exams Assigned to You
                </p>
            </div>
            {assignedExams.isLoading ? (
                <div className="flex h-52 items-center justify-center">
                    <p>Loading assigned exams...</p>
                </div>
            ) : assignedExams.data?.length === 0 ? (
                <div className="flex h-52 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <h3 className="text-lg font-medium">
                        No Exams Assigned to You Yet
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                        Check back later for assigned exams.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
                    {assignedExams.data?.map((exam) => (
                        <Card
                            key={exam.id}
                            className="flex flex-col justify-between overflow-hidden"
                        >
                            <CardHeader className="pb-4">
                                <CardTitle className="flex flex-col gap-2">
                                    {exam.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p
                                    className="truncate text-sm text-muted-foreground"
                                    title={exam.description || ""}
                                >
                                    {exam.description ||
                                        "No description provided"}
                                </p>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Clock className="mr-2 h-4 w-4" />
                                        {formatDuration(exam.timeLimit)}
                                    </div>

                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <span
                                            className="truncate"
                                            title={
                                                exam.availableFrom &&
                                                exam.availableTo
                                                    ? `${formatDate(exam.availableFrom)} to ${formatDate(exam.availableTo)}`
                                                    : "No date restriction"
                                            }
                                        >
                                            {exam.availableFrom &&
                                            exam.availableTo
                                                ? `${formatDate(exam.availableFrom)} to ${formatDate(exam.availableTo)}`
                                                : "No date restriction"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 p-2">
                                <Separator />
                                <Button
                                    asChild
                                    variant="secondary"
                                    className="w-full"
                                >
                                    <Link href={`/`}>Take Exam</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
