// authIcons.js — monochrome icon set for the auth screen, ported 1:1 from the
// design handoff (hexlash_auth_handoff/auth_parts.jsx). Functional components via
// Vue's h() render function — no template compiler, production-safe. currentColor
// throughout so the parent controls tone. Sizes accepted via `s` prop (default
// per-icon), chevron direction via `dir`. The brand mark is NOT here — the screen
// reuses the canonical logo-512.png asset (same mark as nav / loading screen).
import { h } from 'vue';

const base = { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' };

function svg(props, extra, children) {
  const s = props?.s || extra._s || 20;
  return h('svg', { ...base, width: s, height: s, ...extra.attrs }, children);
}

export const IconGoogle = (p) =>
  svg(p, { _s: 18, attrs: { stroke: 'none', fill: 'currentColor' } }, [
    h('path', { d: 'M21.6 12.2c0-.66-.06-1.3-.17-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.74 3-4.3 3-7.2Z', opacity: '.95' }),
    h('path', { d: 'M12 22c2.7 0 4.96-.9 6.6-2.43l-3.2-2.5c-.9.6-2.04.96-3.4.96-2.6 0-4.8-1.76-5.6-4.13H3.1v2.6A10 10 0 0 0 12 22Z' }),
    h('path', { d: 'M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z' }),
    h('path', { d: 'M12 5.96c1.47 0 2.8.5 3.84 1.5l2.86-2.86A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.96 12 5.96Z' }),
  ]);
IconGoogle.props = ['s'];

export const IconX = (p) =>
  svg(p, { _s: 16, attrs: { stroke: 'none', fill: 'currentColor' } }, [
    h('path', { d: 'M18.9 2H22l-7.5 8.6L23.3 22h-6.8l-5.3-7-6.1 7H2l8-9.2L1 2h7l4.8 6.4L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z' }),
  ]);
IconX.props = ['s'];

export const IconWallet = (p) =>
  svg(p, { _s: 19, attrs: { stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } }, [
    h('rect', { x: '3', y: '6', width: '18', height: '13', rx: '2.5' }),
    h('path', { d: 'M3 9.5h18' }),
    h('circle', { cx: '16.5', cy: '13.5', r: '1.15', fill: 'currentColor', stroke: 'none' }),
    h('path', { d: 'M16 6V4.6a1.6 1.6 0 0 0-2-1.55L5 5.2' }),
  ]);
IconWallet.props = ['s'];

export const IconFarcaster = (p) =>
  svg(p, { _s: 18, attrs: { stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } }, [
    h('path', { d: 'M5 5h14M4.4 5l.9 14M19.6 5l-.9 14' }),
    h('path', { d: 'M7.2 9.2h9.6M7.6 9.2v6.6M16.4 9.2v6.6' }),
    h('path', { d: 'M5.6 19h3.2M15.2 19h3.2' }),
  ]);
IconFarcaster.props = ['s'];

export const IconDiscord = (p) =>
  svg(p, { _s: 19, attrs: { stroke: 'none', fill: 'currentColor' } }, [
    h('path', { d: 'M19.5 5.3A17 17 0 0 0 15.4 4l-.25.5a13 13 0 0 1 3.7 1.8 12 12 0 0 0-13.7 0A13 13 0 0 1 8.85 4.5L8.6 4a17 17 0 0 0-4.1 1.3C1.9 9.2 1.2 13 1.5 16.7A17 17 0 0 0 6.7 19l.65-1.1a11 11 0 0 1-1.7-.82l.42-.32a8.4 8.4 0 0 0 7.86 0l.42.32a11 11 0 0 1-1.7.82L13.3 19a17 17 0 0 0 5.2-2.3c.36-4.3-.6-8.07-2-11.4ZM8.4 14.4c-.82 0-1.5-.74-1.5-1.66 0-.92.66-1.67 1.5-1.67.84 0 1.51.76 1.5 1.67 0 .92-.67 1.66-1.5 1.66Zm6.4 0c-.82 0-1.5-.74-1.5-1.66 0-.92.66-1.67 1.5-1.67.84 0 1.51.76 1.5 1.67 0 .92-.66 1.66-1.5 1.66Z' }),
  ]);
IconDiscord.props = ['s'];

export const IconMail = (p) =>
  svg(p, { _s: 18, attrs: { stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } }, [
    h('rect', { x: '3', y: '5', width: '18', height: '14', rx: '2.2' }),
    h('path', { d: 'M3.6 6.5 12 12.4l8.4-5.9' }),
  ]);
IconMail.props = ['s'];

export const IconChevron = (p) => {
  const dir = p?.dir || 'right';
  const d = dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6';
  return svg(p, { _s: 16, attrs: { stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } }, [
    h('path', { d }),
  ]);
};
IconChevron.props = ['s', 'dir'];

export const IconTicket = (p) =>
  svg(p, { _s: 15, attrs: { stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } }, [
    h('path', { d: 'M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4V7.5Z' }),
    h('path', { d: 'M13 6v2M13 11v2M13 16v2', 'stroke-dasharray': '0.1 3' }),
  ]);
IconTicket.props = ['s'];

// "More Options" person glyph (handoff inline svg on the More Options button).
export const IconUser = (p) =>
  svg(p, { _s: 18, attrs: { stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } }, [
    h('circle', { cx: '12', cy: '8', r: '3.4' }),
    h('path', { d: 'M5.5 19.5a6.5 6.5 0 0 1 13 0' }),
  ]);
IconUser.props = ['s'];

// Lock glyph — not in handoff (which is magic-link only); added for the
// password field of the retained username/password login (Этап 1).
export const IconLock = (p) =>
  svg(p, { _s: 18, attrs: { stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } }, [
    h('rect', { x: '4.5', y: '10.5', width: '15', height: '9.5', rx: '2.2' }),
    h('path', { d: 'M8 10.5V8a4 4 0 0 1 8 0v2.5' }),
  ]);
IconLock.props = ['s'];

// Small alert circle for the inline email-error line (handoff inline svg).
export const IconAlert = (p) =>
  svg(p, { _s: 13, attrs: { stroke: 'currentColor', 'stroke-width': '2' } }, [
    h('circle', { cx: '12', cy: '12', r: '9' }),
    h('path', { d: 'M12 7.5v5M12 16h.01', 'stroke-linecap': 'round' }),
  ]);
IconAlert.props = ['s'];
