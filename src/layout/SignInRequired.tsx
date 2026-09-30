import { useAuth } from "@/auth/provider";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

import { PageShell } from "./PageShell";

interface SignInRequiredProps {
    message?: string;
    returnTo: string;
}

export function SignInRequired({
    message = "You need to be signed in to view this page.",
    returnTo,
}: SignInRequiredProps) {
    const { login } = useAuth();
    return (
        <PageShell>
            <Card padded>
                <h1 className="page-title">Sign in required</h1>
                <p className="text-muted" style={{ marginTop: "var(--space-2)" }}>
                    {message}
                </p>
                <Button style={{ marginTop: "var(--space-4)" }} onClick={() => login(returnTo)}>
                    Go to login
                </Button>
            </Card>
        </PageShell>
    );
}
