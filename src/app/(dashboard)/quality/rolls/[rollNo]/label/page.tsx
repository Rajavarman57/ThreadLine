import { getRollTrace } from "@/services/quality";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ rollNo: string }>;
}

export default async function RollPrintableLabelPage({ params }: PageProps) {
  const { rollNo } = await params;
  const trace = await getRollTrace(rollNo);

  if (!trace) {
    notFound();
  }

  const qrDataUrl = await QRCode.toDataURL(
    `https://thread-line-smoky.vercel.app/quality/rolls/${rollNo}`,
    {
      width: 240,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }
  );

  return (
    <div className="min-h-screen bg-white text-black p-8 font-mono flex items-center justify-center">
      <div className="border-4 border-black p-8 max-w-md w-full space-y-6">
        {/* HEADER */}
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-xl font-black uppercase tracking-wider">
            Everest Textile Mills
          </h1>
          <p className="text-xs uppercase tracking-tight text-gray-700">
            Finished Fabric Roll Identification Label
          </p>
        </div>

        {/* QR CODE & BARCODE */}
        <div className="flex flex-col items-center justify-center space-y-2 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt={`QR Code for ${rollNo}`} className="size-48" />
          <span className="text-2xl font-black tracking-widest">{trace.roll.rollNo}</span>
        </div>

        {/* SPECIFICATIONS TABLE */}
        <div className="border-t-2 border-black pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-bold">LENGTH:</span>
            <span className="font-bold text-base">{trace.roll.lengthM} METRES</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">ORDER REF:</span>
            <span>PO #{trace.order.orderNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">BUYER:</span>
            <span className="text-right truncate max-w-[200px]">{trace.order.buyer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">FABRIC:</span>
            <span className="text-right truncate max-w-[200px]">{trace.order.fabricType}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">COLOUR:</span>
            <span>{trace.order.colour}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">QC STATUS:</span>
            <span className="font-black uppercase">{trace.roll.qcStatus}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-gray-300">
            <span>MFG DATE:</span>
            <span>{new Date(trace.roll.createdAt).toLocaleDateString("en-IN")}</span>
          </div>
        </div>

        {/* FOOTER PRINT CONTROLS */}
        <div className="pt-4 text-center print:hidden">
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            className="px-4 py-2 border-2 border-black font-bold uppercase text-xs hover:bg-black hover:text-white transition-colors"
          >
            Click to Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
