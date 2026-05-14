import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Rent Eazy',
  description: 'Privacy Policy explaining how Rent Eazy collects, uses, and protects your personal data in Uganda.',
};

const LAST_UPDATED = '13 May 2026';
const CONTACT_EMAIL = 'privacy@renteazy.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-3">{title}</h2>
      <div className="text-stone-600 dark:text-slate-400 text-sm leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">

      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-orange-500 hover:underline text-sm font-medium">← Back to Rent Eazy</Link>
        <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white mt-4 mb-2">Privacy Policy</h1>
        <p className="text-stone-400 dark:text-slate-500 text-sm">Last updated: {LAST_UPDATED}</p>
        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
          <p className="text-sm text-stone-700 dark:text-slate-300">
            <strong>Summary:</strong> We collect only what is necessary to operate the Platform. We do not sell your data.
            You can request deletion of your data at any time.
          </p>
        </div>
      </div>

      <div className="prose-sm max-w-none">

        <Section title="1. Who We Are">
          <p>
            Rent Eazy (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a property rental and services marketplace based in Uganda.
            We operate the Platform at <span className="font-mono text-xs bg-stone-100 dark:bg-slate-700 px-1 rounded">rent-eazy.vercel.app</span>.
          </p>
          <p>
            We are the data controller for personal data collected through the Platform. For data-related enquiries,
            contact our Privacy Officer at <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p>We collect the following categories of personal data:</p>

          <p className="font-semibold text-stone-700 dark:text-slate-300 mt-2">Account Information</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full name and email address (required for account creation)</li>
            <li>Phone number (optional; used for WhatsApp contact features)</li>
            <li>Account role (tenant, landlord, service provider)</li>
            <li>Password (stored as a secure hash — we never see your plain-text password)</li>
            <li>Date and time of account creation and terms acceptance</li>
          </ul>

          <p className="font-semibold text-stone-700 dark:text-slate-300 mt-2">Property Listing Data</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Property address, district, and coordinates (latitude/longitude)</li>
            <li>Rental price, property description, and photos</li>
            <li>Listing status and expiry dates</li>
          </ul>

          <p className="font-semibold text-stone-700 dark:text-slate-300 mt-2">Service Provider Data</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Business name and service category</li>
            <li>Location and service area</li>
            <li>Profile description</li>
          </ul>

          <p className="font-semibold text-stone-700 dark:text-slate-300 mt-2">Usage and Technical Data</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Browser type, device type, and IP address (collected automatically)</li>
            <li>Pages visited and features used (via analytics)</li>
            <li>Session and authentication tokens (stored in secure HTTP-only cookies)</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <p>We use your personal data to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage your account and authenticate your sessions.</li>
            <li>Display your property listings or service provider profile to other users.</li>
            <li>Process payments and maintain transaction records.</li>
            <li>Send transactional emails (account confirmation, payment receipts, trial reminders).</li>
            <li>Enforce our Terms &amp; Conditions and prevent fraud.</li>
            <li>Improve the Platform&apos;s performance and user experience through analytics.</li>
            <li>Comply with legal obligations under Ugandan law.</li>
          </ul>
          <p>
            <strong>We do not use your data for advertising, profiling, or selling to third parties.</strong>
          </p>
        </Section>

        <Section title="4. Location Data">
          <p>
            When you create a property listing or service provider profile, you provide a location (district, area,
            and optionally precise coordinates selected on a map). This location is displayed publicly to help tenants
            find properties near them.
          </p>
          <p>
            We do not track your device&apos;s real-time GPS location. The map tool on the Platform uses Mapbox, which may
            collect anonymised usage data as described in Mapbox&apos;s privacy policy.
          </p>
        </Section>

        <Section title="5. Cookies and Analytics">
          <p>We use the following cookies and analytics tools:</p>

          <p className="font-semibold text-stone-700 dark:text-slate-300 mt-2">Essential Cookies</p>
          <p>
            Session and authentication cookies are required for the Platform to function. They keep you logged in
            and secure your account. These cannot be disabled.
          </p>

          <p className="font-semibold text-stone-700 dark:text-slate-300 mt-2">Analytics Cookies</p>
          <p>
            We may use analytics tools (such as PostHog or Google Analytics) to understand how users interact with
            the Platform. Analytics data is anonymised and aggregated. You may opt out via the cookie banner.
          </p>

          <p className="font-semibold text-stone-700 dark:text-slate-300 mt-2">Managing Cookies</p>
          <p>
            You can manage or disable non-essential cookies via the cookie banner shown on your first visit, or
            through your browser&apos;s settings.
          </p>
        </Section>

        <Section title="6. Payment Data">
          <p>
            Payments on Rent Eazy are processed via mobile money (MTN Mobile Money and Airtel Money). We do not
            store your full mobile money PIN or account credentials.
          </p>
          <p>
            We retain records of completed transactions (amount, type, date, and your user ID) for accounting and
            legal compliance purposes. Payment reference numbers from your mobile money provider may be stored.
          </p>
        </Section>

        <Section title="7. Third-Party Services">
          <p>We use the following third-party services, each with their own privacy policies:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Supabase</strong> — database and authentication provider. Your data is stored on Supabase&apos;s
              servers (hosted on AWS). Supabase does not access your data except to provide the hosting service.
            </li>
            <li>
              <strong>Mapbox</strong> — interactive map service used to display property and provider locations.
              Mapbox may collect anonymised map usage data.
            </li>
            <li>
              <strong>Resend</strong> — email delivery service used to send transactional emails (confirmations,
              reminders, reports). Your email address is transmitted to Resend to deliver these messages.
            </li>
            <li>
              <strong>Vercel</strong> — hosting platform. Vercel processes request logs including IP addresses for
              security and performance purposes.
            </li>
          </ul>
        </Section>

        <Section title="8. Data Retention">
          <p>We retain personal data for as long as necessary to provide the Platform and comply with legal obligations:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Active account data: retained until you request deletion or your account is terminated.</li>
            <li>Property listing data: deleted or anonymised 12 months after a listing expires.</li>
            <li>Payment records: retained for 7 years for tax and legal compliance.</li>
            <li>Analytics data: retained in anonymised form for up to 24 months.</li>
          </ul>
        </Section>

        <Section title="9. Data Security">
          <p>We implement the following security measures to protect your data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All data transmitted between your browser and our servers is encrypted using HTTPS (TLS).</li>
            <li>Passwords are hashed using bcrypt — we cannot recover your plain-text password.</li>
            <li>Authentication sessions use secure, HTTP-only cookies with short expiry windows.</li>
            <li>Database access is protected by Row-Level Security (RLS) policies — users can only access their own data.</li>
            <li>Admin access requires a verified admin role and is protected by additional server-side checks.</li>
            <li>Security headers (Content-Security-Policy, X-Frame-Options, etc.) are applied to all responses.</li>
          </ul>
          <p>
            Despite these measures, no system is completely secure. If you believe your account has been compromised,
            contact us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="10. Your Rights">
          <p>
            Under the Uganda Data Protection and Privacy Act 2019, you have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access</strong> — request a copy of all personal data we hold about you.</li>
            <li><strong>Correction</strong> — request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion</strong> — request that we delete your account and associated personal data.</li>
            <li><strong>Portability</strong> — request your data in a machine-readable format.</li>
            <li><strong>Objection</strong> — object to processing of your data for analytics purposes.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">{CONTACT_EMAIL}</a>.
            We will respond within 21 days.
          </p>
        </Section>

        <Section title="11. Children's Privacy">
          <p>
            The Platform is not intended for use by anyone under the age of 18. We do not knowingly collect personal
            data from minors. If you believe a minor has created an account, contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>
            We may update this Privacy Policy periodically. Significant changes will be communicated via email or a
            prominent notice on the Platform. Continued use of the Platform after the effective date constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="13. Contact and Complaints">
          <p>
            For any privacy-related concerns, contact our Privacy Officer at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
          <p>
            You may also lodge a complaint with the Personal Data Protection Office of Uganda:
            Office of the Personal Data Protection Office, Uganda Communications Commission,
            Plot 42-44 Spring Road, Bugolobi, Kampala, Uganda.
          </p>
        </Section>

      </div>

      <div className="mt-10 pt-6 border-t border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs text-stone-400 dark:text-slate-600">
        <span>Last updated: {LAST_UPDATED} &copy; {new Date().getFullYear()} Rent Eazy.</span>
        <Link href="/terms" className="text-orange-500 hover:underline">View Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}
