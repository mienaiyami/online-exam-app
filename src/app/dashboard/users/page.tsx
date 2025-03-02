import { redirect } from "next/navigation";
import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/server/auth";
import { AssignRoleForm } from "./AssignRoleForm";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user.roles.includes("admin")) {
    redirect("/dashboard");
  }

  const users = await api.user.getAll();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Management</h1>

      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle>{user.name ?? user.email}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <div className="mt-2">
                    <strong>Roles:</strong>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role.id}
                            className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                          >
                            {role.role}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">No roles assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <AssignRoleForm userId={user.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
