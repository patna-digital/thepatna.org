import Link from "next/link";
import { MarketingPageHero } from "@/components/marketing-page-hero";

export const metadata = {
  title: "Terms of Service | The PATNA Initiative",
  description:
    "The terms and conditions governing use of The PATNA Initiative platform and community workspace.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <MarketingPageHero
        label="Legal"
        subtitle="The terms and conditions governing your use of the PATNA platform and community workspace."
        title="Terms of Service"
      />

      <section className="section">
        <div className="section-inner">
          <div className="content-card legal-doc">

            <p className="legal-effective">
              <strong>Effective date:</strong> 1 April 2026 &nbsp;·&nbsp;{" "}
              <strong>Last updated:</strong> 1 April 2026
            </p>

            <p>
              Please read these Terms of Service ("<strong>Terms</strong>") carefully before
              using the services provided by The PATNA Initiative. By accessing or using any
              part of our Services, you agree to be bound by these Terms.
            </p>

            <h2>1. About PATNA</h2>
            <p>
              The PATNA Initiative ("<strong>PATNA</strong>", "<strong>we</strong>",
              "<strong>us</strong>", or "<strong>our</strong>") operates a community platform
              that facilitates evidence sharing, coordination, and institutional engagement in
              African climate, maritime, and energy transition policy. Our Services include
              this website (<strong>thepatna.org</strong>), the member workspace, community
              application system, event listings, publications, and scheduling tools
              (collectively the "<strong>Services</strong>").
            </p>
            <address className="legal-address">
              The PATNA Initiative<br />
              JLARZON ADJ, University of Liberia, Fendell Campus<br />
              Montserrado, Monrovia, Liberia<br />
              <a href="mailto:contact@thepatna.org">contact@thepatna.org</a><br />
              +231 886 551 782 · +231 889 145 072
            </address>

            <h2>2. Eligibility and accounts</h2>
            <p>
              Membership in the PATNA community is by application and invitation. To create an
              account you must:
            </p>
            <ul>
              <li>Be at least 18 years of age.</li>
              <li>Have received an invitation or have an approved community application.</li>
              <li>Provide accurate and complete information during registration.</li>
              <li>Keep your login credentials confidential and not share them with others.</li>
            </ul>
            <p>
              You are responsible for all activity that occurs under your account. If you
              suspect unauthorised access, notify us immediately at{" "}
              <a href="mailto:contact@thepatna.org">contact@thepatna.org</a>.
            </p>

            <h2>3. Acceptable use</h2>
            <p>When using the Services you agree to:</p>
            <ul>
              <li>Use the Services only for lawful purposes and in a manner consistent with PATNA's mission of constructive policy engagement and coordination.</li>
              <li>Treat all community members, staff, and partners with respect and professionalism.</li>
              <li>Not upload, share, or transmit content that is unlawful, defamatory, harassing, fraudulent, or otherwise harmful.</li>
              <li>Not attempt to gain unauthorised access to any part of the Services, other members' accounts, or PATNA's infrastructure.</li>
              <li>Not use the Services to distribute spam, unsolicited commercial messages, or malware.</li>
              <li>Not scrape, harvest, or systematically extract data from the platform without prior written permission.</li>
              <li>Not misrepresent your identity, affiliation, or credentials within the community.</li>
            </ul>
            <p>
              PATNA reserves the right to suspend or terminate access for any member who
              violates these standards, with or without notice, at our sole discretion.
            </p>

            <h2>4. Community application</h2>
            <p>
              Submitting a community application does not guarantee membership. PATNA reviews
              all applications and makes admission decisions at its sole discretion, considering
              alignment with the community's focus areas and capacity. We are not obligated to
              explain individual admission decisions.
            </p>

            <h2>5. Member content</h2>
            <p>
              You retain ownership of any original content you submit to the Services, including
              profile information, discussion contributions, and uploaded documents
              ("<strong>Member Content</strong>"). By submitting Member Content you grant PATNA
              a non-exclusive, royalty-free, worldwide licence to use, display, reproduce, and
              distribute that content solely for the purpose of operating and improving the
              Services and promoting PATNA's mission.
            </p>
            <p>
              You are solely responsible for your Member Content and represent that it does not
              infringe any third-party intellectual property rights or violate any applicable
              law.
            </p>

            <h2>6. PATNA intellectual property</h2>
            <p>
              All content, design, code, logos, trademarks, and materials produced or owned by
              PATNA are protected by applicable intellectual property laws. You may not
              reproduce, redistribute, or create derivative works from PATNA materials without
              express written permission, except as permitted by applicable law or as expressly
              stated in a specific content licence.
            </p>

            <h2>7. Publications and insights</h2>
            <p>
              Policy briefs, working papers, and other publications made available through the
              Services are provided for informational and educational purposes. They represent
              the views of their authors and do not constitute legal, financial, or policy
              advice. PATNA makes no warranty as to the accuracy or completeness of any
              publication.
            </p>

            <h2>8. Calendar and scheduling features</h2>
            <p>
              The scheduling and calendar tools are provided as a convenience for community
              coordination. If you connect a third-party calendar service, you do so subject to
              that provider's own terms. PATNA is not responsible for errors, conflicts, or data
              loss arising from third-party calendar integrations.
            </p>

            <h2>9. Third-party links and services</h2>
            <p>
              The Services may contain links to external websites or integrate third-party
              services. These are provided for convenience only. PATNA does not endorse and is
              not responsible for the content, privacy practices, or availability of any
              third-party service.
            </p>

            <h2>10. Disclaimer of warranties</h2>
            <p>
              The Services are provided "<strong>as is</strong>" and "
              <strong>as available</strong>" without warranties of any kind, express or implied,
              including but not limited to implied warranties of merchantability, fitness for a
              particular purpose, or non-infringement. PATNA does not warrant that the Services
              will be uninterrupted, error-free, or free of harmful components.
            </p>

            <h2>11. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by applicable law, PATNA and its staff, partners,
              and affiliates shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including loss of data, revenue, or goodwill,
              arising out of or in connection with your use of the Services, even if advised of
              the possibility of such damages. Our total aggregate liability for any claim
              arising from these Terms shall not exceed the amount you paid (if any) to PATNA
              in the three months preceding the claim.
            </p>

            <h2>12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless PATNA and its staff, partners,
              and affiliates from and against any claims, liabilities, damages, losses, and
              expenses (including reasonable legal fees) arising from your violation of these
              Terms, your Member Content, or your use of the Services.
            </p>

            <h2>13. Termination</h2>
            <p>
              Either party may terminate the membership relationship at any time. You may close
              your account by contacting us at{" "}
              <a href="mailto:contact@thepatna.org">contact@thepatna.org</a>. PATNA may suspend
              or terminate your access immediately and without notice if you breach these Terms
              or for any other reason at our discretion. Upon termination, your right to access
              the Services ceases; provisions that by their nature should survive (intellectual
              property, limitation of liability, indemnification, governing law) remain in
              effect.
            </p>

            <h2>14. Governing law and disputes</h2>
            <p>
              These Terms are governed by the laws of the Republic of Liberia. Any dispute
              arising from or relating to these Terms or the Services shall be subject to the
              exclusive jurisdiction of the courts of Montserrado County, Liberia. If any
              provision of these Terms is found to be unenforceable, the remaining provisions
              shall continue in full force.
            </p>

            <h2>15. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify active members of
              material changes by email or by notice in the workspace at least 14 days before
              the changes take effect. Continued use of the Services after the effective date
              constitutes acceptance of the revised Terms.
            </p>

            <h2>16. Contact us</h2>
            <p>Questions about these Terms should be directed to:</p>
            <address className="legal-address">
              The PATNA Initiative<br />
              JLARZON ADJ, University of Liberia, Fendell Campus<br />
              Montserrado, Monrovia, Liberia<br />
              <a href="mailto:contact@thepatna.org">contact@thepatna.org</a><br />
              +231 886 551 782 · +231 889 145 072
            </address>

            <div className="legal-nav-row">
              <Link href="/legal/privacy">Read our Privacy Policy →</Link>
              <Link href="/legal">Back to Legal overview</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
