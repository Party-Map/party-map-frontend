import { Card } from "@/components/Card";
import text from "@/components/typography.module.scss";
import { PageShell } from "@/layout/PageShell";
import { usePageMeta } from "@/lib/seo";

import styles from "./PrivacyPage.module.scss";

/** The privacy notice the sign-up page asks people to accept (and the consent banner links to). */
export function PrivacyPage() {
    usePageMeta({ title: "Privacy notice", description: "What Party Map stores about you, where and why." });

    return (
        <PageShell>
            <Card padded>
                <article className={styles.notice}>
                    <h1 className={text.pageTitle}>Privacy notice</h1>
                    <p className={text.lead}>
                        Party Map is a map of parties in Hungary. This notice says what it keeps about you, where and
                        why. It applies to terkep.party, api.terkep.party and the sign-in pages at auth.terkep.party.
                    </p>

                    <section>
                        <h2 className={text.sectionTitle}>Your account</h2>
                        <p>
                            Creating an account stores your email address, your display name and a hash of your password
                            in our sign-in service (Keycloak, run by us on our own server in the EU). We use them to
                            sign you in and to show your name on your profile and to the people you work with on events.
                            We never sell them or use them for advertising.
                        </p>
                    </section>

                    <section>
                        <h2 className={text.sectionTitle}>What the app keeps</h2>
                        <ul className={styles.list}>
                            <li>An anonymous user id that links your account to your data.</li>
                            <li>The events, places and performers you like.</li>
                            <li>
                                The places, performers, event plans and events you create or manage, including the
                                invitations between them; these are public once published.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className={text.sectionTitle}>In your browser</h2>
                        <p>
                            The site keeps your theme, your answer to the privacy banner and the last map view in your
                            browser&apos;s storage, and a sign-in session with the sign-in service. Your location is
                            used only in your browser, to centre the map and sort lists by distance, and only when you
                            allow it. There are no advertising or cross-site tracking cookies. The logo&apos;s font is
                            loaded from Google Fonts, which sees your IP address when it is fetched.
                        </p>
                    </section>

                    <section>
                        <h2 className={text.sectionTitle}>Map data</h2>
                        <p>
                            The map is drawn from our own copy of the OpenStreetMap data (&copy; OpenMapTiles &copy;
                            OpenStreetMap contributors); loading it sends no request to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className={text.sectionTitle}>Your rights</h2>
                        <p>
                            You can see and change your account details from your profile. To get a copy of your data or
                            to delete your account, write to{" "}
                            <a className={styles.link} href="mailto:adrian@szell.dev">
                                adrian@szell.dev
                            </a>
                            .
                        </p>
                    </section>
                </article>
            </Card>
        </PageShell>
    );
}
