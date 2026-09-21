import { useEffect } from "react";
import { useRouter } from "next/router";

export default function MarksPredictorRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calcgpa-plus");
  }, [router]);

  return null;
}