import { useFarm } from '../../context/FarmContext';

export default function FeedPredictor() {
  const { state } = useFarm();

  const dailyRate = state.ducksCount * state.feedConsumptionPerDuckPerDay;
  const daysLeft = state.ducksCount > 0 ? state.feedKgRemaining / dailyRate : Infinity;
  const formattedDays = Math.ceil(daysLeft);
  const isLow = daysLeft <= 4;

  if (state.ducksCount === 0) {
    return (
      <article className="bg-white rounded-2xl p-5 border-2 border-homestead-green shadow-[4px_4px_0px_0px_rgba(26,58,43,1)]">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-homestead-green opacity-75">
              Feed Stock Prediction
            </h3>
            <p className="text-sm">Based on daily consumption calculations</p>
          </div>
          <div className="text-2xl" aria-hidden="true">🏡</div>
        </div>
        <div className="mt-4 flex items-center space-x-4">
          <div className="text-3xl font-black tracking-tight text-homestead-green shrink-0">∞ Days</div>
          <div className="text-xs leading-relaxed text-homestead-green/80">
            No active flock consumption.
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`rounded-2xl p-5 border-2 shadow-[4px_4px_0px_0px_rgba(26,58,43,1)] transition-colors duration-300 ${
        isLow
          ? 'bg-homestead-light-terracotta border-homestead-terracotta text-homestead-terracotta'
          : 'bg-white border-homestead-green text-homestead-green'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-75">
            Feed Stock Prediction
          </h3>
          <p className="text-sm">Based on daily consumption calculations</p>
        </div>
        <div className="text-2xl" aria-hidden="true">{isLow ? '🚨' : '🌾'}</div>
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <div className={`text-3xl font-black tracking-tight shrink-0 ${isLow ? 'text-homestead-terracotta' : 'text-homestead-green'}`}>
          {formattedDays} Day{formattedDays === 1 ? '' : 's'}
        </div>
        <div className="text-xs leading-relaxed opacity-80">
          remaining before feed depletes completely.
          <div className="font-bold mt-1">
            {isLow ? '⚠️ LOW STOCK: Order feed today!' : 'Secure levels of grain.'}
          </div>
        </div>
      </div>
    </article>
  );
}
