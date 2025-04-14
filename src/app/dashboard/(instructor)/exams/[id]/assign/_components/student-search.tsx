"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { columns, type Student } from "./columns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2, Copy, Download, X } from "lucide-react";
import { DataTable } from "./data-table";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface StudentSearchProps {
    examId: number;
}

export function StudentSearch({ examId }: StudentSearchProps) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const debouncedQuery = useDebounce(query, 500);

    const { data: studentsData, isLoading } = api.user.searchStudents.useQuery(
        {
            query: debouncedQuery,
            page,
            limit: pageSize,
        },
        {
            enabled: debouncedQuery.length > 0,
        },
    );

    const { mutate: assignExam, isPending: isAssigning } =
        api.exam.assignExam.useMutation({
            onSuccess: (data) => {
                if (data.assignedCount > 0) {
                    toast.success(
                        `Successfully assigned ${data.assignedCount} students to exam. ${data.alreadyAssignedCount} were already assigned.`,
                    );
                } else {
                    toast.error("No students assigned", {
                        description:
                            "Please select at least one student that has not been assigned to this exam.",
                    });
                }
            },
            onError: (error) => {
                toast.error("Error assigning exam", {
                    description: error.message,
                });
            },
        });

    const [selectedRows, setSelectedRows] = useState<Student[]>([]);

    const handleSaveAsCSV = () => {
        if (selectedRows.length === 0) {
            toast.error("No students selected", {
                description: "Please select at least one student",
            });
            return;
        }

        const csvContent = [
            "id,name,email",
            ...selectedRows.map(
                (student) =>
                    `${student.id},"${student.name ?? ""}","${student.email}"`,
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        saveAs(blob, `students-${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const handleCopyToClipboard = () => {
        if (selectedRows.length === 0) {
            toast.error("No students selected", {
                description: "Please select at least one student",
            });
            return;
        }

        const ids = selectedRows.map((student) => student.id).join(",");
        void navigator.clipboard.writeText(ids);

        toast.success("Copied to clipboard", {
            description: `${selectedRows.length} student IDs copied`,
        });
    };

    const handleAssignSelected = () => {
        if (selectedRows.length === 0) {
            toast.error("No students selected", {
                description: "Please select at least one student",
            });
            return;
        }

        assignExam({
            examId,
            userIds: selectedRows.map((student) => student.id),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 flex-row">
                    <Input
                        placeholder="Search students by email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className=""
                        disabled={!query}
                        onClick={() => setQuery("")}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyToClipboard}
                        disabled={selectedRows.length === 0}
                        title="Copy student IDs to clipboard"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSaveAsCSV}
                        disabled={selectedRows.length === 0}
                        title="Download as CSV"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleAssignSelected}
                        disabled={selectedRows.length === 0 || isAssigning}
                    >
                        {isAssigning ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Assign{" "}
                        {selectedRows.length > 0
                            ? `(${selectedRows.length})`
                            : ""}
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={studentsData?.students ?? []}
                isLoading={isLoading}
                pageCount={Math.ceil(studentsData?.totalCount ?? 0 / pageSize)}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onRowSelectionChange={setSelectedRows}
                selectionCount={selectedRows.length}
            />

            {debouncedQuery &&
                !isLoading &&
                studentsData?.students.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        No students found.
                    </p>
                )}
        </div>
    );
}
