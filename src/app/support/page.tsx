import { PublicPage } from "@/components/layout/PublicPage";

function supportContact(): { href: string; label: string } | null {
  const url = process.env.KEIBO_SUPPORT_URL?.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" && !parsed.username && !parsed.password)
        return { href: parsed.href, label: "Contact KEIBO support" };
    } catch {
      // Ignore invalid contact configuration rather than rendering an unsafe link.
    }
  }
  const email = process.env.KEIBO_SUPPORT_EMAIL?.trim();
  if (email && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email))
    return { href: `mailto:${email}`, label: email };
  return null;
}

export default function SupportPage() {
  const contact = supportContact();
  return (
    <PublicPage eyebrow="Support" title="Get help with KEIBO">
      {contact ? (
        <p>
          <a className="font-semibold underline" href={contact.href}>
            {contact.label}
          </a>
        </p>
      ) : (
        <p>
          Use the verified contact details provided in your existing KEIBO
          account correspondence. Public support contact details have not yet
          been published here.
        </p>
      )}
      <p>
        Include the page, time, campaign ID, and any non-secret payment
        reference so the team can identify the issue.
      </p>
      <p>
        Never send passwords, access tokens, KYC documents, card data, private
        keys or seed phrases in a support request.
      </p>
    </PublicPage>
  );
}
