export type DailyTrendItem = {
  title: string;
  subtitle?: string;
  url?: string;
  meta?: string;
};

export type DailyPlatformSection = {
  key: string;
  label: string;
  items: DailyTrendItem[];
};

export type DailyTrendingResponse = {
  updated_at: string;
  sections: DailyPlatformSection[];
};
