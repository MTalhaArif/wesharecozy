export type DistrictSeed = {
  id: string;
  nameTr: string;
  nameEn: string;
  order: number;
};

// Istanbul-only for v1, ordered roughly by search popularity.
export const ISTANBUL_DISTRICTS: DistrictSeed[] = [
  { id: "kadikoy", nameTr: "Kadıköy", nameEn: "Kadikoy", order: 0 },
  { id: "besiktas", nameTr: "Beşiktaş", nameEn: "Besiktas", order: 1 },
  { id: "sisli", nameTr: "Şişli", nameEn: "Sisli", order: 2 },
  { id: "uskudar", nameTr: "Üsküdar", nameEn: "Uskudar", order: 3 },
  { id: "beyoglu", nameTr: "Beyoğlu", nameEn: "Beyoglu", order: 4 },
  { id: "bakirkoy", nameTr: "Bakırköy", nameEn: "Bakirkoy", order: 5 },
  { id: "maltepe", nameTr: "Maltepe", nameEn: "Maltepe", order: 6 },
  { id: "atasehir", nameTr: "Ataşehir", nameEn: "Atasehir", order: 7 },
  { id: "kartal", nameTr: "Kartal", nameEn: "Kartal", order: 8 },
  { id: "pendik", nameTr: "Pendik", nameEn: "Pendik", order: 9 },
  { id: "sariyer", nameTr: "Sarıyer", nameEn: "Sariyer", order: 10 },
  { id: "bahcelievler", nameTr: "Bahçelievler", nameEn: "Bahcelievler", order: 11 },
  { id: "zeytinburnu", nameTr: "Zeytinburnu", nameEn: "Zeytinburnu", order: 12 },
  { id: "fatih", nameTr: "Fatih", nameEn: "Fatih", order: 13 },
  { id: "beylikduzu", nameTr: "Beylikdüzü", nameEn: "Beylikduzu", order: 14 },
];