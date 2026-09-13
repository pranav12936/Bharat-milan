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
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    role: accountRoleEnum("role").default("user").notNull(),
    accountStatus: accountStatusEnum("account_status").default("active").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    clerkIdIndex: uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    emailIndex: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const profilesTable = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    gender: text("gender").notNull(),
    height: integer("height"),
    maritalStatus: text("marital_status"),
    religion: text("religion"),
    community: text("community"),
    motherTongue: text("mother_tongue"),
    state: text("state"),
    district: text("district"),
    currentCity: text("current_city"),
    nativePlace: text("native_place"),
    about: text("about"),
    education: text("education"),
    college: text("college"),
    profession: text("profession"),
    jobTitle: text("job_title"),
    company: text("company"),
    workLocation: text("work_location"),
    incomeRange: text("income_range"),
    familyInformation: text("family_information"),
    lifestyleInformation: text("lifestyle_information"),
    hobbies: text("hobbies"),
    languages: text("languages"),
    foodPreferences: text("food_preferences"),
    culturalInterests: text("cultural_interests"),
    familyValues: text("family_values"),
    visibility: profileVisibilityEnum("visibility").default("private").notNull(),
    profileCompletion: integer("profile_completion").default(0).notNull(),
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
    preferredAgeMin: integer("preferred_age_min"),
    preferredAgeMax: integer("preferred_age_max"),
    preferredHeightMin: integer("preferred_height_min"),
    preferredHeightMax: integer("preferred_height_max"),
    preferredLocation: text("preferred_location"),
    preferredDistrict: text("preferred_district"),
    preferredEducation: text("preferred_education"),
    preferredProfession: text("preferred_profession"),
    preferredCommunity: text("preferred_community"),
    preferredMaritalStatus: text("preferred_marital_status"),
    preferredFamilyValues: text("preferred_family_values"),
    otherPreferences: text("other_preferences"),
  },
  (table) => ({
    profileIdIndex: uniqueIndex("partner_preferences_profile_id_idx").on(
      table.profileId,
    ),
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
    senderReceiverIndex: uniqueIndex("interests_sender_receiver_idx").on(
      table.senderProfileId,
      table.receiverProfileId,
    ),
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

export const insertUserSchema = createInsertSchema(usersTable);
export const insertProfileSchema = createInsertSchema(profilesTable);
export const insertPartnerPreferencesSchema = createInsertSchema(
  partnerPreferencesTable,
);
export const insertPhotoSchema = createInsertSchema(photosTable);
export const insertInterestSchema = createInsertSchema(interestsTable);
export const insertReportSchema = createInsertSchema(reportsTable);

export type User = typeof usersTable.$inferSelect;
export type Profile = typeof profilesTable.$inferSelect;
export type PartnerPreferences = typeof partnerPreferencesTable.$inferSelect;
export type Photo = typeof photosTable.$inferSelect;
export type Interest = typeof interestsTable.$inferSelect;
export type Report = typeof reportsTable.$inferSelect;