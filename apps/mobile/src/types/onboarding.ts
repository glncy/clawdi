export const MONEY_SCORE = {
  Stressed: { label: "Stressed", value: 1 },
  Worried: { label: "Worried", value: 2 },
  Okay: { label: "Okay", value: 3 },
  Comfortable: { label: "Comfortable", value: 4 },
  Secure: { label: "Secure", value: 5 },
} as const;
export type MoneyScore = typeof MONEY_SCORE[keyof typeof MONEY_SCORE]["value"];

export const TIME_SCORE = {
  Overwhelmed: { label: "Overwhelmed", value: 1 },
  Rushed: { label: "Rushed", value: 2 },
  Managing: { label: "Managing", value: 3 },
  Balanced: { label: "Balanced", value: 4 },
  InControl: { label: "In control", value: 5 },
} as const;
export type TimeScore = typeof TIME_SCORE[keyof typeof TIME_SCORE]["value"];

export const HEALTH_SCORE = {
  Exhausted: { label: "Exhausted", value: 1 },
  Tired: { label: "Tired", value: 2 },
  Decent: { label: "Decent", value: 3 },
  Energetic: { label: "Energetic", value: 4 },
  Vibrant: { label: "Vibrant", value: 5 },
} as const;
export type HealthScore = typeof HEALTH_SCORE[keyof typeof HEALTH_SCORE]["value"];

export const PEOPLE_SCORE = {
  Disconnected: { label: "Disconnected", value: 1 },
  Distant: { label: "Distant", value: 2 },
  Okay: { label: "Okay", value: 3 },
  Connected: { label: "Connected", value: 4 },
  Close: { label: "Close", value: 5 },
} as const;
export type PeopleScore = typeof PEOPLE_SCORE[keyof typeof PEOPLE_SCORE]["value"];

export const MIND_SCORE = {
  Stagnant: { label: "Stagnant", value: 1 },
  Stuck: { label: "Stuck", value: 2 },
  Steady: { label: "Steady", value: 3 },
  Growing: { label: "Growing", value: 4 },
  Thriving: { label: "Thriving", value: 5 },
} as const;
export type MindScore = typeof MIND_SCORE[keyof typeof MIND_SCORE]["value"];
