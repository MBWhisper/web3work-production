import { useEffect } from "react";
import { useLocation } from "wouter";

export function Navigate({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => { navigate(to); }, []);
  return null;
}
