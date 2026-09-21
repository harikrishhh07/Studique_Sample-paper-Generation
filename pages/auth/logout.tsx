import { useRouter } from "next/router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const LogoutPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let isUnmounted = false;
    const performLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        sessionStorage.removeItem('studique-session-id');
        queryClient.clear();
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!isUnmounted) window.location.href = "/auth/login";
      } catch (error) {
        sessionStorage.removeItem('studique-session-id');
        queryClient.clear();
        if (!isUnmounted) window.location.href = "/auth/login";
      }
    };
    performLogout();
    return () => { isUnmounted = true; };
  }, [queryClient]);

  return null;
};

export default LogoutPage;
