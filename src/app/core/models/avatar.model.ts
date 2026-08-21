export type AvatarSkinTone = 'light' | 'warm' | 'tan' | 'deep';
export type AvatarHairStyle = 'short' | 'curly' | 'long' | 'bun';
export type AvatarHairColor = 'espresso' | 'chestnut' | 'golden' | 'black';
export type AvatarShirtColor = 'coffee' | 'rose' | 'sage' | 'blue';
export type AvatarAccessory = 'none' | 'glasses' | 'headphones' | 'earrings';

export interface AvatarConfig {
  skinTone: AvatarSkinTone;
  hairStyle: AvatarHairStyle;
  hairColor: AvatarHairColor;
  shirtColor: AvatarShirtColor;
  accessory: AvatarAccessory;
}
