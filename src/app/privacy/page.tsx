import { PublicPage } from "@/components/layout/PublicPage";

export default function PrivacyPage() {
  return (
    <PublicPage eyebrow="Legal" title="Privacy Notice">
      <p>
        KEIBO processes account, campaign, payment-reference, wallet-address,
        KYC-status, security and audit information needed to operate the
        service. Private keys and seed phrases must never be submitted to KEIBO.
      </p>
      <p>
        Provider credentials, raw KYC payloads and wallet signatures are
        excluded from application logs. The final public privacy notice,
        including retention periods, processors and data-controller contact
        details, will be published before broader availability.
      </p>
    </PublicPage>
  );
}
