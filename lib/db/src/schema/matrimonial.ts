import { createInsertSchema } from "drizzle-zod";

import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const accountRoleEnum = pgEnum("account_role", ["user", "admin"]);

export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "disabled",
  "pending",
  "suspended",
]);

export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "public",
  "private",
]);

export const interestStatusEnum = pgEnum("interest_status", [
  "pending",
  "accepted",
  "declined",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewed",
  "dismissed",
  "actioned",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    // Google account identifier (Google "sub")
    googleId: text("google_id"),

    // User's email address
    email: text("email"),

    // User's mobile number
    phone: text("phone"),

    // Whether the email/mobile has been verified
    emailVerified: boolean("email_verified").default(false).notNull(),

    phoneVerified: boolean("phone_verified").default(false).notNull(),

    // ============================================================
    // ACCOUNT
    // ============================================================

    role: accountRoleEnum("role").default("user").notNull(),

    accountStatus: accountStatusEnum("account_status")
      .default("active")
      .notNull(),

    ...timestamps,
  },
  (table) => ({
    googleIdIndex: uniqueIndex("users_google_id_idx").on(table.googleId),

    emailIndex: uniqueIndex("users_email_idx").on(table.email),

    phoneIndex: uniqueIndex("users_phone_idx").on(table.phone),
  }),
);

export const profilesTable = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    // ============================================================
    // PROFILE SETUP STATUS
    // ============================================================

    profileSetupCompleted: boolean("profile_setup_completed")
      .default(false)
      .notNull(),

    profileSetupStep: integer("profile_setup_step")
      .default(1)
      .notNull(),

    // ============================================================
    // STEP 1 — BASIC & CONTACT
    // ============================================================

    fullName: text("full_name").notNull(),

    dateOfBirth: date("date_of_birth").notNull(),

    gender: text("gender").notNull(),

    phone: text("phone"),

    address: text("address"),

    currentCity: text("current_city"),

    state: text("state"),

    district: text("district"),

    // ============================================================
    // STEP 2 — CULTURAL & BACKGROUND
    // ============================================================

    religion: text("religion"),

    community: text("community"),

    caste: text("caste"),

    subCaste: text("sub_caste"),

    ethnicBackground: text("ethnic_background"),

    motherTongue: text("mother_tongue"),

    languages: text("languages"),

    nativePlace: text("native_place"),

    culturalInterests: text("cultural_interests"),

    // ============================================================
    // STEP 3 — EDUCATION & CAREER
    // ============================================================

    education: text("education"),

    qualifications: text("qualifications"),

    college: text("college"),

    profession: text("profession"),

    jobTitle: text("job_title"),

    company: text("company"),

    workLocation: text("work_location"),

    employmentDetails: text("employment_details"),

    incomeRange: text("income_range"),

    visaWorkStatus: text("visa_work_status"),

    // ============================================================
    // STEP 4 — PHYSICAL, LIFESTYLE & FAMILY
    // ============================================================

    height: integer("height"),

    bodyType: text("body_type"),

    appearance: text("appearance"),

    lifestyleInformation: text("lifestyle_information"),

    smoking: text("smoking"),

    drinking: text("drinking"),

    foodPreferences: text("food_preferences"),

    healthInformation: text("health_information"),

    // ============================================================
    // FAMILY DETAILS
    // ============================================================

    fatherOccupation: text("father_occupation"),

    fatherStatus: text("father_status"),

    motherOccupation: text("mother_occupation"),

    motherStatus: text("mother_status"),

    siblingsCount: integer("siblings_count"),

    brothersCount: integer("brothers_count"),

    sistersCount: integer("sisters_count"),

    marriedSiblingsCount: integer("married_siblings_count"),

    unmarriedSiblingsCount: integer("unmarried_siblings_count"),

    familyType: text("family_type"),

    familyValues: text("family_values"),

    familyInformation: text("family_information"),

    // ============================================================
    // EXISTING PROFILE CONTENT
    // ============================================================

    maritalStatus: text("marital_status"),

    about: text("about"),

    hobbies: text("hobbies"),

    // ============================================================
    // PROFILE SETTINGS
    // ============================================================

    visibility: profileVisibilityEnum("visibility")
      .default("private")
      .notNull(),

    profileCompletion: integer("profile_completion")
      .default(0)
      .notNull(),

    ...timestamps,
  },
  (table) => ({
    userIdIndex: uniqueIndex("profiles_user_id_idx").on(table.userId),
  }),
);

export const partnerPreferencesTable = pgTable(
  "partner_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    profileId: uuid("profile_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),

    // ============================================================
    // PARTNER PREFERENCES
    // ============================================================

    preferredAgeMin: integer("preferred_age_min"),

    preferredAgeMax: integer("preferred_age_max"),

    preferredHeightMin: integer("preferred_height_min"),

    preferredHeightMax: integer("preferred_height_max"),

    preferredLocation: text("preferred_location"),

    preferredDistrict: text("preferred_district"),

    preferredReligion: text("preferred_religion"),

    preferredCaste: text("preferred_caste"),

    preferredCommunity: text("preferred_community"),

    preferredEducation: text("preferred_education"),

    preferredProfession: text("preferred_profession"),

    preferredIncomeRange: text("preferred_income_range"),

    preferredMaritalStatus: text("preferred_marital_status"),

    preferredFamilyValues: text("preferred_family_values"),

    otherPreferences: text("other_preferences"),
  },
  (table) => ({
    profileIdIndex: uniqueIndex(
      "partner_preferences_profile_id_idx",
    ).on(table.profileId),
  }),
);

export const photosTable = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),

  profileId: uuid("profile_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),

  objectPath: text("object_path").notNull(),

  fileType: text("file_type").notNull(),

  isPrimary: boolean("is_primary").default(false).notNull(),

  sortOrder: integer("sort_order").default(0).notNull(),

  ...timestamps,
});

export const interestsTable = pgTable(
  "interests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    senderProfileId: uuid("sender_profile_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),

    receiverProfileId: uuid("receiver_profile_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),

    status: interestStatusEnum("status").default("pending").notNull(),

    ...timestamps,
  },
  (table) => ({
    senderReceiverIndex: uniqueIndex(
      "interests_sender_receiver_idx",
    ).on(table.senderProfileId, table.receiverProfileId),
  }),
);

export const reportsTable = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),

  reporterUserId: uuid("reporter_user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  reportedProfileId: uuid("reported_profile_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),

  reason: text("reason").notNull(),

  description: text("description"),

  status: reportStatusEnum("status").default("open").notNull(),

  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

  ...timestamps,
});

// ============================================================
// INSERT SCHEMAS
// ============================================================

export const insertUserSchema = createInsertSchema(usersTable);

export const insertProfileSchema = createInsertSchema(profilesTable);

export const insertPartnerPreferencesSchema = createInsertSchema(
  partnerPreferencesTable,
);

export const insertPhotoSchema = createInsertSchema(photosTable);

export const insertInterestSchema = createInsertSchema(interestsTable);

export const insertReportSchema = createInsertSchema(reportsTable);

// ============================================================
// TYPES
// ============================================================

export type User = typeof usersTable.$inferSelect;

export type Profile = typeof profilesTable.$inferSelect;

export type PartnerPreferences =
  typeof partnerPreferencesTable.$inferSelect;

export type Photo = typeof photosTable.$inferSelect;

export type Interest = typeof interestsTable.$inferSelect;

export type Report = typeof reportsTable.$inferSelect;