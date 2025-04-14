"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface BulkAssignProps {
    examId: number;
}

export function BulkAssign({ examId }: BulkAssignProps) {
    const [csvInput, setCsvInput] = useState("");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [resultData, setResultData] = useState<
        RouterOutputs["exam"]["assignExamBulk"] | null
    >(null);

    const { mutate: assignExam, isPending: isAssigning } =
        api.exam.assignExamBulk.useMutation({
            onSuccess: (data) => {
                if (data.assignedCount === 0) {
                    toast.error("No students assigned", {
                        description: "No students were assigned to the exam",
                    });
                    return;
                }
                toast.success("Exam assignment complete", {
                    description: `Successfully assigned exam to ${data.assignedCount} students.`,
                });
                setResultData(data);
            },
            onError: (error) => {
                toast.error("Error assigning exam", {
                    description: error.message,
                });
            },
        });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setUploadedFile(e.target.files[0]);
            setCsvInput("");
        }
    };

    const handleFileUpload = async () => {
        if (!uploadedFile) return;

        const fileContent = await readFileAsText(uploadedFile);
        processCsvData(fileContent);
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    };

    const handleDirectInput = () => {
        if (!csvInput.trim()) {
            toast.error("Empty input", {
                description: "Please enter user IDs or emails",
            });
            return;
        }

        processCsvData(csvInput);
    };

    const processCsvData = (data: string) => {
        const lines = data
            .split(/[\r\n,]+/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length === 0) {
            toast.error("No valid data", {
                description: "No valid user IDs or emails found in the input",
            });
            return;
        }

        const userIdentifiers = lines.map((line) => {
            return line.includes("@")
                ? ({ type: "email", value: line } as const)
                : ({ type: "id", value: line } as const);
        });

        assignExam({
            examId,
            userIdentifiers,
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Assign Students</CardTitle>
                    <CardDescription>
                        Assign multiple students to this exam by uploading a CSV
                        file or entering a list of user IDs or emails.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="upload" className="w-full select-none">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                            <TabsTrigger value="input">
                                Direct Input
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="space-y-4 pt-4">
                            <Label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-12">
                                <UploadCloud className="mb-4 h-10 w-10 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    Drag and drop your CSV file, or click to
                                    browse
                                </p>

                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {uploadedFile && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Selected: {uploadedFile.name}
                                    </p>
                                )}
                            </Label>
                            <Button
                                onClick={handleFileUpload}
                                disabled={!uploadedFile || isAssigning}
                                className="w-full"
                            >
                                {isAssigning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Upload and Assign"
                                )}
                            </Button>
                        </TabsContent>
                        <TabsContent value="input" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="csvInput">
                                    Enter user IDs or emails (one per line or
                                    comma-separated)
                                </Label>
                                <Textarea
                                    id="csvInput"
                                    placeholder="user1@example.com,user2@example.com"
                                    value={csvInput}
                                    onChange={(e) =>
                                        setCsvInput(e.target.value)
                                    }
                                    rows={8}
                                    className="resize-none font-mono"
                                />
                            </div>
                            <Button
                                onClick={handleDirectInput}
                                disabled={!csvInput.trim() || isAssigning}
                                className="w-full"
                            >
                                {isAssigning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Process and Assign"
                                )}
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {resultData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Assignment Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="space-y-1 rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">
                                    Total Input
                                </p>
                                <p className="text-2xl font-bold">
                                    {resultData.totalInputCount}
                                </p>
                            </div>
                            <div className="space-y-1 rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">
                                    Successfully Assigned
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {resultData.assignedCount}
                                </p>
                            </div>
                            <div className="space-y-1 rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">
                                    Already Assigned
                                </p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {resultData.alreadyAssignedCount}
                                </p>
                            </div>
                            <div className="space-y-1 rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">
                                    Not Found
                                </p>
                                <p className="text-2xl font-bold text-red-600">
                                    {resultData.notFoundCount.length}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {resultData.notFoundCount.length > 0 && (
                            <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                <p>
                                    Some users were not found. Make sure all
                                    email addresses or IDs are correct.
                                </p>
                            </div>
                        )}

                        {resultData.assignedCount > 0 && (
                            <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-300">
                                <p>
                                    Exam has been successfully assigned to{" "}
                                    {resultData.assignedCount} students.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
