import FinancialSnapshot from './FinancialSnapshot';
import FeedPredictor from './FeedPredictor';
import InventoryGrid from './InventoryGrid';
import Milestones from './Milestones';

export default function DashboardView() {
  return (
    <section className="space-y-4">
      <FinancialSnapshot />
      <FeedPredictor />
      <InventoryGrid />
      <Milestones />
    </section>
  );
}
