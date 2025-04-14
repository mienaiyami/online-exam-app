"use client";

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    type SortingState,
    getSortedRowModel,
    type RowSelectionState,
    type PaginationState,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
    pageCount?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onRowSelectionChange?: (selectedRows: TData[]) => void;
    selectionCount?: number;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    isLoading = false,
    pageCount = 1,
    onPageChange,
    onPageSizeChange,
    onRowSelectionChange,
    selectionCount = 0,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [localData, setLocalData] = useState<TData[]>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const pagination = {
        pageIndex,
        pageSize,
    };

    useEffect(() => {
        if (JSON.stringify(data) !== JSON.stringify(localData)) {
            setLocalData(data);
        }
    }, [data]);

    useEffect(() => {
        setRowSelection({});
    }, [localData]);

    useEffect(() => {
        if (onRowSelectionChange) {
            const selectedRows = localData.filter(
                (_, index) => rowSelection[index],
            );
            onRowSelectionChange(selectedRows);
        }
    }, [localData, rowSelection, onRowSelectionChange]);

    useEffect(() => {
        onPageChange?.(pageIndex);
    }, [pageIndex, onPageChange]);

    useEffect(() => {
        onPageSizeChange?.(pageSize);
    }, [pageSize, onPageSizeChange]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        state: {
            sorting,
            rowSelection,
            pagination,
        },
        pageCount: pageCount,
        manualPagination: true,
    });

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {selectionCount} of {data.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[5, 10, 20, 50].map((pageSize) => (
                                    <SelectItem
                                        key={pageSize}
                                        value={pageSize.toString()}
                                    >
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {pageIndex + 1} of {pageCount}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
