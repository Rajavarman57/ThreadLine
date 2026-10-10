import { auth } from "@/lib/auth";
import { getInvoiceDetail } from "@/services/payments";
import { InvoiceDetailClient } from "./invoice-detail-client";
import { notFound, redirect } from "next/navigation";
export const dynamic = "force-dynamic";

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const invoice = await getInvoiceDetail(id);

  if (!invoice) {
    notFound();
  }

  // If user is BUYER, ensure they can only view invoices for their own company
  if (session.user.role === "BUYER" && session.user.buyerId) {
    if (invoice.order.buyer.id !== session.user.buyerId) {
      notFound();
    }
  }

  const canRecordPayment =
    session.user.role === "ADMIN" || session.user.role === "ACCOUNTS";

  return (
    <div className="flex-1 space-y-6 p-6">
      <InvoiceDetailClient
        invoice={invoice}
        canRecordPayment={canRecordPayment}
      />
    </div>
  );
}
