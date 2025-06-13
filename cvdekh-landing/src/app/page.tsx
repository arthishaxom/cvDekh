import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-4">
      <header className="text-center mb-12">
        <Image
          src="/icon.png" // Assumes icon.png is in the public folder
          alt="cvDekh Logo"
          width={128} // Adjust size as needed
          height={128} // Adjust size as needed
          className="mx-auto mb-6 rounded-lg"
        />
        <h1 className="text-5xl font-bold mb-4 text-white">cvDekh</h1>
        <h2 className="text-3xl font-bold mb-4 text-white">
          Craft Your Future, One Resume at a Time.
        </h2>
        <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
          Effortlessly build, enhance, and tailor professional resumes that
          stand out. Get AI-powered suggestions and land your dream job.
        </p>
      </header>

      <main className="text-center mb-12">
        {/* You can add more sections here, like features, testimonials, etc. */}
        <a
          href="#" // Replace with your app download link or sign-up page
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          Get Started Now
        </a>
      </main>

      <footer className="text-center text-neutral-400 text-sm">
        <p>&copy; {new Date().getFullYear()} cvDekh. All rights reserved.</p>
        <Link href="/privacy-policy" className="hover:text-green-400 underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
