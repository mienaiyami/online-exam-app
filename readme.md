# Online Exam Application

A modern web application for creating, managing, and taking online exams. Built with Next.js, TypeScript, Drizzle ORM, and PostgreSQL.

## Features

- **User Authentication**: Secure login and role-based access (Admin, Instructor, Student)
- **Exam Management**:
  - Create and edit exams with time limits
  - Schedule exam availability with start and end dates
  - Support for multiple question types (Multiple Choice, Short Answer, Essay)
- **Interactive Testing Environment**:
  - Rich text editor for questions and answers
  - Real-time exam session management
  - Automated grading for multiple-choice questions
- **User Management**:
  - Manage users with different roles
  - Assign exams to specific users
- **Analytics & Reporting**:
  - View exam results and statistics
  - Track student progress

## Technology Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **UI Components**: Tailwind CSS, Radix UI
- **Form Handling**: React Hook Form, Zod
- **Rich Text Editor**: Tiptap
- **API**: tRPC
- **File Uploads**: UploadThing

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [pnpm](https://pnpm.io/) (v8 or newer)
- [PostgreSQL](https://www.postgresql.org/) (v14 or newer)

## Installation

1. Clone the repository:

```sh
git clone https://github.com/yourusername/online-exam-app.git
cd online-exam-app
```

2. Install dependencies:

```sh
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:

```
cp .env.example .env
```

4. Start the PostgreSQL database (requires Docker):

```sh
# in bash or wsl
chmod +x start-database.sh
./start-database.sh
```

5. Initialize the database schema:

```sh
pnpm db:push
```

6. Seed the database with an admin user:

```sh
pnpm seed:admin
```

7. (Optional) Seed the database with student users:

```sh
pnpm seed:students
```

## Running the Application

### Development Mode

```sh
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```sh
pnpm build
pnpm start
```

## Database Management

- Generate migration files based on schema changes:

  ```sh
  pnpm db:generate
  ```

- Push schema changes to the database:

  ```sh
  pnpm db:push
  ```

- Open Drizzle Studio (database GUI):

  ```sh
  pnpm db:studio
  ```

## Development Scripts

- Check code for errors:

  ```sh
  pnpm check
  ```

- Format code:

  ```sh
  pnpm format:write
  ```

- Type checking:

  ```sh
  pnpm typecheck
  ```

- Linting:

  ```sh
  pnpm lint
  ```

- List mock users (after seeding):

  ```sh
  pnpm list:mock-users
  ```

## License

MIT
