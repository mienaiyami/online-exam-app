"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Trash2, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { type QuestionFormValues, questionFormSchema } from "../create/schema";

type QuestionFormProps = {
    onSubmit: (values: QuestionFormValues) => void;
    defaultValues?: Partial<QuestionFormValues>;
    questionIndex: number;
};

export function QuestionForm({
    onSubmit,
    defaultValues = {
        questionText: "",
        questionType: "multiple_choice" as const,
        points: 1,
        orderIndex: 0,
        options: [
            { optionText: "", isCorrect: false, orderIndex: 0 },
            { optionText: "", isCorrect: false, orderIndex: 1 },
        ],
    },
    questionIndex,
}: QuestionFormProps) {
    const form = useForm({
        resolver: zodResolver(questionFormSchema),
        defaultValues: defaultValues as QuestionFormValues,
    });

    const questionType = form.watch("questionType");

    const options = form.watch("options") ?? [];

    const addOption = () => {
        const currentOptions = form.getValues("options") ?? [];
        form.setValue("options", [
            ...currentOptions,
            {
                optionText: "",
                isCorrect: false,
                orderIndex: currentOptions.length,
            },
        ]);
    };

    const removeOption = (index: number) => {
        const currentOptions = form.getValues("options") ?? [];
        form.setValue(
            "options",
            currentOptions
                .filter((_, i) => i !== index)
                .map((option, i) => ({ ...option, orderIndex: i })),
        );
    };

    console.log(form.formState.errors);

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                ref={(node) => {
                    node?.scrollIntoView({ behavior: "smooth" });
                }}
            >
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                            Question {questionIndex + 1}
                        </h3>
                        <div className="flex items-center space-x-4">
                            <FormField
                                control={form.control}
                                name="points"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2">
                                        <FormLabel className="text-sm">
                                            Points:
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                className="w-20"
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        Number(e.target.value),
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="questionType"
                                render={({ field }) => (
                                    <FormItem>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                if (val !== "multiple_choice") {
                                                    form.setValue(
                                                        "options",
                                                        undefined,
                                                    );
                                                }
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-36">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="multiple_choice">
                                                    Multiple Choice
                                                </SelectItem>
                                                <SelectItem value="short_answer">
                                                    Short Answer
                                                </SelectItem>
                                                <SelectItem value="essay">
                                                    Essay
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="questionText"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Question Text</FormLabel>
                                    <FormControl>
                                        <RichTextEditor
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Enter your question here..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {questionType === "multiple_choice" && (
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <FormLabel>Options</FormLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addOption}
                                        className="flex items-center gap-1"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        <span>Add Option</span>
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {options.map((_, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start space-x-2 rounded-md border p-3"
                                        >
                                            <GripVertical className="mt-2 h-5 w-5 text-muted-foreground" />

                                            <div className="flex-1 space-y-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`options.${index}.optionText`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={`Option ${index + 1}`}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="flex items-center space-x-2 self-center">
                                                <FormField
                                                    control={form.control}
                                                    name={`options.${index}.isCorrect`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        checked={
                                                                            field.value
                                                                        }
                                                                        onCheckedChange={
                                                                            field.onChange
                                                                        }
                                                                        id={`option-${index}-correct`}
                                                                    />
                                                                    <label
                                                                        htmlFor={`option-${index}-correct`}
                                                                        className="text-sm font-medium"
                                                                    >
                                                                        Correct
                                                                    </label>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        removeOption(index)
                                                    }
                                                    disabled={
                                                        options.length <= 2
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {form.formState.errors.options && (
                                    <p className="text-sm font-medium text-destructive">
                                        {form.formState.errors.options.message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit">Save Question</Button>
                </div>
            </form>
        </Form>
    );
}
