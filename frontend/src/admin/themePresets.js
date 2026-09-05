// THEME PRESETS — curated color palettes the admin picks from (no color
// theory required, no raw RGB entry). Each preset is a plain object using
// the exact same keys ThemeProvider.jsx already reads from config.theme and
// applies as CSS variables, so selecting one is just "save this whole
// object as the invitation's theme" — no new backend concept needed.
//
// Colors are RGB triplets (no commas), matching src/index.css's :root tokens.

export const THEME_PRESETS = [
  {
    key: 'classic-romance',
    name: 'Classic Romance',
    theme: {
      bg: '50 12 24', surface: '255 248 241', fg: '245 232 215', fgSoft: '220 200 175',
      ink: '47 25 30', muted: '175 150 130', accent: '212 168 95', gold: '195 145 70', rose: '207 142 132',
    },
  },
  {
    key: 'blush-rose',
    name: 'Blush Rose',
    theme: {
      bg: '46 18 28', surface: '255 245 246', fg: '250 232 232', fgSoft: '230 200 205',
      ink: '54 24 32', muted: '190 150 155', accent: '224 140 150', gold: '206 120 130', rose: '235 170 178',
    },
  },
  {
    key: 'emerald-garden',
    name: 'Emerald Garden',
    theme: {
      bg: '10 28 22', surface: '244 249 244', fg: '224 240 226', fgSoft: '190 215 195',
      ink: '18 40 30', muted: '140 170 150', accent: '104 158 122', gold: '84 132 100', rose: '198 176 140',
    },
  },
  {
    key: 'midnight-blue',
    name: 'Midnight Blue',
    theme: {
      bg: '10 16 34', surface: '244 246 252', fg: '222 230 248', fgSoft: '190 200 225',
      ink: '18 24 46', muted: '140 155 190', accent: '132 158 214', gold: '108 134 190', rose: '170 150 210',
    },
  },
  {
    key: 'ivory-champagne',
    name: 'Ivory & Champagne',
    theme: {
      bg: '38 32 24', surface: '253 250 240', fg: '245 238 220', fgSoft: '222 210 185',
      ink: '46 38 26', muted: '180 165 135', accent: '198 172 110', gold: '176 148 90', rose: '210 190 155',
    },
  },
  {
    key: 'sunset-coral',
    name: 'Sunset Coral',
    theme: {
      bg: '42 16 16', surface: '255 245 238', fg: '250 226 210', fgSoft: '230 190 170',
      ink: '52 22 20', muted: '195 145 120', accent: '224 118 90', gold: '206 100 76', rose: '235 150 120',
    },
  },
  {
    key: 'lavender-dusk',
    name: 'Lavender Dusk',
    theme: {
      bg: '28 18 42', surface: '248 245 252', fg: '232 224 245', fgSoft: '205 195 225',
      ink: '36 24 52', muted: '160 145 190', accent: '162 132 210', gold: '140 110 190', rose: '196 170 220',
    },
  },
  {
    key: 'golden-sand',
    name: 'Golden Sand',
    theme: {
      bg: '40 30 14', surface: '253 248 236', fg: '244 232 200', fgSoft: '220 200 160',
      ink: '48 36 18', muted: '185 160 115', accent: '206 158 70', gold: '184 136 55', rose: '212 168 120',
    },
  },

  // ---- Nature-inspired ---------------------------------------------------
  {
    key: 'ocean-teal',
    name: 'Ocean Teal',
    theme: {
      bg: '8 26 30', surface: '240 250 250', fg: '216 240 240', fgSoft: '180 212 212',
      ink: '14 38 42', muted: '135 175 175', accent: '90 172 172', gold: '70 148 148', rose: '150 195 185',
    },
  },
  {
    key: 'forest-moss',
    name: 'Forest Moss',
    theme: {
      bg: '18 24 12', surface: '247 249 238', fg: '230 236 210', fgSoft: '200 212 175',
      ink: '26 34 16', muted: '160 172 125', accent: '138 156 78', gold: '112 130 60', rose: '188 178 120',
    },
  },
  {
    key: 'desert-sage',
    name: 'Desert Sage',
    theme: {
      bg: '30 32 24', surface: '250 249 240', fg: '236 236 220', fgSoft: '210 210 188',
      ink: '38 40 30', muted: '175 178 155', accent: '150 165 130', gold: '128 142 105', rose: '205 195 160',
    },
  },
  {
    key: 'autumn-maple',
    name: 'Autumn Maple',
    theme: {
      bg: '36 16 10', surface: '253 244 234', fg: '246 222 200', fgSoft: '222 182 155',
      ink: '44 22 14', muted: '190 135 100', accent: '198 100 55', gold: '172 82 42', rose: '216 140 90',
    },
  },
];

export function findThemePreset(themeValue) {
  if (!themeValue) return null;
  return THEME_PRESETS.find((p) => p.theme.accent === themeValue.accent && p.theme.bg === themeValue.bg) || null;
}
