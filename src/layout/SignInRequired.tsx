import { useAuth } from "@/auth/provider";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import text from "@/components/typography.module.scss";

import { PageShell } from "./PageShell";
import styles from "./SignInRequired.module.scss";

interface SignInRequiredProps {
    message?: string;
    returnTo: string;
}

export function SignInRequired({
    message = "You need to be signed in to view this page.",
    returnTo,
}: SignInRequiredProps) {
    const { login, register } = useAuth();
    return (
        <PageShell>
            <Card padded>
                <h1 className={text.pageTitle}>Sign in required</h1>
                <p className={text.lead}>{message}</p>
                <div className={styles.actions}>
                    <Button onClick={() => login(returnTo)}>Go to login</Button>
                    <Button variant="secondary" onClick={() => register(returnTo)}>
                        Create account
                    </Button>
                </div>
            </Card>
        </PageShell>
    );
}
