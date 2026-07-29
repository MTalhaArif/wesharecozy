"use client"; // Firebase Auth (ID token), react-hook-form state, file/map inputs, dynamic Leaflet import

import { useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { clientAuth } from "@/lib/firebase-client";
import {
  createListingFormSchema,
  type CreateListingFormValues,
  type ListingType,
} from "@/lib/schemas/listing-schema";
import { createListing } from "@/actions/listings/create-listing";
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

export function CreateListingForm({ districts }: { districts: DistrictSeed[] }) {
  const t = useTranslations("CreateListing");
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    },
  });

  const selectedType = watch("type");
  const genderPreferenceApplies = GENDER_PREFERENCE_TYPES.includes(selectedType);

  const onSubmit = async (values: CreateListingFormValues) => {
    setSubmitError(null);
    const user = clientAuth.currentUser;
    if (!user) {
      setSubmitError(t("mustBeSignedIn"));
      return;
    }
    if (photos.length === 0) {
      setSubmitError(t("photosRequired"));
      return;
    }

    try {
      const idToken = await user.getIdToken();
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
      for (const photo of photos) {
        formData.append("photos", photo);
      }

      const result = await createListing(formData);
      router.push(`/listings/${result.listingId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  // Fallback for any field validation blocks submission -- without this, a
  // field whose error isn't individually rendered (e.g. a Select) fails
  // silently with no feedback at all, which is what happened to districtId.
  const onInvalid = () => setSubmitError(t("formHasErrors"));

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex w-full max-w-xl flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">{t("typeLabel")}</Label>
        <Select
          defaultValue="ROOM_IN_SHARED_FLAT"
          onValueChange={(value) => {
            if (value) setValue("type", value as ListingType);
          }}
        >
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
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
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.nameTr}
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
              <SelectValue />
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

      {submitError && <p className="text-destructive text-sm">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}