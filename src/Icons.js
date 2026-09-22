// Single-stroke authored icon set (24x24, 2px stroke, round caps/joins) so the
// app never falls back to unicode glyphs or emoji standing in for controls.

const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconClose(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconTrash(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconChevronLeft(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function IconChevronRight(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function IconArrowRight(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconFlame(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 2c1.2 2.4-1.6 4-1.6 6.4 0 1.2.8 2 1.8 2 1.4 0 2-1.2 1.8-2.6 2.6 1.6 4 4.4 4 6.8a6 6 0 1 1-12 0c0-3.6 2.4-6 4.2-8.2.6-.8 1.4-2.2 1.8-4.4z" />
    </svg>
  );
}

export function IconEdit(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function IconAlert(props) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.3 2.6 18a1.8 1.8 0 0 0 1.6 2.7h15.6a1.8 1.8 0 0 0 1.6-2.7L13.7 4.3a1.8 1.8 0 0 0-3.4 0z" />
    </svg>
  );
}
