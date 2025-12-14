"use client";

import {useContext, useTransition} from "react";
import {useRouter} from "next/navigation";
import toast from "react-hot-toast";

import {EventPlan} from "@/lib/types";
import {publishEventPlan} from "@/lib/api/eventPlan";
import {SessionContext} from "@/lib/auth/session-provider";

export default function AdminPublishButton({eventPlan}: { eventPlan: EventPlan }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const session = useContext(SessionContext);

    const confirmPublish = () => {
        toast.custom((t) => (
            <div className="bg-white shadow-lg rounded-md p-4 border border-gray-200 w-72">
                <p className="font-semibold text-gray-900">Publish Event?</p>
                <p className="text-sm text-gray-600 mt-1">
                    Once published, this cannot be undone. Continue?
                </p>

                <div className="flex justify-end gap-2 mt-3">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 rounded-md border text-red-500 text-sm"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            handlePublish();
                        }}
                        className="px-3 py-1 rounded-md bg-green-600 text-white text-sm"
                    >
                        Yes, publish
                    </button>
                </div>
            </div>
        ));
    };

    const handlePublish = () => {
        startTransition(async () => {
            try {
                await publishEventPlan(eventPlan.id, session);

                toast.success("Event plan published successfully!");
                router.push(`/?focus=${eventPlan.placeInvitation?.place.id}`);

            } catch {
                toast.error("Failed to publish event plan. Check if place accepted invitation and there are no pending performer invitation!");
            }
        });
    };

    return (
        <button
            type="button"
            onClick={confirmPublish}
            disabled={isPending}
            className="rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? "Publishing…" : "Publish event"}
        </button>
    );
}
