import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function ExamsPage() {
  const session = await auth();

  if (
    !session ||
    (!session.user.roles.includes("admin") &&
      !session.user.roles.includes("instructor"))
  ) {
    redirect("/dashboard");
  }

  const exams = await api.exam.getCreatedExams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Exams</h1>
        <Link href="/dashboard/exams/create">
          <Button>Create New Exam</Button>
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-500">
            {"You haven't created any exams yet."}
          </p>
          <Link href="/dashboard/exams/create" className="mt-4 inline-block">
            <Button>Create Your First Exam</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle>{exam.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {exam.description || "No description"}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">Time Limit</p>
                    <p>{exam.timeLimit} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available From</p>
                    <p>
                      {exam.availableFrom
                        ? formatDate(exam.availableFrom)
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available Until</p>
                    <p>
                      {exam.availableTo
                        ? formatDate(exam.availableTo)
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Link href={`/dashboard/exams/${exam.id}/sessions`}>
                  <Button variant="outline">View Sessions</Button>
                </Link>
                <Link href={`/dashboard/exams/${exam.id}/edit`}>
                  <Button variant="outline">Edit</Button>
                </Link>
                <Link href={`/dashboard/exams/${exam.id}/assign`}>
                  <Button>Assign to Students</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
