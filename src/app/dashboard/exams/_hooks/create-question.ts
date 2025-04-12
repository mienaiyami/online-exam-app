import { api } from "@/trpc/react";
import { toast } from "sonner";

export const useCreateQuestion = (cb?: () => void) => {
    const utils = api.useUtils();
    return api.exam.addQuestion.useMutation({
        onSuccess: async () => {
            toast.success("Question added successfully!");
            await utils.exam.invalidate();
            cb?.();
        },
        onError: (error) => {
            toast.error(`Failed to add question: ${error.message}`);
        },
    });
};
