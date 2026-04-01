import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing-page-hero";

export const metadata = {
  title: "Privacy Policy | The PATNA Initiative",
  description:
    "How The PATNA Initiative collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <MarketingPageHero
        label="Legal"
        subtitle="How we collect, use, and protect your personal information."
        title="Privacy Policy"
      />

      <section className="section">
        <div className="section-inner">
          <div className="content-card legal-doc">

            <p className="legal-effective">
              <strong>Effective date:</strong> 1 April 2026 &nbsp;·&nbsp;{" "}
              <strong>Last updated:</strong> 1 April 2026
            </p>

            <h2>1. Who we are</h2>
            <p>
              The PATNA Initiative ("<strong>PATNA</strong>", "<strong>we</strong>",
              "<strong>us</strong>", or "<strong>our</strong>") is a community platform that
              connects evidence, coordination, and institutional action for African climate,
              maritime, and energy transition leadership.
            </p>
            <address className="legal-address">
              The PATNA Initiative<br />
              JLARZON ADJ, University of Liberia, Fendell Campus<br />
              Montserrado, Monrovia, Liberia<br />
              <a href="mailto:contact@thepatna.org">contact@thepatna.org</a><br />
              +231 886 551 782 · +231 889 145 072
            </address>

            <h2>2. Scope of this policy</h2>
            <p>
              This Privacy Policy applies to all personal information we collect through our
              website (<strong>thepatna.org</strong>), member workspace, community application
              form, event registrations, and any other services we operate (collectively, the
              "<strong>Services</strong>"). By using our Services you agree to the practices
              described in this policy.
            </p>

            <h2>3. Information we collect</h2>
            <h3>3.1 Information you provide directly</h3>
            <ul>
              <li><strong>Account information</strong> — name, email address, password, and role when you create a member account or complete a community application.</li>
              <li><strong>Profile information</strong> — professional biography, organisation, areas of expertise, headshot, and any other information you add to your member profile.</li>
              <li><strong>Application data</strong> — responses to the community application form, including motivation, expertise areas, and engagement preferences.</li>
              <li><strong>Communications</strong> — messages, enquiries, or feedback you send to us by email or through contact forms.</li>
              <li><strong>Event registrations</strong> — name, email, and any additional details you provide when registering for PATNA events.</li>
              <li><strong>Calendar data</strong> — if you choose to connect an external calendar, we receive and store event information necessary to display availability and sync scheduling.</li>
            </ul>

            <h3>3.2 Information collected automatically</h3>
            <ul>
              <li><strong>Usage data</strong> — pages visited, features used, timestamps, and navigation paths within the workspace.</li>
              <li><strong>Device and browser data</strong> — IP address, browser type and version, operating system, and referring URL, collected through standard server logs.</li>
              <li><strong>Cookies and similar technologies</strong> — session cookies necessary for authentication and preference cookies to remember your settings. We do not use advertising or cross-site tracking cookies.</li>
            </ul>

            <h3>3.3 Information from third parties</h3>
            <p>
              If you connect a third-party calendar service (Google Calendar, Microsoft Outlook,
              or similar), we receive only the data you explicitly authorise through that
              provider's OAuth flow.
            </p>

            <h2>4. How we use your information</h2>
            <ul>
              <li>Operate and maintain your member account and workspace.</li>
              <li>Review and process community membership applications.</li>
              <li>Communicate with you about your membership, events, and community activities.</li>
              <li>Send newsletters and updates where you have opted in.</li>
              <li>Provide and improve the scheduling and calendar features.</li>
              <li>Ensure the security and integrity of our platform.</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information to third
              parties for marketing purposes.
            </p>

            <h2>5. Legal basis for processing (where applicable)</h2>
            <p>
              Where data protection laws require a legal basis for processing, we rely on:
            </p>
            <ul>
              <li><strong>Contract performance</strong> — processing necessary to provide the Services you have requested.</li>
              <li><strong>Legitimate interests</strong> — improving our platform, ensuring security, and communicating about our mission, where these interests are not overridden by your rights.</li>
              <li><strong>Consent</strong> — for optional communications such as newsletters and for connecting third-party calendar services.</li>
              <li><strong>Legal obligation</strong> — where we are required to process data by law.</li>
            </ul>

            <h2>6. Data sharing and disclosure</h2>
            <p>We share personal information only in the following circumstances:</p>
            <ul>
              <li><strong>Service providers</strong> — we use Supabase (database and authentication) and Vercel (hosting). These providers process data on our behalf under data processing agreements and are not permitted to use your data for their own purposes.</li>
              <li><strong>Within the community</strong> — limited profile information (name, role, organisation, and areas of expertise) is visible to other verified PATNA members within the workspace. You control what you add to your profile.</li>
              <li><strong>Legal requirements</strong> — we may disclose information if required by law, court order, or to protect the rights and safety of PATNA, its members, or the public.</li>
              <li><strong>Business transfers</strong> — if PATNA is involved in a merger, acquisition, or transfer of assets, member data may be transferred as part of that transaction, subject to appropriate safeguards.</li>
            </ul>

            <h2>7. Data retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as
              needed to provide the Services. If you close your account, we will delete or
              anonymise your data within <strong>90 days</strong>, except where we are required
              to retain it for legal compliance purposes. Application data from unsuccessful or
              withdrawn applications is retained for up to <strong>12 months</strong>, then
              deleted.
            </p>

            <h2>8. Your rights</h2>
            <p>
              Depending on your location, you may have the following rights regarding your
              personal information:
            </p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — request that we correct inaccurate or incomplete data.</li>
              <li><strong>Deletion</strong> — request that we delete your personal data (subject to our legal obligations).</li>
              <li><strong>Portability</strong> — receive your data in a structured, commonly used format.</li>
              <li><strong>Objection / restriction</strong> — object to or request restriction of certain processing activities.</li>
              <li><strong>Withdraw consent</strong> — where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:contact@thepatna.org">contact@thepatna.org</a>. We will respond
              within 30 days.
            </p>

            <h2>9. Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your
              personal information, including encrypted data storage, secure HTTPS connections,
              and access controls limited to authorised personnel. No system is completely
              secure; if you become aware of any security concern, please notify us immediately
              at <a href="mailto:contact@thepatna.org">contact@thepatna.org</a>.
            </p>

            <h2>10. Cookies</h2>
            <p>
              We use only essential cookies required for authentication and session management.
              No third-party advertising or analytics cookies are set. You can disable cookies
              in your browser settings, but this may prevent you from signing in to the member
              workspace.
            </p>

            <h2>11. Children's privacy</h2>
            <p>
              Our Services are not directed to individuals under the age of 18. We do not
              knowingly collect personal information from minors. If you believe a minor has
              provided us with personal information, please contact us and we will delete it
              promptly.
            </p>

            <h2>12. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify members of
              material changes by email or by posting a notice in the workspace. Continued use
              of the Services after the effective date of any update constitutes acceptance of
              the revised policy.
            </p>

            <h2>13. Contact us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or
              your personal data, please contact:
            </p>
            <address className="legal-address">
              The PATNA Initiative — Data Enquiries<br />
              JLARZON ADJ, University of Liberia, Fendell Campus<br />
              Montserrado, Monrovia, Liberia<br />
              <a href="mailto:contact@thepatna.org">contact@thepatna.org</a><br />
              +231 886 551 782 · +231 889 145 072
            </address>

            <div className="legal-nav-row">
              <Link href="/legal/terms">Read our Terms of Service →</Link>
              <Link href="/legal">Back to Legal overview</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
