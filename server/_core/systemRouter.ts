import { z } from "zod";
import { notifyOwner } from "./notification";
import { publicProcedure, router } from "./trpc";
import { getAllSettings, upsertSettings } from "../db";

// Default settings — used when DB has no value yet
const DEFAULT_SETTINGS: Record<string, string> = {
  adminUsername: "admin",
  adminPassword: "",
  adminLoginVisible: "true",
  leaderboardVisible: "true",
  yearlyKingVisible: "true",
  subscriptionVisible: "true",
  revenueVisible: "true",
  monthlyLeaderboardVisible: "true",
  editHomepageVisible: "true",
  currentMonthKingVisible: "true",
  premiumPlanVisible: "true",
  newcomerPlanVisible: "true",
  npcVisible: "true",
  bannerAutoPlay: "true",
  parallaxEnabled: "false",
  blackGoldEffect: "false",
  premiumPrice: "600",
  newcomerPrice: "300",
  quarterlyPrice: "1300",
  depositPrice: "1000",
  weekdayPrice: "39280",
  studentPrice: "29280",
  holidayPrice: "49280",
  paymentPlatform: "restaurant",
  bookingInfoVisible: "true",
  sopVisible: "true",
  branchFeatureVisibility: "",
  rainEffect: "true",
  storeSelectFlameEffect: "true",
  storeSelectFlameColor: "orange",
  storeSelectSocialIconsVisible: "true",
  bookFlipEffect: "true",
  pageBackgrounds: "",
  bookingCalendarVisible: "true",
};

function parseSettings(raw: Record<string, string>) {
  return {
    adminUsername: raw.adminUsername ?? DEFAULT_SETTINGS.adminUsername,
    adminPassword: raw.adminPassword ?? DEFAULT_SETTINGS.adminPassword,
    adminLoginVisible: (raw.adminLoginVisible ?? "true") === "true",
    leaderboardVisible: (raw.leaderboardVisible ?? "true") === "true",
    yearlyKingVisible: (raw.yearlyKingVisible ?? "true") === "true",
    subscriptionVisible: (raw.subscriptionVisible ?? "true") === "true",
    revenueVisible: (raw.revenueVisible ?? "true") === "true",
    monthlyLeaderboardVisible: (raw.monthlyLeaderboardVisible ?? "true") === "true",
    editHomepageVisible: (raw.editHomepageVisible ?? "true") === "true",
    currentMonthKingVisible: (raw.currentMonthKingVisible ?? "true") === "true",
    premiumPlanVisible: (raw.premiumPlanVisible ?? "true") === "true",
    newcomerPlanVisible: (raw.newcomerPlanVisible ?? "true") === "true",
    npcVisible: (raw.npcVisible ?? "true") === "true",
    bannerAutoPlay: (raw.bannerAutoPlay ?? "true") === "true",
    parallaxEnabled: (raw.parallaxEnabled ?? "false") === "true",
    // Existing branches without this key keep the historical behavior: parallax enabled also showed black-gold effects.
    blackGoldEffect: (raw.blackGoldEffect ?? raw.parallaxEnabled ?? DEFAULT_SETTINGS.blackGoldEffect) === "true",
    premiumPrice: parseInt(raw.premiumPrice ?? DEFAULT_SETTINGS.premiumPrice),
    newcomerPrice: parseInt(raw.newcomerPrice ?? DEFAULT_SETTINGS.newcomerPrice),
    quarterlyPrice: parseInt(raw.quarterlyPrice ?? DEFAULT_SETTINGS.quarterlyPrice),
    depositPrice: parseInt(raw.depositPrice ?? DEFAULT_SETTINGS.depositPrice),
    weekdayPrice: parseInt(raw.weekdayPrice ?? DEFAULT_SETTINGS.weekdayPrice),
    studentPrice: parseInt(raw.studentPrice ?? DEFAULT_SETTINGS.studentPrice),
    holidayPrice: parseInt(raw.holidayPrice ?? DEFAULT_SETTINGS.holidayPrice),
    paymentPlatform: raw.paymentPlatform ?? DEFAULT_SETTINGS.paymentPlatform,
    bookingInfoVisible: (raw.bookingInfoVisible ?? "true") === "true",
    sopVisible: (raw.sopVisible ?? "true") === "true",
    branchFeatureVisibility: raw.branchFeatureVisibility ?? "",
    rainEffect: (raw.rainEffect ?? "true") === "true",
    storeSelectFlameEffect: (raw.storeSelectFlameEffect ?? DEFAULT_SETTINGS.storeSelectFlameEffect) === "true",
    storeSelectFlameColor: raw.storeSelectFlameColor ?? DEFAULT_SETTINGS.storeSelectFlameColor,
    storeSelectSocialIconsVisible: (raw.storeSelectSocialIconsVisible ?? DEFAULT_SETTINGS.storeSelectSocialIconsVisible) === "true",
    bookFlipEffect: (raw.bookFlipEffect ?? "true") === "true",
    pageBackgrounds: raw.pageBackgrounds ?? "",
    bookingCalendarVisible: (raw.bookingCalendarVisible ?? "true") === "true",
  };
}

