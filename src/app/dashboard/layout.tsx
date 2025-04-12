import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import Link from "next/link";
import ToggleTheme from "@/components/theme/ToggleTheme";

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
        return (
            <div className="flex min-h-screen flex-col">
                <header className="border-b">
                    <div className="container mx-auto flex h-16 w-full items-center justify-between gap-2 md:px-10">
                        <h1 className="text-xl font-bold">
                            <Link href="/">Online Exam Platform</Link>
                        </h1>
                        <SignOutButton />
                        <ToggleTheme />
                    </div>
                </header>
                <main className="container mx-auto flex-1 py-10">
                    <div className="mx-auto max-w-md text-center">
                        <h2 className="mb-4 text-2xl font-bold">Welcome!</h2>
                        <p className="mb-6">
                            Your account is pending role assignment. Please
                            contact an administrator.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="grid min-h-screen grid-cols-[16rem_1fr]">
            <div className="w-full border-r">
                <div className="p-4">
                    <h1 className="text-xl font-bold">
                        <Link href="/">Online Exam Platform</Link>
                    </h1>
                </div>
                <nav className="mt-6">
                    <ul className="space-y-2 px-2">
                        <li>
                            <Link
                                href="/dashboard"
                                className="block rounded-md px-4 py-2 hover:bg-foreground/10"
                            >
                                Dashboard
                            </Link>
                        </li>

                        {(isAdmin || isInstructor) && (
                            <>
                                <li>
                                    <Link
                                        href="/dashboard/exams"
                                        className="block rounded-md px-4 py-2 hover:bg-foreground/10"
                                    >
                                        Manage Exams
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/dashboard/students"
                                        className="block rounded-md px-4 py-2 hover:bg-foreground/10"
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
                                    className="block rounded-md px-4 py-2 hover:bg-foreground/10"
                                >
                                    User Management
                                </Link>
                            </li>
                        )}

                        {isStudent && (
                            <li>
                                <Link
                                    href="/dashboard/my-exams"
                                    className="block rounded-md px-4 py-2 hover:bg-foreground/10"
                                >
                                    My Exams
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>

            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-end border-b px-6">
                    <div className="flex items-center gap-2">
                        <span>{session.user.name}</span>
                        <SignOutButton />
                        <ToggleTheme />
                    </div>
                </header>
                <main className="w-full p-6">{children}</main>
            </div>
        </div>
    );
}
