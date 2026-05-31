// icons.js — landing inline SVG marks, ported 1:1 from the design reference
// (hexlash_latest/icons.jsx). Functional components via Vue's h() render
// function — no template compiler, production-safe, tree-shakeable.
import { h } from 'vue';

const svg = (attrs, children) =>
  h('svg', { 'aria-hidden': 'true', ...attrs }, children);

export const LogoMark = () =>
  svg(
    { viewBox: '0 0 48 48', class: 'logo-svg' },
    [
      h('polygon', {
        points: '24,3 41.5,13 41.5,35 24,45 6.5,35 6.5,13',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.4',
      }),
      h('polygon', {
        points: '24,13 33,18.5 33,29.5 24,35 15,29.5 15,18.5',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.4',
      }),
      h('path', {
        d: 'M24 13 L24 24 M24 24 L33 18.5 M24 24 L15 29.5',
        stroke: 'currentColor',
        'stroke-width': '2.4',
        fill: 'none',
        'stroke-linecap': 'round',
      }),
    ]
  );

export const DiscordIcon = () =>
  svg(
    { viewBox: '0 0 24 24', width: '22', height: '22', fill: 'currentColor' },
    [
      h('path', {
        d: 'M20.3 4.5A19 19 0 0 0 15.6 3l-.3.5a14 14 0 0 1 4.2 2 12.6 12.6 0 0 0-15 0 14 14 0 0 1 4.2-2L8.4 3a19 19 0 0 0-4.7 1.5C1 9 .3 13.3.6 17.6A19 19 0 0 0 6.4 20l.7-1.2a12 12 0 0 1-1.9-.9l.5-.4a9 9 0 0 0 7.6 0l.5.4a12 12 0 0 1-1.9.9l.7 1.2a19 19 0 0 0 5.8-2.4c.4-5-.7-9.3-3-13.1ZM8.5 15c-.9 0-1.7-.8-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Zm7 0c-.9 0-1.7-.8-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Z',
      }),
    ]
  );

export const XIcon = () =>
  svg(
    { viewBox: '0 0 24 24', width: '19', height: '19', fill: 'currentColor' },
    [
      h('path', {
        d: 'M18.9 2H22l-7.5 8.6L23.3 22h-6.8l-5.3-7-6.1 7H2l8-9.2L1 2h7l4.8 6.4L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z',
      }),
    ]
  );

export const TelegramIcon = () =>
  svg(
    { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'currentColor' },
    [
      h('path', {
        d: 'M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.7L17 6.5c.4-.3-.1-.5-.6-.2L6.7 12.5l-4.5-1.4c-1-.3-1-1 .2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.3Z',
      }),
    ]
  );

export const YoutubeIcon = () =>
  svg(
    { viewBox: '0 0 24 24', width: '22', height: '22', fill: 'currentColor' },
    [
      h('path', {
        d: 'M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5C.5 9.4.5 12 .5 12s0 2.6.5 4.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.5.5-4.5s0-2.6-.5-4.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z',
      }),
    ]
  );

export const InstagramIcon = () =>
  svg(
    {
      viewBox: '0 0 24 24',
      width: '20',
      height: '20',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
    },
    [
      h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '5' }),
      h('circle', { cx: '12', cy: '12', r: '4' }),
      h('circle', { cx: '17.4', cy: '6.6', r: '1.2', fill: 'currentColor', stroke: 'none' }),
    ]
  );

export const ArrowIcon = () =>
  svg(
    {
      viewBox: '0 0 24 24',
      width: '18',
      height: '18',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2.6',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    [h('path', { d: 'M5 12h14M13 6l6 6-6 6' })]
  );

export const PlayIcon = () =>
  svg(
    { viewBox: '0 0 24 24', width: '26', height: '26', fill: 'currentColor' },
    [h('path', { d: 'M8 5.5v13l11-6.5L8 5.5Z' })]
  );

export const CopyIcon = () =>
  svg(
    {
      viewBox: '0 0 24 24',
      width: '16',
      height: '16',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    [
      h('rect', { x: '9', y: '9', width: '11', height: '11', rx: '2' }),
      h('path', { d: 'M5 15V5a2 2 0 0 1 2-2h10' }),
    ]
  );
