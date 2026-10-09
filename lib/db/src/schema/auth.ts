import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { usersTable } from "./matrimonial";

// ============================================================
// AUTH SESSIONS
// ============================================================

export const authSessionsTable = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    tokenHash: text("token_hash").notNull().unique(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    revoked: boolean("revoked").default(false).notNull(),
  },
  (table) => ({
    userIdIndex: index("auth_sessions_user_id_idx").on(table.userId),
    expiresAtIndex: index("auth_sessions_expires_at_idx").on(
      table.expiresAt,
    ),
  }),
);

// ============================================================
// OTP VERIFICATIONS
// ============================================================

export const otpVerificationsTable = pgTable(
  "otp_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    phone: text("phone").notNull(),

    otpHash: text("otp_hash").notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }).notNull(),

    attempts: integer("attempts").default(0).notNull(),

    verified: boolean("verified").default(false).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    phoneIndex: index("otp_verifications_phone_idx").on(table.phone),
    expiresAtIndex: index("otp_verifications_expires_at_idx").on(
      table.expiresAt,
    ),
  }),
);

// ============================================================
// TYPES
// ============================================================

export type AuthSession = typeof authSessionsTable.$inferSelect;

export type OtpVerification =
  typeof otpVerificationsTable.$inferSelect;
