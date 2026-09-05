import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { AssetRecord } from "@/lib/schemas";
import { UserRole } from "@/lib/auth/roles";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("individual"),
  /** Developer flag. Not an organization role; unused for `/admin` gates. */
  isSiteAdmin: boolean("is_site_admin").notNull().default(false),
  displayName: text("display_name"),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const buildings = pgTable("buildings", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  buildingName: text("building_name").notNull().default(""),
  buildingType: text("building_type").notNull().default(""),
  totalSqft: integer("total_sqft").notNull().default(0),
  aboveGradeFloors: integer("above_grade_floors").notNull().default(0),
  basementLevels: integer("basement_levels").notNull().default(0),
  hasRoofLevel: boolean("has_roof_level").notNull().default(false),
  buildDate: text("build_date"),
  remodelDates: jsonb("remodel_dates").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  buildingId: uuid("building_id")
    .notNull()
    .references(() => buildings.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").references(() => users.id),
  assessmentDate: text("assessment_date"),
  facilityLevel: text("facility_level"),
  floorId: text("floor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  record: jsonb("record").$type<AssetRecord>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
