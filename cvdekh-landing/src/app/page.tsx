"use client";
import { Button } from "@/components/ui/button";
import VercelBlobVideoModal from "@/components/video";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative flex h-[50rem] w-full max-h-screen items-center justify-center bg-black">
      <div
        className={cn(
          "absolute inset-0 opacity-50",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center  [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] bg-black"></div>

      <div className="min-h-screen relative z-20  text-neutral-50 flex flex-col items-center justify-center p-4">
        <header className="text-center mb-8">
          {/* <Image
          src="/cvdekh-header.png" // Assumes icon.png is in the public folder
          alt="cvDekh Logo"
          width={700} // Adjust size as needed
          height={100} // Adjust size as needed
          className="mx-auto mb-6 rounded-lg"
        /> */}
          <Image
            src="/icon.png" // Assumes icon.png is in the public folder
            alt="cvDekh Logo"
            width={100} // Adjust size as needed
            height={100} // Adjust size as needed
            className="mx-auto mb-6 rounded-lg"
          />
          {/* <h1 className="text-5xl font-bold mb-4 text-white">cvDekh</h1> */}
          <h2 className="text-3xl font-bold mb-4 text-white">
            Smarter Resumes, Faster Jobs
          </h2>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            AI-powered resume editor that helps you edit, tailor, and optimize
            your resume for every job you apply to
          </p>
        </header>

        <main className="text-center mb-8 flex flex-row gap-4">
          {/* You can add more sections here, like features, testimonials, etc. */}
          <Button
            // variant="outline"
            className="bg-[#9FFE3F] hover:bg-[#9FFE3F]/70 text-black font-semibold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
            asChild
          >
            <Link
              href="https://forms.gle/X78yYmCcEkkctGje6" // Replace with your app download link or sign-up page
            >
              Get Early Access
            </Link>
          </Button>
          <VercelBlobVideoModal
            videoUrl={process.env.NEXT_PUBLIC_DEMO_VIDEO_URL}
            thumbnailUrl={process.env.NEXT_PUBLIC_DEMO_THUMBNAIL_URL}
          />
        </main>

        <footer className="text-center text-neutral-400 text-sm">
          <p>&copy; {new Date().getFullYear()} cvDekh. All rights reserved.</p>
          <Button variant={"link"} className="text-white/70">
            <Link href="/privacy-policy">Privacy Policy</Link>
          </Button>
        </footer>
      </div>
    </div>
  );
}
