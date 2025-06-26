"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Define proper types for the Tally widget
interface TallyWidget {
  loadEmbeds: () => void;
}

interface WindowWithTally extends Window {
  Tally?: TallyWidget;
}

export default function EarlyAccessPage() {
  const [formLoading, setFormLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
 
  useEffect(() => {
    // Set a minimum loading time to ensure skeleton is visible
    const minLoadingTime = setTimeout(() => {
      if (scriptLoaded && typeof window !== "undefined" && (window as WindowWithTally).Tally) {
        (window as WindowWithTally).Tally!.loadEmbeds();
      }
    }, 500); // Minimum 500ms loading time

    return () => clearTimeout(minLoadingTime);
  }, [scriptLoaded]);

  const handleScriptLoad = () => {
    setScriptLoaded(true);
    if (typeof window !== "undefined" && (window as WindowWithTally).Tally) {
      (window as WindowWithTally).Tally!.loadEmbeds();
    }
  };

  const handleIframeLoad = () => {
    // Add small delay to ensure smooth transition
    setTimeout(() => {
      setFormLoading(false);
    }, 200);
  };

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
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] bg-black"></div>
      
      <div className="lg:min-h-screen min-h-dvh relative z-20 text-neutral-50 flex flex-col items-center justify-center p-4">
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
        
        <main className="flex items-center justify-center w-full z-21 min-h-[600px] max-w-2xl">
          {formLoading && (
            <div className="w-full h-[600px] flex flex-col space-y-4 p-6 bg-neutral-900/50 rounded-lg border border-neutral-800">
              {/* Form skeleton */}
              <Skeleton className="h-8 w-3/4 bg-neutral-700" />
              <Skeleton className="h-4 w-full bg-neutral-700" />
              <Skeleton className="h-4 w-2/3 bg-neutral-700" />
              
              <div className="space-y-3 mt-6">
                <Skeleton className="h-12 w-full bg-neutral-700" />
                <Skeleton className="h-12 w-full bg-neutral-700" />
                <Skeleton className="h-24 w-full bg-neutral-700" />
              </div>
              
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full bg-neutral-700" />
                <Skeleton className="h-4 w-5/6 bg-neutral-700" />
              </div>
              
              <Skeleton className="h-12 w-32 bg-neutral-600 mt-6" />
            </div>
          )}
          
          <iframe
            data-tally-src="https://tally.so/embed/mRQM14?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="600"
            title="cvDekh Early Access"
            className={cn(
              "transition-opacity duration-500",
              formLoading ? "opacity-0 absolute" : "opacity-100 relative"
            )}
            onLoad={handleIframeLoad}
          />
        </main>
        
        <footer className="text-center text-neutral-400 text-sm mt-8">
          <Button variant="link" className="text-white/70">
            <Link href="/">Back to Home</Link>
          </Button>
        </footer>
      </div>
      
      <Script
        id="tally-js"
        src="https://tally.so/widgets/embed.js"
        onLoad={handleScriptLoad}
      />
    </div>
  );
}