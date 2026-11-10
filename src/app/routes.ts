export interface RouteDefinition {
  readonly path: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly index: string;
  readonly title: string;
  readonly subtitle: string;
}

export const ROUTES: readonly RouteDefinition[] = [
  {
    path: '/',
    label: 'LAB HOME',
    shortLabel: 'HOME',
    index: '00',
    title: 'THE OPTICAL LABORATORY',
    subtitle: 'An Interactive Optical Physics Laboratory',
  },
  {
    path: '/theory',
    label: 'THEORY',
    shortLabel: 'THEORY',
    index: '01',
    title: 'POLARISATION AT THE INTERFACE',
    subtitle: 'Unpolarised light, the plane of incidence, and the polarising condition',
  },
  {
    path: '/apparatus',
    label: 'APPARATUS',
    shortLabel: 'KIT',
    index: '02',
    title: 'THE OPTICAL TRAIN',
    subtitle: 'Seven components of the 500 mm goniometer bench',
  },
  {
    path: '/experiment',
    label: 'LIVE EXPERIMENT',
    shortLabel: 'LAB',
    index: '03',
    title: 'LIVE ANGULAR MEASUREMENT',
    subtitle: 'Drive the bench, sweep the incidence angle, and watch the physics respond',
  },
  {
    path: '/observations',
    label: 'OBSERVATIONS',
    shortLabel: 'DATA',
    index: '04',
    title: 'SOURCE LAB RECORD',
    subtitle: 'All 57 recorded readings, exactly as supplied',
  },
  {
    path: '/analysis',
    label: 'ANALYSIS',
    shortLabel: 'GRAPH',
    index: '05',
    title: 'CURRENT RESPONSE / INCIDENCE ANGLE',
    subtitle: 'Three measured minima and the reported Brewster angles',
  },
  {
    path: '/results',
    label: 'RESULTS',
    shortLabel: 'RESULTS',
    index: '06',
    title: 'THE POLARISING CONDITION',
    subtitle: 'What the source experiment establishes',
  },
  {
    path: '/viva',
    label: 'VIVA',
    shortLabel: 'VIVA',
    index: '07',
    title: 'TEST YOUR OPTICS',
    subtitle: 'Twenty-four experiment-focused questions',
  },
] as const;

export function routeByPath(path: string): RouteDefinition | undefined {
  return ROUTES.find((route) => route.path === path);
}
