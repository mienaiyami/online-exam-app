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
                <div className="flex flex-row flex-wrap gap-4">
                    {createdExams.data?.map((exam) => (
                        <Card key={exam.id} className="w-80 overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <span className="line-clamp-1">
                                        {exam.title}
                                    </span>
                                    {!exam.finalized && (
                                        <Badge
                                            variant="outline"
                                            className="bg-warning text-warning-foreground"
                                        >
                                            Pending Finalization
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="line-clamp-2 text-sm text-muted-foreground">
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
                            <Separator />
                            <CardFooter className="p-2">
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
