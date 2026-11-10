import { PortalExperience } from '../portal/PortalExperience';

interface Props {
  readonly onArrive?: (route: string) => void;
}

/** Route entry for the full-viewport portal navigator. */
export default function PortalPage({ onArrive }: Props) {
  return <PortalExperience onArrive={onArrive} />;
}
