import { ShieldCheck } from "lucide-react";
import { Navigate } from "react-router";

import { useAuth } from "@/auth/provider";
import { ButtonLink } from "@/components/Button";

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
