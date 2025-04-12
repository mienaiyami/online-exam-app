"use client";

import { useState, useEffect } from "react";
import { Reorder } from "motion/react";
import { GripVertical, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ReorderQuestionsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const examId = Number(params.id);

    const [isDragging, setIsDragging] = useState<number | null>(null);

    const utils = api.useUtils();

    const { data: questions, isLoading } = api.exam.getQuestions.useQuery({
        examId,
    });

    const { mutate: reorderQuestions } = api.exam.reorderQuestions.useMutation({
        onSuccess: async () => {
            toast.success("Questions reordered successfully");
            await utils.exam.invalidate();
            router.push(`/dashboard/exams/${examId}/`);
        },
    });

    const [questionOrder, setQuestionOrder] = useState<number[]>([]);

    useEffect(() => {
        if (questions) {
            setQuestionOrder(questions.map((q) => q.id));
        }
    }, [questions]);

    const handleResetOrder = () => {
        if (questions) {
            setQuestionOrder(questions.map((q) => q.id));
        }
    };

    const handleSaveOrder = () => {
        reorderQuestions({
            examId,
            questionIds: questionOrder,
        });
    };

    if (isLoading)
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );

    if (!questions)
        return (
            <div className="flex h-full items-center justify-center">
                <p>No questions found</p>
            </div>
        );

    return (
        <div className="container max-w-4xl overflow-clip py-10">
            <div className="mb-6 flex items-center gap-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Reorder Questions
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        ExamId: {examId}
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="ml-auto"
                    onClick={handleResetOrder}
                >
                    Reset
                </Button>
                <Button onClick={handleSaveOrder}>Save Order</Button>
            </div>

            <Reorder.Group
                axis="y"
                values={questionOrder}
                onReorder={setQuestionOrder}
                className="space-y-3 px-4"
            >
                {questionOrder.map((id, index) => {
                    const question = questions.find((q) => q.id === id);
                    if (!question) return null;

                    return (
                        <Reorder.Item
                            key={question.id}
                            value={question.id}
                            className="cursor-grab"
                            whileDrag={{
                                zIndex: 100,
                            }}
                            onDragStart={() => setIsDragging(question.id)}
                            onDragEnd={() => setIsDragging(null)}
                            layout
                        >
                            <Card
                                className={`flex items-center gap-3 p-4 ring-1 ${
                                    isDragging === question.id
                                        ? "ring-primary/40"
                                        : "ring-transparent"
                                }`}
                            >
                                <GripVertical className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                <div className="line-clamp-2">
                                    {index + 1}. {question.questionText}
                                </div>
                            </Card>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>
        </div>
    );
}
