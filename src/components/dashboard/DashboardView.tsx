import { useFarm } from '../../context/FarmContext';
import FinancialSnapshot from './FinancialSnapshot';
import FeedPredictor from './FeedPredictor';
import InventoryGrid from './InventoryGrid';
import Milestones from './Milestones';

export default function DashboardView() {
  const { loading } = useFarm();

  if (loading) {
    return (
      <section className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/60 rounded-2xl p-5 border-2 border-homestead-green/30 animate-pulse">
            <div className="h-4 bg-homestead-green/10 rounded w-1/3 mb-4" />
            <div className="h-8 bg-homestead-green/10 rounded w-1/2 mb-2" />
            <div className="h-4 bg-homestead-green/10 rounded w-2/3" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <FinancialSnapshot />
      <FeedPredictor />
      <InventoryGrid />
      <Milestones />
    </section>
  );
}
