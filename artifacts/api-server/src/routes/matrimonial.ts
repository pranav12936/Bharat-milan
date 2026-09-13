import { getAuth } from "@clerk/express";
import { and, count, desc, eq, gte, ilike, lte, ne, or } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  CompletePhotoUploadBody,
  CreateReportBody,
  ExpressInterestParams,
  GetProfileParams,
  ListAdminReportsQueryParams,
  ListProfilesQueryParams,
  UpdateInterestBody,
  UpdateInterestParams,
  UpdateMyProfileBody,
  UpdateProfileVisibilityBody,
} from "@workspace/api-zod";
import {
  db,
  interestsTable,
  partnerPreferencesTable,
  photosTable,
  profilesTable,
  reportsTable,
  usersTable,
  type Profile,
  type User,
} from "@workspace/db";

const router: IRouter = Router();

function currentClerkUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

function claimsEmail(req: Request): string {
  const claims = getAuth(req).sessionClaims as Record<string, unknown> | null;
  return typeof claims?.email === "string"
    ? claims.email
    : `member-${getAuth(req).userId ?? "unknown"}@pahadi-bwari.invalid`;
}

async function currentUser(req: Request): Promise<User | null> {
  const clerkId = currentClerkUserId(req);
  if (!clerkId) return null;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(usersTable)
    .values({ clerkId, email: claimsEmail(req), emailVerified: true })
    .returning();
  return created ?? null;
}

function ageFromDate(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - dob.getUTCMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
}

function dateForAge(age: number): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - age);
  return date.toISOString().slice(0, 10);
}

function isAdult(dateOfBirth: string): boolean {
  return ageFromDate(dateOfBirth) >= 18;
}

