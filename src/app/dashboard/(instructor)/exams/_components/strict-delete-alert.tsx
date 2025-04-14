"use client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function StrictDeleteAlert({ onDelete }: { onDelete: () => void }) {
    const [input, setInput] = useState("");
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Exam
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this exam? This action
                        cannot be undone. All exam data, questions, and student
                        responses will be permanently removed.
                    </AlertDialogDescription>
                    <Input
                        type="text"
                        placeholder="Type 'delete' to confirm"
                        value={input}
                        ref={(node) => {
                            node?.focus();
                        }}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && input === "delete") {
                                onDelete();
                            }
                        }}
                    />
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            if (input === "delete") {
                                onDelete();
                            } else {
                                e.preventDefault();
                            }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
