"use client"; // Firebase Auth (ID token), react-hook-form state, file/map inputs, dynamic Leaflet import

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { onAuthStateChanged, createUserWithEmailAndPassword, updateProfile, type User } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import {
  createListingFormSchema,
  type CreateListingFormValues,
  type ListingType,
} from "@/lib/schemas/listing-schema";
import { signupFormSchema } from "@/lib/schemas/user-schema";
import { phoneE164Schema, otpCodeSchema } from "@/lib/schemas/phone-schema";
import { CURRENT_CONSENT_TEXT_VERSION } from "@/lib/schemas/consent-schema";
import { createListing } from "@/actions/listings/create-listing";
import { createUserProfile } from "@/actions/auth/create-user-profile";
import { getMyPhoneVerificationStatus } from "@/actions/auth/get-my-phone-verification-status";
import { requestOtp } from "@/actions/phone/request-otp";
import { verifyOtp } from "@/actions/phone/verify-otp";
import { useRouter } from "@/i18n/navigation";
import type { DistrictSeed } from "@/lib/districts/district-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoUpload } from "@/components/photo-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LocationPicker = dynamic(
  () => import("@/components/location-picker").then((mod) => mod.LocationPicker),
  { ssr: false },
);

const LISTING_TYPES: ListingType[] = [
  "ROOM_IN_SHARED_FLAT",
  "WHOLE_FLAT_SUBLET",
  "SHORT_TERM_SUBLET",
  "FLATMATE_WANTED",
];

const GENDER_PREFERENCE_TYPES: ListingType[] = ["ROOM_IN_SHARED_FLAT", "FLATMATE_WANTED"];

// Inline account fields only need displayName/email/password -- the full
// signup form's gender-for-filtering step isn't relevant here and defaults
// silently to "unspecified", same as it would if left blank on /signup.
const inlineAccountSchema = signupFormSchema.pick({ displayName: true, email: true, password: true });

