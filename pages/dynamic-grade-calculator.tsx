import { useEffect } from "react";
import { useRouter } from "next/router";

export default function DynamicGradeCalculatorRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/calcgpa-plus");
  }, [router]);

  return null;
}
