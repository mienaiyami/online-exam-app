import { z } from "zod";
import dompurify from "dompurify";
import { cleanHtmlForDisplay } from "@/lib/utils";
export const examFormSchema = z.object({
    title: z
        .string()
        .min(1, { message: "Title is required" })
        .max(255, { message: "Title must be less than 255 characters" }),
    description: z.string().optional(),
    timeLimit: z
        .number()
        .int()
        .positive({ message: "Time limit must be a positive number" }),
    availableFrom: z.date().optional(),
    availableTo: z
        .date()
        .optional()
        .refine(
            (date) => !date || (!!date && date > new Date()),
            "Available to date must be in the future",
        ),
});

export const questionFormSchema = z
    .object({
        questionText: z
            .string()
            .min(1, { message: "Question text is required" }),
        questionType: z.enum(["multiple_choice", "short_answer", "essay"], {
            required_error: "Please select a question type",
        }),
        points: z
            .number()
            .int()
            .positive({ message: "Points must be a positive number" })
            .default(1),
        orderIndex: z.number().int().nonnegative(),
        options: z
            .array(
                z.object({
                    optionText: z
                        .string()
                        .min(1, { message: "Option text is required" }),
                    isCorrect: z.boolean().default(false),
                }),
            )
            .optional()
            .refine(
                (options) => {
                    if (!options || options.length === 0) return true;
                    return options.some((option) => option.isCorrect);
                },
                { message: "At least 2 options must be marked as correct" },
            )
            .refine(
                (options) => {
                    if (!options || options.length === 0) return true;
                    return options.length >= 2;
                },
                { message: "Options are required" },
            ),
    })
    .refine(
        (data) => {
            if (data.questionType === "multiple_choice") {
                return data.options && data.options.length >= 2;
            }
            return true;
        },
        {
            message: "Multiple choice questions must have at least one option",
            path: ["options"],
        },
    )
    .transform((data) => {
        if (data.questionType !== "multiple_choice") {
            data.options = undefined;
        }
        data.questionText = dompurify.sanitize(
            cleanHtmlForDisplay(data.questionText),
        );
        if (data.options) {
            data.options.forEach((option) => {
                option.optionText = dompurify.sanitize(
                    cleanHtmlForDisplay(option.optionText),
                );
            });
        }
        return data;
    });

export type ExamFormValues = z.infer<typeof examFormSchema>;
export type QuestionFormValues = z.infer<typeof questionFormSchema>;
