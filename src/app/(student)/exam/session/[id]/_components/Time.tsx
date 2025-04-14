import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function Time({
    onTimeUp,
    startedAt,
    timeLimit,
}: {
    onTimeUp: () => void;
    startedAt: number;
    timeLimit: number;
}) {
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    const formattedTimeRemaining = useMemo(() => {
        if (timeRemaining === null) return "--:--:--";

        const totalSeconds = Math.floor(timeRemaining / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }, [timeRemaining]);

    useEffect(() => {
        if (!startedAt) return;

        const expiryTime = startedAt + timeLimit * 60 * 1000;

        const calculateTimeRemaining = () => {
            const now = Date.now();
            const remaining = Math.max(0, expiryTime - now);
            setTimeRemaining(remaining);

            if (remaining <= 0) {
                onTimeUp();
            }
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [startedAt, onTimeUp, timeLimit]);

    return (
        <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-2 font-mono text-lg font-medium">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span
                className={cn(
                    timeRemaining !== null &&
                        timeRemaining < 5 * 60 * 1000 &&
                        "animate-pulse text-red-500",
                )}
            >
                {formattedTimeRemaining}
            </span>
        </div>
    );
}
