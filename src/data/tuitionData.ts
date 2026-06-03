// Static cost tables for Study Cost Planner.
// All figures in USD per year. Sources: QS, Numbeo, UKCISA, government study-abroad guides (2024–25).

export type Country =
  | "us" | "uk" | "canada" | "australia" | "netherlands" | "germany"
  | "ireland" | "france" | "italy" | "spain" | "sweden" | "denmark"
  | "switzerland" | "singapore" | "new-zealand" | "other";

export type DegreeType = "undergrad" | "masters" | "mba";
export type LivingStyle = "budget" | "standard" | "premium";
export type AffordabilityLevel = "affordable" | "moderate" | "high";

export interface CostBreakdown {
  tuitionMin: number; tuitionMax: number;
  rentMin: number; rentMax: number;
  foodMin: number; foodMax: number;
  transportMin: number; transportMax: number;
  healthInsuranceMin: number; healthInsuranceMax: number;
  visaFlightsMin: number; visaFlightsMax: number;
  booksMin: number; booksMax: number;
  emergencyBufferMin: number; emergencyBufferMax: number;
  durationYears: number;
  cityContext: string;
}

export interface ScholarshipReduction { min: number; max: number; }

export interface CityOption {
  value: string;
  label: string;
  livingMultiplier: number; // 1.0 = country average; applied to rent/food/transport
}

// ── Duration defaults ────────────────────────────────────────────────────────
export const DEFAULT_DURATION: Record<DegreeType, number> = {
  undergrad: 4,
  masters: 2,
  mba: 2,
};

// ── Base cost entries (standard living, no city multiplier) ──────────────────
type BaseCostEntry = Omit<CostBreakdown, "durationYears">;

