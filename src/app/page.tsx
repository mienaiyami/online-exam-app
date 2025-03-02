import Link from "next/link";
import { SignInButton } from "@/components/auth/SignInButton";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800 text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Online Exam Platform
        </h1>

        <div className="max-w-md text-center">
          <p className="mb-8 text-xl">
            A secure platform for creating, managing, and taking online exams.
          </p>

          {session ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-10 py-3 font-semibold text-blue-700 no-underline transition hover:bg-gray-100"
            >
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg">Sign in to access your exams</p>
              <SignInButton />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
