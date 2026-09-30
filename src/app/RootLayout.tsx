import { Outlet } from "react-router";
import { ConsentBanner } from "@/components/ConsentBanner";

export function RootLayout() {
    return (
        <>
            <Outlet />
            <ConsentBanner />
        </>
    );
}
