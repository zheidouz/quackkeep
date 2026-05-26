import { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';

export default function RecalibrateView() {
  const { state, updateState, resetState } = useFarm();
  const { showToast } = useToast();

  // Inventory form state
  const [ducks, setDucks] = useState(state.ducksCount);
  const [eggs, setEggs] = useState(state.eggsOnHand);
  const [feed, setFeed] = useState(state.feedKgRemaining);

  // Constants form state
  const [feedRate, setFeedRate] = useState(state.feedConsumptionPerDuckPerDay);
  const [eggPrice, setEggPrice] = useState(state.eggDefaultSalePrice);
  const [duckPrice, setDuckPrice] = useState(state.duckDefaultSalePrice);

  // Sync form fields when navigating back to this view
  useEffect(() => {
    setDucks(state.ducksCount);
    setEggs(state.eggsOnHand);
    setFeed(state.feedKgRemaining);
    setFeedRate(state.feedConsumptionPerDuckPerDay);
    setEggPrice(state.eggDefaultSalePrice);
    setDuckPrice(state.duckDefaultSalePrice);
  }, [state.ducksCount, state.eggsOnHand, state.feedKgRemaining,
      state.feedConsumptionPerDuckPerDay, state.eggDefaultSalePrice, state.duckDefaultSalePrice]);

  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    updateState((prev) => ({
      ...prev,
      ducksCount: ducks,
      eggsOnHand: eggs,
      feedKgRemaining: feed,
    }));
    showToast('Raw stock updated successfully');
  };

  const handleSaveConstants = (e: React.FormEvent) => {
    e.preventDefault();
    updateState((prev) => ({
      ...prev,
      feedConsumptionPerDuckPerDay: feedRate,
      eggDefaultSalePrice: eggPrice,
      duckDefaultSalePrice: duckPrice,
    }));
    showToast('Calculations refreshed');
  };

  const handleWipe = () => {
    if (confirm("Reset everything to standard default starter data? All custom entries will disappear.")) {
      resetState();
      showToast('System reset complete.');
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Manual Recalibration & Constants</h2>
      <p className="text-xs">Adjust raw counts or baseline coefficients to match reality.</p>

      {/* Raw Stock Override */}
      <article className="bg-white rounded-2xl p-5 border-2 border-homestead-green shadow-[4px_4px_0px_0px_rgba(26,58,43,1)] space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-homestead-green opacity-75">
          Adjust Raw Count Totals
        </h3>

        <form onSubmit={handleSaveInventory} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="recal-ducks" className="block text-xs font-bold mb-1">Ducks flock count</label>
              <input
                id="recal-ducks"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={ducks}
                onChange={(e) => setDucks(parseInt(e.target.value) || 0)}
                className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label htmlFor="recal-eggs" className="block text-xs font-bold mb-1">Eggs stock on hand</label>
              <input
                id="recal-eggs"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={eggs}
                onChange={(e) => setEggs(parseInt(e.target.value) || 0)}
                className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
          </div>
          <div>
            <label htmlFor="recal-feed" className="block text-xs font-bold mb-1">Feed On Hand (kg)</label>
            <input
              id="recal-feed"
              type="number"
              min={0}
              step={0.1}
              inputMode="decimal"
              value={feed}
              onChange={(e) => setFeed(parseFloat(e.target.value) || 0)}
              className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-homestead-green text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Save Raw Inventory Changes
          </button>
        </form>
      </article>

      {/* Constants Form */}
      <article className="bg-white rounded-2xl p-5 border-2 border-homestead-green shadow-[4px_4px_0px_0px_rgba(26,58,43,1)] space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-homestead-green opacity-75">
          Update Calculation Constants
        </h3>

        <form onSubmit={handleSaveConstants} className="space-y-3">
          <div>
            <label htmlFor="recal-feed-rate" className="block text-xs font-bold mb-1">
              Daily Feed consumption rate (kg per duck / day)
            </label>
            <input
              id="recal-feed-rate"
              type="number"
              min={0.01}
              max={5}
              step={0.01}
              inputMode="decimal"
              value={feedRate}
              onChange={(e) => setFeedRate(parseFloat(e.target.value) || 0.15)}
              className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="recal-price-egg" className="block text-xs font-bold mb-1">Default Egg price (₱)</label>
              <input
                id="recal-price-egg"
                type="number"
                min={0}
                step={0.05}
                inputMode="decimal"
                value={eggPrice}
                onChange={(e) => setEggPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <label htmlFor="recal-price-duck" className="block text-xs font-bold mb-1">Default Duck price (₱)</label>
              <input
                id="recal-price-duck"
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                value={duckPrice}
                onChange={(e) => setDuckPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-homestead-terracotta text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Update Constants
          </button>
        </form>
      </article>

      {/* Reset */}
      <div className="p-2 text-center">
        <button
          onClick={handleWipe}
          className="text-xs text-red-700 underline font-semibold focus:outline-none cursor-pointer"
        >
          🚨 Reset application data to default
        </button>
      </div>
    </section>
  );
}