function calculateCompletion(profile: Partial<Profile>): number {
  const fields = [
    profile.fullName,
    profile.dateOfBirth,
    profile.gender,
    profile.height,
    profile.maritalStatus,
    profile.currentCity,
    profile.district,
    profile.about,
    profile.education,
    profile.profession,
    profile.familyValues,
    profile.hobbies,
    profile.languages,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function photoUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

async function photosFor(profileId: string) {
  return db
    .select()
    .from(photosTable)
    .where(eq(photosTable.profileId, profileId))
    .orderBy(photosTable.sortOrder, photosTable.createdAt);
}

async function publicProfile(profile: Profile) {
  const photos = await photosFor(profile.id);
  return {
    id: profile.id,
    fullName: profile.fullName,
    age: ageFromDate(profile.dateOfBirth),
    gender: profile.gender,
    height: profile.height ?? 0,
    city: profile.currentCity ?? "",
    district: profile.district ?? "",
    nativePlace: profile.nativePlace ?? "",
    education: profile.education ?? "",
    profession: profile.profession ?? "",
    community: profile.community ?? "",
    maritalStatus: profile.maritalStatus ?? "",
    about: profile.about ?? "",
    familyValues: profile.familyValues ?? "",
    hobbies: profile.hobbies ?? "",
    languages: profile.languages ?? "",
    photoUrl: photos[0] ? photoUrl(photos[0].objectPath) : null,
    photos: photos.map((photo) => ({
      id: photo.id,
      url: photoUrl(photo.objectPath),
      isPrimary: photo.isPrimary,
      sortOrder: photo.sortOrder,
    })),
  };
}

async function myProfile(profile: Profile, user: User) {
  const [base, preferences] = await Promise.all([
    publicProfile(profile),
    db
      .select()
      .from(partnerPreferencesTable)
      .where(eq(partnerPreferencesTable.profileId, profile.id))
      .limit(1),
  ]);

  return {
    ...base,
    email: user.email,
    visibility: profile.visibility,
    completion: profile.profileCompletion,
    preferences: {
      preferredAgeMin: preferences[0]?.preferredAgeMin ?? null,
      preferredAgeMax: preferences[0]?.preferredAgeMax ?? null,
      preferredHeightMin: preferences[0]?.preferredHeightMin ?? null,
      preferredHeightMax: preferences[0]?.preferredHeightMax ?? null,
      preferredLocation: preferences[0]?.preferredLocation ?? null,
      preferredDistrict: preferences[0]?.preferredDistrict ?? null,
      preferredEducation: preferences[0]?.preferredEducation ?? null,
      preferredProfession: preferences[0]?.preferredProfession ?? null,
      preferredCommunity: preferences[0]?.preferredCommunity ?? null,
      preferredMaritalStatus: preferences[0]?.preferredMaritalStatus ?? null,
      preferredFamilyValues: preferences[0]?.preferredFamilyValues ?? null,
      otherPreferences: preferences[0]?.otherPreferences ?? null,
    },
  };
}

async function profileForUser(userId: string): Promise<Profile | null> {
  const result = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

async function requireUser(req: Request, res: Response): Promise<User | null> {
  if (!currentClerkUserId(req)) {
    res.status(401).json({ error: "Please sign in to continue." });
    return null;
  }
  const user = await currentUser(req);
  if (!user || user.accountStatus !== "active") {
    res.status(403).json({ error: "This account is not currently active." });
    return null;
  }
  return user;
}

async function requireAdmin(req: Request, res: Response): Promise<User | null> {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin access is required." });
    return null;
  }
  return user;
}

router.get("/dashboard", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const profile = await profileForUser(user.id);
  if (!profile) {
    res.status(200).json({
      profile: null,
      sentInterests: 0,
      receivedInterests: 0,
      acceptedInterests: 0,
      recentProfiles: [],
    });
    return;
  }

  const [sent, received, accepted, recent] = await Promise.all([
    db
      .select({ total: count() })
      .from(interestsTable)
      .where(eq(interestsTable.senderProfileId, profile.id)),
    db
      .select({ total: count() })
      .from(interestsTable)
      .where(eq(interestsTable.receiverProfileId, profile.id)),
    db
      .select({ total: count() })
      .from(interestsTable)
      .where(
        and(
          eq(interestsTable.receiverProfileId, profile.id),
          eq(interestsTable.status, "accepted"),
        ),
      ),
    db
      .select()
      .from(profilesTable)
      .where(
        and(
          eq(profilesTable.visibility, "public"),
          ne(profilesTable.userId, user.id),
        ),
      )
      .orderBy(desc(profilesTable.createdAt))
      .limit(3),
  ]);

  res.json({
    profile: await myProfile(profile, user),
    sentInterests: sent[0]?.total ?? 0,
    receivedInterests: received[0]?.total ?? 0,
    acceptedInterests: accepted[0]?.total ?? 0,
    recentProfiles: await Promise.all(recent.map(publicProfile)),
  });
});

router.get("/profile/me", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const profile = await profileForUser(user.id);
  if (!profile) {
    res.status(404).json({ error: "Your profile is not complete yet." });
    return;
  }
  res.json(await myProfile(profile, user));
});

