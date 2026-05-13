import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Rent Eazy',
  description: 'Terms and Conditions for using the Rent Eazy property and services marketplace in Uganda.',
};

const LAST_UPDATED = '13 May 2026';
const CONTACT_EMAIL = 'legal@renteazy.com';

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

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">

      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-orange-500 hover:underline text-sm font-medium">← Back to Rent Eazy</Link>
        <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white mt-4 mb-2">Terms &amp; Conditions</h1>
        <p className="text-stone-400 dark:text-slate-500 text-sm">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="prose-sm max-w-none">

        <Section title="1. Introduction and Acceptance">
          <p>
            Welcome to <strong>Rent Eazy</strong> ("the Platform", "we", "us", or "our"), a property rental and service
            marketplace operated in Uganda. By creating an account, listing a property, subscribing as a service provider,
            or otherwise accessing or using the Platform, you agree to be bound by these Terms &amp; Conditions.
          </p>
          <p>
            If you do not agree to these terms, you must not use the Platform. These terms apply to all users, including
            tenants, landlords, service providers, and visitors.
          </p>
          <p>
            We reserve the right to update these terms at any time. Continued use of the Platform after changes are
            published constitutes acceptance of the revised terms.
          </p>
        </Section>

        <Section title="2. Platform Purpose">
          <p>
            Rent Eazy is an online marketplace that connects landlords and property agents with tenants looking for
            residential and commercial properties in Uganda. It also connects verified service providers (plumbers,
            electricians, cleaners, security personnel, and others) with property occupants and landlords.
          </p>
          <p>
            Rent Eazy is a <strong>listing and discovery platform only</strong>. We are not a party to any rental
            agreement, service contract, or financial transaction between users. All agreements are made directly
            between the parties involved.
          </p>
        </Section>

        <Section title="3. Eligibility and Account Registration">
          <p>To use the Platform you must:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Be at least 18 years of age.</li>
            <li>Provide accurate, truthful, and complete registration information.</li>
            <li>Maintain the confidentiality of your account credentials.</li>
            <li>Promptly notify us of any unauthorised access to your account.</li>
          </ul>
          <p>
            You are responsible for all activity that occurs under your account. We reserve the right to refuse
            registration or suspend accounts at our discretion.
          </p>
        </Section>

        <Section title="4. User Responsibilities">
          <p>All users agree to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Platform only for lawful purposes in compliance with Ugandan law.</li>
            <li>Provide accurate information in all listings, profiles, and communications.</li>
            <li>Treat other users with respect and professionalism.</li>
            <li>Not attempt to circumvent or hack the Platform's security measures.</li>
            <li>Not use automated tools, bots, or scrapers without written permission.</li>
            <li>Not use the Platform to harass, threaten, or defraud other users.</li>
          </ul>
        </Section>

        <Section title="5. Property Listing Rules">
          <p>Landlords and agents who list properties on Rent Eazy must ensure that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All property information (location, price, bedrooms, photos) is accurate and up to date.</li>
            <li>They have the legal right to list the property (ownership or authorised agency).</li>
            <li>Listed properties are genuinely available for rent at the stated price.</li>
            <li>Photos are genuine photos of the actual property being listed.</li>
            <li>Prices are stated in Ugandan Shillings (UGX) and reflect the true rental amount.</li>
          </ul>
          <p className="font-semibold text-stone-700 dark:text-slate-300">
            Fraudulent listings are strictly prohibited. This includes phantom listings, bait-and-switch pricing,
            fake property photos, or listing a property you do not have authority to rent. Violations will result
            in immediate account suspension and may be reported to Ugandan law enforcement authorities.
          </p>
        </Section>

        <Section title="6. Service Provider Rules">
          <p>Service providers listed on the Platform agree to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Only offer legal services that they are qualified and authorised to provide.</li>
            <li>Accurately describe their services, area of operation, and qualifications.</li>
            <li>Not offer or facilitate any illegal services, including fraud, theft, or unlicensed security work.</li>
            <li>Communicate honestly and professionally with potential clients.</li>
          </ul>
        </Section>

        <Section title="7. Payment Terms">
          <p>
            Rent Eazy charges fees for certain features, including property listing activations
            (UGX 10,000 per listing) and service provider subscriptions (UGX 30,000 per 30-day period).
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payments are processed via mobile money (MTN Mobile Money and Airtel Money).</li>
            <li>All fees are non-refundable except where required by Ugandan law.</li>
            <li>Listings and subscriptions expire at the end of the paid period unless renewed.</li>
            <li>Rent Eazy is not responsible for any mobile money transaction failures caused by your network provider.</li>
          </ul>
        </Section>

        <Section title="8. Free Trial Terms">
          <p>
            New users who create an account receive a <strong>3-month free trial</strong> during which they may
            activate property listings or a service provider profile without payment.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The free trial begins at account creation and expires exactly 3 months later.</li>
            <li>After the trial expires, continued use of paid features requires payment of the applicable fee.</li>
            <li>We reserve the right to modify or discontinue the free trial offer at any time.</li>
            <li>Trial abuse (creating multiple accounts to extend trial periods) will result in account termination.</li>
          </ul>
        </Section>

        <Section title="9. Prohibited Content and Conduct">
          <p>The following are strictly prohibited on the Platform:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Publishing false, misleading, or fraudulent property advertisements.</li>
            <li>Impersonating another person or entity.</li>
            <li>Uploading malicious files, viruses, or any harmful content.</li>
            <li>Collecting personal data of other users without their consent.</li>
            <li>Any conduct that violates the laws of Uganda, including the Computer Misuse Act 2011
            and the Data Protection and Privacy Act 2019.</li>
          </ul>
        </Section>

        <Section title="10. Content Ownership and Licence">
          <p>
            You retain ownership of content you submit to the Platform (photos, descriptions, profile information).
            By submitting content, you grant Rent Eazy a non-exclusive, royalty-free, worldwide licence to display
            and use that content for the purpose of operating the Platform.
          </p>
          <p>
            You warrant that you own or have the right to publish all content you submit, and that the content does
            not infringe any third party's intellectual property rights.
          </p>
        </Section>

        <Section title="11. Privacy Commitment">
          <p>
            Your privacy is important to us. We collect and process personal data in accordance with our{' '}
            <Link href="/privacy-policy" className="text-orange-500 hover:underline">Privacy Policy</Link>, which
            forms part of these Terms. By using the Platform, you consent to our data practices as described therein.
          </p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>
            Rent Eazy provides the Platform on an "as is" basis. To the maximum extent permitted by Ugandan law, we
            disclaim all warranties, express or implied, including fitness for a particular purpose.
          </p>
          <p>
            Rent Eazy is not liable for: (a) losses arising from fraudulent listings or service provider misconduct;
            (b) disputes between landlords and tenants; (c) losses arising from Platform downtime; (d) any indirect,
            incidental, or consequential damages.
          </p>
          <p>
            Our total liability to you for any claim shall not exceed the fees you paid to us in the 12 months
            preceding the claim.
          </p>
        </Section>

        <Section title="13. Account Suspension and Termination">
          <p>We reserve the right to suspend or permanently terminate any account that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violates these Terms &amp; Conditions.</li>
            <li>Engages in fraudulent, abusive, or illegal conduct.</li>
            <li>Receives multiple verified reports from other users.</li>
            <li>Has been inactive for more than 24 months.</li>
          </ul>
          <p>
            Suspended users may appeal by contacting <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="14. Reporting Violations">
          <p>
            If you encounter a fraudulent listing or abusive service provider, please use our{' '}
            <Link href="/report" className="text-orange-500 hover:underline">Report a Listing</Link> feature.
            Reports are reviewed by our team within 3 business days.
          </p>
        </Section>

        <Section title="15. Ugandan Law and Jurisdiction">
          <p>
            These Terms are governed by and construed in accordance with the laws of the Republic of Uganda.
            Any disputes arising from use of the Platform shall be subject to the exclusive jurisdiction of the
            courts of Uganda.
          </p>
          <p>
            Rent Eazy operates in compliance with the Uganda Communications Act 2013, the Data Protection and
            Privacy Act 2019, and all other applicable Ugandan legislation.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>
            For questions about these Terms, contact us at:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-orange-500 hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </Section>

      </div>

      <div className="mt-10 pt-6 border-t border-stone-200 dark:border-slate-700 text-xs text-stone-400 dark:text-slate-600 text-center">
        These Terms &amp; Conditions were last updated on {LAST_UPDATED}. &copy; {new Date().getFullYear()} Rent Eazy. All rights reserved.
      </div>
    </div>
  );
}
