import { db } from "@/server/db";
import { userRoles, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const seedAdmin = async (adminEmail: string) => {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!existingUser) {
    console.log(
      `User with email ${adminEmail} not found. Please sign in first.`,
    );
    return;
  }

  const existingRole = await db.query.userRoles.findFirst({
    where: eq(userRoles.userId, existingUser.id),
  });

  if (existingRole) {
    console.log(
      `User ${adminEmail} already has a role assigned: ${existingRole.role}`,
    );
    return;
  }

  await db.insert(userRoles).values({
    userId: existingUser.id,
    role: "admin",
  });

  console.log(`Successfully assigned admin role to ${adminEmail}`);
};

seedAdmin("qerjdhjsnnnssns@gmail.com")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding admin:", error);
    process.exit(1);
  });