const BASE_COSTS: Record<Country, Record<DegreeType, BaseCostEntry>> = {
  us: {
    undergrad: {
      tuitionMin: 25_000, tuitionMax: 55_000,
      rentMin: 8_400, rentMax: 18_000,
      foodMin: 3_000, foodMax: 5_500,
      transportMin: 600, transportMax: 1_800,
      healthInsuranceMin: 1_200, healthInsuranceMax: 2_000,
      visaFlightsMin: 1_500, visaFlightsMax: 2_500,
      booksMin: 500, booksMax: 900,
      emergencyBufferMin: 1_000, emergencyBufferMax: 2_000,
      cityContext: "major US university cities (Boston, NYC, LA)",
    },
    masters: {
      tuitionMin: 20_000, tuitionMax: 50_000,
      rentMin: 9_000, rentMax: 18_000,
      foodMin: 3_000, foodMax: 5_500,
      transportMin: 600, transportMax: 1_800,
      healthInsuranceMin: 1_200, healthInsuranceMax: 2_000,
      visaFlightsMin: 1_500, visaFlightsMax: 2_500,
      booksMin: 500, booksMax: 900,
      emergencyBufferMin: 1_000, emergencyBufferMax: 2_000,
      cityContext: "major US university cities",
    },
    mba: {
      tuitionMin: 40_000, tuitionMax: 80_000,
      rentMin: 12_000, rentMax: 22_000,
      foodMin: 4_000, foodMax: 7_000,
      transportMin: 800, transportMax: 2_000,
      healthInsuranceMin: 1_400, healthInsuranceMax: 2_200,
      visaFlightsMin: 1_500, visaFlightsMax: 2_500,
      booksMin: 500, booksMax: 900,
      emergencyBufferMin: 1_500, emergencyBufferMax: 2_500,
      cityContext: "major US business school cities",
    },
  },
  uk: {
    undergrad: {
      tuitionMin: 14_000, tuitionMax: 28_000,
      rentMin: 7_200, rentMax: 16_800,
      foodMin: 2_500, foodMax: 4_500,
      transportMin: 700, transportMax: 1_500,
      healthInsuranceMin: 600, healthInsuranceMax: 900,
      visaFlightsMin: 1_200, visaFlightsMax: 2_000,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "UK university cities (London range shown)",
    },
    masters: {
      tuitionMin: 15_000, tuitionMax: 32_000,
      rentMin: 8_400, rentMax: 18_000,
      foodMin: 2_500, foodMax: 4_500,
      transportMin: 700, transportMax: 1_500,
      healthInsuranceMin: 600, healthInsuranceMax: 900,
      visaFlightsMin: 1_200, visaFlightsMax: 2_000,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "UK university cities",
    },
    mba: {
      tuitionMin: 35_000, tuitionMax: 65_000,
      rentMin: 12_000, rentMax: 22_000,
      foodMin: 3_000, foodMax: 5_500,
      transportMin: 900, transportMax: 1_800,
      healthInsuranceMin: 600, healthInsuranceMax: 900,
      visaFlightsMin: 1_200, visaFlightsMax: 2_000,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_200, emergencyBufferMax: 2_000,
      cityContext: "London & major UK business school cities",
    },
  },
  canada: {
    undergrad: {
      tuitionMin: 15_000, tuitionMax: 35_000,
      rentMin: 7_200, rentMax: 15_600,
      foodMin: 2_800, foodMax: 4_800,
      transportMin: 700, transportMax: 1_400,
      healthInsuranceMin: 600, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_200, visaFlightsMax: 2_200,
      booksMin: 400, booksMax: 800,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "major Canadian university cities",
    },
    masters: {
      tuitionMin: 15_000, tuitionMax: 30_000,
      rentMin: 8_400, rentMax: 16_800,
      foodMin: 2_800, foodMax: 4_800,
      transportMin: 700, transportMax: 1_400,
      healthInsuranceMin: 600, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_200, visaFlightsMax: 2_200,
      booksMin: 400, booksMax: 800,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "major Canadian university cities",
    },
    mba: {
      tuitionMin: 35_000, tuitionMax: 60_000,
      rentMin: 10_800, rentMax: 18_000,
      foodMin: 3_500, foodMax: 5_500,
      transportMin: 800, transportMax: 1_600,
      healthInsuranceMin: 700, healthInsuranceMax: 1_100,
      visaFlightsMin: 1_200, visaFlightsMax: 2_200,
      booksMin: 400, booksMax: 800,
      emergencyBufferMin: 1_200, emergencyBufferMax: 2_000,
      cityContext: "Toronto & Vancouver",
    },
  },
  australia: {
    undergrad: {
      tuitionMin: 20_000, tuitionMax: 35_000,
      rentMin: 9_600, rentMax: 18_000,
      foodMin: 3_500, foodMax: 5_800,
      transportMin: 700, transportMax: 1_400,
      healthInsuranceMin: 450, healthInsuranceMax: 800,
      visaFlightsMin: 1_500, visaFlightsMax: 2_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "major Australian university cities",
    },
    masters: {
      tuitionMin: 20_000, tuitionMax: 40_000,
      rentMin: 10_200, rentMax: 18_600,
      foodMin: 3_500, foodMax: 5_800,
      transportMin: 700, transportMax: 1_400,
      healthInsuranceMin: 450, healthInsuranceMax: 800,
      visaFlightsMin: 1_500, visaFlightsMax: 2_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Sydney & Melbourne average",
    },
    mba: {
      tuitionMin: 40_000, tuitionMax: 70_000,
      rentMin: 12_000, rentMax: 21_600,
      foodMin: 4_000, foodMax: 6_500,
      transportMin: 800, transportMax: 1_600,
      healthInsuranceMin: 500, healthInsuranceMax: 900,
      visaFlightsMin: 1_500, visaFlightsMax: 2_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_200, emergencyBufferMax: 2_000,
      cityContext: "Sydney & Melbourne",
    },
  },
  netherlands: {
    undergrad: {
      tuitionMin: 8_000, tuitionMax: 18_000,
      rentMin: 6_000, rentMax: 13_200,
      foodMin: 2_800, foodMax: 4_500,
      transportMin: 500, transportMax: 1_000,
      healthInsuranceMin: 700, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 800, emergencyBufferMax: 1_500,
      cityContext: "Amsterdam, Delft & Utrecht average",
    },
    masters: {
      tuitionMin: 8_000, tuitionMax: 18_000,
      rentMin: 6_600, rentMax: 14_400,
      foodMin: 2_800, foodMax: 4_500,
      transportMin: 500, transportMax: 1_000,
      healthInsuranceMin: 700, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 800, emergencyBufferMax: 1_500,
      cityContext: "major Dutch university cities",
    },
    mba: {
      tuitionMin: 20_000, tuitionMax: 40_000,
      rentMin: 9_600, rentMax: 18_000,
      foodMin: 3_200, foodMax: 5_000,
      transportMin: 600, transportMax: 1_200,
      healthInsuranceMin: 700, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Amsterdam & Rotterdam",
    },
  },
  germany: {
    undergrad: {
      tuitionMin: 500, tuitionMax: 5_000,
      rentMin: 5_400, rentMax: 12_000,
      foodMin: 2_500, foodMax: 4_200,
      transportMin: 400, transportMax: 900,
      healthInsuranceMin: 900, healthInsuranceMax: 1_200,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 800, emergencyBufferMax: 1_500,
      cityContext: "Munich, Berlin & Hamburg average",
    },
    masters: {
      tuitionMin: 1_000, tuitionMax: 12_000,
      rentMin: 6_000, rentMax: 13_200,
      foodMin: 2_500, foodMax: 4_200,
      transportMin: 400, transportMax: 900,
      healthInsuranceMin: 900, healthInsuranceMax: 1_200,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 800, emergencyBufferMax: 1_500,
      cityContext: "major German university cities",
    },
    mba: {
      tuitionMin: 15_000, tuitionMax: 35_000,
      rentMin: 8_400, rentMax: 15_600,
      foodMin: 3_000, foodMax: 5_000,
      transportMin: 500, transportMax: 1_100,
      healthInsuranceMin: 900, healthInsuranceMax: 1_200,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Munich & Frankfurt",
    },
  },
  ireland: {
    undergrad: {
      tuitionMin: 15_000, tuitionMax: 25_000,
      rentMin: 9_600, rentMax: 18_000,
      foodMin: 3_000, foodMax: 5_000,
      transportMin: 700, transportMax: 1_400,
      healthInsuranceMin: 600, healthInsuranceMax: 900,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 900, emergencyBufferMax: 1_600,
      cityContext: "Dublin & Cork average",
    },
    masters: {
      tuitionMin: 15_000, tuitionMax: 25_000,
      rentMin: 10_200, rentMax: 18_600,
      foodMin: 3_000, foodMax: 5_000,
      transportMin: 700, transportMax: 1_400,
      healthInsuranceMin: 600, healthInsuranceMax: 900,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 900, emergencyBufferMax: 1_600,
      cityContext: "Dublin average",
    },
    mba: {
      tuitionMin: 25_000, tuitionMax: 50_000,
      rentMin: 12_000, rentMax: 21_000,
      foodMin: 3_500, foodMax: 5_500,
      transportMin: 800, transportMax: 1_500,
      healthInsuranceMin: 600, healthInsuranceMax: 900,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Dublin",
    },
  },
  france: {
    undergrad: {
      tuitionMin: 4_000, tuitionMax: 15_000,
      rentMin: 6_000, rentMax: 13_200,
      foodMin: 2_500, foodMax: 4_200,
      transportMin: 400, transportMax: 900,
      healthInsuranceMin: 300, healthInsuranceMax: 600,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 800, emergencyBufferMax: 1_500,
      cityContext: "Paris, Lyon & Toulouse average",
    },
    masters: {
      tuitionMin: 4_000, tuitionMax: 18_000,
      rentMin: 6_600, rentMax: 14_400,
      foodMin: 2_500, foodMax: 4_200,
      transportMin: 400, transportMax: 900,
      healthInsuranceMin: 300, healthInsuranceMax: 600,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 800, emergencyBufferMax: 1_500,
      cityContext: "major French university cities",
    },
    mba: {
      tuitionMin: 20_000, tuitionMax: 40_000,
      rentMin: 9_600, rentMax: 18_000,
      foodMin: 3_000, foodMax: 5_000,
      transportMin: 500, transportMax: 1_100,
      healthInsuranceMin: 300, healthInsuranceMax: 600,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Paris & Lyon",
    },
  },
  italy: {
    undergrad: {
      tuitionMin: 1_000, tuitionMax: 8_000,
      rentMin: 4_800, rentMax: 11_400,
      foodMin: 2_200, foodMax: 3_800,
      transportMin: 350, transportMax: 800,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 700, emergencyBufferMax: 1_400,
      cityContext: "Milan, Rome & Bologna average",
    },
    masters: {
      tuitionMin: 1_000, tuitionMax: 10_000,
      rentMin: 5_400, rentMax: 12_000,
      foodMin: 2_200, foodMax: 3_800,
      transportMin: 350, transportMax: 800,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 700, emergencyBufferMax: 1_400,
      cityContext: "major Italian university cities",
    },
    mba: {
      tuitionMin: 15_000, tuitionMax: 30_000,
      rentMin: 8_400, rentMax: 15_600,
      foodMin: 3_000, foodMax: 4_800,
      transportMin: 400, transportMax: 900,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 900, emergencyBufferMax: 1_600,
      cityContext: "Milan",
    },
  },
  spain: {
    undergrad: {
      tuitionMin: 2_000, tuitionMax: 10_000,
      rentMin: 4_800, rentMax: 10_800,
      foodMin: 2_200, foodMax: 3_600,
      transportMin: 350, transportMax: 750,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 300, booksMax: 600,
      emergencyBufferMin: 700, emergencyBufferMax: 1_300,
      cityContext: "Madrid, Barcelona & Valencia average",
    },
    masters: {
      tuitionMin: 3_000, tuitionMax: 12_000,
      rentMin: 5_400, rentMax: 11_400,
      foodMin: 2_200, foodMax: 3_600,
      transportMin: 350, transportMax: 750,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 300, booksMax: 600,
      emergencyBufferMin: 700, emergencyBufferMax: 1_300,
      cityContext: "major Spanish university cities",
    },
    mba: {
      tuitionMin: 15_000, tuitionMax: 30_000,
      rentMin: 7_200, rentMax: 14_400,
      foodMin: 2_800, foodMax: 4_500,
      transportMin: 400, transportMax: 900,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_000, visaFlightsMax: 1_800,
      booksMin: 300, booksMax: 600,
      emergencyBufferMin: 900, emergencyBufferMax: 1_600,
      cityContext: "Madrid & Barcelona",
    },
  },
  sweden: {
    undergrad: {
      tuitionMin: 12_000, tuitionMax: 22_000,
      rentMin: 6_600, rentMax: 13_200,
      foodMin: 2_800, foodMax: 4_500,
      transportMin: 400, transportMax: 900,
      healthInsuranceMin: 0, healthInsuranceMax: 300,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 800, emergencyBufferMax: 1_500,
      cityContext: "Stockholm, Gothenburg & Lund average",
    },
    masters: {
      tuitionMin: 12_000, tuitionMax: 22_000,
      rentMin: 7_200, rentMax: 14_400,
      foodMin: 2_800, foodMax: 4_500,
      transportMin: 400, transportMax: 900,
      healthInsuranceMin: 0, healthInsuranceMax: 300,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 800, emergencyBufferMax: 1_500,
      cityContext: "major Swedish university cities",
    },
    mba: {
      tuitionMin: 20_000, tuitionMax: 35_000,
      rentMin: 9_600, rentMax: 16_800,
      foodMin: 3_200, foodMax: 5_200,
      transportMin: 500, transportMax: 1_000,
      healthInsuranceMin: 0, healthInsuranceMax: 300,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 350, booksMax: 650,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Stockholm",
    },
  },
  denmark: {
    undergrad: {
      tuitionMin: 15_000, tuitionMax: 25_000,
      rentMin: 7_800, rentMax: 15_600,
      foodMin: 3_200, foodMax: 5_200,
      transportMin: 500, transportMax: 1_000,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 900, emergencyBufferMax: 1_600,
      cityContext: "Copenhagen & Aarhus average",
    },
    masters: {
      tuitionMin: 15_000, tuitionMax: 25_000,
      rentMin: 8_400, rentMax: 16_200,
      foodMin: 3_200, foodMax: 5_200,
      transportMin: 500, transportMax: 1_000,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 900, emergencyBufferMax: 1_600,
      cityContext: "Copenhagen average",
    },
    mba: {
      tuitionMin: 20_000, tuitionMax: 40_000,
      rentMin: 10_800, rentMax: 18_600,
      foodMin: 3_500, foodMax: 5_500,
      transportMin: 600, transportMax: 1_200,
      healthInsuranceMin: 200, healthInsuranceMax: 400,
      visaFlightsMin: 1_100, visaFlightsMax: 1_900,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Copenhagen",
    },
  },
  switzerland: {
    undergrad: {
      tuitionMin: 1_000, tuitionMax: 10_000,
      rentMin: 12_000, rentMax: 22_200,
      foodMin: 5_000, foodMax: 8_000,
      transportMin: 800, transportMax: 1_600,
      healthInsuranceMin: 1_200, healthInsuranceMax: 1_800,
      visaFlightsMin: 1_200, visaFlightsMax: 2_000,
      booksMin: 400, booksMax: 750,
      emergencyBufferMin: 1_200, emergencyBufferMax: 2_200,
      cityContext: "Zurich, Geneva & Lausanne average",
    },
    masters: {
      tuitionMin: 1_000, tuitionMax: 12_000,
      rentMin: 13_200, rentMax: 24_000,
      foodMin: 5_000, foodMax: 8_000,
      transportMin: 800, transportMax: 1_600,
      healthInsuranceMin: 1_200, healthInsuranceMax: 1_800,
      visaFlightsMin: 1_200, visaFlightsMax: 2_000,
      booksMin: 400, booksMax: 750,
      emergencyBufferMin: 1_200, emergencyBufferMax: 2_200,
      cityContext: "major Swiss university cities",
    },
    mba: {
      tuitionMin: 25_000, tuitionMax: 55_000,
      rentMin: 15_600, rentMax: 27_600,
      foodMin: 5_500, foodMax: 9_000,
      transportMin: 900, transportMax: 1_800,
      healthInsuranceMin: 1_200, healthInsuranceMax: 1_800,
      visaFlightsMin: 1_200, visaFlightsMax: 2_000,
      booksMin: 400, booksMax: 750,
      emergencyBufferMin: 1_500, emergencyBufferMax: 2_500,
      cityContext: "Zurich & Geneva",
    },
  },
  singapore: {
    undergrad: {
      tuitionMin: 20_000, tuitionMax: 35_000,
      rentMin: 9_600, rentMax: 18_000,
      foodMin: 3_500, foodMax: 6_000,
      transportMin: 600, transportMax: 1_200,
      healthInsuranceMin: 600, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_500, visaFlightsMax: 2_500,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Singapore (city-state)",
    },
    masters: {
      tuitionMin: 20_000, tuitionMax: 40_000,
      rentMin: 10_800, rentMax: 19_200,
      foodMin: 3_500, foodMax: 6_000,
      transportMin: 600, transportMax: 1_200,
      healthInsuranceMin: 600, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_500, visaFlightsMax: 2_500,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Singapore",
    },
    mba: {
      tuitionMin: 35_000, tuitionMax: 60_000,
      rentMin: 13_200, rentMax: 22_800,
      foodMin: 4_000, foodMax: 7_000,
      transportMin: 700, transportMax: 1_400,
      healthInsuranceMin: 700, healthInsuranceMax: 1_100,
      visaFlightsMin: 1_500, visaFlightsMax: 2_500,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_200, emergencyBufferMax: 2_000,
      cityContext: "Singapore",
    },
  },
  "new-zealand": {
    undergrad: {
      tuitionMin: 18_000, tuitionMax: 30_000,
      rentMin: 7_800, rentMax: 15_000,
      foodMin: 3_200, foodMax: 5_200,
      transportMin: 600, transportMax: 1_200,
      healthInsuranceMin: 450, healthInsuranceMax: 700,
      visaFlightsMin: 1_500, visaFlightsMax: 2_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 900, emergencyBufferMax: 1_600,
      cityContext: "Auckland & Wellington average",
    },
    masters: {
      tuitionMin: 18_000, tuitionMax: 28_000,
      rentMin: 8_400, rentMax: 15_600,
      foodMin: 3_200, foodMax: 5_200,
      transportMin: 600, transportMax: 1_200,
      healthInsuranceMin: 450, healthInsuranceMax: 700,
      visaFlightsMin: 1_500, visaFlightsMax: 2_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 900, emergencyBufferMax: 1_600,
      cityContext: "major New Zealand university cities",
    },
    mba: {
      tuitionMin: 25_000, tuitionMax: 45_000,
      rentMin: 10_200, rentMax: 18_000,
      foodMin: 3_800, foodMax: 6_000,
      transportMin: 700, transportMax: 1_300,
      healthInsuranceMin: 500, healthInsuranceMax: 800,
      visaFlightsMin: 1_500, visaFlightsMax: 2_800,
      booksMin: 400, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 1_800,
      cityContext: "Auckland",
    },
  },
  other: {
    undergrad: {
      tuitionMin: 10_000, tuitionMax: 25_000,
      rentMin: 6_000, rentMax: 14_400,
      foodMin: 2_500, foodMax: 4_500,
      transportMin: 400, transportMax: 1_000,
      healthInsuranceMin: 500, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_200, visaFlightsMax: 2_500,
      booksMin: 350, booksMax: 700,
      emergencyBufferMin: 800, emergencyBufferMax: 1_600,
      cityContext: "international average estimate",
    },
    masters: {
      tuitionMin: 10_000, tuitionMax: 25_000,
      rentMin: 6_600, rentMax: 15_000,
      foodMin: 2_500, foodMax: 4_500,
      transportMin: 400, transportMax: 1_000,
      healthInsuranceMin: 500, healthInsuranceMax: 1_000,
      visaFlightsMin: 1_200, visaFlightsMax: 2_500,
      booksMin: 350, booksMax: 700,
      emergencyBufferMin: 800, emergencyBufferMax: 1_600,
      cityContext: "international average estimate",
    },
    mba: {
      tuitionMin: 20_000, tuitionMax: 45_000,
      rentMin: 8_400, rentMax: 18_000,
      foodMin: 3_000, foodMax: 5_500,
      transportMin: 500, transportMax: 1_200,
      healthInsuranceMin: 600, healthInsuranceMax: 1_200,
      visaFlightsMin: 1_200, visaFlightsMax: 2_500,
      booksMin: 350, booksMax: 700,
      emergencyBufferMin: 1_000, emergencyBufferMax: 2_000,
      cityContext: "international average estimate",
    },
  },
};

