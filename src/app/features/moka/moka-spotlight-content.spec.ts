import { MOKA_CONFIG } from './moka.component';
import { getMokaSpotlight } from './moka-spotlight-content';

describe('Moka spotlight content', () => {
  it('varies recurring contextual messages', () => {
    expect(getMokaSpotlight('welcome', 0, MOKA_CONFIG.welcome).title).not.toBe(
      getMokaSpotlight('welcome', 1, MOKA_CONFIG.welcome).title,
    );
  });

  it('cycles variants safely', () => {
    expect(getMokaSpotlight('goal', 2, MOKA_CONFIG.goal)).toEqual(
      getMokaSpotlight('goal', 0, MOKA_CONFIG.goal),
    );
  });
});
