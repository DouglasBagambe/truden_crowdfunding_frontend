import { PublicPage } from "@/components/layout/PublicPage";

export default function TermsPage() {
  return (
    <PublicPage eyebrow="Legal" title="Terms of Service">
      <p>
        KEIBO staging access is for evaluation only. A campaign listing, payment
        intent, wallet connection, or investment receipt is not a promise of
        returns, regulatory eligibility, provider settlement, or blockchain
        finality.
      </p>
      <p>
        Users must provide accurate information, use wallets they control, and
        comply with the eligibility and campaign rules shown before an action.
        Production terms and governing-entity details must be approved before
        public launch.
      </p>
    </PublicPage>
  );
}
