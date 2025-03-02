import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const userRoles = session.user.roles || [];
  const isAdmin = userRoles.includes("admin");
  const isInstructor = userRoles.includes("instructor");
  const isStudent = userRoles.includes("student");

  if (!isAdmin && !isInstructor && !isStudent) {
    // User has no role assigned yet
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold">Online Exam Platform</h1>
            <SignOutButton />
          </div>
        </header>
        <main className="container flex-1 py-10">
          <div className="mx-auto max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">Welcome!</h2>
            <p className="mb-6">
              Your account is pending role assignment. Please contact an
              administrator.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-100">
        <div className="p-4">
          <h1 className="text-xl font-bold">Exam Platform</h1>
        </div>
        <nav className="mt-6">
          <ul className="space-y-2 px-2">
            <li>
              <Link
                href="/dashboard"
                className="block rounded-md px-4 py-2 hover:bg-gray-200"
              >
                Dashboard
              </Link>
            </li>

            {(isAdmin || isInstructor) && (
              <>
                <li>
                  <Link
                    href="/dashboard/exams"
                    className="block rounded-md px-4 py-2 hover:bg-gray-200"
                  >
                    Manage Exams
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/students"
                    className="block rounded-md px-4 py-2 hover:bg-gray-200"
                  >
                    Students
                  </Link>
                </li>
              </>
            )}

            {isAdmin && (
              <li>
                <Link
                  href="/dashboard/users"
                  className="block rounded-md px-4 py-2 hover:bg-gray-200"
                >
                  User Management
                </Link>
              </li>
            )}

            {isStudent && (
              <li>
                <Link
                  href="/dashboard/my-exams"
                  className="block rounded-md px-4 py-2 hover:bg-gray-200"
                >
                  My Exams
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b px-6">
          <div className="flex items-center gap-4">
            <span>{session.user.name}</span>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
