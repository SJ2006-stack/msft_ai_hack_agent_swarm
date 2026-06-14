import type { Citation } from "@/types/gtm";

type Props = {
  citations: Citation[];
  className?: string;
};

function formatHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function CitationChip({ citations, className = "" }: Props) {
  if (citations.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {citations.map((citation) => (
        <a
          key={`${citation.url}-${citation.title}`}
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          title={citation.snippet ?? citation.title}
          className="group inline-flex max-w-full flex-col gap-0.5 border-4 border-black bg-[#FCD116] px-2 py-1 text-[#0A0A0A] brutalist-shadow transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="truncate text-[10px] font-black uppercase tracking-wide">
            {formatHost(citation.url)}
          </span>
          <span className="truncate text-xs font-bold leading-tight">{citation.title}</span>
          {citation.snippet && (
            <span className="line-clamp-2 text-[10px] font-medium leading-snug opacity-80 group-hover:opacity-100">
              {citation.snippet}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

export function CitationChipList({ citations }: { citations: Citation[] }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
        Sources
      </p>
      <CitationChip citations={citations} />
    </div>
  );
}
