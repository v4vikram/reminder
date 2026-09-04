"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * A row of language buttons.
 *
 * Two options on a phone: buttons beat a select - one tap instead of two, and
 * both choices stay visible so the owner can see what they are switching from.
 */
export function LanguagePicker<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("language");

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          variant={value === option ? "default" : "outline"}
          onClick={() => onChange(option)}
          disabled={disabled}
          className="h-12"
        >
          {/* Every label is written in its own language, so someone who cannot
              read the current one can still find the one they want. */}
          {t(option === "HI_LATN" || option === "hi-Latn" ? "hi-Latn" : "en")}
        </Button>
      ))}
    </div>
  );
}
