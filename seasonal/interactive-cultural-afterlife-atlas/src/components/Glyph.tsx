import type { RemembranceCluster, SourceKind, Silhouette } from "../data/types";

/**
 * Marker glyphs encode *what kind of knowledge* a record is.
 * Solid + crisp = living practice.  Soft = reconstructed.  Ticked = reported.
 */
export function Marker({
  source,
  strong,
}: {
  source: SourceKind;
  strong: boolean;
}) {
  const s = strong ? 1 : 0.82;
  switch (source) {
    case "living":
      return (
        <g>
          <circle r={13} fill="currentColor" opacity={0.07} />
          <circle r={7.4} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.6 * s} />
          <circle r={3.4} fill="currentColor" opacity={s} />
        </g>
      );
    case "historical":
      return (
        <g>
          <rect
            x={-6.4}
            y={-6.4}
            width={12.8}
            height={12.8}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.9}
            opacity={0.62 * s}
            transform="rotate(45)"
          />
          <rect x={-6.4} y={-0.5} width={2.4} height={1} fill="currentColor" opacity={0.5} transform="rotate(45)" />
          <circle r={2.8} fill="currentColor" opacity={0.92 * s} />
        </g>
      );
    case "reconstructed":
      return (
        <g>
          <circle r={7} fill="currentColor" opacity={0.26 * s} filter="url(#soften)" />
          <circle
            r={9}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.9}
            strokeDasharray="2.5 3.5"
            opacity={0.42 * s}
          />
          <circle r={2} fill="currentColor" opacity={0.6 * s} />
        </g>
      );
    case "folklore":
      return (
        <g>
          <circle r={14} fill="currentColor" opacity={0.05} />
          <circle
            r={8.2}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeDasharray="0.4 3.1"
            strokeLinecap="round"
            opacity={0.85 * s}
          />
          <circle r={3.1} fill="currentColor" opacity={0.9 * s} />
        </g>
      );
    case "report":
      return (
        <g stroke="currentColor" strokeWidth={0.9} opacity={s}>
          <path d="M-11 0 H-5 M5 0 H11 M0 -11 V-5 M0 5 V11" opacity={0.7} />
          <circle r={4.6} fill="none" opacity={0.75} />
          <circle r={1.3} fill="currentColor" stroke="none" />
        </g>
      );
    case "contested":
      return (
        <g fill="none" stroke="currentColor">
          <circle r={7} strokeWidth={0.9} strokeDasharray="1.8 4" opacity={0.5 * s} />
          <circle r={9.6} strokeWidth={0.7} strokeDasharray="1.8 4" opacity={0.2 * s} transform="rotate(30)" />
          <circle r={1.6} fill="currentColor" stroke="none" opacity={0.55 * s} />
        </g>
      );
  }
}

const SHAPES: { [K in Silhouette["shape"]]: { d: string; stroke?: boolean } } = {
  shade: {
    d: "M20 3c5.2 0 8.4 4.2 8.4 9.2 0 4-2.1 6.1-2.1 9.1 0 4.2 3.4 6.3 3.4 11 0 2.2-4.3 3.4-9.7 3.4s-9.7-1.2-9.7-3.4c0-4.7 3.4-6.8 3.4-11 0-3-2.1-5.1-2.1-9.1C11.6 7.2 14.8 3 20 3z",
  },
  humanoid: {
    d: "M20 3.4a4.3 4.3 0 110 8.6 4.3 4.3 0 010-8.6zM13.4 13.6h13.2l2.4 12.4-3.6.7-1 10.9h-3.2l-1.2-9.2-1.2 9.2h-3.2l-1-10.9-3.6-.7z",
  },
  quadruped: {
    d: "M7 22.4c0-4.4 3.4-7.6 8.6-7.6h9.2l4.6-4.6 1.4 4.6 4.2 1.4-3.6 3.2v3c0 3-1.9 5.2-4.8 5.6l1.2 8h-3.2l-1.6-7.8h-6.4L15 36h-3.2l1.4-8.2C9.4 27 7 25 7 22.4z",
  },
  winged: {
    d: "M20 11.6a3.4 3.4 0 110 6.8 3.4 3.4 0 010-6.8zm0 7.4c2.3 0 3.6 2.2 3.6 5.4V37h-7.2V24.4c0-3.2 1.3-5.4 3.6-5.4zM16.6 19 2.2 12.4c-.6 7.2 5.4 13.4 13.2 14.2zm6.8 0 14.4-6.6c.6 7.2-5.4 13.4-13.2 14.2z",
  },
  aquatic: {
    d: "M4.6 22.4C11 13.6 22 11 29 15.4l5.8-5.6-1.2 8 3.8 4.6-3.8 4.4 1.2 8-5.8-5.6C22 33.6 11 31 4.6 22.4z",
  },
  serpent: {
    d: "M3 30c5-8 9 3 14-4s9 3 13-5c1.6-3.2 3.6-4.6 6-5",
    stroke: true,
  },
  light: {
    d: "M20 12.4a7.6 7.6 0 110 15.2 7.6 7.6 0 010-15.2zM20 1v6M20 33v6M1 20h6M33 20h6M7 7l4.2 4.2M28.8 28.8 33 33M33 7l-4.2 4.2M11.2 28.8 7 33",
    stroke: true,
  },
  masked: {
    d: "M20 5.4c7 0 11.2 5.2 11.2 12.4S26 33.4 20 33.4 8.8 25 8.8 17.8 13 5.4 20 5.4zm-8.6-4 3.4 5.8m13.8-5.8-3.4 5.8M15 17.6h3M22 17.6h3M15.6 25.6c2.8 1.8 6 1.8 8.8 0",
    stroke: true,
  },
  bird: {
    d: "M17.6 8.4a3.4 3.4 0 116.8 0c0 1.8-.8 2.8-.8 2.8l7.4 3.4-6.8 2 1.6 20h-3l-2-15.6-4 15.6h-3l4.2-20.6-7-3.2 8-2z",
  },
  composite: {
    d: "M20 3l4.8 6.6 7.8-2.2-2.6 7.6L37 20l-7 5 2.6 7.6-7.8-2.2L20 37l-4.8-6.6-7.8 2.2 2.6-7.6L3 20l7-5-2.6-7.6 7.8 2.2z",
  },
};

