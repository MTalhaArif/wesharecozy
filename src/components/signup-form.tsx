"use client"; // Firebase Auth client SDK + react-hook-form local form state

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useTranslations } from "next-intl";
import { clientAuth } from "@/lib/firebase-client";
import { signupFormSchema, type SignupFormValues } from "@/lib/schemas/user-schema";
import { CURRENT_CONSENT_TEXT_VERSION } from "@/lib/schemas/consent-schema";
import { createUserProfile } from "@/actions/auth/create-user-profile";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SignupForm() {
  const t = useTranslations("Signup");
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      genderForFiltering: "unspecified",
      consentAccepted: false,
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setSubmitError(null);
    try {
      const credential = await createUserWithEmailAndPassword(
        clientAuth,
        values.email,
        values.password,
      );
      const idToken = await credential.user.getIdToken();
      await createUserProfile({
        idToken,
        displayName: values.displayName,
        genderForFiltering: values.genderForFiltering,
        consentTextVersion: CURRENT_CONSENT_TEXT_VERSION,
      });
      router.push("/verify-phone");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">{t("displayNameLabel")}</Label>
        <Input id="displayName" {...register("displayName")} />
        {errors.displayName && (
          <p className="text-destructive text-sm">{errors.displayName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="genderForFiltering">{t("genderLabel")}</Label>
        <Select
          defaultValue="unspecified"
          onValueChange={(value) => {
            if (value) {
              setValue("genderForFiltering", value as SignupFormValues["genderForFiltering"]);
            }
          }}
        >
          <SelectTrigger id="genderForFiltering" className="w-full">
            <SelectValue>
              {(value: SignupFormValues["genderForFiltering"]) =>
                t(
                  value === "female"
                    ? "genderFemale"
                    : value === "male"
                      ? "genderMale"
                      : "genderUnspecified",
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unspecified">{t("genderUnspecified")}</SelectItem>
            <SelectItem value="female">{t("genderFemale")}</SelectItem>
            <SelectItem value="male">{t("genderMale")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="consentAccepted"
          checked={watch("consentAccepted")}
          onCheckedChange={(checked) => setValue("consentAccepted", checked === true)}
        />
        <Label htmlFor="consentAccepted" className="text-sm leading-snug font-normal">
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