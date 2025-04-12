import { api } from "@/trpc/react";
import { toast } from "sonner";

export const useDeleteQuestion = (cb?: () => void) => {
    const utils = api.useUtils();
    return api.exam.deleteQuestion.useMutation({
        onSuccess: async () => {
            toast.success("Question deleted successfully!");
            await utils.exam.invalidate();
            cb?.();
        },
        onError: (error) => {
            toast.error(`Failed to delete question: ${error.message}`);
        },
    });
};
