"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { api } from "@/trpc/react";

export default function ExamsPage() {
    const [activeTab, setActiveTab] = useState<"created" | "assigned">(
        "created",
    );

    const createdExams = api.exam.getCreatedExams.useQuery(undefined, {
        enabled: activeTab === "created",
    });

    const assignedExams = api.exam.getAssignedExams.useQuery(undefined, {
        enabled: activeTab === "assigned",
    });

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hr${hours > 1 ? "s" : ""}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ""}`;
    };

    const formatDate = (date: Date | null | undefined) => {
        if (!date) return "Not set";
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="container p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">
                    Your Exams
                </h1>
                <p className="mt-2 text-muted-foreground">
                    View and manage all of your exams
                </p>
            </div>

            <Tabs
                defaultValue="created"
                value={activeTab}
                onValueChange={(value) =>
                    setActiveTab(value as "created" | "assigned")
                }
                className="w-full"
            >
                <TabsList className="mb-4">
                    <TabsTrigger value="created">Exams You Created</TabsTrigger>
                    <TabsTrigger value="assigned">
                        Exams Assigned to You
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="created" className="space-y-4">
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
                                <Card
                                    key={exam.id}
                                    className="w-80 overflow-hidden"
                                >
                                    <CardHeader className="pb-4">
                                        <CardTitle className="line-clamp-1">
                                            {exam.title}
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
                                            <Link
                                                href={`/dashboard/exams/${exam.id}`}
                                            >
                                                <FileEdit className="mr-2 h-4 w-4" />
                                                View Details
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="assigned" className="space-y-4">
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
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {assignedExams.data?.map((exam) => (
                                <Card key={exam.id} className="overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="line-clamp-1">
                                            {exam.title}
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
                                                <span className="truncate">
                                                    {exam.availableFrom &&
                                                    exam.availableTo
                                                        ? `${formatDate(exam.availableFrom)} to ${formatDate(exam.availableTo)}`
                                                        : "No date restriction"}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <Separator />
                                    <CardFooter className="pt-4">
                                        <Button
                                            asChild
                                            variant="default"
                                            className="w-full"
                                        >
                                            <Link
                                                href={`/dashboard/exams/take/${exam.id}`}
                                            >
                                                Take Exam
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
