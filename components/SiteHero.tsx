'use client';

import { SITE_HERO_TAGLINE, SITE_NAME } from '@/lib/site-config';

const HERO_IMAGE = '/hero.jpg?v=3';

const steps = [
  { n: '1', title: 'מחפשת שמלה', text: 'סנני לפי מידה, עיר ומחיר' },
  { n: '2', title: 'בוחרת מהקטלוג', text: 'פותחות כרטיס ורואות את כל הפרטים' },
  { n: '3', title: 'משריינת באתר', text: 'שולחות בקשה למשכירה במקום אחד' },
];

const readable = {
  textShadow: '0 1px 2px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.35)',
} as const;

type Props = {
  onAddDress: () => void;
};

export default function SiteHero({ onAddDress }: Props) {
  return (
    <section className="relative isolate">
      <div className="relative min-h-[88vh] overflow-hidden sm:min-h-[92vh]">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center blur-xl"
          style={{
            transform: 'scale(1.08)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, transparent 28%, black 62%, black 100%)',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, transparent 28%, black 62%, black 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(26,11,18,0.58) 0%, rgba(26,11,18,0.28) 32%, transparent 62%)',
          }}
        />
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-3xl flex-col items-center justify-end px-5 pb-28 pt-28 text-center sm:min-h-[92vh] sm:pb-32">
          <p
            className="mb-3 text-sm font-semibold leading-relaxed text-white sm:text-base"
            style={readable}
          >
            {SITE_HERO_TAGLINE}
          </p>
          <h1
            className="font-[family-name:var(--font-luxury)] text-4xl leading-[1.15] text-white sm:text-5xl md:text-6xl"
            style={readable}
          >
            {SITE_NAME}
          </h1>
          <div className="mx-auto mt-4 h-px w-16 bg-white/80" />
          <p
            className="mt-4 max-w-lg text-sm leading-relaxed text-white sm:text-base"
            style={readable}
          >
            מחפשת לשכור, או מעוניינת להשכיר?
            <br />
            קטלוג מסודר, תמונות ברורות, והפרטים במקום אחד.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="#catalog"
              className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#6b2340] shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition hover:bg-[#f6eef1]"
            >
              חיפוש שמלה במאגר
            </a>
            <button
              type="button"
              onClick={onAddDress}
              className="rounded-full border-2 border-white bg-transparent px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              פרסום שמלה
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-5xl px-4 pb-4">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.n}
              className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/95 px-5 py-5 shadow-[0_18px_50px_rgba(26,11,18,0.12)] backdrop-blur-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#6b2340] bg-transparent text-lg font-semibold text-[#6b2340]">
                {step.n}
              </span>
              <div className="text-right">
                <p className="text-sm font-bold text-[#2a1f22]">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#6e5e62]">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
