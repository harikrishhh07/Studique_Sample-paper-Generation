"use client";

import { useEffect, useState, useCallback } from "react";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Link, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CouponResponse {
  coupon: {
    coupon_code: string;
    discount: number;
    status: string;
  };
  restaurant?: { name: string } | null;
  qrImage: string;
  discount: number;
}

const ARK_WEBSITE_URL = "https://arkbistro.in/onlineorder/";

let cachedSiteFont = "";
function getSiteFont(): string {
  if (cachedSiteFont) return cachedSiteFont;
  cachedSiteFont = "Inter, Segoe UI, Arial, sans-serif";
  return cachedSiteFont;
}

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CouponModal({ open, onOpenChange }: CouponModalProps) {
  const [data, setData] = useState<CouponResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError("");
    setLoading(true);

    (async () => {
      try {
        const response = await fetch("/api/coupons/me", {
          credentials: "include",
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const delay = response.redirected ? 0 : 600;
          await new Promise((r) => setTimeout(r, delay));
          throw new Error(payload?.error || "Could not load your coupon");
        }

        const payload = await response.json();
        if (!cancelled) {
          setData(payload);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Something went wrong. Try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const restaurantName = data?.restaurant?.name || "Ark Bistro";

  const handleDownload = useCallback(() => {
    if (!data) return;
    const code = data.coupon.coupon_code;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const qrSize = img.naturalWidth || 640;
      const U = qrSize / 100; // 1% of QR size = layout unit

      // ===================== LAYOUT =====================
      const margin = Math.round(8 * U);   // white margin around the whole ticket
      const framePad = Math.round(8 * U); // padding between frame edge and QR
      const bottomPad = Math.round(18 * U); // space under the last note line

      // Frame + QR block (square)
      const frameSize = qrSize + framePad * 2;
      const frameX = margin;
      const frameY = margin;
      const qrX = frameX + framePad;
      const qrY = frameY + framePad;

      // Sections below the frame
      const dividerGap = Math.round(5 * U);
      const labelH = Math.round(8 * U);
      const labelGap = Math.round(6 * U);
      const chipH = Math.round(22 * U);
      const chipGap = Math.round(7 * U);
      const noteLine = Math.round(8 * U);
      const noteGap = Math.round(9 * U);

      const divY = frameY + frameSize + dividerGap;          // divider line
      const labelY = divY + labelGap + labelH / 2;           // label center
      const chipY = labelY + labelH / 2 + chipGap;           // chip top
      const note1Y = chipY + chipH + noteGap;                // note line 1
      const note2Y = note1Y + noteLine;                      // note line 2

      // Canvas size = everything + margins, so nothing overflows
      const width = margin * 2 + frameSize;
      const height = note2Y + bottomPad + margin;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // White ticket background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // ===================== SCAN FRAME =====================
      ctx.fillStyle = "#FAFAFA";
      ctx.beginPath();
      ctx.roundRect(frameX, frameY, frameSize, frameSize, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,101,47,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // QR (fits exactly inside the frame)
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Corner brackets on the frame corners
      ctx.strokeStyle = "#ff652f";
      ctx.lineWidth = Math.max(4, Math.round(1.4 * U));
      const cl = Math.round(12 * U); // bracket arm length
      const brack = (x: number, y: number, dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(x + dx * cl, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy * cl);
        ctx.stroke();
      };
      const a = frameX;
      const b = frameX + frameSize;
      const c = frameY;
      const d = frameY + frameSize;
      brack(a, c, 1, 1);
      brack(b, c, -1, 1);
      brack(a, d, 1, -1);
      brack(b, d, -1, -1);

      // ===================== CENTER LOGO =====================
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.onload = () => {
        const logoBox = Math.round(qrSize * 0.22);
        const logoX = qrX + (qrSize - logoBox) / 2;
        const logoY = qrY + (qrSize - logoBox) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(logoX, logoY, logoBox, logoBox);
        const logoPad = Math.round(logoBox * 0.14);
        ctx.drawImage(
          logo,
          logoX + logoPad,
          logoY + logoPad,
          logoBox - logoPad * 2,
          logoBox - logoPad * 2
        );

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // ===================== PERFORATED DIVIDER =====================
        ctx.strokeStyle = "#E5E5E5";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(margin * 1.6, divY);
        ctx.lineTo(width - margin * 1.6, divY);
        ctx.stroke();
        ctx.setLineDash([]);

        // ===================== COUPON CODE =====================
        ctx.fillStyle = "#9aa0a6";
        ctx.font = `600 ${Math.round(7 * U)}px ${getSiteFont()}`;
        ctx.fillText("COUPON CODE", width / 2, labelY);

        const chipW = Math.round(qrSize * 0.7);
        const chipX = (width - chipW) / 2;
        ctx.fillStyle = "#FFF7F0";
        ctx.beginPath();
        ctx.roundRect(chipX, chipY, chipW, chipH, 16);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,101,47,0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.roundRect(chipX, chipY, chipW, chipH, 16);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#1a1a1a";
        ctx.font = `bold ${Math.round(9 * U)}px ${getSiteFont()}`;
        ctx.fillText(code, width / 2, chipY + chipH / 2);

        // ===================== INSTRUCTION NOTE =====================
        ctx.fillStyle = "#666666";
        ctx.font = `${Math.round(4.4 * U)}px ${getSiteFont()}`;
        ctx.fillText(
          "Get this scanned at the restaurant before",
          width / 2, note1Y
        );
        ctx.fillText(
          "making your final payment for the discount",
          width / 2, note2Y
        );

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${code}.png`;
        link.click();
      };
      logo.src = "/images/qrark.png";
    };
    img.src = data.qrImage;
  }, [data, restaurantName]);

  const handleWebsite = useCallback(() => {
    window.open(ARK_WEBSITE_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm border-0 bg-transparent text-white p-0 overflow-hidden sm:max-w-sm font-['Inter',system-ui,sans-serif]"
      >
        <DialogTitle className="sr-only">Coupon</DialogTitle>
        <DialogDescription className="sr-only">
          Your restaurant discount coupon QR code
        </DialogDescription>
        <div className="relative flex flex-col items-center gap-6 rounded-3xl border border-white/15 bg-[#121212] px-6 py-9 text-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_24px_60px_rgba(0,0,0,0.55)]">
          {/* Inner soft ring */}
          <div className="pointer-events-none absolute inset-2 rounded-[20px] border border-white/5" />
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-10"
              >
                <Loader2 className="h-9 w-9 animate-spin text-[#ff652f]" />
                <p className="text-sm font-medium text-white">
                  Generating your coupon...
                </p>
              </motion.div>
            )}

            {!loading && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-5"
              >
                <p className="text-sm font-medium text-red-400">{error}</p>
              </motion.div>
            )}

            {!loading && !error && data && (
              <motion.div
                key="qr"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-5 w-full"
              >
                {/* Ticket-style QR card */}
                <div className="w-full max-w-64 overflow-hidden rounded-2xl bg-white">
                  {/* QR with premium scan frame */}
                  <div className="relative p-4 pb-3">
                    <div className="relative rounded-xl border border-[#ff652f]/20 bg-[#FAFAFA] p-3">
                      {/* Corner accents */}
                      <span className="pointer-events-none absolute left-1.5 top-1.5 h-4 w-4 rounded-tl-md border-l-2 border-t-2 border-[#ff652f]" />
                      <span className="pointer-events-none absolute right-1.5 top-1.5 h-4 w-4 rounded-tr-md border-r-2 border-t-2 border-[#ff652f]" />
                      <span className="pointer-events-none absolute bottom-1.5 left-1.5 h-4 w-4 rounded-bl-md border-b-2 border-l-2 border-[#ff652f]" />
                      <span className="pointer-events-none absolute bottom-1.5 right-1.5 h-4 w-4 rounded-br-md border-b-2 border-r-2 border-[#ff652f]" />
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={data.qrImage}
                          alt={`${restaurantName} coupon QR code`}
                          className="w-full h-auto block"
                        />
                        {/* Embedded center logo */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="h-[22%] w-[22%] rounded-lg bg-white p-[3%]">
                            <NextImage
                              src="/images/qrark.png"
                              alt=""
                              width={120}
                              height={120}
                              className="h-full w-full object-contain"
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Perforated divider */}
                  <div className="relative mx-3">
                    <div className="border-t-2 border-dashed border-[#E5E5E5]" />
                    <span className="absolute -left-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#121212]" />
                    <span className="absolute -right-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#121212]" />
                  </div>

                  {/* Coupon code */}
                  <div className="flex flex-col items-center px-6 py-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                      Coupon Code
                    </p>
                    <div className="mt-2.5 w-full rounded-xl border border-dashed border-[#ff652f]/40 bg-[#FFF7F0] px-3 py-3">
                      <span className="block text-lg font-bold tracking-[0.3em] text-[#1a1a1a] select-all">
                        {data.coupon.coupon_code}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !!error || !data}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 text-white text-sm font-semibold transition-colors duration-200 hover:bg-orange-600 disabled:opacity-60 disabled:pointer-events-none"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              type="button"
              onClick={handleWebsite}
              disabled={loading || !!error || !data}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-white text-sm font-semibold transition-colors duration-200 hover:bg-white/10 disabled:opacity-60 disabled:pointer-events-none"
            >
              <Link className="h-4 w-4" />
              Website
            </button>
          </div>

          <p className="px-4 text-xs leading-relaxed text-gray-400">
            Get this scanned at the restaurant before making your final payment
            for the discount.
          </p>

          <p className="px-4 text-xs leading-relaxed text-gray-400">
            * Coupons are not valid for orders through the Ark Bistro website.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}