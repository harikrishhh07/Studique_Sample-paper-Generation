import Background from "@/components/ui/background";
import AppSidebar from "@/components/ui/sidebar";
import QuestionBankComponent from "@/components/pages/questionbank";
import SEO from "@/components/SEO";
import { useState } from "react";
import { useRouter } from "next/router";

export default function QuestionBankPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();

  const handleNavigate = (page: string) => {
    if (page === "dashboard") {
      router.push("/");
    } else {
      router.push(`/${page}`);
    }
  };

  return (
    <>
      <SEO
        title="Question Bank & Sample Paper Generator | Studique"
        description="Generate verbatim Question Banks and SRM format Sample Papers from subject PPT notes and PYQs."
        keywords="Question Bank, Sample Paper, SRM PYQ, SRM exam paper, unit notes, Studique"
        url="https://studique.in/question-bank"
        canonical="https://studique.in/question-bank"
      />
      <div className="relative flex min-h-screen">
        <Background />
        <div className="absolute inset-0 z-10 flex">
          <AppSidebar
            onNavigate={handleNavigate}
            currentPage="question-bank"
            onCollapseChange={setIsSidebarCollapsed}
          />

          <main
            className={`flex-1 w-full overflow-auto transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? "md:ml-20" : "md:ml-20 lg:ml-60"
            }`}
          >
            <div className="flex-1">
              <QuestionBankComponent />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
