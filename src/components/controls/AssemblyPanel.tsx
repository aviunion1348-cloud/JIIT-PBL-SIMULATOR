import { useState } from 'react';
import { APPARATUS, componentById, isValidRailPosition, type ComponentId } from '../../experiment/apparatus';
import { checkReadiness } from '../../experiment/assembly';
import { useExperiment } from '../../experiment/experimentStore';
import './assembly.css';

/**
 * Component placement.
 *
 * Desktop: drag a mount from the palette onto the rail, or click then click.
 * Touch: tap to select, then tap a slot — the same code path, no hover reliance.
 */
export function AssemblyPanel() {
  const { state, dispatch, notify } = useExperiment();
  const [armed, setArmed] = useState<ComponentId | null>(null);
  const readiness = checkReadiness(state.apparatus);

  const place = (id: ComponentId, positionMm: number) => {
    if (!isValidRailPosition(positionMm)) {
      notify('That position is outside the rail (valid range 5–495 mm).');
      return;
    }
    dispatch({ type: 'place-component', id, positionMm: Math.round(positionMm) });
    setArmed(null);
  };

  const handlePaletteClick = (id: ComponentId) => {
    setArmed((current) => (current === id ? null : id));
    if (armed !== id) notify('Selected — now choose a rail slot.');
  };

  return (
    <div className="assembly">
      <div className="assembly__head">
        <span className="label">COMPONENT PALETTE</span>
        <span className={`chip ${readiness.ready ? 'chip--live' : 'chip--amber'}`}>
          {readiness.ready ? 'OPTICAL TRAIN READY' : `${readiness.missing.length} MISSING`}
        </span>
      </div>

      <ul className="assembly__palette">
        {APPARATUS.map((component) => {
          const placed = state.apparatus.placedComponentIds.includes(component.id);
          return (
            <li key={component.id}>
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', component.id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => handlePaletteClick(component.id)}
                className={`assembly__chip${placed ? ' is-placed' : ''}${armed === component.id ? ' is-armed' : ''}`}
                aria-pressed={armed === component.id}
                title={`${component.name} — drag onto the rail, or tap then tap a slot`}
              >
                <span className="assembly__chip-index mono">{String(component.index).padStart(2, '0')}</span>
                <span className="assembly__chip-name">{component.shortName}</span>
                <span className="assembly__chip-dot" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className={`assembly__rail${armed ? ' is-armed' : ''}`}
        role="group"
        aria-label="Optical rail drop zone"
        onDragOver={(event) => {
          if (armed || event.dataTransfer.types.includes('text/plain')) event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          const id = (event.dataTransfer.getData('text/plain') || armed) as ComponentId | null;
          if (!id) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / Math.max(1, rect.width);
          place(id, ratio * 500);
        }}
      >
        <div className="assembly__rail-slots">
          {Array.from({ length: 10 }, (_, i) => i * 50).map((mm) => (
            <button
              key={mm}
              type="button"
              className="assembly__slot"
              onClick={() => {
                if (!armed) {
                  notify('Select a component from the palette first.');
                  return;
                }
                place(armed, mm + 25);
              }}
              aria-label={`Rail slot at ${mm} to ${mm + 50} millimetres${armed ? `, place ${componentById(armed).name}` : ''}`}
            >
              <span className="mono">{mm}</span>
            </button>
          ))}
        </div>
        {state.apparatus.placedComponentIds
          .filter((id) => typeof state.apparatus.positions[id] === 'number')
          .map((id) => (
            <span
              key={id}
              className="assembly__placed"
              style={{ left: `${((state.apparatus.positions[id] ?? 0) / 500) * 100}%` }}
              title={`${componentById(id as ComponentId).name} at ${Math.round(state.apparatus.positions[id])} mm`}
            >
              <span className="mono">{componentById(id as ComponentId).index}</span>
            </span>
          ))}
      </div>

      <p className="note">
        {armed
          ? `Placing ${componentById(armed).name} — tap a rail slot or drop above.`
          : 'Drag a mount onto the rail, or tap a mount then a slot. The bench starts pre-assembled so you can experiment immediately.'}
      </p>

      <div className="assembly__actions">
        <button type="button" className="btn btn--sm" onClick={() => dispatch({ type: 'auto-assemble' })}>
          AUTO-ASSEMBLE
        </button>
        <button type="button" className="btn btn--sm btn--danger" onClick={() => dispatch({ type: 'reset-assembly' })}>
          CLEAR RAIL
        </button>
      </div>

      {!readiness.ready && (
        <p className="callout">
          Missing: {readiness.missing.map((id) => componentById(id).shortName).join(', ')}. The
          experiment will not start until the train is complete.
        </p>
      )}
    </div>
  );
}
