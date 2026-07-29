"use client"; // form state + router redirect to the seeker's tracking link

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  createInterestRequestSchema,
  type CreateInterestRequestValues,
} from "@/lib/schemas/interest-schema";
import { createInterestRequest } from "@/actions/interest/create-interest-request";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function InterestRequestForm({ listingId }: { listingId: string }) {
  const t = useTranslations("Interest");
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateInterestRequestValues>({
    resolver: zodResolver(createInterestRequestSchema),
    defaultValues: { listingId, consentAccepted: false },
  });

  const onSubmit = async (values: CreateInterestRequestValues) => {
    setSubmitError(null);
    try {
      const result = await createInterestRequest(values);
      router.push(`/requests/${result.requestId}?token=${result.seekerRatingToken}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card flex flex-col gap-3 rounded-xl border p-4"
    >
      <h2 className="font-semibold">{t("heading")}</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seekerName">{t("nameLabel")}</Label>
        <Input id="seekerName" {...register("seekerName")} />
        {errors.seekerName && (
          <p className="text-destructive text-sm">{errors.seekerName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="seekerContact">{t("contactLabel")}</Label>
        <Input id="seekerContact" {...register("seekerContact")} />
        {errors.seekerContact && (
          <p className="text-destructive text-sm">{errors.seekerContact.message}</p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="interestConsent"
          checked={watch("consentAccepted")}
          onCheckedChange={(checked) => setValue("consentAccepted", checked === true)}
        />
        <Label htmlFor="interestConsent" className="text-sm leading-snug font-normal">
          {t("consentLabel")}
        </Label>
      </div>
      {errors.consentAccepted && (
        <p className="text-destructive text-sm">{errors.consentAccepted.message}</p>
      )}

      {submitError && <p className="text-destructive text-sm">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
