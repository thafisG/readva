import type { AvatarConfig } from '../models/avatar.model';

const SKIN_COLORS = { light: '#f6d6bd', warm: '#e9b68f', tan: '#bd7d57', deep: '#70462f' } as const;
const HAIR_COLORS = {
  espresso: '#382821',
  chestnut: '#70452f',
  golden: '#c08b47',
  black: '#1f2024',
} as const;
const SHIRT_COLORS = {
  coffee: '#7c5c45',
  rose: '#b76e79',
  sage: '#6f947d',
  blue: '#657f9f',
} as const;

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinTone: 'warm',
  hairStyle: 'curly',
  hairColor: 'espresso',
  shirtColor: 'coffee',
  accessory: 'none',
};

export function createAvatarDataUrl(config: AvatarConfig): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createAvatarSvg(config))}`;
}

export function createAvatarSvg(config: AvatarConfig): string {
  const skin = SKIN_COLORS[config.skinTone];
  const hair = HAIR_COLORS[config.hairColor];
  const shirt = SHIRT_COLORS[config.shirtColor];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Avatar personalizado">
    <rect width="240" height="240" rx="120" fill="#f4ebe3"/>
    <circle cx="42" cy="54" r="20" fill="#ead7c6" opacity=".6"/>
    <circle cx="202" cy="190" r="30" fill="#dfc8b5" opacity=".45"/>
    <path d="M42 240c3-55 34-82 78-82s75 27 78 82" fill="${shirt}"/>
    <path d="M94 154h52v35c-12 13-40 13-52 0z" fill="${skin}"/>
    <circle cx="76" cy="110" r="15" fill="${skin}"/>
    <circle cx="164" cy="110" r="15" fill="${skin}"/>
    <ellipse cx="120" cy="101" rx="53" ry="65" fill="${skin}"/>
    ${hairShape(config.hairStyle, hair)}
    <ellipse cx="100" cy="108" rx="4" ry="5" fill="#392e29"/>
    <ellipse cx="140" cy="108" rx="4" ry="5" fill="#392e29"/>
    <path d="M110 136c7 6 14 6 21 0" fill="none" stroke="#9b584f" stroke-width="3" stroke-linecap="round"/>
    <path d="M93 94c5-4 11-4 16-1M132 93c5-3 11-3 16 1" fill="none" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>
    ${accessoryShape(config.accessory)}
  </svg>`;
}

function hairShape(style: AvatarConfig['hairStyle'], color: string): string {
  const shapes: Record<AvatarConfig['hairStyle'], string> = {
    short: `<path d="M67 99c-2-46 21-70 54-70 37 0 57 28 52 70-12-7-15-24-15-35-19 13-43 18-77 14-2 8-6 16-14 21z" fill="${color}"/>`,
    curly: `<path d="M66 104c-13-11-9-29 1-34-7-16 8-30 22-29 5-17 29-20 41-10 15-10 37 2 37 18 17 2 23 23 12 34 8 12 1 27-9 31-3-17-8-34-14-45-18 12-43 15-74 9-2 11-8 22-16 26z" fill="${color}"/>`,
    long: `<path d="M65 104c-5-49 19-76 55-76s60 29 55 78l-7 69-26-7 13-100c-18 12-42 16-73 10l13 90-25 7z" fill="${color}"/>`,
    bun: `<circle cx="120" cy="27" r="25" fill="${color}"/><path d="M67 101c-3-47 20-71 53-71 36 0 57 28 53 71-9-9-15-21-17-35-18 12-43 17-74 11-2 10-7 18-15 24z" fill="${color}"/>`,
  };
  return shapes[style];
}

function accessoryShape(accessory: AvatarConfig['accessory']): string {
  const shapes: Record<AvatarConfig['accessory'], string> = {
    none: '',
    glasses:
      '<g fill="none" stroke="#66554b" stroke-width="4"><rect x="84" y="98" width="31" height="23" rx="9"/><rect x="125" y="98" width="31" height="23" rx="9"/><path d="M115 106h10"/></g>',
    headphones:
      '<path d="M70 107V91c0-31 21-53 50-53s50 22 50 53v16" fill="none" stroke="#51463f" stroke-width="8"/><rect x="62" y="99" width="16" height="34" rx="8" fill="#7c5c45"/><rect x="162" y="99" width="16" height="34" rx="8" fill="#7c5c45"/>',
    earrings:
      '<g fill="#d6a84e"><circle cx="75" cy="126" r="5"/><circle cx="165" cy="126" r="5"/></g>',
  };
  return shapes[accessory];
}
