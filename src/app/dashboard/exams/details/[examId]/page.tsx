"use client";
import { useParams } from "next/navigation";

export default function ExamDetailsPage() {
    const params = useParams();

    return (
        <div className="flex flex-row">
            {JSON.stringify(params, null, "\n")}
        </div>
    );
}
