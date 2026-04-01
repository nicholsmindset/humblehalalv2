export enum HalalStatus {
  MuisCertified = "muis_certified",
  MuslimOwned = "muslim_owned",
  SelfDeclared = "self_declared",
  NotApplicable = "not_applicable",
}

export enum Vertical {
  Food = "food",
  Catering = "catering",
  Services = "services",
  Products = "products",
  Events = "events",
  Classifieds = "classifieds",
  Mosque = "mosque",
  PrayerRoom = "prayer_room",
}

export enum SingaporeArea {
  Tampines = "tampines",
  JurongEast = "jurong-east",
  JurongWest = "jurong-west",
  Woodlands = "woodlands",
  Yishun = "yishun",
  Sengkang = "sengkang",
  Punggol = "punggol",
  Bedok = "bedok",
  Hougang = "hougang",
  Bukit = "bukit-timah",
  Orchard = "orchard",
  Bugis = "bugis",
  ArabStreet = "arab-street",
  MarinaBay = "marina-bay",
  GeylangSerangoon = "geylang-serangoon",
  PasirRis = "pasir-ris",
  Clementi = "clementi",
  QueensTown = "queenstown",
  Bishan = "bishan",
  ToaPayoh = "toa-payoh",
  Sembawang = "sembawang",
  Choa = "choa-chu-kang",
  Ang = "ang-mo-kio",
  Boon = "boon-lay",
  Jurong = "jurong",
  City = "city",
}

export enum CuisineType {
  Malay = "malay",
  Indian = "indian",
  Chinese = "chinese",
  Korean = "korean",
  Japanese = "japanese",
  Turkish = "turkish",
  MiddleEastern = "middle-eastern",
  Western = "western",
  Mediterranean = "mediterranean",
  Thai = "thai",
  Indonesian = "indonesian",
  Pakistani = "pakistani",
  Bangladeshi = "bangladeshi",
  Vietnamese = "vietnamese",
  Mexican = "mexican",
  Italian = "italian",
  Fusion = "fusion",
  Buffet = "buffet",
  Seafood = "seafood",
  Dessert = "dessert",
  Cafe = "cafe",
  Bakery = "bakery",
  FastFood = "fast-food",
  Mamak = "mamak",
}

export enum BusinessCategory {
  Restaurant = "restaurant",
  Catering = "catering",
  FoodDelivery = "food-delivery",
  Grocery = "grocery",
  Fashion = "fashion",
  Beauty = "beauty",
  Finance = "finance",
  Travel = "travel",
  Education = "education",
  Healthcare = "healthcare",
  LegalServices = "legal-services",
  Photography = "photography",
  Events = "events",
  Cleaning = "cleaning",
  Technology = "technology",
  RealEstate = "real-estate",
  Childcare = "childcare",
  Fitness = "fitness",
  HomeServices = "home-services",
  Other = "other",
}

export const SITE_URL = "https://humblehalal.sg";
export const SITE_NAME = "HumbleHalal";

export const HALAL_STATUS_LABELS: Record<HalalStatus, string> = {
  [HalalStatus.MuisCertified]: "MUIS Certified",
  [HalalStatus.MuslimOwned]: "Muslim Owned",
  [HalalStatus.SelfDeclared]: "Self Declared Halal",
  [HalalStatus.NotApplicable]: "Not Applicable",
};

export const ISR_REVALIDATE = {
  HIGH_TRAFFIC: 1800,   // 30 minutes
  LONG_TAIL: 3600,      // 60 minutes
  STATIC: 86400,        // 24 hours
} as const;
