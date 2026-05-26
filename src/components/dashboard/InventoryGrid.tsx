import { useFarm } from '../../context/FarmContext';

function InventoryCard({ label, value, unit, sub }: { label: string; value: string | number; unit?: string; sub: string }) {
  return (
    <article className="bg-white rounded-xl p-3 border-2 border-homestead-green shadow-[2px_2px_0px_0px_rgba(26,58,43,1)] flex flex-col justify-between text-center">
      <span className="text-[10px] uppercase font-black tracking-wider text-homestead-green/75">
        {label}
      </span>
      <span className="text-2xl font-black text-homestead-green my-2">
        {value}{unit && <span className="text-xs font-normal">{unit}</span>}
      </span>
      <span className="text-[10px] text-homestead-green/70">{sub}</span>
    </article>
  );
}

export default function InventoryGrid() {
  const { state } = useFarm();

  return (
    <div className="grid grid-cols-3 gap-3">
      <InventoryCard label="Ducks Count" value={state.ducksCount} sub="active birds" />
      <InventoryCard label="Eggs Stock" value={state.eggsOnHand} sub="raw eggs on hand" />
      <InventoryCard label="Feed On Hand" value={parseFloat(state.feedKgRemaining.toFixed(1))} unit="kg" sub="remaining stock" />
    </div>
  );
}
