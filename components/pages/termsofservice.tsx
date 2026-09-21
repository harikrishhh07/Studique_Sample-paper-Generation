import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/router";

const Terms = () => {
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
            Terms of Service
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

        {/* 1. Using Studique */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">
            1. Using Studique
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            By using Studique, you agree to these Terms and applicable laws. You are responsible 
            for providing accurate account information and keeping your login credentials secure.
          </p>
        </section>

        {/* 2. Academic Resources */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">
            2. Academic Resources
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Studique provides academic resources such as previous year papers, answer keys, PPTs, 
            syllabus materials, Question Banks, Sample Papers, and other educational content.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Resources may be created, managed, or obtained from authorized sources. You may use them 
            only for personal, educational purposes.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Students cannot directly upload resources to Studique.
          </p>
        </section>

        {/* 3. Paid Content */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">3. Paid Content</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Certain Question Banks and Sample Papers may require payment for access to a particular subject.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Paid content is provided for personal use only. Unless expressly permitted, you must not 
            download, copy, reproduce, screen-record, distribute, share, resell, or attempt to bypass access restrictions.
          </p>
        </section>

        {/* 4. Campus Features */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">4. Campus Features</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Features such as Unit-wise Finder and Meal Map provide campus-related information, 
            including faculty details, room information, and dining information. Such information may 
            change and may not always be current.
          </p>
        </section>

        {/* 5. Academic Planner */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">5. Academic Planner</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            The Academic Planner allows you to manage your academic information within Studique. 
            You are responsible for the information you add or maintain.
          </p>
        </section>

        {/* 6. Perks and Partner Offers */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">6. Perks and Partner Offers</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Studique may provide discounts or offers from third-party businesses. Each offer may have 
            its own terms, eligibility, and validity. Studique is not responsible for the products or 
            services provided by partner businesses.
          </p>
        </section>

        {/* 7. Acceptable Use */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">7. Acceptable Use</h2>
          <p className="text-gray-300 text-sm leading-relaxed">You must not:</p>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-300 ml-2">
            <li>Use Studique for unlawful purposes.</li>
            <li>Attempt to gain unauthorized access to the platform or its systems.</li>
            <li>Circumvent technical restrictions or access controls.</li>
            <li>Copy, distribute, resell, or misuse Studique&apos;s content or services.</li>
          </ul>
        </section>

        {/* 8. Intellectual Property */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">8. Intellectual Property</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Studique and its licensors retain all rights to the platform, branding, software, and content 
            unless otherwise stated. You receive a limited, non-transferable right to use Studique for its intended purpose.
          </p>
        </section>

        {/* 9. Purchases and Refunds */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">9. Purchases and Refunds</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Purchases are subject to the applicable App Store or payment provider terms and applicable law. 
            Access to paid content is granted according to the purchase made.
          </p>
        </section>

        {/* 10. Disclaimer */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">10. Disclaimer</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Studique provides academic and campus information for convenience and educational purposes. 
            We do not guarantee the accuracy, completeness, availability, or academic outcome of any information or resource.
          </p>
        </section>

        {/* 11. Changes or Suspension */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">11. Changes or Suspension</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            We may modify, suspend, or discontinue features and may restrict or terminate access where necessary, 
            including for misuse or violation of these Terms.
          </p>
        </section>

        {/* 12. Privacy */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">12. Privacy</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Your use of Studique is also subject to our Privacy Policy.
          </p>
        </section>

        {/* 13. Governing Law */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">13. Governing Law</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            These Terms are governed by the laws of India. Subject to applicable law, courts in Chennai, 
            Tamil Nadu shall have jurisdiction.
          </p>
        </section>

        {/* 14. Contact */}
        <section className="space-y-3 mb-8">
          <h2 className="text-xl font-bold text-orange-400">14. Contact</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            For questions or support:
          </p>
          <div className="text-gray-300 text-sm ml-4">
            <p><span className="text-orange-400 font-semibold">Email:</span> <a href="mailto:studique.srm@gmail.com" className="hover:text-orange-300">studique.srm@gmail.com</a></p>
            <p><span className="text-orange-400 font-semibold">Website:</span> <a href="https://studique.in" className="hover:text-orange-300">studique.in</a></p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-6 p-4 bg-white/5 border border-gray-500/40 rounded-xl">
          <p className="text-gray-300 text-xs text-center">
            By using Studique, you acknowledge and agree to these Terms of Service.
          </p>
          <p className="text-orange-400 font-semibold mt-3 text-center text-sm">
            © {new Date().getFullYear()} Studique. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
