"use client";

import Link from "next/link";
import { Clock, Calendar, PlusCircle, FileEdit } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export default function ExamsPage() {
    const createdExams = api.exam.getCreatedExams.useQuery(undefined, {
        refetchOnMount: true,
    });

    return (
        <div className="container p-6">
            <div className="mb-6">
                <p className="mt-2 text-muted-foreground">
                    View and manage all of your exams
                </p>
            </div>

            {createdExams.isLoading ? (
                <div className="flex h-52 items-center justify-center">
                    <p>Loading exams...</p>
                </div>
            ) : createdExams.data?.length === 0 ? (
                <div className="flex h-52 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <h3 className="text-lg font-medium">
                        No Exams Created Yet
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                        Get started by creating your first exam.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard/exams/create">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Exam
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
                    {createdExams.data?.map((exam) => (
                        <Card
                            key={exam.id}
                            className="flex flex-col justify-between overflow-hidden"
                        >
                            <CardHeader className="pb-4">
                                <CardTitle className="flex flex-col gap-2">
                                    <Link
                                        href={`/dashboard/exams/${exam.id}`}
                                        className="truncate underline-offset-1 hover:underline"
                                        title={exam.title}
                                    >
                                        {exam.title}
                                    </Link>
                                    {!exam.finalized && (
                                        <Badge
                                            variant="outline"
                                            className="w-fit bg-warning text-warning-foreground"
                                        >
                                            Pending Finalization
                                        </Badge>
                                    )}
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
                                    <Link href={`/dashboard/exams/${exam.id}`}>
                                        <FileEdit className="mr-2 h-4 w-4" />
                                        View Details
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
