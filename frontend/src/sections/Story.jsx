// "OUR STORY" — dispatches to one of 5 selectable layouts (set per
// invitation in the admin editor's Story tab): Constellation, Timeline,
// Horizontal Scroll, Stacked, or Mosaic. All 5 share the same milestone
// data shape (date, title, description, image) so switching layouts needs
// no data migration.

import { Section } from '../components/ui/Section.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { ConstellationLayout } from './story-layouts/ConstellationLayout.jsx';
import { TimelineLayout } from './story-layouts/TimelineLayout.jsx';
import { HorizontalScrollLayout } from './story-layouts/HorizontalScrollLayout.jsx';
import { StackedLayout } from './story-layouts/StackedLayout.jsx';
import { MosaicLayout } from './story-layouts/MosaicLayout.jsx';

const LAYOUTS = {
  constellation: ConstellationLayout,
  timeline: TimelineLayout,
  horizontal: HorizontalScrollLayout,
  stacked: StackedLayout,
  mosaic: MosaicLayout,
};

export function Story() {
  const config = useConfig();
  const { story } = config;

  if (!story.enabled) return null;

  const Layout = LAYOUTS[config.storyLayout] || ConstellationLayout;

  return (
    <Section id="story" title={story.title} subtitle={story.subtitle} size="lg">
      <Layout milestones={story.milestones} />
    </Section>
  );
}