export function Sil({
  shape,
  size = 26,
  opacity = 1,
}: {
  shape: Silhouette["shape"];
  size?: number;
  opacity?: number;
}) {
  const cfg = SHAPES[shape];
  const k = size / 40;
  return (
    <g transform={`translate(${-size / 2} ${-size / 2}) scale(${k})`} opacity={opacity}>
      {cfg.stroke ? (
        <path
          d={cfg.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path d={cfg.d} fill="currentColor" />
      )}
    </g>
  );
}

/**
 * Remembrance emblems — one per cluster, so each niche on the ofrenda wall is
 * recognisable before you read its label.  Same 40×40 space as SHAPES; `solid`
 * is filled, `line` is stroked, most emblems use both.
 */
const EMBLEMS: { [K in RemembranceCluster]: { solid?: string; line?: string } } = {
  // a shallow bowl set down, still steaming
  offering: {
    solid: "M8.5 22h23a11.5 11.5 0 0 1-23 0z M16 33.6h8v2.4h-8z",
    line: "M14 18.5c0-2.6 2.6-3.2 2.6-5.8S14 9.4 14 6.8M20 17.4c0-2.6 2.6-3.2 2.6-5.8S20 8.2 20 5.6M26 18.5c0-2.6 2.6-3.2 2.6-5.8S26 9.4 26 6.8",
  },
  // a household shrine with something kept burning in it
  altar: {
    solid: "M20 20.6c1.9 1.7 3 3.2 3 4.9a3 3 0 0 1-6 0c0-1.7 1.1-3.2 3-4.9z",
    line: "M8.5 33V16.4L20 8.6l11.5 7.8V33M14.4 33V22.2h11.2V33M4.5 33h31",
  },
  // a headstone, and the ground in front of it kept swept
  grave: {
    solid: "M13 32.5V19.6a7 7 0 0 1 14 0v12.9z",
    line: "M4.5 32.5h31M9 36.6c3.6-2 8-3 11-3M31 36.6c-3.6-2-8-3-11-3",
  },
  // lanterns strung up for the night the dead are expected
  festival: {
    solid:
      "M11.6 13.4a3.4 4.4 0 0 1 0 8.8 3.4 4.4 0 0 1 0-8.8z M20 15a3.4 4.4 0 0 1 0 8.8 3.4 4.4 0 0 1 0-8.8z M28.4 13.4a3.4 4.4 0 0 1 0 8.8 3.4 4.4 0 0 1 0-8.8z",
    line: "M3 8.4q17 8.6 34 0M11.6 12V9.8M20 13.6v-2M28.4 12V9.8M11.6 23.6v2.2M20 25.2v2.2M28.4 23.6v2.2",
  },
  // cloth knotted and hung — grief given a shape, and an end
  mourning: {
    solid:
      "M20 11.4c-4.6 0-6.6 1.9-6.6 4.2 0 2.3 2.3 2.8 2.3 5.1L11.4 36 20 32.2 28.6 36l-4.3-15.3c0-2.3 2.3-2.8 2.3-5.1 0-2.3-2-4.2-6.6-4.2z",
    line: "M6 8.4h28M20 11.4V6.6",
  },
  // a portrait kept in a frame, one corner gone dark
  object: {
    solid:
      "M20 14.4a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4z M14.2 29.6c0-3.4 2.6-5.9 5.8-5.9s5.8 2.5 5.8 5.9z M30 6.4v6.2l-6.2-6.2z",
    line: "M10 6.4h20v27.2H10zM14 10.4h12v19.2H14z",
  },
};

export function Emblem({
  cluster,
  size = 40,
  opacity = 1,
}: {
  cluster: RemembranceCluster;
  size?: number;
  opacity?: number;
}) {
  const cfg = EMBLEMS[cluster];
  const k = size / 40;
  return (
    <g transform={`translate(${-size / 2} ${-size / 2}) scale(${k})`} opacity={opacity}>
      {cfg.solid && <path d={cfg.solid} fill="currentColor" />}
      {cfg.line && (
        <path
          d={cfg.line}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}