export function CreateListingForm({
  districts,
  locale,
}: {
  districts: DistrictSeed[];
  locale: string;
}) {
  const t = useTranslations("CreateListing");
  const tSignup = useTranslations("Signup");
  const tVerify = useTranslations("VerifyPhone");
  const districtName = (district: DistrictSeed) =>
    locale === "tr" ? district.nameTr : district.nameEn;
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => onAuthStateChanged(clientAuth, (nextUser) => {
    setUser(nextUser);
    setAuthChecked(true);
  }), []);

  // Inline "create an account" fields, only shown/used when signed out.
  const [accountDisplayName, setAccountDisplayName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConsent, setAccountConsent] = useState(false);

  // Inline phone-verification step, entered only if the (possibly
  // just-created) account hasn't verified a phone number yet.
  const [phase, setPhase] = useState<"listing" | "phone">("listing");
  const [phone, setPhone] = useState("+90");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const pendingValuesRef = useRef<CreateListingFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingFormValues>({
    resolver: zodResolver(createListingFormSchema),
    defaultValues: {
      type: "ROOM_IN_SHARED_FLAT",
      genderPreference: "ANY",
      districtId: districts[0]?.id ?? "",
      exactLat: 0,
      exactLng: 0,
      consentAccepted: false,
      commissionAccepted: false,
    },
  });

  const selectedType = watch("type");
  const genderPreferenceApplies = GENDER_PREFERENCE_TYPES.includes(selectedType);

  const publishListing = async (values: CreateListingFormValues, currentUser: User) => {
    setIsPublishing(true);
    try {
      const idToken = await currentUser.getIdToken();
      const formData = new FormData();
      formData.set("idToken", idToken);
      formData.set("type", values.type);
      formData.set("districtId", values.districtId);
      formData.set("neighborhood", values.neighborhood);
      formData.set("titleTr", values.titleTr);
      formData.set("titleEn", values.titleEn);
      formData.set("descriptionTr", values.descriptionTr);
      formData.set("descriptionEn", values.descriptionEn);
      formData.set("rentKurus", String(values.rentKurus));
      formData.set("depositKurus", String(values.depositKurus));
      formData.set("roomCount", String(values.roomCount));
      formData.set("genderPreference", values.genderPreference);
      formData.set("exactLat", String(values.exactLat));
      formData.set("exactLng", String(values.exactLng));
      formData.set("fullAddress", values.fullAddress ?? "");
      formData.set("consentAccepted", String(values.consentAccepted));
      formData.set("commissionAccepted", String(values.commissionAccepted));
      for (const photo of photos) {
        formData.append("photos", photo);
      }

      const result = await createListing(formData);
      router.push(`/listings/${result.listingId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
      setIsPublishing(false);
    }
  };

  const onSubmit = async (values: CreateListingFormValues) => {
    setSubmitError(null);
    if (photos.length === 0) {
      setSubmitError(t("photosRequired"));
      return;
    }

    let currentUser = user;

    if (!currentUser) {
      const accountParsed = inlineAccountSchema.safeParse({
        displayName: accountDisplayName,
        email: accountEmail,
        password: accountPassword,
      });
      if (!accountParsed.success) {
        setSubmitError(accountParsed.error.issues[0]?.message ?? t("accountFieldsInvalid"));
        return;
      }
      if (!accountConsent) {
        setSubmitError(tSignup("consentLabel"));
        return;
      }

      setIsPublishing(true);
      try {
        const credential = await createUserWithEmailAndPassword(
          clientAuth,
          accountParsed.data.email,
          accountParsed.data.password,
        );
        await updateProfile(credential.user, { displayName: accountParsed.data.displayName });
        const idToken = await credential.user.getIdToken();
        await createUserProfile({
          idToken,
          displayName: accountParsed.data.displayName,
          genderForFiltering: "unspecified",
          consentTextVersion: CURRENT_CONSENT_TEXT_VERSION,
        });
        currentUser = credential.user;
        setUser(credential.user);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : String(error));
        setIsPublishing(false);
        return;
      }
    }

    // currentUser is guaranteed signed in past this point -- check whether
    // publishing needs the inline phone-OTP step first.
    const idToken = await currentUser.getIdToken();
    const status = await getMyPhoneVerificationStatus({ idToken });
    if (!status.phoneVerified) {
      pendingValuesRef.current = values;
      setIsPublishing(false);
      setPhase("phone");
      return;
    }

    await publishListing(values, currentUser);
  };

  // Fallback for any field validation blocks submission -- without this, a
  // field whose error isn't individually rendered (e.g. a Select) fails
  // silently with no feedback at all, which is what happened to districtId.
  const onInvalid = () => setSubmitError(t("formHasErrors"));

  const handleRequestCode = async () => {
    setSubmitError(null);
    const parsed = phoneE164Schema.safeParse(phone);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Invalid phone number");
      return;
    }
    if (!user) return;

    setIsPublishing(true);
    try {
      const idToken = await user.getIdToken();
      const result = await requestOtp({ idToken, phoneE164: parsed.data });
      setDevCode(result.devCode ?? null);
      setOtpStep("verify");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleVerifyCode = async () => {
    setSubmitError(null);
    const parsed = otpCodeSchema.safeParse(otpCode);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }
    if (!user) return;

    setIsPublishing(true);
    try {
      const idToken = await user.getIdToken();
      await verifyOtp({ idToken, code: parsed.data });
      // Phone is verified -- finish publishing with the listing details
      // that were already filled in before this step, no re-entry needed.
      if (pendingValuesRef.current) {
        await publishListing(pendingValuesRef.current, user);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
      setIsPublishing(false);
    }
  };

  if (phase === "phone") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4">
        <p className="text-muted-foreground text-sm">{t("phoneStepIntro")}</p>
        <p className="text-muted-foreground text-sm">{tVerify("devCodeNotice")}</p>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{tVerify("phoneLabel")}</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={otpStep === "verify"}
          />
        </div>

        {otpStep === "request" ? (
          <Button type="button" onClick={handleRequestCode} disabled={isPublishing}>
            {tVerify("requestCode")}
          </Button>
        ) : (
          <>
            {devCode && (
              <p className="text-muted-foreground text-sm" data-testid="dev-otp-code">
                {tVerify("devCodeValue", { code: devCode })}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">{tVerify("codeLabel")}</Label>
              <Input id="code" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} />
            </div>
            <Button type="button" onClick={handleVerifyCode} disabled={isPublishing}>
              {tVerify("verify")}
            </Button>
          </>
        )}

        {submitError && <p className="text-destructive text-sm">{submitError}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex w-full max-w-xl flex-col gap-4"
    >
      {authChecked && !user && (
        <div className="bg-card flex flex-col gap-3 rounded-xl border p-4">
          <h2 className="font-semibold">{t("accountSectionHeading")}</h2>
          <p className="text-muted-foreground text-sm">{t("accountSectionHint")}</p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accountDisplayName">{tSignup("displayNameLabel")}</Label>
            <Input
              id="accountDisplayName"
              value={accountDisplayName}
              onChange={(event) => setAccountDisplayName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accountEmail">{tSignup("emailLabel")}</Label>
            <Input
              id="accountEmail"
              type="email"
              value={accountEmail}
              onChange={(event) => setAccountEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accountPassword">{tSignup("passwordLabel")}</Label>
            <Input
              id="accountPassword"
              type="password"
              value={accountPassword}
              onChange={(event) => setAccountPassword(event.target.value)}
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="accountConsent"
              checked={accountConsent}
              onCheckedChange={(checked) => setAccountConsent(checked === true)}
            />
            <Label htmlFor="accountConsent" className="text-sm leading-snug font-normal">
              {tSignup("consentLabel")}
            </Label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">{t("typeLabel")}</Label>
        <Select
          defaultValue="ROOM_IN_SHARED_FLAT"
          onValueChange={(value) => {
            if (value) setValue("type", value as ListingType);
          }}
        >
          <SelectTrigger id="type" className="w-full">
            <SelectValue>{(value: ListingType) => t(`type.${value}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LISTING_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`type.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="districtId">{t("districtLabel")}</Label>
        <Select
          defaultValue={districts[0]?.id}
          onValueChange={(value) => {
            if (value) setValue("districtId", value);
          }}
        >
          <SelectTrigger id="districtId" className="w-full">
            <SelectValue>
              {(value: string) => {
                const district = districts.find((d) => d.id === value);
                return district ? districtName(district) : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {districtName(district)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.districtId && (
          <p className="text-destructive text-sm">{errors.districtId.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="neighborhood">{t("neighborhoodLabel")}</Label>
        <Input id="neighborhood" {...register("neighborhood")} />
        {errors.neighborhood && (
          <p className="text-destructive text-sm">{errors.neighborhood.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="titleTr">{t("titleTrLabel")}</Label>
        <Input id="titleTr" {...register("titleTr")} />
        {errors.titleTr && <p className="text-destructive text-sm">{errors.titleTr.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="titleEn">{t("titleEnLabel")}</Label>
        <Input id="titleEn" {...register("titleEn")} />
        {errors.titleEn && <p className="text-destructive text-sm">{errors.titleEn.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descriptionTr">{t("descriptionTrLabel")}</Label>
        <textarea
          id="descriptionTr"
          {...register("descriptionTr")}
          className="border-input min-h-24 rounded-md border px-3 py-2 text-sm"
        />
        {errors.descriptionTr && (
          <p className="text-destructive text-sm">{errors.descriptionTr.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descriptionEn">{t("descriptionEnLabel")}</Label>
        <textarea
          id="descriptionEn"
          {...register("descriptionEn")}
          className="border-input min-h-24 rounded-md border px-3 py-2 text-sm"
        />
        {errors.descriptionEn && (
          <p className="text-destructive text-sm">{errors.descriptionEn.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rentKurus">{t("rentLabel")}</Label>
          <Input
            id="rentKurus"
            type="number"
            {...register("rentKurus", { valueAsNumber: true })}
          />
          {errors.rentKurus && (
            <p className="text-destructive text-sm">{errors.rentKurus.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="depositKurus">{t("depositLabel")}</Label>
          <Input
            id="depositKurus"
            type="number"
            {...register("depositKurus", { valueAsNumber: true })}
          />
          {errors.depositKurus && (
            <p className="text-destructive text-sm">{errors.depositKurus.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="roomCount">{t("roomCountLabel")}</Label>
          <Input
            id="roomCount"
            type="number"
            {...register("roomCount", { valueAsNumber: true })}
          />
          {errors.roomCount && (
            <p className="text-destructive text-sm">{errors.roomCount.message}</p>
          )}
        </div>
      </div>

      {genderPreferenceApplies && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="genderPreference">{t("genderPreferenceLabel")}</Label>
          <Select
            defaultValue="ANY"
            onValueChange={(value) => {
              if (value) {
                setValue("genderPreference", value as CreateListingFormValues["genderPreference"]);
              }
            }}
          >
            <SelectTrigger id="genderPreference" className="w-full">
              <SelectValue>
                {(value: CreateListingFormValues["genderPreference"]) =>
                  t(`genderPreference.${value}`)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">{t("genderPreference.ANY")}</SelectItem>
              <SelectItem value="FEMALE_ONLY">{t("genderPreference.FEMALE_ONLY")}</SelectItem>
              <SelectItem value="MALE_ONLY">{t("genderPreference.MALE_ONLY")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>{t("locationLabel")}</Label>
        <LocationPicker
          onChange={(lat, lng) => {
            setCoordinates({ lat, lng });
            setValue("exactLat", lat);
            setValue("exactLng", lng);
          }}
        />
        <p className="text-muted-foreground text-sm">
          {coordinates
            ? t("locationSelected", {
                lat: coordinates.lat.toFixed(5),
                lng: coordinates.lng.toFixed(5),
              })
            : t("locationHint")}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullAddress">{t("fullAddressLabel")}</Label>
        <Input id="fullAddress" {...register("fullAddress")} />
      </div>

      <PhotoUpload onChange={setPhotos} />

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

      <div className="flex items-start gap-2">
        <Checkbox
          id="commissionAccepted"
          checked={watch("commissionAccepted")}
          onCheckedChange={(checked) => setValue("commissionAccepted", checked === true)}
        />
        <Label htmlFor="commissionAccepted" className="text-sm leading-snug font-normal">
          {t("commissionLabel")}
        </Label>
      </div>
      {errors.commissionAccepted && (
        <p className="text-destructive text-sm">{errors.commissionAccepted.message}</p>
      )}

      {submitError && <p className="text-destructive text-sm">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting || isPublishing}>
        {authChecked && !user ? t("submitCreateAccountAndPublish") : t("submit")}
      </Button>
    </form>
  );
}
