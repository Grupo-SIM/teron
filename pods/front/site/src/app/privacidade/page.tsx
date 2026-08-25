import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/site/legal-page";
import { Localized, defaultLocale, getDictionary, type Locale } from "@/i18n/site";

const metadataCopy = getDictionary(defaultLocale).metadata.privacy;

export const metadata: Metadata = {
  title: metadataCopy.title,
  description: metadataCopy.description,
};

export function PrivacidadeContent({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <Localized locale={locale}><LegalPage
      title="common.privacy"
      updatedAt="privacy.updatedAt"
      intro="privacy.intro"
    >
      <LegalSection title="privacy.sections.controller.title">
        <p>
          {"privacy.sections.controller.controllerPrefix"}<strong>J B Marketing Digital LTDA</strong>{"privacy.sections.controller.companySuffix"}</p>
        <p>
          {"privacy.sections.controller.organizationPrefix"}{" "}
          <strong>{"privacy.sections.controller.processor"}</strong>{"privacy.sections.controller.organizationSuffix"}</p>
      </LegalSection>

      <LegalSection title="privacy.sections.collected.title">
        <h3>{"privacy.sections.collected.provided"}</h3>
        <ul>
          <li>
            <strong>{"privacy.sections.collected.registration"}</strong>{"privacy.sections.collected.registrationDetails"}</li>
          <li>
            <strong>{"privacy.sections.collected.payment"}</strong>{"privacy.sections.collected.paymentDetails"}</li>
          <li>
            <strong>{"privacy.sections.collected.content"}</strong>{"privacy.sections.collected.contentDetails"}</li>
          <li>
            <strong>{"privacy.sections.collected.support"}</strong>{"privacy.sections.collected.supportDetails"}</li>
        </ul>

        <h3>{"privacy.sections.collected.automatic"}</h3>
        <ul>
          <li>
            <strong>{"privacy.sections.collected.usage"}</strong>{"privacy.sections.collected.usageDetails"}</li>
          <li>
            <strong>{"privacy.sections.collected.technical"}</strong>{"privacy.sections.collected.technicalDetails"}</li>
          <li>
            <strong>{"privacy.sections.collected.cookies"}</strong> {"privacy.sections.collected.cookiesDetails"}</li>
        </ul>
      </LegalSection>

      <LegalSection title="privacy.sections.purposes.title">
        <ul>
          <li>
            <strong>{"privacy.sections.purposes.platform"}</strong> {"privacy.sections.purposes.platformDetails"}{" "}
            <em>{"privacy.sections.purposes.contractBasis"}</em>
          </li>
          <li>
            <strong>{"privacy.sections.purposes.billing"}</strong>.{" "}
            <em>{"privacy.sections.purposes.billingBasis"}</em>
          </li>
          <li>
            <strong>{"privacy.sections.purposes.security"}</strong> {"privacy.sections.purposes.securityDetails"}{" "}
            <em>{"privacy.sections.purposes.securityBasis"}</em>
          </li>
          <li>
            <strong>{"privacy.sections.purposes.support"}</strong> {"privacy.sections.purposes.supportDetails"}{" "}
            <em>{"privacy.sections.purposes.contractBasis"}</em>
          </li>
          <li>
            <strong>{"privacy.sections.purposes.improvement"}</strong> {"privacy.sections.purposes.improvementDetails"}<em>{"privacy.sections.purposes.legitimateInterest"}</em>
          </li>
          <li>
            <strong>{"privacy.sections.purposes.marketing"}</strong> {"privacy.sections.purposes.marketingDetails"}<em>{"privacy.sections.purposes.consentBasis"}</em>
          </li>
        </ul>
        <p>
          {"privacy.sections.purposes.noSale"}</p>
      </LegalSection>

      <LegalSection title="privacy.sections.sharing.title">
        <ul>
          <li>
            <strong>{"privacy.sections.sharing.providers"}</strong> {"privacy.sections.sharing.providersDetails"}</li>
          <li>
            <strong>{"privacy.sections.sharing.organization"}</strong> {"privacy.sections.sharing.organizationDetails"}</li>
          <li>
            <strong>{"privacy.sections.sharing.authorities"}</strong> {"privacy.sections.sharing.authoritiesDetails"}</li>
          <li>
            <strong>{"privacy.sections.sharing.successors"}</strong> {"privacy.sections.sharing.successorsDetails"}</li>
        </ul>
      </LegalSection>

      <LegalSection title="privacy.sections.cookies.title">
        <p>
          {"privacy.sections.cookies.body"}</p>
      </LegalSection>

      <LegalSection title="privacy.sections.security.title">
        <p>
          {"privacy.sections.security.safeguards"}</p>
        <p>
          {"privacy.sections.security.incidents"}</p>
      </LegalSection>

      <LegalSection title="privacy.sections.retention.title">
        <ul>
          <li>
            <strong>{"privacy.sections.retention.content"}</strong> {"privacy.sections.retention.contentDetails"}</li>
          <li>
            <strong>{"privacy.sections.retention.accessLogs"}</strong> {"privacy.sections.retention.accessLogsDetails"}</li>
          <li>
            <strong>{"privacy.sections.retention.billing"}</strong> {"privacy.sections.retention.billingDetails"}</li>
        </ul>
      </LegalSection>

      <LegalSection title="privacy.sections.rights.title">
        <p>
          {"privacy.sections.rights.body"}</p>
        <p>
          {"privacy.sections.rights.contactPrefix"}{" "}
          <a href="mailto:jbmidiadigital@gmail.com">jbmidiadigital@gmail.com</a>{"privacy.sections.rights.contactSuffix"}</p>
      </LegalSection>

      <LegalSection title="privacy.sections.transfers.title">
        <p>
          {"privacy.sections.transfers.body"}</p>
      </LegalSection>

      <LegalSection title="privacy.sections.children.title">
        <p>
          {"privacy.sections.children.body"}</p>
      </LegalSection>

      <LegalSection title="privacy.sections.changes.title">
        <p>
          {"privacy.sections.changes.body"}</p>
        <p>
          {"privacy.sections.changes.termsPrefix"}{" "}
          <Link href="/termos">{"common.terms"}</Link>.
        </p>
      </LegalSection>
    </LegalPage></Localized>
  );
}

export default function PrivacidadePage() {
  return <PrivacidadeContent />;
}
