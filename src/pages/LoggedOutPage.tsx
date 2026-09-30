import { ShieldCheck } from "lucide-react";
import { Navigate } from "react-router";

import { ButtonLink } from "@/components/Button";
import { useAuth } from "@/lib/auth/AuthProvider";

import styles from "./LoggedOutPage.module.css";

export function LoggedOutPage() {
    const { status } = useAuth();
    if (status === "authenticated") return <Navigate to="/" replace />;

    return (
        <main className={styles.main}>
            <ShieldCheck className={styles.icon} aria-hidden />
            <h1 className={styles.title}>You are now logged out</h1>
            <ButtonLink to="/">Go back home</ButtonLink>
        </main>
    );
}