// ── City options by country ───────────────────────────────────────────────────
export const CITIES_BY_COUNTRY: Record<Country, CityOption[]> = {
  us: [
    { value: "new-york-city", label: "New York City", livingMultiplier: 1.45 },
    { value: "boston", label: "Boston", livingMultiplier: 1.3 },
    { value: "los-angeles", label: "Los Angeles", livingMultiplier: 1.25 },
    { value: "sf-bay-area", label: "San Francisco Bay Area", livingMultiplier: 1.4 },
    { value: "chicago", label: "Chicago", livingMultiplier: 1.1 },
    { value: "washington-dc", label: "Washington DC", livingMultiplier: 1.3 },
    { value: "philadelphia", label: "Philadelphia", livingMultiplier: 1.05 },
    { value: "atlanta", label: "Atlanta", livingMultiplier: 0.9 },
    { value: "austin", label: "Austin", livingMultiplier: 0.95 },
    { value: "seattle", label: "Seattle", livingMultiplier: 1.2 },
    { value: "miami", label: "Miami", livingMultiplier: 1.1 },
    { value: "other-us", label: "Other US Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  uk: [
    { value: "london", label: "London", livingMultiplier: 1.35 },
    { value: "manchester", label: "Manchester", livingMultiplier: 0.85 },
    { value: "edinburgh", label: "Edinburgh", livingMultiplier: 0.9 },
    { value: "glasgow", label: "Glasgow", livingMultiplier: 0.82 },
    { value: "birmingham", label: "Birmingham", livingMultiplier: 0.82 },
    { value: "leeds", label: "Leeds", livingMultiplier: 0.8 },
    { value: "bristol", label: "Bristol", livingMultiplier: 0.88 },
    { value: "nottingham", label: "Nottingham", livingMultiplier: 0.78 },
    { value: "other-uk", label: "Other UK Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  canada: [
    { value: "toronto", label: "Toronto", livingMultiplier: 1.2 },
    { value: "vancouver", label: "Vancouver", livingMultiplier: 1.25 },
    { value: "montreal", label: "Montreal", livingMultiplier: 0.9 },
    { value: "ottawa", label: "Ottawa", livingMultiplier: 1.0 },
    { value: "calgary", label: "Calgary", livingMultiplier: 1.0 },
    { value: "edmonton", label: "Edmonton", livingMultiplier: 0.95 },
    { value: "other-ca", label: "Other Canadian Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  australia: [
    { value: "sydney", label: "Sydney", livingMultiplier: 1.2 },
    { value: "melbourne", label: "Melbourne", livingMultiplier: 1.1 },
    { value: "brisbane", label: "Brisbane", livingMultiplier: 0.95 },
    { value: "perth", label: "Perth", livingMultiplier: 0.9 },
    { value: "adelaide", label: "Adelaide", livingMultiplier: 0.85 },
    { value: "canberra", label: "Canberra", livingMultiplier: 1.0 },
    { value: "other-au", label: "Other Australian Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  netherlands: [
    { value: "amsterdam", label: "Amsterdam", livingMultiplier: 1.25 },
    { value: "rotterdam", label: "Rotterdam", livingMultiplier: 1.0 },
    { value: "the-hague", label: "The Hague", livingMultiplier: 1.05 },
    { value: "utrecht", label: "Utrecht", livingMultiplier: 1.05 },
    { value: "eindhoven", label: "Eindhoven", livingMultiplier: 0.9 },
    { value: "groningen", label: "Groningen", livingMultiplier: 0.85 },
    { value: "other-nl", label: "Other Dutch Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  germany: [
    { value: "munich", label: "Munich", livingMultiplier: 1.3 },
    { value: "berlin", label: "Berlin", livingMultiplier: 1.05 },
    { value: "frankfurt", label: "Frankfurt", livingMultiplier: 1.2 },
    { value: "hamburg", label: "Hamburg", livingMultiplier: 1.1 },
    { value: "cologne", label: "Cologne", livingMultiplier: 1.0 },
    { value: "stuttgart", label: "Stuttgart", livingMultiplier: 1.1 },
    { value: "aachen", label: "Aachen", livingMultiplier: 0.85 },
    { value: "other-de", label: "Other German Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  ireland: [
    { value: "dublin", label: "Dublin", livingMultiplier: 1.2 },
    { value: "cork", label: "Cork", livingMultiplier: 0.9 },
    { value: "galway", label: "Galway", livingMultiplier: 0.88 },
    { value: "limerick", label: "Limerick", livingMultiplier: 0.82 },
    { value: "other-ie", label: "Other Irish Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  france: [
    { value: "paris", label: "Paris", livingMultiplier: 1.3 },
    { value: "lyon", label: "Lyon", livingMultiplier: 0.95 },
    { value: "toulouse", label: "Toulouse", livingMultiplier: 0.88 },
    { value: "lille", label: "Lille", livingMultiplier: 0.85 },
    { value: "other-fr", label: "Other French Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  italy: [
    { value: "milan", label: "Milan", livingMultiplier: 1.2 },
    { value: "rome", label: "Rome", livingMultiplier: 1.1 },
    { value: "bologna", label: "Bologna", livingMultiplier: 0.95 },
    { value: "turin", label: "Turin", livingMultiplier: 0.9 },
    { value: "florence", label: "Florence", livingMultiplier: 1.0 },
    { value: "other-it", label: "Other Italian Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  spain: [
    { value: "madrid", label: "Madrid", livingMultiplier: 1.1 },
    { value: "barcelona", label: "Barcelona", livingMultiplier: 1.15 },
    { value: "valencia", label: "Valencia", livingMultiplier: 0.88 },
    { value: "seville", label: "Seville", livingMultiplier: 0.82 },
    { value: "other-es", label: "Other Spanish Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  sweden: [
    { value: "stockholm", label: "Stockholm", livingMultiplier: 1.2 },
    { value: "gothenburg", label: "Gothenburg", livingMultiplier: 1.0 },
    { value: "lund", label: "Lund", livingMultiplier: 0.9 },
    { value: "uppsala", label: "Uppsala", livingMultiplier: 0.95 },
    { value: "other-se", label: "Other Swedish Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  denmark: [
    { value: "copenhagen", label: "Copenhagen", livingMultiplier: 1.1 },
    { value: "aarhus", label: "Aarhus", livingMultiplier: 0.9 },
    { value: "other-dk", label: "Other Danish Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  switzerland: [
    { value: "zurich", label: "Zurich", livingMultiplier: 1.15 },
    { value: "geneva", label: "Geneva", livingMultiplier: 1.2 },
    { value: "lausanne", label: "Lausanne", livingMultiplier: 1.1 },
    { value: "other-ch", label: "Other Swiss Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  singapore: [
    { value: "singapore", label: "Singapore", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  "new-zealand": [
    { value: "auckland", label: "Auckland", livingMultiplier: 1.15 },
    { value: "wellington", label: "Wellington", livingMultiplier: 1.0 },
    { value: "christchurch", label: "Christchurch", livingMultiplier: 0.88 },
    { value: "other-nz", label: "Other New Zealand Cities", livingMultiplier: 1.0 },
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
  other: [
    { value: "other", label: "Other (Enter Manually)", livingMultiplier: 1.0 },
  ],
};

// ── Living style multipliers (applied to rent / food / transport) ─────────────
const LIVING_MULTIPLIER: Record<LivingStyle, number> = {
  budget: 0.75,
  standard: 1.0,
  premium: 1.35,
};

// ── Scholarship reduction estimates ──────────────────────────────────────────
const SCHOLARSHIP_REDUCTION: Record<Country, Record<DegreeType, ScholarshipReduction>> = {
  us:          { undergrad: { min: 5_000, max: 25_000 }, masters: { min: 5_000, max: 20_000 }, mba: { min: 10_000, max: 30_000 } },
  uk:          { undergrad: { min: 3_000, max: 12_000 }, masters: { min: 5_000, max: 20_000 }, mba: { min: 8_000, max: 20_000 } },
  canada:      { undergrad: { min: 3_000, max: 12_000 }, masters: { min: 4_000, max: 15_000 }, mba: { min: 8_000, max: 20_000 } },
  australia:   { undergrad: { min: 3_000, max: 12_000 }, masters: { min: 4_000, max: 15_000 }, mba: { min: 8_000, max: 18_000 } },
  netherlands: { undergrad: { min: 2_000, max: 8_000  }, masters: { min: 3_000, max: 12_000 }, mba: { min: 5_000, max: 15_000 } },
  germany:     { undergrad: { min: 1_000, max: 5_000  }, masters: { min: 2_000, max: 8_000  }, mba: { min: 4_000, max: 12_000 } },
  ireland:     { undergrad: { min: 2_000, max: 8_000  }, masters: { min: 3_000, max: 10_000 }, mba: { min: 5_000, max: 15_000 } },
  france:      { undergrad: { min: 1_000, max: 6_000  }, masters: { min: 2_000, max: 8_000  }, mba: { min: 4_000, max: 12_000 } },
  italy:       { undergrad: { min: 500,   max: 4_000  }, masters: { min: 1_000, max: 6_000  }, mba: { min: 3_000, max: 10_000 } },
  spain:       { undergrad: { min: 500,   max: 4_000  }, masters: { min: 1_000, max: 6_000  }, mba: { min: 3_000, max: 10_000 } },
  sweden:      { undergrad: { min: 2_000, max: 8_000  }, masters: { min: 3_000, max: 10_000 }, mba: { min: 4_000, max: 12_000 } },
  denmark:     { undergrad: { min: 2_000, max: 8_000  }, masters: { min: 3_000, max: 10_000 }, mba: { min: 4_000, max: 12_000 } },
  switzerland: { undergrad: { min: 500,   max: 5_000  }, masters: { min: 1_000, max: 8_000  }, mba: { min: 5_000, max: 15_000 } },
  singapore:   { undergrad: { min: 3_000, max: 12_000 }, masters: { min: 4_000, max: 15_000 }, mba: { min: 6_000, max: 18_000 } },
  "new-zealand": { undergrad: { min: 2_000, max: 8_000 }, masters: { min: 3_000, max: 10_000 }, mba: { min: 4_000, max: 12_000 } },
  other:       { undergrad: { min: 2_000, max: 10_000 }, masters: { min: 3_000, max: 12_000 }, mba: { min: 5_000, max: 15_000 } },
};

// ── Affordability thresholds (annual mid in USD) ──────────────────────────────
const AFFORDABILITY_THRESHOLDS: Record<Country, { affordable: number; moderate: number }> = {
  us:          { affordable: 35_000, moderate: 60_000 },
  uk:          { affordable: 28_000, moderate: 50_000 },
  canada:      { affordable: 28_000, moderate: 48_000 },
  australia:   { affordable: 30_000, moderate: 52_000 },
  netherlands: { affordable: 22_000, moderate: 40_000 },
  germany:     { affordable: 16_000, moderate: 30_000 },
  ireland:     { affordable: 28_000, moderate: 50_000 },
  france:      { affordable: 20_000, moderate: 36_000 },
  italy:       { affordable: 16_000, moderate: 28_000 },
  spain:       { affordable: 15_000, moderate: 26_000 },
  sweden:      { affordable: 24_000, moderate: 40_000 },
  denmark:     { affordable: 26_000, moderate: 44_000 },
  switzerland: { affordable: 32_000, moderate: 55_000 },
  singapore:   { affordable: 30_000, moderate: 52_000 },
  "new-zealand": { affordable: 26_000, moderate: 44_000 },
  other:       { affordable: 24_000, moderate: 42_000 },
};

// ── Country average annual cost for insights comparison ──────────────────────
const COUNTRY_ANNUAL_AVERAGE: Record<Country, number> = {
  us: 45_000, uk: 36_000, canada: 33_000, australia: 38_000,
  netherlands: 28_000, germany: 18_000, ireland: 36_000, france: 24_000,
  italy: 18_000, spain: 16_000, sweden: 28_000, denmark: 32_000,
  switzerland: 42_000, singapore: 40_000, "new-zealand": 34_000, other: 30_000,
};

// ── Field of study tuition modifier ──────────────────────────────────────────
export const FIELD_MODIFIERS: Record<string, number> = {
  "Medicine / Health Sciences": 1.5,
  "Law": 1.3,
  "Business / Finance": 1.2,
  "Engineering / CS": 1.1,
  "Arts / Humanities": 0.95,
  "Social Sciences": 1.0,
  "Natural Sciences": 1.0,
  "Education": 0.9,
};

export const FIELDS_OF_STUDY = Object.keys(FIELD_MODIFIERS);

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCosts(
  country: Country,
  degree: DegreeType,
  living: LivingStyle,
  field: string,
  durationYears: number,
  cityMultiplier = 1.0,
): CostBreakdown {
  const base = BASE_COSTS[country][degree];
  const lm = LIVING_MULTIPLIER[living] * cityMultiplier;
  const fm = FIELD_MODIFIERS[field] ?? 1.0;

  return {
    tuitionMin: Math.round(base.tuitionMin * fm),
    tuitionMax: Math.round(base.tuitionMax * fm),
    rentMin: Math.round(base.rentMin * lm),
    rentMax: Math.round(base.rentMax * lm),
    foodMin: Math.round(base.foodMin * lm),
    foodMax: Math.round(base.foodMax * lm),
    transportMin: Math.round(base.transportMin * lm),
    transportMax: Math.round(base.transportMax * lm),
    healthInsuranceMin: base.healthInsuranceMin,
    healthInsuranceMax: base.healthInsuranceMax,
    visaFlightsMin: base.visaFlightsMin,
    visaFlightsMax: base.visaFlightsMax,
    booksMin: base.booksMin,
    booksMax: base.booksMax,
    emergencyBufferMin: base.emergencyBufferMin,
    emergencyBufferMax: base.emergencyBufferMax,
    durationYears,
    cityContext: base.cityContext,
  };
}

export function getAnnualTotal(c: CostBreakdown): { min: number; max: number } {
  return {
    min: c.tuitionMin + c.rentMin + c.foodMin + c.transportMin + c.healthInsuranceMin + c.visaFlightsMin + c.booksMin + c.emergencyBufferMin,
    max: c.tuitionMax + c.rentMax + c.foodMax + c.transportMax + c.healthInsuranceMax + c.visaFlightsMax + c.booksMax + c.emergencyBufferMax,
  };
}

export function getProgramTotal(annual: { min: number; max: number }, years: number) {
  return { min: annual.min * years, max: annual.max * years };
}

export function getMonthlyLiving(c: CostBreakdown): { min: number; max: number } {
  return {
    min: Math.round((c.rentMin + c.foodMin + c.transportMin) / 12),
    max: Math.round((c.rentMax + c.foodMax + c.transportMax) / 12),
  };
}

export function getAffordability(annualMidpoint: number, country: Country): AffordabilityLevel {
  const { affordable, moderate } = AFFORDABILITY_THRESHOLDS[country];
  if (annualMidpoint <= affordable) return "affordable";
  if (annualMidpoint <= moderate) return "moderate";
  return "high";
}

export function getScholarshipReduction(country: Country, degree: DegreeType): ScholarshipReduction {
  return SCHOLARSHIP_REDUCTION[country][degree];
}

export function generateInsights(
  costs: CostBreakdown,
  annual: { min: number; max: number },
  country: Country,
  living: LivingStyle,
): string[] {
  const insights: string[] = [];
  const mid = Math.round((annual.min + annual.max) / 2);
  const tuitionMid = Math.round((costs.tuitionMin + costs.tuitionMax) / 2);
  const avg = COUNTRY_ANNUAL_AVERAGE[country];

  if (tuitionMid / mid > 0.5) {
    insights.push("Most of your projected expenses come from tuition rather than living costs.");
  } else {
    insights.push("Your living costs make up more than half of your total estimated budget.");
  }

  const diff = Math.round(((mid - avg) / avg) * 100);
  if (diff <= -10) {
    insights.push(`Your estimate is about ${Math.abs(diff)}% below the typical international student cost in this country.`);
  } else if (diff >= 10) {
    insights.push(`Your estimate is about ${diff}% above the typical international student cost — consider reviewing your lifestyle choice or city.`);
  } else {
    insights.push("Your estimate is broadly in line with what most international students spend in this country.");
  }

  if (living === "budget") {
    insights.push("Choosing a budget lifestyle could save you $3,000–$6,000/year compared to standard spending.");
  } else if (living === "premium") {
    insights.push("A premium lifestyle adds roughly $5,000–$10,000/year to your base estimate.");
  }

  return insights.slice(0, 3);
}

export function formatUSD(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

// ── Select options ────────────────────────────────────────────────────────────

export const COUNTRIES: { value: Country; label: string; flag: string }[] = [
  { value: "us",           label: "United States",   flag: "🇺🇸" },
  { value: "uk",           label: "United Kingdom",   flag: "🇬🇧" },
  { value: "canada",       label: "Canada",           flag: "🇨🇦" },
  { value: "australia",    label: "Australia",        flag: "🇦🇺" },
  { value: "netherlands",  label: "Netherlands",      flag: "🇳🇱" },
  { value: "germany",      label: "Germany",          flag: "🇩🇪" },
  { value: "ireland",      label: "Ireland",          flag: "🇮🇪" },
  { value: "france",       label: "France",           flag: "🇫🇷" },
  { value: "italy",        label: "Italy",            flag: "🇮🇹" },
  { value: "spain",        label: "Spain",            flag: "🇪🇸" },
  { value: "sweden",       label: "Sweden",           flag: "🇸🇪" },
  { value: "denmark",      label: "Denmark",          flag: "🇩🇰" },
  { value: "switzerland",  label: "Switzerland",      flag: "🇨🇭" },
  { value: "singapore",    label: "Singapore",        flag: "🇸🇬" },
  { value: "new-zealand",  label: "New Zealand",      flag: "🇳🇿" },
  { value: "other",        label: "Other (Enter Manually)", flag: "🌍" },
];

export const DEGREE_TYPES: { value: DegreeType; label: string }[] = [
  { value: "undergrad", label: "Undergraduate (Bachelor's)" },
  { value: "masters",   label: "Master's Degree" },
  { value: "mba",       label: "MBA" },
];

export const LIVING_STYLES: { value: LivingStyle; label: string; description: string }[] = [
  { value: "budget",   label: "Budget",   description: "Shared housing, cook at home, public transit" },
  { value: "standard", label: "Standard", description: "Typical student lifestyle" },
  { value: "premium",  label: "Premium",  description: "Private room, dining out, rideshares" },
];

export const DURATION_OPTIONS = [1, 2, 3, 4, 5];
