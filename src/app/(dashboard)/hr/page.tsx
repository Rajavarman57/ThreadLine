import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

export default function HRPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Resources & Shift Attendance"
        description="Manage the factory worker registry, record shift hours (Shift A, B, C), log overtime, and finalize monthly wage payments."
      />

      <EmptyState
        icon={Users}
        title="No Attendance Records Logged"
        description="Register mill workers and record daily shift attendance to compute overtime and wage payouts."
      />
    </div>
  );
}
