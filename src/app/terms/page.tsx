import { PublicPage } from "@/components/layout/PublicPage";

export default function TermsPage() {
  return (
    <PublicPage eyebrow="Legal" title="Terms of Service">
      <p>
        Campaign listings, payment actions, wallet connections, and investment
        receipts remain subject to the eligibility, provider, and confirmation
        checks shown at the time of use.
      </p>
      <p>
        Users must provide accurate information, use wallets they control, and
        comply with the eligibility and campaign rules shown before an action.
        Additional service terms and notices will be published as they become
        available.
      </p>
    </PublicPage>
  );
}
