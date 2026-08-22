import { createAvatarDataUrl, createAvatarSvg, DEFAULT_AVATAR_CONFIG } from './avatar-svg.rules';

describe('avatar SVG rules', () => {
  it('creates a deterministic SVG from safe options', () => {
    const svg = createAvatarSvg({ ...DEFAULT_AVATAR_CONFIG, accessory: 'glasses' });
    expect(svg).toContain('Avatar personalizado');
    expect(svg).toContain('<rect x="84"');
    expect(svg).toContain('#e9b68f');
  });

  it('creates an image data URL', () => {
    expect(createAvatarDataUrl(DEFAULT_AVATAR_CONFIG)).toMatch(/^data:image\/svg\+xml/);
  });
});