router.put("/profile/me", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the highlighted profile fields." });
    return;
  }
  const dateOfBirth = parsed.data.dateOfBirth.toISOString().slice(0, 10);
  if (!isAdult(dateOfBirth)) {
    res.status(400).json({ error: "Pahadi Bwari is for adults aged 18 and above." });
    return;
  }

  const existing = await profileForUser(user.id);
  const values = {
    fullName: parsed.data.fullName,
    dateOfBirth,
    gender: parsed.data.gender,
    height: parsed.data.height,
    maritalStatus: parsed.data.maritalStatus,
    religion: parsed.data.religion,
    community: parsed.data.community,
    motherTongue: parsed.data.motherTongue,
    state: parsed.data.state,
    district: parsed.data.district,
    currentCity: parsed.data.currentCity,
    nativePlace: parsed.data.nativePlace,
    about: parsed.data.about,
    education: parsed.data.education,
    college: parsed.data.college,
    profession: parsed.data.profession,
    jobTitle: parsed.data.jobTitle,
    company: parsed.data.company,
    workLocation: parsed.data.workLocation,
    incomeRange: parsed.data.incomeRange,
    familyInformation: parsed.data.familyInformation,
    lifestyleInformation: parsed.data.lifestyleInformation,
    hobbies: parsed.data.hobbies,
    languages: parsed.data.languages,
    foodPreferences: parsed.data.foodPreferences,
    culturalInterests: parsed.data.culturalInterests,
    familyValues: parsed.data.familyValues,
    visibility: parsed.data.visibility ?? existing?.visibility ?? "private",
    profileCompletion: calculateCompletion({ ...parsed.data, dateOfBirth }),
    updatedAt: new Date(),
  };

  const saved = existing
    ? (
        await db
          .update(profilesTable)
          .set(values)
          .where(eq(profilesTable.id, existing.id))
          .returning()
      )[0]
    : (
        await db
          .insert(profilesTable)
          .values({ ...values, userId: user.id })
          .returning()
      )[0];

  if (!saved) {
    res.status(500).json({ error: "Something went wrong. Please try again." });
    return;
  }

  const preferenceValues = {
    profileId: saved.id,
    preferredAgeMin: parsed.data.preferredAgeMin,
    preferredAgeMax: parsed.data.preferredAgeMax,
    preferredHeightMin: parsed.data.preferredHeightMin,
    preferredHeightMax: parsed.data.preferredHeightMax,
    preferredLocation: parsed.data.preferredLocation,
    preferredDistrict: parsed.data.preferredDistrict,
    preferredEducation: parsed.data.preferredEducation,
    preferredProfession: parsed.data.preferredProfession,
    preferredCommunity: parsed.data.preferredCommunity,
    preferredMaritalStatus: parsed.data.preferredMaritalStatus,
    preferredFamilyValues: parsed.data.preferredFamilyValues,
    otherPreferences: parsed.data.otherPreferences,
  };
  const existingPreferences = await db
    .select()
    .from(partnerPreferencesTable)
    .where(eq(partnerPreferencesTable.profileId, saved.id))
    .limit(1);
  if (existingPreferences[0]) {
    await db
      .update(partnerPreferencesTable)
      .set(preferenceValues)
      .where(eq(partnerPreferencesTable.id, existingPreferences[0].id));
  } else {
    await db.insert(partnerPreferencesTable).values(preferenceValues);
  }

  res.json(await myProfile(saved, user));
});

router.put("/profile/visibility", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = UpdateProfileVisibilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose whether your profile should be public or private." });
    return;
  }
  const profile = await profileForUser(user.id);
  if (!profile) {
    res.status(404).json({ error: "Complete your profile before changing visibility." });
    return;
  }
  const [updated] = await db
    .update(profilesTable)
    .set({ visibility: parsed.data.visibility, updatedAt: new Date() })
    .where(eq(profilesTable.id, profile.id))
    .returning({ visibility: profilesTable.visibility });
  res.json(updated);
});

