"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { setPendingQuestion } from "@/lib/pending";

export default function AskAboutButton({
  lang,
  question,
  label,
  variant = "primary",
}: {
  lang: string;
  question: string;
  label: string;
  variant?: "primary" | "ghost";
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={`btn btn-${variant}`}
      onClick={() => {
        setPendingQuestion(question);
        router.push(`/${lang}/ask`);
      }}
    >
      <MessageCircle aria-hidden="true" />
      {label}
    </button>
  );
}
