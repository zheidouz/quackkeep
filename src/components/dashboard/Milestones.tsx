import { useFarm } from '../../context/FarmContext';

export default function Milestones() {
  const { state } = useFarm();

  const totalIncome = state.transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const dailyRate = state.ducksCount * state.feedConsumptionPerDuckPerDay;

  const insights: string[] = [];
  if (state.ducksCount > 0) {
    insights.push(`Your flock consumes about ${dailyRate.toFixed(1)} kg of feed every single day.`);
  }
  if (state.eggsOnHand > 50) {
    insights.push(`🥚 Stock surplus! You have ${state.eggsOnHand} eggs on hand ready for sale.`);
  }
  if (netBalance > 100) {
    insights.push(`📈 Financial milestone: Net profit is positive. Your homestead is solvent!`);
  } else if (netBalance < 0) {
    insights.push(`📉 Expense Note: Current outlays exceed sales revenues. Plan next crop egg sales.`);
  }
  if (state.ducksCount < 10) {
    insights.push(`🏡 Small scale operation active. Perfect size for local direct consumer sales.`);
  } else {
    insights.push(`🎉 Vibrant Farm: ${state.ducksCount} ducks driving organic fertilizer and pest removal.`);
  }

  return (
    <article className="bg-white rounded-2xl p-4 border-2 border-homestead-green shadow-[4px_4px_0px_0px_rgba(26,58,43,1)] space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-homestead-green border-b border-homestead-green pb-1 flex items-center space-x-2">
        <span>🎉</span> <span>Homestead Milestones</span>
      </h3>
      <ul className="space-y-2 text-xs leading-relaxed">
        {insights.map((item, i) => (
          <li key={i} className="flex items-start space-x-2">
            <span>▶</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
