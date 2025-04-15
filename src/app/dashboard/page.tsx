import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/server/auth";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();
    console.log({ session });
    if (!session) {
        redirect("/login");
    }
    const userRoles = session?.user.roles;

    const isAdmin = userRoles.includes("admin");
    const isInstructor = userRoles.includes("instructor");
    const isStudent = userRoles.includes("student");

    let createdExams = [] as RouterOutputs["exam"]["getCreatedExams"];
    let assignedExams = [] as RouterOutputs["exam"]["getAvailableExams"];
    let examHistory = [] as RouterOutputs["examSession"]["getUserHistory"];

    if (isInstructor || isAdmin) {
        createdExams = await api.exam.getCreatedExams();
    }

    if (isStudent) {
        assignedExams = await api.exam.getAvailableExams();
        examHistory = await api.examSession.getUserHistory();
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-2">
                {(isInstructor || isAdmin) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Created Exams</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {createdExams.length}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {isStudent && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Exams</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {assignedExams.length}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Completed Exams</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">
                                    {
                                        examHistory.filter(
                                            (session) =>
                                                session.status !==
                                                "in_progress",
                                        ).length
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    </>
                )}

                {isAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Access</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>You have administrator privileges</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
