"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

export default function EarlyAccessPage() {
  const [formLoading, setFormLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Tally) {
      (window as any).Tally.loadEmbeds();
    }
  }, []);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-black">
      <div
        className={cn(
          "absolute inset-0 opacity-20",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center  [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] bg-black"></div>

      <div className="lg:min-h-screen min-h-dvh relative z-20  text-neutral-50 flex flex-col items-center justify-center p-4">
        <header className="text-center my-8">
          <Image
            src="/icon.png"
            alt="cvDekh Logo"
            width={100}
            height={100}
            className="mx-auto mb-6 rounded-lg"
          />
          <h2 className="text-3xl font-bold mb-4 text-white">
            Get Early Access
          </h2>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            Fill out the form below to join our early access program!
          </p>
        </header>

        <main className="flex items-center w-full z-21 min-h-[400px]">
          {formLoading && (
            <div className="absolute left-0 right-0 flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#9FFE3F] border-opacity-70"></div>
            </div>
          )}
          <iframe
            data-tally-src="https://tally.so/embed/mRQM14?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="1061"
            title="cvDekh Early Access"
            style={{ visibility: formLoading ? 'hidden' : 'visible' }}
            onLoad={() => setFormLoading(false)}
          ></iframe>
          <Script
            id="tally-js"
            src="https://tally.so/widgets/embed.js"
            onLoad={() => {
              if (typeof window !== "undefined" && (window as any).Tally) {
                (window as any).Tally.loadEmbeds();
              }
            }}
          />
        </main>

        <footer className="text-center text-neutral-400 text-sm mt-8">
          <Button variant={"link"} className="text-white/70">
            <Link href="/">Back to Home</Link>
          </Button>
        </footer>
      </div>
    </div>
  );
} 