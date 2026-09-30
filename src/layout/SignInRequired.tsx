import { useAuth } from "@/auth/provider";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import layout from "@/components/layout.module.scss";
import text from "@/components/typography.module.scss";

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
                <h1 className={text.pageTitle}>Sign in required</h1>
                <p className={text.lead}>{message}</p>
                <Button className={layout.action} onClick={() => login(returnTo)}>
                    Go to login
                </Button>
            </Card>
        </PageShell>
    );
}
