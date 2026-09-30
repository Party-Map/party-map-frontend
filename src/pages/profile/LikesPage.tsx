import { useMyLikes } from "@/api/hooks";
import { useAuth } from "@/auth/provider";
import layout from "@/components/layout.module.scss";
import { LoadingState } from "@/components/States";
import text from "@/components/typography.module.scss";
import { PageShell } from "@/layout/PageShell";
import { RequireAuth } from "@/layout/RequireAuth";

import { LikedTabs } from "./LikedTabs";

/** Everything the signed-in user has liked, grouped by kind. */
export function LikesPage() {
    const { status } = useAuth();
    const likes = useMyLikes({ enabled: status === "authenticated" });

    return (
        <RequireAuth message="You need to be signed in to view your likes.">
            <PageShell>
                <div className={layout.stack}>
                    <h1 className={text.pageTitle}>Your likes</h1>
                    <p className={text.muted}>View and manage the events, places and performers you’ve liked.</p>
                    {likes.data ? <LikedTabs {...likes.data} /> : <LoadingState />}
                </div>
            </PageShell>
        </RequireAuth>
    );
}
