import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useFinalizeExam = () => {
    const router = useRouter();
    const utils = api.useUtils();
    return api.exam.finalizeExam.useMutation({
        onSuccess: async () => {
            toast.success("Exam finalized successfully!");
            await utils.exam.invalidate();
            router.push("/dashboard/exams");
        },
        onError: (error) => {
            toast.error(`Failed to finalize exam: ${error.message}`);
        },
    });
};
