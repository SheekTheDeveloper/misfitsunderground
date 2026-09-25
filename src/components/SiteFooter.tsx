import { site } from "@/config/site";

export function SiteFooter() {
  const socials = Object.entries(site.socials).filter(([, url]) => url);

  return (
    <footer className="mt-16 border-t border-edge pt-6 text-center text-xs text-muted">
      {socials.length > 0 && (
        <div className="mb-4 flex justify-center gap-4">
          {socials.map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="capitalize hover:text-acid">
              {name}
            </a>
          ))}
        </div>
      )}
      <p>
        {site.name} is an independent Roobet affiliate and works independently of Roobet.
      </p>
      <p className="mt-2">
        <span className="font-semibold text-white">18+</span> only. Gambling is entertainment, not a way to make money.
        When the fun stops, stop.{" "}
        <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-acid">
          BeGambleAware.org
        </a>
        {" · "}
        <a href="https://roobet.com/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="underline hover:text-acid">
          Roobet T&amp;Cs
        </a>
      </p>
      <p className="mt-2">
        Roobet is not available in every country, including the United States and the United Kingdom. Check
        Roobet&apos;s T&amp;Cs to make sure it&apos;s available where you live before signing up. Accounts opened
        from a restricted country can be closed and their bets voided.
      </p>
      <p className="mt-1">© {new Date().getFullYear()} {site.name}</p>
    </footer>
  );
}
