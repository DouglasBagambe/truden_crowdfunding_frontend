import { PublicPage } from "@/components/layout/PublicPage";

export default function SupportPage() {
  return (
    <PublicPage eyebrow="Support" title="Get help with KEIBO">
      <p>
        For UAT issues, record the page, time, campaign ID, and non-secret
        payment reference before contacting the authorized UAT operator.
      </p>
      <p>
        Never send passwords, access tokens, KYC documents, card data, private
        keys or seed phrases in a support request.
      </p>
    </PublicPage>
  );
}
