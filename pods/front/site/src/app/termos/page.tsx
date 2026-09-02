import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { Localized, defaultLocale, getDictionary, type Locale } from "@/i18n/site";

const metadataCopy = getDictionary(defaultLocale).metadata.terms;

export const metadata: Metadata = {
  title: metadataCopy.title,
  description: metadataCopy.description,
};

export function TermosContent({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <Localized locale={locale}><LegalPage
      title="common.terms"
      updatedAt="privacy.updatedAt"
      intro="terms.intro"
    >
      <LegalSection title="terms.sections.about.title">
        <p>
          {"terms.sections.about.companyPrefix"}<strong>Sim Intermediações LTDA</strong>{"terms.sections.about.companySuffix"}</p>
        <p>
          {"terms.sections.about.authority"}</p>
      </LegalSection>

      <LegalSection title="terms.sections.account.title">
        <p>
          {"terms.sections.account.responsibility"}</p>
        <ul>
          <li>
            {"terms.sections.account.age"}</li>
          <li>
            {"terms.sections.account.unauthorizedUse"}</li>
          <li>
            {"terms.sections.account.administrators"}</li>
        </ul>
      </LegalSection>

      <LegalSection title="terms.sections.billing.title">
        <p>
          {"terms.sections.billing.intro"}<Link href="/precos">{"terms.sections.billing.plansLink"}</Link>{"terms.sections.billing.summary"}</p>
        <ul>
          <li>
            <strong>Free</strong> {"terms.sections.billing.free"}</li>
          <li>
            <strong>{"pricing.plans.business.name"}</strong> {"terms.sections.billing.business"}</li>
        </ul>
        <p>
          {"terms.sections.billing.recurring"}</p>
        <p>
          {"terms.sections.billing.cancellation"}</p>
        <p>
          {"terms.sections.billing.priceChanges"}</p>
      </LegalSection>

      <LegalSection title="terms.sections.acceptableUse.title">
        <p>{"terms.sections.acceptableUse.intro"}</p>
        <ul>
          <li>
            {"terms.sections.acceptableUse.unlawful"}</li>
          <li>
            {"terms.sections.acceptableUse.malware"}</li>
          <li>
            {"terms.sections.acceptableUse.spam"}</li>
          <li>
            {"terms.sections.acceptableUse.resale"}</li>
        </ul>
      </LegalSection>

      <LegalSection title="terms.sections.content.title">
        <p>
          {"terms.sections.content.ownershipPrefix"}<strong>{"terms.sections.content.yours"}</strong>{"terms.sections.content.ownershipSuffix"}</p>
        <p>
          {"terms.sections.content.license"}</p>
        <p>
          {"terms.sections.content.privacyPrefix"}{" "}
          <Link href="/privacidade">{"common.privacy"}</Link>.
        </p>
      </LegalSection>

      <LegalSection title="terms.sections.intellectualProperty.title">
        <p>
          {"terms.sections.intellectualProperty.body"}</p>
      </LegalSection>

      <LegalSection title="terms.sections.availability.title">
        <p>
          {"terms.sections.availability.body"}</p>
      </LegalSection>

      <LegalSection title="terms.sections.termination.title">
        <p>
          {"terms.sections.termination.body"}</p>
        <p>
          {"terms.sections.termination.exportPrefix"}<strong>{"terms.sections.termination.exportPeriod"}</strong> {"terms.sections.termination.exportSuffix"}</p>
      </LegalSection>

      <LegalSection title="terms.sections.liability.title">
        <p>
          {"terms.sections.liability.warranty"}</p>
        <p>
          {"terms.sections.liability.limitation"}</p>
      </LegalSection>

      <LegalSection title="terms.sections.changes.title">
        <p>
          {"terms.sections.changes.body"}</p>
      </LegalSection>

      <LegalSection title="terms.sections.contact.title">
        <p>
          {"terms.sections.contact.body"}{" "}
          <a href="mailto:jbmidiadigital@gmail.com">jbmidiadigital@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage></Localized>
  );
}

export default function TermosPage() {
  return <TermosContent />;
}
