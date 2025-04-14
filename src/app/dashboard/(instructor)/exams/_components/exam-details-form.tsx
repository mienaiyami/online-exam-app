"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { type ExamFormValues, examFormSchema } from "../_hooks/schema";

type ExamDetailsFormProps = {
    onSubmit: (values: ExamFormValues) => void;
    defaultValues?: Partial<ExamFormValues>;
    submitLabel?: string;
};

export function ExamDetailsForm({
    onSubmit,
    defaultValues = {
        title: "",
        description: "",
        timeLimit: 60,
    },
    submitLabel = "Continue",
}: ExamDetailsFormProps) {
    const form = useForm<ExamFormValues>({
        resolver: zodResolver(examFormSchema),
        defaultValues,
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 pb-10"
            >
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Exam Title</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter exam title"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    The title of your exam that will be visible
                                    to students.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter exam description"
                                        className="min-h-32 resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Provide details about the exam content and
                                    instructions.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="timeLimit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Time Limit (minutes)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        {...field}
                                        onChange={(e) =>
                                            field.onChange(
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </FormControl>
                                <FormDescription>
                                    The amount of time students have to complete
                                    the exam.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <FormField
                            control={form.control}
                            name="availableFrom"
                            render={({ field }) => (
                                <FormItem className="flex flex-1 flex-col">
                                    <FormLabel>Available From</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            "PPP",
                                                        )
                                                    ) : (
                                                        <span>Select date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        When the exam becomes available to
                                        students.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="availableTo"
                            render={({ field }) => (
                                <FormItem className="flex flex-1 flex-col">
                                    <FormLabel>Available To</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            "PPP",
                                                        )
                                                    ) : (
                                                        <span>Select date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                                disabled={(date) =>
                                                    date <
                                                    (form.getValues()
                                                        .availableFrom ??
                                                        new Date())
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        When the exam is no longer available to
                                        students.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto">
                    {submitLabel}
                </Button>
            </form>
        </Form>
    );
}
