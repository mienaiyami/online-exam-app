import { api } from "@/trpc/react";
import { toast } from "sonner";

export const useUpdateQuestion = (cb?: () => void) => {
    const utils = api.useUtils();
    return api.exam.updateQuestion.useMutation({
        onSuccess: async () => {
            toast.success("Question updated successfully!");
            await utils.exam.invalidate();
            cb?.();
        },
        onError: (error) => {
            toast.error(`Failed to update question: ${error.message}`);
        },
    });
};
