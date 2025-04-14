import { db } from "@/server/db";
import { users, userRoles } from "@/server/db/schema";
import { randomUUID } from "crypto";

function generateRandomName() {
    const firstNames = [
        "Emma",
        "Liam",
        "Olivia",
        "Noah",
        "Ava",
        "Oliver",
        "Sophia",
        "Elijah",
        "Isabella",
        "Lucas",
        "Mia",
        "Mason",
        "Harper",
        "Ethan",
        "Amelia",
        "Logan",
        "Evelyn",
        "James",
        "Charlotte",
        "Benjamin",
    ];
    const lastNames = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
        "Hernandez",
        "Lopez",
        "Gonzalez",
        "Wilson",
        "Anderson",
        "Thomas",
        "Taylor",
        "Moore",
        "Jackson",
        "Martin",
    ];

    const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)]!;
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]!;

    return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

function generateRandomEmail(firstName: string, lastName: string) {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}-${Math.random().toString(36).substring(2)}@example.com`;
}

function generateRandomAvatar() {
    const avatarIds = [
        "1b671a64-40d5-491e-99b0-da01ff1f3341",
        "2c672b64-40d5-491e-99b0-da01ff1f3342",
        "3d673c64-40d5-491e-99b0-da01ff1f3343",
        "4e674d64-40d5-491e-99b0-da01ff1f3344",
        "5f675e64-40d5-491e-99b0-da01ff1f3345",
        "6g676f64-40d5-491e-99b0-da01ff1f3346",
    ];

    const id = avatarIds[Math.floor(Math.random() * avatarIds.length)];
    return `https://avatars.githubusercontent.com/u/${id}?v=4`;
}

const STUDENT_COUNT = 20;

async function seedStudents() {
    console.log("Seeding mock students...");

    const mockStudents = Array.from({ length: STUDENT_COUNT }).map(() => {
        const { firstName, lastName, fullName } = generateRandomName();

        return {
            id: `mock-${randomUUID()}`,
            name: fullName,
            email: generateRandomEmail(firstName, lastName),
            emailVerified: new Date(),
            image: generateRandomAvatar(),
        };
    });

    try {
        console.log(`Creating ${mockStudents.length} mock students...`);

        await db.transaction(async (tx) => {
            for (const student of mockStudents) {
                await tx.insert(users).values(student);
                await tx.insert(userRoles).values({
                    userId: student.id,
                    role: "student",
                });
            }
        });

        console.log("✅ Mock students seeded successfully!");

        console.log("\nSample students created:");
        mockStudents.slice(0, 5).forEach((student) => {
            console.log(`- ${student.name} (${student.email})`);
        });
    } catch (error) {
        console.error("❌ Failed to seed students:", error);
        process.exit(1);
    }

    process.exit(0);
}

seedStudents().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
});