export const systemRouter = router({
  settings: router({
    get: publicProcedure
      .input(z.object({ branchId: z.number().default(1) }).optional())
      .query(async ({ input }) => {
        const raw = await getAllSettings(input?.branchId ?? 1);
        return parseSettings(raw);
      }),
    update: publicProcedure
      .input(
        z.object({
          branchId: z.number().optional(),
          adminUsername: z.string().optional(),
          adminPassword: z.string().optional(),
          adminLoginVisible: z.boolean().optional(),
          leaderboardVisible: z.boolean().optional(),
          yearlyKingVisible: z.boolean().optional(),
          subscriptionVisible: z.boolean().optional(),
          revenueVisible: z.boolean().optional(),
          monthlyLeaderboardVisible: z.boolean().optional(),
          editHomepageVisible: z.boolean().optional(),
          currentMonthKingVisible: z.boolean().optional(),
          premiumPlanVisible: z.boolean().optional(),
          newcomerPlanVisible: z.boolean().optional(),
          npcVisible: z.boolean().optional(),
          bannerAutoPlay: z.boolean().optional(),
          parallaxEnabled: z.boolean().optional(),
          blackGoldEffect: z.boolean().optional(),
          premiumPrice: z.number().optional(),
          newcomerPrice: z.number().optional(),
          quarterlyPrice: z.number().optional(),
          depositPrice: z.number().optional(),
          weekdayPrice: z.number().optional(),
          studentPrice: z.number().optional(),
          holidayPrice: z.number().optional(),
          paymentPlatform: z.string().optional(),
          bookingInfoVisible: z.boolean().optional(),
          sopVisible: z.boolean().optional(),
          branchFeatureVisibility: z.string().optional(),
          rainEffect: z.boolean().optional(),
          storeSelectFlameEffect: z.boolean().optional(),
          storeSelectFlameColor: z.enum(["orange", "pink", "blue", "cyan", "purple", "rainbow"]).optional(),
          storeSelectSocialIconsVisible: z.boolean().optional(),
          bookFlipEffect: z.boolean().optional(),
          pageBackgrounds: z.string().optional(),
          bookingCalendarVisible: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { branchId, ...rest } = input;
        const updates: Record<string, string> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (value === undefined) continue;
          updates[key] = typeof value === "boolean" ? (value ? "true" : "false") : String(value);
        }
        await upsertSettings(updates, branchId ?? 1);
        return { success: true };
      }),
  }),

  health: publicProcedure
    .input(z.object({ timestamp: z.number().min(0) }))
    .query(() => ({ ok: true })),

  notifyOwner: publicProcedure
    .input(z.object({ title: z.string().min(1), content: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return { success: delivered } as const;
    }),
});
