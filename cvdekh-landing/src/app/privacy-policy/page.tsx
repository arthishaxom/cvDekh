export default function PrivacyPolicyPage() {
  const launchDate = "15/06/2025"; // Replace with your actual launch date

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 py-8 px-4 md:px-8 lg:px-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Privacy Policy - cvDekh
        </h1>
        <p className="mb-4 text-md text-center text-neutral-200">
          <strong>Effective Date:</strong> {launchDate}
        </p>
        <p className="mb-6 text-md text-center text-neutral-200">
          <strong>Developer Contact:</strong>{" "}
          <span className="text-green-300">
            <a href="mailto:pothal.builds@gmail.com">pothal.builds@gmail.com</a>
          </span>
        </p>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">1. Overview</h2>
          <p className="text-neutral-300">
            <span className="text-green-300 font-bold">cvDekh</span> is a resume
            builder app designed to help users edit, enhance, and tailor their
            resumes for job applications. We take your privacy seriously and aim
            to be transparent about how we collect, use, and store your
            information.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            2. Information We Collect
          </h2>
          <p className="text-neutral-300 mb-2">
            We collect the following types of data when you use the app:
          </p>
          <ul className="list-disc list-inside pl-4 text-neutral-300 space-y-1">
            <li>Email address (required for login and access)</li>
            <li>Name (used for personalization)</li>
            <li>
              Resume data, either:
              <ul className="list-circle list-inside pl-6 space-y-1 mt-1">
                <li>Entered manually</li>
                <li>Uploaded via PDF</li>
              </ul>
            </li>
            <li>
              Job descriptions pasted by you to receive improvement suggestions
            </li>
          </ul>
          <p className="text-neutral-300 mt-2">
            We do not collect your location, device metadata, or any background
            activity.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            3. How We Use Your Data
          </h2>
          <p className="text-neutral-300 mb-2">Your data is used only for:</p>
          <ul className="list-disc list-inside pl-4 text-neutral-300 space-y-1">
            <li>Allowing you to create, view, and edit your resumes</li>
            <li>
              Generating resume improvement suggestions based on the job
              description
            </li>
            <li>Saving your resume data securely for future access</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            4. Third-Party Services
          </h2>
          <p className="text-neutral-300 mb-2">
            We use the following services to provide core app functionality:
          </p>
          <ul className="list-disc list-inside pl-4 text-neutral-300 space-y-1">
            <li>Supabase – for authentication and database storage</li>
            <li>AI APIs – to generate resume improvement suggestions</li>
          </ul>
          <p className="text-neutral-300 mt-2">
            These third-party services may process your data according to their
            own privacy policies.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">5. Data Sharing</h2>
          <p className="text-neutral-300">
            We do not share your personal data or resume content with any third
            parties for advertising, analytics, or marketing purposes.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">6. Data Security</h2>
          <p className="text-neutral-300 mb-2">
            We take reasonable steps to protect your data. All data is
            transferred securely over HTTPS.
          </p>
          <p className="text-neutral-300 mb-2">
            However, as a solo developer using standard cloud services and an
            Express middleware server, we recommend not storing sensitive
            personal information (e.g., government IDs) within your resume.
          </p>
          <p className="text-neutral-300">
            Your resume data is stored securely using Supabase&apos;s database
            infrastructure.
          </p>
        </section>

        <section className="mb-6">
          <h2 id="delete-account" className="text-2xl font-semibold mb-3">
            7. Delete Your cvDekh Account
          </h2>
          <p className="text-neutral-300 mb-2">
            To permanently delete your cvDekh account and all associated data
            (including your email, name, uploaded resumes, and job
            descriptions), please follow these steps:
          </p>
          <ul className="list-disc list-inside pl-4 text-neutral-300 space-y-2">
            <li>
              Email us at{" "}
              <a
                href="mailto:pothal.builds@gmail.com"
                className="text-green-300 hover:underline"
              >
                pothal.builds@gmail.com
              </a>{" "}
              with the subject line: "Delete my cvDekh account".
            </li>
            <li>
              In your email, please confirm your registered email address.
            </li>
            <li>
              Upon receipt, we will:
              <ul className="list-circle list-inside pl-6 space-y-1 mt-1">
                <li>
                  Permanently erase all personal and resume-related data from
                  our databases.
                </li>
                <li>Confirm the deletion via email within 30 days.</li>
              </ul>
            </li>
            <li>No data is retained in backups beyond that period.</li>
            <li>If you have further questions, feel free to contact us.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            8. Children&apos;s Privacy
          </h2>
          <p className="text-neutral-300 mb-2">
            This app is intended for users 18 years and older. We do not
            knowingly collect personal information from anyone under the age of
            18.
          </p>
          <p className="text-neutral-300">
            If you believe that a child has provided us with personal data,
            please contact us for deletion.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">
            9. Changes to This Policy
          </h2>
          <p className="text-neutral-300">
            We may update this Privacy Policy as needed. If we make changes,
            we&apos;ll notify users via the app or by email.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-3">10. Contact</h2>
          <p className="text-neutral-300">
            If you have any questions or requests, please reach out at:
          </p>
          <p className="text-green-300 font-semibold">
            📧 pothal.builds@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
