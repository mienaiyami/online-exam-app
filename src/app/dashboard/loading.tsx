import { Loader2 } from "lucide-react";

export default function ExamsLoading() {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-20 w-20 animate-spin" />
        </div>
    );
}
