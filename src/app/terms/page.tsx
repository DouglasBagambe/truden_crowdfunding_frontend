import { PublicPage } from "@/components/layout/PublicPage";

export default function TermsPage() {
  return (
    <PublicPage eyebrow="Legal" title="Terms of Service">
      <p>
        KEIBO is currently available in a limited UAT environment while the
        platform is being prepared for wider release. Campaign listings, payment
        actions, wallet connections, and investment receipts remain subject to
        the eligibility, provider, and confirmation checks shown at the time of
        use.
      </p>
      <p>
        Users must provide accurate information, use wallets they control, and
        comply with the eligibility and campaign rules shown before an action.
        The governing terms, contact details, and launch notices for public
        availability will be published before the service is offered more
        broadly.
      </p>
    </PublicPage>
  );
}
