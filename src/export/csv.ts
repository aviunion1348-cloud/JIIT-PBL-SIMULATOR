import { INCIDENCE_ANGLES, MATERIALS, MATERIAL_MAP, CURRENT_UNIT } from '../data/observations';
import type { MaterialKey } from '../physics/types';

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Full source observation export.
 * Values are emitted with their original decimal precision (String(number)).
 */
export function buildSourceCsv(): string {
  const header = [
    'Sr No',
    'Angle of Incidence (degrees)',
    'Topaz Glass - Current (I) in A',
    'Crown Glass - Current (I) in A',
    'Flint Glass - Current (I) in A',
  ];
  const rows = INCIDENCE_ANGLES.map((angle, index) => {
    const values = MATERIALS.map((material) => material.observations[index].currentA);
    return [String(index + 1), String(angle), ...values.map((value) => String(value))];
  });
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
}

/** Material-filtered export preserving source values. */
export function buildMaterialCsv(materialKey: MaterialKey): string {
  const material = MATERIAL_MAP[materialKey];
  const header = [
    'Sr No',
    'Angle of Incidence (degrees)',
    `${material.name} - ${CURRENT_UNIT}`,
  ];
  const rows = material.observations.map((observation) => [
    String(observation.serial),
    String(observation.angleDeg),
    String(observation.currentA),
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
}

/** Trigger a client-side download. No server involved. */
export function downloadFile(filename: string, contents: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next frame so Safari has time to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