router.get("/profiles", async (req, res) => {
  const parsed = ListProfilesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "One or more search filters are invalid." });
    return;
  }
  const user = currentClerkUserId(req) ? await currentUser(req) : null;
  const filters = [
    eq(profilesTable.visibility, "public"),
    user ? ne(profilesTable.userId, user.id) : undefined,
    parsed.data.gender ? eq(profilesTable.gender, parsed.data.gender) : undefined,
    parsed.data.location
      ? or(
          ilike(profilesTable.currentCity, `%${parsed.data.location}%`),
          ilike(profilesTable.state, `%${parsed.data.location}%`),
        )
      : undefined,
    parsed.data.district
      ? ilike(profilesTable.district, `%${parsed.data.district}%`)
      : undefined,
    parsed.data.education
      ? ilike(profilesTable.education, `%${parsed.data.education}%`)
      : undefined,
    parsed.data.profession
      ? ilike(profilesTable.profession, `%${parsed.data.profession}%`)
      : undefined,
    parsed.data.community
      ? ilike(profilesTable.community, `%${parsed.data.community}%`)
      : undefined,
    parsed.data.maritalStatus
      ? eq(profilesTable.maritalStatus, parsed.data.maritalStatus)
      : undefined,
    parsed.data.heightMin
      ? gte(profilesTable.height, parsed.data.heightMin)
      : undefined,
    parsed.data.heightMax
      ? lte(profilesTable.height, parsed.data.heightMax)
      : undefined,
    parsed.data.ageMin
      ? lte(profilesTable.dateOfBirth, dateForAge(parsed.data.ageMin))
      : undefined,
    parsed.data.ageMax
      ? gte(profilesTable.dateOfBirth, dateForAge(parsed.data.ageMax + 1))
      : undefined,
  ].filter(Boolean);

  const page = parsed.data.page ?? 1;
  const pageSize = parsed.data.pageSize ?? 12;
  const where = and(...filters);
  const [profiles, totals] = await Promise.all([
    db
      .select()
      .from(profilesTable)
      .where(where)
      .orderBy(desc(profilesTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(profilesTable).where(where),
  ]);
  const total = totals[0]?.total ?? 0;
  res.json({
    items: await Promise.all(profiles.map(publicProfile)),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

router.get("/profiles/:id", async (req, res) => {
  const parsed = GetProfileParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(
      and(eq(profilesTable.id, parsed.data.id), eq(profilesTable.visibility, "public")),
    )
    .limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  res.json(await publicProfile(profile));
});

async function interestView(
  interest: typeof interestsTable.$inferSelect,
  profilesById: Map<string, Profile>,
) {
  return {
    id: interest.id,
    senderProfileId: interest.senderProfileId,
    receiverProfileId: interest.receiverProfileId,
    senderName: profilesById.get(interest.senderProfileId)?.fullName ?? "Member",
    receiverName: profilesById.get(interest.receiverProfileId)?.fullName ?? "Member",
    status: interest.status,
    createdAt: interest.createdAt.toISOString(),
  };
}

router.post("/profiles/:id/interest", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = ExpressInterestParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Profile not found." });
    return;
  }
  const sender = await profileForUser(user.id);
  const [receiver] = await db
    .select()
    .from(profilesTable)
    .where(
      and(eq(profilesTable.id, parsed.data.id), eq(profilesTable.visibility, "public")),
    )
    .limit(1);
  if (!sender || !receiver || sender.id === receiver.id) {
    res.status(400).json({ error: "You can only express interest in another public profile." });
    return;
  }
  const duplicate = await db
    .select()
    .from(interestsTable)
    .where(
      and(
        eq(interestsTable.senderProfileId, sender.id),
        eq(interestsTable.receiverProfileId, receiver.id),
      ),
    )
    .limit(1);
  if (duplicate[0]) {
    res.status(409).json({ error: "You have already expressed interest in this profile." });
    return;
  }
  const [created] = await db
    .insert(interestsTable)
    .values({ senderProfileId: sender.id, receiverProfileId: receiver.id })
    .returning();
  const names = new Map([
    [sender.id, sender],
    [receiver.id, receiver],
  ]);
  res.status(201).json(await interestView(created, names));
});

router.get("/interests", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const profile = await profileForUser(user.id);
  if (!profile) {
    res.json({ sent: [], received: [] });
    return;
  }
  const [sent, received] = await Promise.all([
    db
      .select()
      .from(interestsTable)
      .where(eq(interestsTable.senderProfileId, profile.id))
      .orderBy(desc(interestsTable.createdAt)),
    db
      .select()
      .from(interestsTable)
      .where(eq(interestsTable.receiverProfileId, profile.id))
      .orderBy(desc(interestsTable.createdAt)),
  ]);
  const ids = [...new Set([...sent, ...received].flatMap((item) => [
    item.senderProfileId,
    item.receiverProfileId,
  ]))];
  const namedProfiles = ids.length
    ? await db.select().from(profilesTable).where(or(...ids.map((id) => eq(profilesTable.id, id))))
    : [];
  const profilesById = new Map(namedProfiles.map((item) => [item.id, item]));
  res.json({
    sent: await Promise.all(sent.map((item) => interestView(item, profilesById))),
    received: await Promise.all(received.map((item) => interestView(item, profilesById))),
  });
});

router.put("/interests/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const params = UpdateInterestParams.safeParse(req.params);
  const body = UpdateInterestBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Choose accepted or declined." });
    return;
  }
  const profile = await profileForUser(user.id);
  if (!profile) {
    res.status(404).json({ error: "Complete your profile first." });
    return;
  }
  const [interest] = await db
    .select()
    .from(interestsTable)
    .where(
      and(
        eq(interestsTable.id, params.data.id),
        eq(interestsTable.receiverProfileId, profile.id),
      ),
    )
    .limit(1);
  if (!interest) {
    res.status(403).json({ error: "You cannot update this interest." });
    return;
  }
  const [updated] = await db
    .update(interestsTable)
    .set({ status: body.data.status, updatedAt: new Date() })
    .where(eq(interestsTable.id, interest.id))
    .returning();
  const profileRows = await db
    .select()
    .from(profilesTable)
    .where(
      or(
        eq(profilesTable.id, updated.senderProfileId),
        eq(profilesTable.id, updated.receiverProfileId),
      ),
    );
  res.json(await interestView(updated, new Map(profileRows.map((item) => [item.id, item]))));
});

