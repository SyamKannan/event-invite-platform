// STORY LAYOUTS — display names/descriptions for the 5 story layout keys
// (sections/story-layouts/*, dispatched by sections/Story.jsx). Shared by
// the editor's layout picker and the dashboard's badge so the wording lives
// in one place. Which layouts a given event type may use comes from the
// backend registry (EventTypes::ALL[type].storyLayouts).

export const STORY_LAYOUTS = [
  { key: 'constellation', name: 'Constellation', description: 'Glowing stars on a starfield, auto-positioned' },
  { key: 'timeline', name: 'Vertical Timeline', description: 'Alternating left/right cards down a line' },
  { key: 'horizontal', name: 'Horizontal Scroll', description: 'Swipeable strip of cards' },
  { key: 'stacked', name: 'Stacked Cards', description: 'Simple top-to-bottom cards' },
  { key: 'mosaic', name: 'Photo Mosaic', description: 'Image-forward grid, captions on hover' },
];

export function storyLayoutName(key) {
  return STORY_LAYOUTS.find((l) => l.key === key)?.name || null;
}
