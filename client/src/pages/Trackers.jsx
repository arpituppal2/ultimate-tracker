import QuarterlyHabits from '../components/QuarterlyHabits';
import { PageHeader } from '../components/TaskSurface';

export default function Trackers() {
  return (
    <div style={{ paddingTop: 'var(--space-6)' }}>
      <PageHeader eyebrow="Trackers" title="Trackers" />
      <QuarterlyHabits />
    </div>
  );
}