router.post("/photos/complete", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = CompletePhotoUploadBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.objectPath.startsWith("/objects/")) {
    res.status(400).json({ error: "The uploaded photo could not be saved." });
    return;
  }
  const profile = await profileForUser(user.id);
  if (!profile) {
    res.status(400).json({ error: "Complete your profile before adding photos." });
    return;
  }
  if (parsed.data.isPrimary) {
    await db
      .update(photosTable)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(photosTable.profileId, profile.id));
  }
  const existingPhotos = await photosFor(profile.id);
  const [photo] = await db
    .insert(photosTable)
    .values({
      profileId: profile.id,
      objectPath: parsed.data.objectPath,
      fileType: parsed.data.fileType,
      isPrimary: parsed.data.isPrimary ?? existingPhotos.length === 0,
      sortOrder: existingPhotos.length,
    })
    .returning();
  res.status(201).json({
    id: photo.id,
    url: photoUrl(photo.objectPath),
    isPrimary: photo.isPrimary,
    sortOrder: photo.sortOrder,
  });
});

router.post("/reports", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please choose a report reason." });
    return;
  }
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, parsed.data.reportedProfileId))
    .limit(1);
  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }
  const [report] = await db
    .insert(reportsTable)
    .values({
      reporterUserId: user.id,
      reportedProfileId: parsed.data.reportedProfileId,
      reason: parsed.data.reason,
      description: parsed.data.description,
    })
    .returning();
  res.status(201).json({
    id: report.id,
    reportedProfileId: report.reportedProfileId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
  });
});

router.get("/admin/stats", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const [[users], [publicProfiles], [pendingReports], [interestsSent]] =
    await Promise.all([
      db.select({ total: count() }).from(usersTable),
      db
        .select({ total: count() })
        .from(profilesTable)
        .where(eq(profilesTable.visibility, "public")),
      db
        .select({ total: count() })
        .from(reportsTable)
        .where(eq(reportsTable.status, "open")),
      db.select({ total: count() }).from(interestsTable),
    ]);
  res.json({
    totalUsers: users?.total ?? 0,
    publicProfiles: publicProfiles?.total ?? 0,
    pendingReports: pendingReports?.total ?? 0,
    interestsSent: interestsSent?.total ?? 0,
  });
});

router.get("/admin/reports", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const parsed = ListAdminReportsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid pagination." });
    return;
  }
  const page = parsed.data.page ?? 1;
  const pageSize = parsed.data.pageSize ?? 12;
  const [reports, totals] = await Promise.all([
    db
      .select()
      .from(reportsTable)
      .orderBy(desc(reportsTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(reportsTable),
  ]);
  res.json({
    items: reports.map((report) => ({
      id: report.id,
      reportedProfileId: report.reportedProfileId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total: totals[0]?.total ?? 0,
  });
});

export default router;