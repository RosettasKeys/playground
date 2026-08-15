import { COVERAGE, SOURCE_META, WORKS } from "../data";
import type { SourceKind } from "../data/types";
import { SourceChip } from "./Panel";

const ORDER: SourceKind[] = [
  "living",
  "historical",
  "folklore",
  "reconstructed",
  "report",
  "contested",
];

const REPO_ISSUES = "https://github.com/RosettasKeys/playground/issues";
const NATURAL_EARTH = "https://www.naturalearthdata.com/";

function H({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="smallcaps mt-7 mb-2 text-[10.5px] tracking-[0.2em] text-[#d8b46a]">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[13px] leading-[1.75] text-slate-300/90">{children}</p>;
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#d8b46a] underline decoration-[#d8b46a]/30 underline-offset-2 transition-colors hover:decoration-[#d8b46a]"
    >
      {children}
    </a>
  );
}

/**
 * The honesty page.
 *
 * A site that looks like a reference work borrows the authority of one, so it
 * owes the reader a plain account of what it actually is.  This page is that
 * account: who made it, how far it has been checked, and what to do when it is
 * wrong.  It matters more than any individual citation.
 *
 * Not a seventh lens — the header nav is six, and stays six.
 */
export default function Sources({ onClose }: { onClose: () => void }) {
  const pct = Math.round((COVERAGE.checked / COVERAGE.total) * 100);

  return (
    <div className="fixed inset-0 z-[75] flex justify-center overflow-hidden bg-[#05070a]/95 backdrop-blur-sm">
      <div className="scroll-thin h-full w-full max-w-2xl overflow-y-auto px-5 py-10 sm:px-8">
        <div className="animate-fade-up">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="smallcaps text-[11px] tracking-[0.3em] text-[#d8b46a]">
                On sources
              </p>
              <h2 className="font-display mt-2 text-[32px] leading-tight text-[#efe6d4]">
                How this atlas knows what it says
              </h2>
            </div>
            <button
              onClick={onClose}
              className="mode-btn shrink-0 rounded-sm border border-white/10 px-2.5 py-1.5 text-[10px] tracking-widest text-slate-400 hover:bg-white/5 hover:text-slate-200"
            >
              CLOSE
            </button>
          </div>

          <div className="my-6 hairline" />

          <H>What this is</H>
          <P>
            One person's collection of {COVERAGE.total} records about death, memory and the
            unseen, gathered from many cultures and arranged six ways. It is made with care
            and it is not a peer-reviewed reference work. No editor checked it. No
            institution stands behind it.
          </P>
          <P>
            It is also not neutral about that. A site that looks like an encyclopaedia
            borrows the authority of one, so this page exists to say plainly where the
            edges are.
          </P>

          <H>How far it has been checked</H>
          <P>
            The records were first drafted by a language model, which is very good at
            sounding certain and less good at being right about specifics. Every one of
            them has since been worked through by hand against published sources.
          </P>
          <div className="my-4 border border-white/10 bg-black/25 px-4 py-3">
            <div className="font-mono2 text-[12.5px] text-[#e8d3a4]">
              {COVERAGE.checked} of {COVERAGE.total} records checked
              <span className="text-slate-500"> · {pct}%</span>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[#d8b46a]/70"
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
              {Object.keys(WORKS).length} works cited.{" "}
              {COVERAGE.checked < COVERAGE.total
                ? "Records that have not been checked yet simply carry no sources — an absent source list means unverified, not verified-and-sourceless."
                : "Thirty-six claims were corrected along the way. None of them were invented facts; they were specifics that had drifted, hardened, gone stale, or been quietly stated more confidently than the evidence allowed."}
            </p>
          </div>

          <H>What "checked" means here</H>
          <P>
            Checking targets <em className="text-slate-200 not-italic">hard claims</em>:
            dates, year ranges, proper names, book and film titles, numbers, official
            designations, and any claim that something was first recorded at a particular
            time or invented by a particular person. Those are the things that can be wrong,
            and they are where the errors turn out to live.
          </P>
          <P>
            Each hard claim wants two independent sources, at least one of them a primary
            document, a piece of scholarship, or the record of an institution that would
            know. Encyclopaedia entries are used for orientation and never as the only
            support for a specific fact.
          </P>
          <P>
            For folklore the checkable claim is never "this being exists." It is that a
            named collector wrote this down, in this year, in this place. Every source here
            says what it actually supports, so that distinction stays visible rather than
            implied.
          </P>
          <P>
            Where a claim turned out to be traditional rather than settled — widely repeated,
            but disputed by people who study it — the record says so instead of picking a
            side.
          </P>

          <H>How records are drawn</H>
          <p className="mb-3 text-[13px] leading-[1.75] text-slate-300/90">
            The mark on each record describes the kind of knowledge it is. Nothing is
            labelled true or false.
          </p>
          <ul className="mb-4 space-y-2.5">
            {ORDER.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <span className="mt-[2px] shrink-0 text-[#d5c9ae]">
                  <SourceChip source={s} size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] leading-tight text-slate-200">
                    {SOURCE_META[s].label}
                  </span>
                  <span className="block text-[11px] leading-snug text-slate-500">
                    {SOURCE_META[s].blurb}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <H>Living traditions</H>
          <P>
            Many of these records describe things people do now. Living religions are
            described as belief held by people today, not catalogued as folklore or as
            creatures. Where a tradition belongs to a specific community, sources written by
            people from that community are preferred over sources written about them.
          </P>
          <P>
            Some knowledge is restricted — by initiation, by gender, by nation — and is
            deliberately not published here. Where a record is thin for that reason, it is
            thin on purpose, and says so.
          </P>
          <P>
            Similarity between traditions is never presented as evidence of shared origin.
            Two peoples feeding their dead is not proof of contact between them.
          </P>

          <H>When it is wrong</H>
          <P>
            It will be, somewhere. If you find an error — especially in a record about your
            own culture — please say so at{" "}
            <A href={REPO_ISSUES}>the project's issue tracker</A>. Corrections about living
            traditions from the people who hold them carry more weight here than anything
            else on this page.
          </P>

          <H>Credits</H>
          <P>
            Coastlines are drawn from <A href={NATURAL_EARTH}>Natural Earth</A> 1:110m land
            data, which is in the public domain.
          </P>

          <div className="my-6 hairline" />
          <button
            onClick={onClose}
            className="mode-btn mb-4 rounded-sm border border-[#d8b46a]/40 px-5 py-2 text-[12px] tracking-[0.2em] text-[#e8d3a4] hover:bg-[#d8b46a]/10"
          >
            BACK TO THE ATLAS
          </button>
        </div>
      </div>
    </div>
  );
}
