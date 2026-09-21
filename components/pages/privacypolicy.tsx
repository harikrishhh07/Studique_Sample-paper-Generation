import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/router";

const PrivacyPolicy = () => {
  const router = useRouter();
  const handleGoBack = () => router.back();

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white relative">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <header className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors mb-4 p-2 rounded-lg hover:bg-white/5"
          >
            <FaArrowLeft size={16} />
            <span>Back</span>
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold mb-1 text-white">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Effective Date: 5 September 2026
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Last Updated: 5 September 2026
          </p>
        </header>

        {/* Intro */}
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl mb-8">
          <p className="text-gray-200 leading-relaxed text-sm">
            Studique is a student-developed platform developed under the iOS Development Centre, 
            SRM Institute of Science and Technology (SRMIST), and independently operated by the Studique team.
          </p>
        </div>

        {/* 1. Information We Collect */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">
            1. Information We Collect
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            When you use Studique, we may collect:
          </p>
          <ul className="list-disc list-inside text-sm space-y-2 text-gray-300 ml-2">
            <li><span className="font-semibold text-white">Account information:</span> Name, email address, password, academic year, and residence status.</li>
            <li><span className="font-semibold text-white">Login information:</span> Information associated with email/password, Google, or Sign in with Apple authentication.</li>
            <li><span className="font-semibold text-white">App information:</span> Academic Planner data, saved resources, preferences, purchases, and entitlements.</li>
            <li><span className="font-semibold text-white">Technical information:</span> Device information, app version, IP address, crash reports, and basic usage or diagnostic data.</li>
          </ul>
          <p className="text-gray-300 text-sm leading-relaxed mt-2">
            We do not receive or store your Google or Apple account password.
          </p>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">
            2. How We Use Your Information
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            We use your information to:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-300 ml-2">
            <li>Create and manage your account.</li>
            <li>Provide and personalize Studique features.</li>
            <li>Provide academic resources and campus information.</li>
            <li>Manage purchases and access to paid content.</li>
            <li>Maintain security, troubleshoot issues, and improve the platform.</li>
            <li>Communicate with you regarding your account or support requests.</li>
          </ul>
        </section>

        {/* 3. Academic and Campus Information */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">3. Academic and Campus Information</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Studique may provide academic resources, faculty information, room details, mess information, 
            and other campus-related information obtained from authorized sources.
          </p>
        </section>

        {/* 4. Paid Content */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">4. Paid Content</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Paid Question Banks and Sample Papers may be linked to your account or purchase entitlement. 
            Access may be limited to viewing within the app and subject to the applicable purchase terms.
          </p>
        </section>

        {/* 5. Third-Party Services */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">5. Third-Party Services</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Studique may use services such as <span className="font-semibold text-white">Apple, Google, and RevenueCat</span> for authentication, 
            purchases, entitlement management, analytics, or related functionality. These services may process 
            information according to their own privacy policies.
          </p>
        </section>

        {/* 6. Data Security */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">6. Data Security</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            We take reasonable measures to protect your information from unauthorized access, alteration, 
            disclosure, or loss. However, no online service can guarantee complete security.
          </p>
        </section>

        {/* 7. Data Retention and Deletion */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">7. Data Retention and Deletion</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            We retain information for as long as reasonably necessary to provide the service, meet legal 
            obligations, and maintain legitimate business records.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            To request account deletion, contact:
          </p>
          <div className="text-gray-300 text-sm ml-4">
            <p><span className="text-orange-400 font-semibold">Email:</span> <a href="mailto:studiquesrm@gmail.com" className="hover:text-orange-300">studiquesrm@gmail.com</a></p>
          </div>
        </section>

        {/* 8. Your Privacy */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">8. Your Privacy</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            You may request access to, correction of, or deletion of your personal information, 
            subject to applicable law.
          </p>
        </section>

        {/* 9. Changes to This Policy */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">9. Changes to This Policy</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be reflected on this 
            page with an updated date.
          </p>
        </section>

        {/* 10. Contact */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">10. Contact</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            For privacy-related questions or requests:
          </p>
          <div className="text-gray-300 text-sm ml-4">
            <p><span className="text-orange-400 font-semibold">Email:</span> <a href="mailto:studiquesrm@gmail.com" className="hover:text-orange-300">studiquesrm@gmail.com</a></p>
            <p><span className="text-orange-400 font-semibold">Website:</span> <a href="https://studique.in" className="hover:text-orange-300">studique.in</a></p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-6 p-4 bg-white/5 border border-gray-500/40 rounded-xl">
          <p className="text-gray-300 text-xs text-center">
            By using Studique, you acknowledge and agree to this Privacy Policy.
          </p>
          <p className="text-orange-400 font-semibold mt-3 text-center text-sm">
            © {new Date().getFullYear()} Studique. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
