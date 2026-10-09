import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  ne,
  or,
} from "drizzle-orm";

import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";

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

import { objectStorageService } from "../lib/objectStorage";
import { extractBearerToken } from "../auth/token";
import { getSessionUser } from "../auth/session";

const router: IRouter = Router();

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

async function requireUser(
  req: Request,
  res: Response,
): Promise<User | null> {
  const token = extractBearerToken(
    req.headers.authorization,
  );

  if (!token) {
    res.status(401).json({
      error: "Please sign in to continue.",
    });
    return null;
  }

  const result = await getSessionUser(token);

  if (!result) {
    res.status(401).json({
      error: "Your session is invalid or has expired. Please sign in again.",
    });
    return null;
  }

  const user = result.user;

  if (user.accountStatus !== "active") {
    res.status(403).json({
      error: "This account is not currently active.",
    });
    return null;
  }

  return user;
}

async function requireAdmin(
  req: Request,
  res: Response,
): Promise<User | null> {
  const user = await requireUser(req, res);

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    res.status(403).json({
      error: "Admin access is required.",
    });
    return null;
  }

  return user;
}

/* -------------------------------------------------------------------------- */
/* Utility Functions                                                          */
/* -------------------------------------------------------------------------- */

function ageFromDate(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age =
    today.getUTCFullYear() -
    dob.getUTCFullYear();

  const monthDelta =
    today.getUTCMonth() -
    dob.getUTCMonth();

  if (
    monthDelta < 0 ||
    (
      monthDelta === 0 &&
      today.getUTCDate() < dob.getUTCDate()
    )
  ) {
    age -= 1;
  }

  return age;
}

function dateForAge(age: number): string {
  const date = new Date();

  date.setUTCFullYear(
    date.getUTCFullYear() - age,
  );

  return date.toISOString().slice(0, 10);
}

function isAdult(dateOfBirth: string): boolean {
  return ageFromDate(dateOfBirth) >= 18;
}

function calculateCompletion(
  profile: Partial<Profile>,
): number {
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

  return Math.round(
    (
      fields.filter(Boolean).length /
      fields.length
    ) * 100,
  );
}

function photoUrl(
  objectPath: string,
): string {
  if (!objectPath) {
    return "";
  }

  if (
    objectPath.startsWith(
      "/api/storage/",
    )
  ) {
    return objectPath;
  }

  if (
    objectPath.startsWith(
      "/objects/",
    )
  ) {
    return `/api/storage${objectPath}`;
  }

  return "";
}

async function photosFor(
  profileId: string,
) {
  return db
    .select()
    .from(photosTable)
    .where(
      eq(
        photosTable.profileId,
        profileId,
      ),
    )
    .orderBy(
      photosTable.sortOrder,
      photosTable.createdAt,
    );
}

/* -------------------------------------------------------------------------- */
/* Public Profile                                                             */
/* -------------------------------------------------------------------------- */

async function publicProfile(
  profile: Profile,
) {
  const photos =
    await photosFor(profile.id);

  return {
    id: profile.id,

    fullName:
      profile.fullName,

    age:
      ageFromDate(
        profile.dateOfBirth,
      ),

    gender:
      profile.gender,

    height:
      profile.height ?? 0,

    city:
      profile.currentCity ?? "",

    district:
      profile.district ?? "",

    nativePlace:
      profile.nativePlace ?? "",

    education:
      profile.education ?? "",

    profession:
      profile.profession ?? "",

    community:
      profile.community ?? "",

    maritalStatus:
      profile.maritalStatus ?? "",

    about:
      profile.about ?? "",

    familyValues:
      profile.familyValues ?? "",

    hobbies:
      profile.hobbies ?? "",

    languages:
      profile.languages ?? "",

    photoUrl: (() => {
      const primaryPhoto =
        photos.find(
          (photo) =>
            photo.isPrimary,
        );

      return primaryPhoto
        ? photoUrl(
            primaryPhoto.objectPath,
          )
        : null;
    })(),

    photos:
      photos.map((photo) => ({
        id: photo.id,

        url:
          photoUrl(
            photo.objectPath,
          ),

        isPrimary:
          photo.isPrimary,

        sortOrder:
          photo.sortOrder,
      })),
  };
}

/* -------------------------------------------------------------------------- */
/* Full Current User Profile                                                  */
/* -------------------------------------------------------------------------- */

async function myProfile(
  profile: Profile,
  user: User,
) {
  const [
    base,
    preferences,
  ] = await Promise.all([
    publicProfile(profile),

    db
      .select()
      .from(
        partnerPreferencesTable,
      )
      .where(
        eq(
          partnerPreferencesTable.profileId,
          profile.id,
        ),
      )
      .limit(1),
  ]);

  const savedPreferences =
    preferences[0];

  return {
    ...base,

    email:
      user.email,

    /*
     * Personal details
     */

    dateOfBirth:
      profile.dateOfBirth,

    phone:
      profile.phone ?? "",

    address:
      profile.address ?? "",

    religion:
      profile.religion ?? "",

    community:
      profile.community ?? "",

    caste:
      profile.caste ?? "",

    subCaste:
      profile.subCaste ?? "",

    ethnicBackground:
      profile.ethnicBackground ?? "",

    motherTongue:
      profile.motherTongue ?? "",

    state:
      profile.state ?? "",

    currentCity:
      profile.currentCity ?? "",

    district:
      profile.district ?? "",

    nativePlace:
      profile.nativePlace ?? "",

    /*
     * Education and career
     */

    qualifications:
      profile.qualifications ?? "",

    college:
      profile.college ?? "",

    profession:
      profile.profession ?? "",

    jobTitle:
      profile.jobTitle ?? "",

    company:
      profile.company ?? "",

    workLocation:
      profile.workLocation ?? "",

    employmentDetails:
      profile.employmentDetails ?? "",

    incomeRange:
      profile.incomeRange ?? "",

    visaWorkStatus:
      profile.visaWorkStatus ?? "",

    /*
     * Lifestyle
     */

    bodyType:
      profile.bodyType ?? "",

    appearance:
      profile.appearance ?? "",

    lifestyleInformation:
      profile.lifestyleInformation ?? "",

    smoking:
      profile.smoking ?? "",

    drinking:
      profile.drinking ?? "",

    foodPreferences:
      profile.foodPreferences ?? "",

    healthInformation:
      profile.healthInformation ?? "",

    /*
     * Family
     */

    fatherOccupation:
      profile.fatherOccupation ?? "",

    fatherStatus:
      profile.fatherStatus ?? "",

    motherOccupation:
      profile.motherOccupation ?? "",

    motherStatus:
      profile.motherStatus ?? "",

    siblingsCount:
      profile.siblingsCount ??
      undefined,

    brothersCount:
      profile.brothersCount ??
      undefined,

    sistersCount:
      profile.sistersCount ??
      undefined,

    marriedSiblingsCount:
      profile.marriedSiblingsCount ??
      undefined,

    unmarriedSiblingsCount:
      profile.unmarriedSiblingsCount ??
      undefined,

    familyType:
      profile.familyType ?? "",

    familyInformation:
      profile.familyInformation ?? "",

    /*
     * About and interests
     */

    hobbies:
      profile.hobbies ?? "",

    languages:
      profile.languages ?? "",

    culturalInterests:
      profile.culturalInterests ?? "",

    familyValues:
      profile.familyValues ?? "",

    /*
     * Profile settings
     */

    visibility:
      profile.visibility,

    completion:
      profile.profileCompletion,

    /*
     * Partner preferences
     */

    preferences: {
      preferredAgeMin:
        savedPreferences
          ?.preferredAgeMin ??
        null,

      preferredAgeMax:
        savedPreferences
          ?.preferredAgeMax ??
        null,

      preferredHeightMin:
        savedPreferences
          ?.preferredHeightMin ??
        null,

      preferredHeightMax:
        savedPreferences
          ?.preferredHeightMax ??
        null,

      preferredLocation:
        savedPreferences
          ?.preferredLocation ??
        null,

      preferredDistrict:
        savedPreferences
          ?.preferredDistrict ??
        null,

      preferredReligion:
        savedPreferences
          ?.preferredReligion ??
        null,

      preferredCaste:
        savedPreferences
          ?.preferredCaste ??
        null,

      preferredEducation:
        savedPreferences
          ?.preferredEducation ??
        null,

      preferredProfession:
        savedPreferences
          ?.preferredProfession ??
        null,

      preferredCommunity:
        savedPreferences
          ?.preferredCommunity ??
        null,

      preferredIncomeRange:
        savedPreferences
          ?.preferredIncomeRange ??
        null,

      preferredMaritalStatus:
        savedPreferences
          ?.preferredMaritalStatus ??
        null,

      preferredFamilyValues:
        savedPreferences
          ?.preferredFamilyValues ??
        null,

      otherPreferences:
        savedPreferences
          ?.otherPreferences ??
        null,
    },
  };
}

async function profileForUser(
  userId: string,
): Promise<Profile | null> {
  const result =
    await db
      .select()
      .from(profilesTable)
      .where(
        eq(
          profilesTable.userId,
          userId,
        ),
      )
      .limit(1);

  return result[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Profile Setup / Onboarding                                                 */
/* -------------------------------------------------------------------------- */

router.get(
  "/profile/setup",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    try {
      const profile =
        await profileForUser(
          user.id,
        );

      if (!profile) {
        res.json({
          profileExists: false,
          profileSetupCompleted: false,
          currentStep: 1,
          profile: null,
          preferences: null,
          photoCount: 0,
          hasPrimaryPhoto: false,
        });

        return;
      }

      const photos =
        await photosFor(
          profile.id,
        );

      const [
        preferences,
      ] = await db
        .select()
        .from(
          partnerPreferencesTable,
        )
        .where(
          eq(
            partnerPreferencesTable.profileId,
            profile.id,
          ),
        )
        .limit(1);

      res.json({
        profileExists: true,

        profileSetupCompleted:
          profile.profileSetupCompleted,

        currentStep:
          profile.profileSetupCompleted
            ? 6
            : Math.max(
                1,
                Math.min(
                  profile.profileSetupStep,
                  5,
                ),
              ),

        profile: {
          id:
            profile.id,

          fullName:
            profile.fullName,

          dateOfBirth:
            profile.dateOfBirth,

          age:
            ageFromDate(
              profile.dateOfBirth,
            ),

          gender:
            profile.gender,

          phone:
            profile.phone,

          email:
            user.email,

          address:
            profile.address,

          currentCity:
            profile.currentCity,

          state:
            profile.state,

          district:
            profile.district,

          religion:
            profile.religion,

          community:
            profile.community,

          caste:
            profile.caste,

          subCaste:
            profile.subCaste,

          ethnicBackground:
            profile.ethnicBackground,

          motherTongue:
            profile.motherTongue,

          languages:
            profile.languages,

          nativePlace:
            profile.nativePlace,

          culturalInterests:
            profile.culturalInterests,

          education:
            profile.education,

          qualifications:
            profile.qualifications,

          college:
            profile.college,

          profession:
            profile.profession,

          jobTitle:
            profile.jobTitle,

          company:
            profile.company,

          workLocation:
            profile.workLocation,

          employmentDetails:
            profile.employmentDetails,

          incomeRange:
            profile.incomeRange,

          visaWorkStatus:
            profile.visaWorkStatus,

          height:
            profile.height,

          bodyType:
            profile.bodyType,

          appearance:
            profile.appearance,

          lifestyleInformation:
            profile.lifestyleInformation,

          smoking:
            profile.smoking,

          drinking:
            profile.drinking,

          foodPreferences:
            profile.foodPreferences,

          healthInformation:
            profile.healthInformation,

          fatherOccupation:
            profile.fatherOccupation,

          fatherStatus:
            profile.fatherStatus,

          motherOccupation:
            profile.motherOccupation,

          motherStatus:
            profile.motherStatus,

          siblingsCount:
            profile.siblingsCount,

          brothersCount:
            profile.brothersCount,

          sistersCount:
            profile.sistersCount,

          marriedSiblingsCount:
            profile.marriedSiblingsCount,

          unmarriedSiblingsCount:
            profile.unmarriedSiblingsCount,

          familyType:
            profile.familyType,

          familyValues:
            profile.familyValues,

          familyInformation:
            profile.familyInformation,

          maritalStatus:
            profile.maritalStatus,

          about:
            profile.about,

          hobbies:
            profile.hobbies,
        },

        preferences:
          preferences
            ? {
                preferredAgeMin:
                  preferences.preferredAgeMin,

                preferredAgeMax:
                  preferences.preferredAgeMax,

                preferredHeightMin:
                  preferences.preferredHeightMin,

                preferredHeightMax:
                  preferences.preferredHeightMax,

                preferredLocation:
                  preferences.preferredLocation,

                preferredDistrict:
                  preferences.preferredDistrict,

                preferredReligion:
                  preferences.preferredReligion,

                preferredCaste:
                  preferences.preferredCaste,

                preferredCommunity:
                  preferences.preferredCommunity,

                preferredEducation:
                  preferences.preferredEducation,

                preferredProfession:
                  preferences.preferredProfession,

                preferredIncomeRange:
                  preferences.preferredIncomeRange,

                preferredMaritalStatus:
                  preferences.preferredMaritalStatus,

                preferredFamilyValues:
                  preferences.preferredFamilyValues,

                otherPreferences:
                  preferences.otherPreferences,
              }
            : null,

        photoCount:
          photos.length,

        hasPrimaryPhoto:
          photos.some(
            (photo) =>
              photo.isPrimary,
          ),
      });
    } catch (error) {
      console.error(
        "PROFILE SETUP GET ERROR:",
        error,
      );

      res.status(500).json({
        error:
          "Could not load your profile setup.",
      });
    }
  },
);

router.put(
  "/profile/setup",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    try {
      const step =
        Number(req.body?.step);

      if (
        !Number.isInteger(step) ||
        step < 1 ||
        step > 5
      ) {
        res.status(400).json({
          error:
            "Invalid profile setup step.",
        });

        return;
      }

      const data =
        req.body?.data &&
        typeof req.body.data ===
          "object"
          ? req.body.data
          : {};

      const existing =
        await profileForUser(
          user.id,
        );

      /* -------------------------------------------------------------------- */
      /* STEP 1 — BASIC & CONTACT                                             */
      /* -------------------------------------------------------------------- */

      if (step === 1) {
        const fullName =
          typeof data.fullName ===
          "string"
            ? data.fullName.trim()
            : "";

        const gender =
          typeof data.gender ===
          "string"
            ? data.gender.trim()
            : "";

        const dateOfBirth =
          typeof data.dateOfBirth ===
          "string"
            ? data.dateOfBirth
            : "";

        if (
          !fullName ||
          !gender ||
          !dateOfBirth
        ) {
          res.status(400).json({
            error:
              "Full name, gender and date of birth are required.",
          });

          return;
        }

        if (
          !isAdult(
            dateOfBirth,
          )
        ) {
          res.status(400).json({
            error:
              "Bharat Milan is for adults aged 18 and above.",
          });

          return;
        }

        const values = {
          fullName,

          dateOfBirth,

          gender,

          phone:
            typeof data.phone ===
            "string"
              ? data.phone.trim() ||
                null
              : null,

          address:
            typeof data.address ===
            "string"
              ? data.address.trim() ||
                null
              : null,

          currentCity:
            typeof data.currentCity ===
            "string"
              ? data.currentCity.trim() ||
                null
              : null,

          state:
            typeof data.state ===
            "string"
              ? data.state.trim() ||
                null
              : null,

          district:
            typeof data.district ===
            "string"
              ? data.district.trim() ||
                null
              : null,

          profileSetupStep: 2,

          profileSetupCompleted:
            false,

          profileCompletion:
            calculateCompletion({
              fullName,
              dateOfBirth,
              gender,
              currentCity:
                typeof data.currentCity ===
                "string"
                  ? data.currentCity
                  : null,
            }),

          updatedAt:
            new Date(),
        };

        const saved =
          existing
            ? (
                await db
                  .update(
                    profilesTable,
                  )
                  .set(values)
                  .where(
                    eq(
                      profilesTable.id,
                      existing.id,
                    ),
                  )
                  .returning()
              )[0]
            : (
                await db
                  .insert(
                    profilesTable,
                  )
                  .values({
                    ...values,
                    userId:
                      user.id,
                  })
                  .returning()
              )[0];

        if (!saved) {
          res.status(500).json({
            error:
              "Could not save your basic information.",
          });

          return;
        }

        res.json({
          success: true,
          step: 1,
          nextStep: 2,
          profileSetupCompleted:
            false,
        });

        return;
      }

      /* -------------------------------------------------------------------- */
      /* STEPS 2–5 REQUIRE STEP 1                                             */
      /* -------------------------------------------------------------------- */

      if (!existing) {
        res.status(400).json({
          error:
            "Please complete the first profile step before continuing.",
        });

        return;
      }

      /* -------------------------------------------------------------------- */
      /* STEP 2 — CULTURAL & BACKGROUND                                       */
      /* -------------------------------------------------------------------- */

      if (step === 2) {
        await db
          .update(
            profilesTable,
          )
          .set({
            religion:
              typeof data.religion ===
              "string"
                ? data.religion.trim() ||
                  null
                : null,

            community:
              typeof data.community ===
              "string"
                ? data.community.trim() ||
                  null
                : null,

            caste:
              typeof data.caste ===
              "string"
                ? data.caste.trim() ||
                  null
                : null,

            subCaste:
              typeof data.subCaste ===
              "string"
                ? data.subCaste.trim() ||
                  null
                : null,

            ethnicBackground:
              typeof data.ethnicBackground ===
              "string"
                ? data.ethnicBackground.trim() ||
                  null
                : null,

            motherTongue:
              typeof data.motherTongue ===
              "string"
                ? data.motherTongue.trim() ||
                  null
                : null,

            languages:
              typeof data.languages ===
              "string"
                ? data.languages.trim() ||
                  null
                : null,

            nativePlace:
              typeof data.nativePlace ===
              "string"
                ? data.nativePlace.trim() ||
                  null
                : null,

            culturalInterests:
              typeof data.culturalInterests ===
              "string"
                ? data.culturalInterests.trim() ||
                  null
                : null,

            profileSetupStep: 3,

            updatedAt:
              new Date(),
          })
          .where(
            eq(
              profilesTable.id,
              existing.id,
            ),
          );

        res.json({
          success: true,
          step: 2,
          nextStep: 3,
          profileSetupCompleted:
            false,
        });

        return;
      }

      /* -------------------------------------------------------------------- */
      /* STEP 3 — EDUCATION & CAREER                                          */
      /* -------------------------------------------------------------------- */

      if (step === 3) {
        await db
          .update(
            profilesTable,
          )
          .set({
            education:
              typeof data.education ===
              "string"
                ? data.education.trim() ||
                  null
                : null,

            qualifications:
              typeof data.qualifications ===
              "string"
                ? data.qualifications.trim() ||
                  null
                : null,

            college:
              typeof data.college ===
              "string"
                ? data.college.trim() ||
                  null
                : null,

            profession:
              typeof data.profession ===
              "string"
                ? data.profession.trim() ||
                  null
                : null,

            jobTitle:
              typeof data.jobTitle ===
              "string"
                ? data.jobTitle.trim() ||
                  null
                : null,

            company:
              typeof data.company ===
              "string"
                ? data.company.trim() ||
                  null
                : null,

            workLocation:
              typeof data.workLocation ===
              "string"
                ? data.workLocation.trim() ||
                  null
                : null,

            employmentDetails:
              typeof data.employmentDetails ===
              "string"
                ? data.employmentDetails.trim() ||
                  null
                : null,

            incomeRange:
              typeof data.incomeRange ===
              "string"
                ? data.incomeRange.trim() ||
                  null
                : null,

            visaWorkStatus:
              typeof data.visaWorkStatus ===
              "string"
                ? data.visaWorkStatus.trim() ||
                  null
                : null,

            profileSetupStep: 4,

            updatedAt:
              new Date(),
          })
          .where(
            eq(
              profilesTable.id,
              existing.id,
            ),
          );

        res.json({
          success: true,
          step: 3,
          nextStep: 4,
          profileSetupCompleted:
            false,
        });

        return;
      }

      /* -------------------------------------------------------------------- */
      /* STEP 4 — PHYSICAL & LIFESTYLE                                       */
      /* -------------------------------------------------------------------- */

      if (step === 4) {
        const height =
          data.height === null ||
          data.height === undefined ||
          data.height === ""
            ? null
            : Number(
                data.height,
              );

        if (
          height !== null &&
          (
            !Number.isFinite(
              height,
            ) ||
            height < 50 ||
            height > 250
          )
        ) {
          res.status(400).json({
            error:
              "Please enter a valid height.",
          });

          return;
        }

        await db
          .update(
            profilesTable,
          )
          .set({
            height,

            bodyType:
              typeof data.bodyType ===
              "string"
                ? data.bodyType.trim() ||
                  null
                : null,

            appearance:
              typeof data.appearance ===
              "string"
                ? data.appearance.trim() ||
                  null
                : null,

            lifestyleInformation:
              typeof data.lifestyleInformation ===
              "string"
                ? data.lifestyleInformation.trim() ||
                  null
                : null,

            smoking:
              typeof data.smoking ===
              "string"
                ? data.smoking.trim() ||
                  null
                : null,

            drinking:
              typeof data.drinking ===
              "string"
                ? data.drinking.trim() ||
                  null
                : null,

            foodPreferences:
              typeof data.foodPreferences ===
              "string"
                ? data.foodPreferences.trim() ||
                  null
                : null,

            healthInformation:
              typeof data.healthInformation ===
              "string"
                ? data.healthInformation.trim() ||
                  null
                : null,

            fatherOccupation:
              typeof data.fatherOccupation ===
              "string"
                ? data.fatherOccupation.trim() ||
                  null
                : null,

            fatherStatus:
              typeof data.fatherStatus ===
              "string"
                ? data.fatherStatus.trim() ||
                  null
                : null,

            motherOccupation:
              typeof data.motherOccupation ===
              "string"
                ? data.motherOccupation.trim() ||
                  null
                : null,

            motherStatus:
              typeof data.motherStatus ===
              "string"
                ? data.motherStatus.trim() ||
                  null
                : null,

            siblingsCount:
              data.siblingsCount === null ||
              data.siblingsCount === undefined ||
              data.siblingsCount === ""
                ? null
                : Number(
                    data.siblingsCount,
                  ),

            brothersCount:
              data.brothersCount === null ||
              data.brothersCount === undefined ||
              data.brothersCount === ""
                ? null
                : Number(
                    data.brothersCount,
                  ),

            sistersCount:
              data.sistersCount === null ||
              data.sistersCount === undefined ||
              data.sistersCount === ""
                ? null
                : Number(
                    data.sistersCount,
                  ),

            marriedSiblingsCount:
              data.marriedSiblingsCount === null ||
              data.marriedSiblingsCount === undefined ||
              data.marriedSiblingsCount === ""
                ? null
                : Number(
                    data.marriedSiblingsCount,
                  ),

            unmarriedSiblingsCount:
              data.unmarriedSiblingsCount === null ||
              data.unmarriedSiblingsCount === undefined ||
              data.unmarriedSiblingsCount === ""
                ? null
                : Number(
                    data.unmarriedSiblingsCount,
                  ),

            familyType:
              typeof data.familyType ===
              "string"
                ? data.familyType.trim() ||
                  null
                : null,

            familyValues:
              typeof data.familyValues ===
              "string"
                ? data.familyValues.trim() ||
                  null
                : null,

            familyInformation:
              typeof data.familyInformation ===
              "string"
                ? data.familyInformation.trim() ||
                  null
                : null,

            profileSetupStep: 5,

            updatedAt:
              new Date(),
          })
          .where(
            eq(
              profilesTable.id,
              existing.id,
            ),
          );

        res.json({
          success: true,
          step: 4,
          nextStep: 5,
          profileSetupCompleted:
            false,
        });

        return;
      }

      /* -------------------------------------------------------------------- */
      /* STEP 5 — PARTNER PREFERENCES                                         */
      /* -------------------------------------------------------------------- */

      if (step === 5) {
        const preferenceValues = {
          profileId:
            existing.id,

          preferredAgeMin:
            data.preferredAgeMin === null ||
            data.preferredAgeMin === undefined ||
            data.preferredAgeMin === ""
              ? null
              : Number(
                  data.preferredAgeMin,
                ),

          preferredAgeMax:
            data.preferredAgeMax === null ||
            data.preferredAgeMax === undefined ||
            data.preferredAgeMax === ""
              ? null
              : Number(
                  data.preferredAgeMax,
                ),

          preferredHeightMin:
            data.preferredHeightMin === null ||
            data.preferredHeightMin === undefined ||
            data.preferredHeightMin === ""
              ? null
              : Number(
                  data.preferredHeightMin,
                ),

          preferredHeightMax:
            data.preferredHeightMax === null ||
            data.preferredHeightMax === undefined ||
            data.preferredHeightMax === ""
              ? null
              : Number(
                  data.preferredHeightMax,
                ),

          preferredLocation:
            typeof data.preferredLocation ===
            "string"
              ? data.preferredLocation.trim() ||
                null
              : null,

          preferredDistrict:
            typeof data.preferredDistrict ===
            "string"
              ? data.preferredDistrict.trim() ||
                null
              : null,

          preferredReligion:
            typeof data.preferredReligion ===
            "string"
              ? data.preferredReligion.trim() ||
                null
              : null,

          preferredCaste:
            typeof data.preferredCaste ===
            "string"
              ? data.preferredCaste.trim() ||
                null
              : null,

          preferredCommunity:
            typeof data.preferredCommunity ===
            "string"
              ? data.preferredCommunity.trim() ||
                null
              : null,

          preferredEducation:
            typeof data.preferredEducation ===
            "string"
              ? data.preferredEducation.trim() ||
                null
              : null,

          preferredProfession:
            typeof data.preferredProfession ===
            "string"
              ? data.preferredProfession.trim() ||
                null
              : null,

          preferredIncomeRange:
            typeof data.preferredIncomeRange ===
            "string"
              ? data.preferredIncomeRange.trim() ||
                null
              : null,

          preferredMaritalStatus:
            typeof data.preferredMaritalStatus ===
            "string"
              ? data.preferredMaritalStatus.trim() ||
                null
              : null,

          preferredFamilyValues:
            typeof data.preferredFamilyValues ===
            "string"
              ? data.preferredFamilyValues.trim() ||
                null
              : null,

          otherPreferences:
            typeof data.otherPreferences ===
            "string"
              ? data.otherPreferences.trim() ||
                null
              : null,
        };

        const [
          existingPreferences,
        ] = await db
          .select()
          .from(
            partnerPreferencesTable,
          )
          .where(
            eq(
              partnerPreferencesTable.profileId,
              existing.id,
            ),
          )
          .limit(1);

        if (
          existingPreferences
        ) {
          await db
            .update(
              partnerPreferencesTable,
            )
            .set(
              preferenceValues,
            )
            .where(
              eq(
                partnerPreferencesTable.id,
                existingPreferences.id,
              ),
            );
        } else {
          await db
            .insert(
              partnerPreferencesTable,
            )
            .values(
              preferenceValues,
            );
        }

        await db
          .update(
            profilesTable,
          )
          .set({
            profileSetupStep: 5,
            updatedAt:
              new Date(),
          })
          .where(
            eq(
              profilesTable.id,
              existing.id,
            ),
          );

        res.json({
          success: true,
          step: 5,
          nextStep: 6,
          profileSetupCompleted:
            false,
        });

        return;
      }
    } catch (error) {
      console.error(
        "PROFILE SETUP SAVE ERROR:",
        error,
      );

      res.status(500).json({
        error:
          "Could not save your profile information.",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Final Onboarding Completion                                                */
/* -------------------------------------------------------------------------- */

router.post(
  "/profile/setup/complete",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    try {
      const profile =
        await profileForUser(
          user.id,
        );

      if (!profile) {
        res.status(400).json({
          error:
            "Please complete your profile information first.",
        });

        return;
      }

      if (
        profile.profileSetupStep <
        5
      ) {
        res.status(400).json({
          error:
            "Please complete all five profile steps first.",

          currentStep:
            profile.profileSetupStep,
        });

        return;
      }

      const photos =
        await photosFor(
          profile.id,
        );

      if (
        photos.length === 0
      ) {
        res.status(400).json({
          error:
            "Please add a profile photo before completing your profile.",
        });

        return;
      }

      const hasPrimaryPhoto =
        photos.some(
          (photo) =>
            photo.isPrimary,
        );

      if (!hasPrimaryPhoto) {
        res.status(400).json({
          error:
            "Please choose a primary profile photo.",
        });

        return;
      }

      const profileCompletion =
        calculateCompletion(
          profile,
        );

      const [
        updated,
      ] = await db
        .update(
          profilesTable,
        )
        .set({
          profileSetupCompleted:
            true,

          profileSetupStep:
            5,

          profileCompletion:
            Math.max(
              profileCompletion,
              100,
            ),

          updatedAt:
            new Date(),
        })
        .where(
          eq(
            profilesTable.id,
            profile.id,
          ),
        )
        .returning();

      if (!updated) {
        res.status(500).json({
          error:
            "Could not complete your profile.",
        });

        return;
      }

      res.json({
        success: true,

        profileSetupCompleted:
          true,

        profileCompletion:
          updated.profileCompletion,

        message:
          "Your profile is complete.",
      });
    } catch (error) {
      console.error(
        "PROFILE SETUP COMPLETE ERROR:",
        error,
      );

      res.status(500).json({
        error:
          "Could not complete your profile.",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

router.get(
  "/dashboard",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const profile =
      await profileForUser(
        user.id,
      );

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

    const [
      sent,
      received,
      accepted,
      recent,
    ] = await Promise.all([
      db
        .select({
          total:
            count(),
        })
        .from(
          interestsTable,
        )
        .where(
          eq(
            interestsTable.senderProfileId,
            profile.id,
          ),
        ),

      db
        .select({
          total:
            count(),
        })
        .from(
          interestsTable,
        )
        .where(
          eq(
            interestsTable.receiverProfileId,
            profile.id,
          ),
        ),

      db
        .select({
          total:
            count(),
        })
        .from(
          interestsTable,
        )
        .where(
          and(
            eq(
              interestsTable.receiverProfileId,
              profile.id,
            ),

            eq(
              interestsTable.status,
              "accepted",
            ),
          ),
        ),

      db
        .select()
        .from(
          profilesTable,
        )
        .where(
          and(
            eq(
              profilesTable.visibility,
              "public",
            ),

            ne(
              profilesTable.userId,
              user.id,
            ),
          ),
        )
        .orderBy(
          desc(
            profilesTable.createdAt,
          ),
        )
        .limit(3),
    ]);

    res.json({
      profile:
        await myProfile(
          profile,
          user,
        ),

      sentInterests:
        sent[0]?.total ?? 0,

      receivedInterests:
        received[0]?.total ?? 0,

      acceptedInterests:
        accepted[0]?.total ?? 0,

      recentProfiles:
        await Promise.all(
          recent.map(
            publicProfile,
          ),
        ),
    });
  },
);

/* -------------------------------------------------------------------------- */
/* My Profile                                                                 */
/* -------------------------------------------------------------------------- */

router.get(
  "/profile/me",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const profile =
      await profileForUser(
        user.id,
      );

    if (!profile) {
      res.status(404).json({
        error:
          "Your profile is not complete yet.",
      });

      return;
    }

    res.json(
      await myProfile(
        profile,
        user,
      ),
    );
  },
);

router.put(
  "/profile/me",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const parsed =
      UpdateMyProfileBody.safeParse(
        req.body,
      );

    if (!parsed.success) {
      res.status(400).json({
        error:
          "Please check the highlighted profile fields.",
      });

      return;
    }

    const dateOfBirth =
      parsed.data.dateOfBirth
        .toISOString()
        .slice(0, 10);

    if (
      !isAdult(
        dateOfBirth,
      )
    ) {
      res.status(400).json({
        error:
          "Bharat Milan is for adults aged 18 and above.",
      });

      return;
    }

    const existing =
      await profileForUser(
        user.id,
      );

    const values = {
      fullName:
        parsed.data.fullName,

      dateOfBirth,

      gender:
        parsed.data.gender,

      height:
        parsed.data.height,

      maritalStatus:
        parsed.data.maritalStatus,

      religion:
        parsed.data.religion,

      community:
        parsed.data.community,

      motherTongue:
        parsed.data.motherTongue,

      state:
        parsed.data.state,

      district:
        parsed.data.district,

      currentCity:
        parsed.data.currentCity,

      nativePlace:
        parsed.data.nativePlace,

      about:
        parsed.data.about,

      education:
        parsed.data.education,

      college:
        parsed.data.college,

      profession:
        parsed.data.profession,

      jobTitle:
        parsed.data.jobTitle,

      company:
        parsed.data.company,

      workLocation:
        parsed.data.workLocation,

      incomeRange:
        parsed.data.incomeRange,

      familyInformation:
        parsed.data.familyInformation,

      lifestyleInformation:
        parsed.data.lifestyleInformation,

      hobbies:
        parsed.data.hobbies,

      languages:
        parsed.data.languages,

      foodPreferences:
        parsed.data.foodPreferences,

      culturalInterests:
        parsed.data.culturalInterests,

      familyValues:
        parsed.data.familyValues,

      visibility:
        parsed.data.visibility ??
        existing?.visibility ??
        "private",

      profileCompletion:
        calculateCompletion({
          ...parsed.data,
          dateOfBirth,
        }),

      updatedAt:
        new Date(),
    };

    const saved =
      existing
        ? (
            await db
              .update(
                profilesTable,
              )
              .set(values)
              .where(
                eq(
                  profilesTable.id,
                  existing.id,
                ),
              )
              .returning()
          )[0]
        : (
            await db
              .insert(
                profilesTable,
              )
              .values({
                ...values,
                userId:
                  user.id,
              })
              .returning()
          )[0];

    if (!saved) {
      res.status(500).json({
        error:
          "Something went wrong. Please try again.",
      });

      return;
    }

    const preferenceValues = {
      profileId:
        saved.id,

      preferredAgeMin:
        parsed.data.preferredAgeMin,

      preferredAgeMax:
        parsed.data.preferredAgeMax,

      preferredHeightMin:
        parsed.data.preferredHeightMin,

      preferredHeightMax:
        parsed.data.preferredHeightMax,

      preferredLocation:
        parsed.data.preferredLocation,

      preferredDistrict:
        parsed.data.preferredDistrict,

      preferredEducation:
        parsed.data.preferredEducation,

      preferredProfession:
        parsed.data.preferredProfession,

      preferredCommunity:
        parsed.data.preferredCommunity,

      preferredMaritalStatus:
        parsed.data.preferredMaritalStatus,

      preferredFamilyValues:
        parsed.data.preferredFamilyValues,

      otherPreferences:
        parsed.data.otherPreferences,
    };

    const existingPreferences =
      await db
        .select()
        .from(
          partnerPreferencesTable,
        )
        .where(
          eq(
            partnerPreferencesTable.profileId,
            saved.id,
          ),
        )
        .limit(1);

    if (
      existingPreferences[0]
    ) {
      await db
        .update(
          partnerPreferencesTable,
        )
        .set(
          preferenceValues,
        )
        .where(
          eq(
            partnerPreferencesTable.id,
            existingPreferences[0].id,
          ),
        );
    } else {
      await db
        .insert(
          partnerPreferencesTable,
        )
        .values(
          preferenceValues,
        );
    }

    res.json(
      await myProfile(
        saved,
        user,
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Profile Visibility                                                         */
/* -------------------------------------------------------------------------- */

router.put(
  "/profile/visibility",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const parsed =
      UpdateProfileVisibilityBody.safeParse(
        req.body,
      );

    if (!parsed.success) {
      res.status(400).json({
        error:
          "Choose whether your profile should be public or private.",
      });

      return;
    }

    const profile =
      await profileForUser(
        user.id,
      );

    if (!profile) {
      res.status(404).json({
        error:
          "Complete your profile before changing visibility.",
      });

      return;
    }

    const [
      updated,
    ] = await db
      .update(
        profilesTable,
      )
      .set({
        visibility:
          parsed.data.visibility,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          profilesTable.id,
          profile.id,
        ),
      )
      .returning({
        visibility:
          profilesTable.visibility,
      });

    res.json(updated);
  },
);

/* -------------------------------------------------------------------------- */
/* Profiles                                                                   */
/* -------------------------------------------------------------------------- */

router.get(
  "/profiles",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const parsed =
      ListProfilesQueryParams.safeParse(
        req.query,
      );

    if (!parsed.success) {
      res.status(400).json({
        error:
          "One or more search filters are invalid.",
      });

      return;
    }

    const filters = [
      eq(
        profilesTable.visibility,
        "public",
      ),

      ne(
        profilesTable.userId,
        user.id,
      ),

      parsed.data.gender
        ? eq(
            profilesTable.gender,
            parsed.data.gender,
          )
        : undefined,

      parsed.data.location
        ? or(
            ilike(
              profilesTable.currentCity,
              `%${parsed.data.location}%`,
            ),

            ilike(
              profilesTable.state,
              `%${parsed.data.location}%`,
            ),
          )
        : undefined,

      parsed.data.district
        ? ilike(
            profilesTable.district,
            `%${parsed.data.district}%`,
          )
        : undefined,

      parsed.data.education
        ? ilike(
            profilesTable.education,
            `%${parsed.data.education}%`,
          )
        : undefined,

      parsed.data.profession
        ? ilike(
            profilesTable.profession,
            `%${parsed.data.profession}%`,
          )
        : undefined,

      parsed.data.community
        ? ilike(
            profilesTable.community,
            `%${parsed.data.community}%`,
          )
        : undefined,

      parsed.data.maritalStatus
        ? eq(
            profilesTable.maritalStatus,
            parsed.data.maritalStatus,
          )
        : undefined,

      parsed.data.heightMin
        ? gte(
            profilesTable.height,
            parsed.data.heightMin,
          )
        : undefined,

      parsed.data.heightMax
        ? lte(
            profilesTable.height,
            parsed.data.heightMax,
          )
        : undefined,

      parsed.data.ageMin
        ? lte(
            profilesTable.dateOfBirth,
            dateForAge(
              parsed.data.ageMin,
            ),
          )
        : undefined,

      parsed.data.ageMax
        ? gte(
            profilesTable.dateOfBirth,
            dateForAge(
              parsed.data.ageMax + 1,
            ),
          )
        : undefined,
    ].filter(Boolean);

    const page =
      parsed.data.page ?? 1;

    const pageSize =
      parsed.data.pageSize ?? 12;

    const where =
      and(...filters);

    const [
      profiles,
      totals,
    ] = await Promise.all([
      db
        .select()
        .from(
          profilesTable,
        )
        .where(where)
        .orderBy(
          desc(
            profilesTable.createdAt,
          ),
        )
        .limit(
          pageSize,
        )
        .offset(
          (page - 1) *
          pageSize,
        ),

      db
        .select({
          total:
            count(),
        })
        .from(
          profilesTable,
        )
        .where(where),
    ]);

    const total =
      totals[0]?.total ?? 0;

    res.json({
      items:
        await Promise.all(
          profiles.map(
            publicProfile,
          ),
        ),

      page,

      pageSize,

      total,

      totalPages:
        Math.ceil(
          total /
          pageSize,
        ),
    });
  },
);

router.get(
  "/profiles/:id",
  async (req, res) => {
    const parsed =
      GetProfileParams.safeParse(
        req.params,
      );

    if (!parsed.success) {
      res.status(404).json({
        error:
          "Profile not found.",
      });

      return;
    }

    const [
      profile,
    ] = await db
      .select()
      .from(
        profilesTable,
      )
      .where(
        and(
          eq(
            profilesTable.id,
            parsed.data.id,
          ),

          eq(
            profilesTable.visibility,
            "public",
          ),
        ),
      )
      .limit(1);

    if (!profile) {
      res.status(404).json({
        error:
          "Profile not found.",
      });

      return;
    }

    res.json(
      await publicProfile(
        profile,
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Interests                                                                  */
/* -------------------------------------------------------------------------- */

async function interestView(
  interest:
    typeof interestsTable.$inferSelect,
  profilesById:
    Map<string, Profile>,
) {
  return {
    id:
      interest.id,

    senderProfileId:
      interest.senderProfileId,

    receiverProfileId:
      interest.receiverProfileId,

    senderName:
      profilesById.get(
        interest.senderProfileId,
      )?.fullName ??
      "Member",

    receiverName:
      profilesById.get(
        interest.receiverProfileId,
      )?.fullName ??
      "Member",

    status:
      interest.status,

    createdAt:
      interest.createdAt.toISOString(),
  };
}

router.post(
  "/profiles/:id/interest",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const parsed =
      ExpressInterestParams.safeParse(
        req.params,
      );

    if (!parsed.success) {
      res.status(400).json({
        error:
          "Profile not found.",
      });

      return;
    }

    const sender =
      await profileForUser(
        user.id,
      );

    const [
      receiver,
    ] = await db
      .select()
      .from(
        profilesTable,
      )
      .where(
        and(
          eq(
            profilesTable.id,
            parsed.data.id,
          ),

          eq(
            profilesTable.visibility,
            "public",
          ),
        ),
      )
      .limit(1);

    if (
      !sender ||
      !receiver ||
      sender.id === receiver.id
    ) {
      res.status(400).json({
        error:
          "You can only express interest in another public profile.",
      });

      return;
    }

    const duplicate =
      await db
        .select()
        .from(
          interestsTable,
        )
        .where(
          and(
            eq(
              interestsTable.senderProfileId,
              sender.id,
            ),

            eq(
              interestsTable.receiverProfileId,
              receiver.id,
            ),
          ),
        )
        .limit(1);

    if (duplicate[0]) {
      res.status(409).json({
        error:
          "You have already expressed interest in this profile.",
      });

      return;
    }

    const [
      created,
    ] = await db
      .insert(
        interestsTable,
      )
      .values({
        senderProfileId:
          sender.id,

        receiverProfileId:
          receiver.id,
      })
      .returning();

    const names =
      new Map([
        [
          sender.id,
          sender,
        ],
        [
          receiver.id,
          receiver,
        ],
      ]);

    res
      .status(201)
      .json(
        await interestView(
          created,
          names,
        ),
      );
  },
);

router.get(
  "/interests",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const profile =
      await profileForUser(
        user.id,
      );

    if (!profile) {
      res.json({
        sent: [],
        received: [],
      });

      return;
    }

    const [
      sent,
      received,
    ] = await Promise.all([
      db
        .select()
        .from(
          interestsTable,
        )
        .where(
          eq(
            interestsTable.senderProfileId,
            profile.id,
          ),
        )
        .orderBy(
          desc(
            interestsTable.createdAt,
          ),
        ),

      db
        .select()
        .from(
          interestsTable,
        )
        .where(
          eq(
            interestsTable.receiverProfileId,
            profile.id,
          ),
        )
        .orderBy(
          desc(
            interestsTable.createdAt,
          ),
        ),
    ]);

    const ids = [
      ...new Set(
        [
          ...sent,
          ...received,
        ].flatMap(
          (item) => [
            item.senderProfileId,
            item.receiverProfileId,
          ],
        ),
      ),
    ];

    const namedProfiles =
      ids.length
        ? await db
            .select()
            .from(
              profilesTable,
            )
            .where(
              or(
                ...ids.map(
                  (id) =>
                    eq(
                      profilesTable.id,
                      id,
                    ),
                ),
              ),
            )
        : [];

    const profilesById =
      new Map(
        namedProfiles.map(
          (item) => [
            item.id,
            item,
          ],
        ),
      );

    res.json({
      sent:
        await Promise.all(
          sent.map(
            (item) =>
              interestView(
                item,
                profilesById,
              ),
          ),
        ),

      received:
        await Promise.all(
          received.map(
            (item) =>
              interestView(
                item,
                profilesById,
              ),
          ),
        ),
    });
  },
);

router.put(
  "/interests/:id",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const params =
      UpdateInterestParams.safeParse(
        req.params,
      );

    const body =
      UpdateInterestBody.safeParse(
        req.body,
      );

    if (
      !params.success ||
      !body.success
    ) {
      res.status(400).json({
        error:
          "Choose accepted or declined.",
      });

      return;
    }

    const profile =
      await profileForUser(
        user.id,
      );

    if (!profile) {
      res.status(404).json({
        error:
          "Complete your profile first.",
      });

      return;
    }

    const [
      interest,
    ] = await db
      .select()
      .from(
        interestsTable,
      )
      .where(
        and(
          eq(
            interestsTable.id,
            params.data.id,
          ),

          eq(
            interestsTable.receiverProfileId,
            profile.id,
          ),
        ),
      )
      .limit(1);

    if (!interest) {
      res.status(403).json({
        error:
          "You cannot update this interest.",
      });

      return;
    }

    const [
      updated,
    ] = await db
      .update(
        interestsTable,
      )
      .set({
        status:
          body.data.status,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          interestsTable.id,
          interest.id,
        ),
      )
      .returning();

    const profileRows =
      await db
        .select()
        .from(
          profilesTable,
        )
        .where(
          or(
            eq(
              profilesTable.id,
              updated.senderProfileId,
            ),

            eq(
              profilesTable.id,
              updated.receiverProfileId,
            ),
          ),
        );

    res.json(
      await interestView(
        updated,
        new Map(
          profileRows.map(
            (item) => [
              item.id,
              item,
            ],
          ),
        ),
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Photos                                                                     */
/* -------------------------------------------------------------------------- */

router.post(
  "/photos/complete",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const parsed =
      CompletePhotoUploadBody.safeParse(
        req.body,
      );

    if (!parsed.success) {
      console.log(
        "PHOTO COMPLETE VALIDATION ERROR:",
        JSON.stringify(
          parsed.error.flatten(),
          null,
          2,
        ),
      );

      res.status(400).json({
        error:
          "Invalid photo upload data.",

        details:
          parsed.error.flatten(),
      });

      return;
    }

    if (
      !parsed.data.objectPath.startsWith(
        "/objects/",
      )
    ) {
      res.status(400).json({
        error:
          "The uploaded photo could not be saved.",
      });

      return;
    }

    const profile =
      await profileForUser(
        user.id,
      );

    console.log(
      "PHOTO PROFILE LOOKUP:",
      {
        userId:
          user.id,

        profileId:
          profile?.id ??
          null,
      },
    );

    if (!profile) {
      res.status(400).json({
        error:
          "Complete your profile before adding photos.",
      });

      return;
    }

    if (
      parsed.data.isPrimary
    ) {
      await db
        .update(
          photosTable,
        )
        .set({
          isPrimary:
            false,

          updatedAt:
            new Date(),
        })
        .where(
          eq(
            photosTable.profileId,
            profile.id,
          ),
        );
    }

    const existingPhotos =
      await photosFor(
        profile.id,
      );

    const [
      photo,
    ] = await db
      .insert(
        photosTable,
      )
      .values({
        profileId:
          profile.id,

        objectPath:
          parsed.data.objectPath,

        fileType:
          parsed.data.fileType,

        isPrimary:
          parsed.data.isPrimary ??
          existingPhotos.length ===
            0,

        sortOrder:
          existingPhotos.length,
      })
      .returning();

    res
      .status(201)
      .json({
        id:
          photo.id,

        url:
          photoUrl(
            photo.objectPath,
          ),

        isPrimary:
          photo.isPrimary,

        sortOrder:
          photo.sortOrder,
      });
  },
);

router.put(
  "/photos/:id",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const photoId =
      req.params.id;

    if (
      !photoId ||
      Array.isArray(photoId)
    ) {
      res.status(400).json({
        error:
          "Invalid photo ID.",
      });

      return;
    }

    try {
      const profile =
        await profileForUser(
          user.id,
        );

      if (!profile) {
        res.status(404).json({
          error:
            "Your profile was not found.",
        });

        return;
      }

      const [
        photo,
      ] = await db
        .select()
        .from(
          photosTable,
        )
        .where(
          and(
            eq(
              photosTable.id,
              photoId,
            ),

            eq(
              photosTable.profileId,
              profile.id,
            ),
          ),
        )
        .limit(1);

      if (!photo) {
        res.status(404).json({
          error:
            "Photo not found.",
        });

        return;
      }

      if (
        req.body?.isPrimary !==
        true
      ) {
        res.status(400).json({
          error:
            "The photo must be set as primary.",
        });

        return;
      }

      await db
        .update(
          photosTable,
        )
        .set({
          isPrimary:
            false,

          updatedAt:
            new Date(),
        })
        .where(
          eq(
            photosTable.profileId,
            profile.id,
          ),
        );

      const [
        updatedPhoto,
      ] = await db
        .update(
          photosTable,
        )
        .set({
          isPrimary:
            true,

          updatedAt:
            new Date(),
        })
        .where(
          eq(
            photosTable.id,
            photo.id,
          ),
        )
        .returning();

      if (!updatedPhoto) {
        res.status(500).json({
          error:
            "Could not update the primary photo.",
        });

        return;
      }

      res.json({
        id:
          updatedPhoto.id,

        url:
          photoUrl(
            updatedPhoto.objectPath,
          ),

        isPrimary:
          updatedPhoto.isPrimary,

        sortOrder:
          updatedPhoto.sortOrder,
      });
    } catch (error) {
      console.error(
        "PHOTO PRIMARY UPDATE ERROR:",
        error,
      );

      res.status(500).json({
        error:
          "Failed to update the primary photo.",
      });
    }
  },
);

router.delete(
  "/photos/:id",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const photoId =
      req.params.id;

    if (
      !photoId ||
      Array.isArray(photoId)
    ) {
      res.status(400).json({
        error:
          "Invalid photo ID.",
      });

      return;
    }

    try {
      const profile =
        await profileForUser(
          user.id,
        );

      if (!profile) {
        res.status(404).json({
          error:
            "Your profile was not found.",
        });

        return;
      }

      const [
        photo,
      ] = await db
        .select()
        .from(
          photosTable,
        )
        .where(
          and(
            eq(
              photosTable.id,
              photoId,
            ),

            eq(
              photosTable.profileId,
              profile.id,
            ),
          ),
        )
        .limit(1);

      if (!photo) {
        res.status(404).json({
          error:
            "Photo not found.",
        });

        return;
      }

      await db
        .delete(
          photosTable,
        )
        .where(
          eq(
            photosTable.id,
            photo.id,
          ),
        );

      try {
        await objectStorageService.deleteObjectEntity(
          photo.objectPath,
        );
      } catch (
        storageError
      ) {
        console.error(
          "PHOTO STORAGE DELETE ERROR:",
          storageError,
        );
      }

      if (
        photo.isPrimary
      ) {
        const remainingPhotos =
          await photosFor(
            profile.id,
          );

        if (
          remainingPhotos.length >
          0
        ) {
          const nextPrimary =
            remainingPhotos[0];

          await db
            .update(
              photosTable,
            )
            .set({
              isPrimary:
                true,

              updatedAt:
                new Date(),
            })
            .where(
              eq(
                photosTable.id,
                nextPrimary.id,
              ),
            );
        }
      }

      res.status(200).json({
        success:
          true,
      });
    } catch (error) {
      console.error(
        "PHOTO DELETE ERROR:",
        error,
      );

      res.status(500).json({
        error:
          "Failed to delete photo.",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

router.post(
  "/reports",
  async (req, res) => {
    const user =
      await requireUser(
        req,
        res,
      );

    if (!user) return;

    const parsed =
      CreateReportBody.safeParse(
        req.body,
      );

    if (!parsed.success) {
      res.status(400).json({
        error:
          "Please choose a report reason.",
      });

      return;
    }

    const [
      profile,
    ] = await db
      .select()
      .from(
        profilesTable,
      )
      .where(
        eq(
          profilesTable.id,
          parsed.data.reportedProfileId,
        ),
      )
      .limit(1);

    if (!profile) {
      res.status(404).json({
        error:
          "Profile not found.",
      });

      return;
    }

    const [
      report,
    ] = await db
      .insert(
        reportsTable,
      )
      .values({
        reporterUserId:
          user.id,

        reportedProfileId:
          parsed.data.reportedProfileId,

        reason:
          parsed.data.reason,

        description:
          parsed.data.description,
      })
      .returning();

    res
      .status(201)
      .json({
        id:
          report.id,

        reportedProfileId:
          report.reportedProfileId,

        reason:
          report.reason,

        description:
          report.description,

        status:
          report.status,

        createdAt:
          report.createdAt.toISOString(),
      });
  },
);

/* -------------------------------------------------------------------------- */
/* Admin Stats                                                                */
/* -------------------------------------------------------------------------- */

router.get(
  "/admin/stats",
  async (req, res) => {
    const user =
      await requireAdmin(
        req,
        res,
      );

    if (!user) return;

    const [
      [users],
      [publicProfiles],
      [pendingReports],
      [interestsSent],
    ] = await Promise.all([
      db
        .select({
          total:
            count(),
        })
        .from(
          usersTable,
        ),

      db
        .select({
          total:
            count(),
        })
        .from(
          profilesTable,
        )
        .where(
          eq(
            profilesTable.visibility,
            "public",
          ),
        ),

      db
        .select({
          total:
            count(),
        })
        .from(
          reportsTable,
        )
        .where(
          eq(
            reportsTable.status,
            "open",
          ),
        ),

      db
        .select({
          total:
            count(),
        })
        .from(
          interestsTable,
        ),
    ]);

    res.json({
      totalUsers:
        users?.total ?? 0,

      publicProfiles:
        publicProfiles?.total ?? 0,

      pendingReports:
        pendingReports?.total ?? 0,

      interestsSent:
        interestsSent?.total ?? 0,
    });
  },
);

/* -------------------------------------------------------------------------- */
/* Admin Reports                                                              */
/* -------------------------------------------------------------------------- */

router.get(
  "/admin/reports",
  async (req, res) => {
    const user =
      await requireAdmin(
        req,
        res,
      );

    if (!user) return;

    const parsed =
      ListAdminReportsQueryParams.safeParse(
        req.query,
      );

    if (!parsed.success) {
      res.status(400).json({
        error:
          "Invalid pagination.",
      });

      return;
    }

    const page =
      parsed.data.page ?? 1;

    const pageSize =
      parsed.data.pageSize ?? 12;

    const [
      reports,
      totals,
    ] = await Promise.all([
      db
        .select()
        .from(
          reportsTable,
        )
        .orderBy(
          desc(
            reportsTable.createdAt,
          ),
        )
        .limit(
          pageSize,
        )
        .offset(
          (page - 1) *
          pageSize,
        ),

      db
        .select({
          total:
            count(),
        })
        .from(
          reportsTable,
        ),
    ]);

    res.json({
      items:
        reports.map(
          (report) => ({
            id:
              report.id,

            reportedProfileId:
              report.reportedProfileId,

            reason:
              report.reason,

            description:
              report.description,

            status:
              report.status,

            createdAt:
              report.createdAt.toISOString(),
          }),
        ),

      page,

      pageSize,

      total:
        totals[0]?.total ??
        0,
    });
  },
);

/* -------------------------------------------------------------------------- */
/* Moderator: Update Report Status                                            */
/* -------------------------------------------------------------------------- */

router.patch(
  "/admin/reports/:id",
  async (req, res) => {
    const user =
      await requireAdmin(
        req,
        res,
      );

    if (!user) return;

    const reportId =
      req.params.id;

    const status =
      req.body?.status;

    if (
      status !== "open" &&
      status !== "reviewed" &&
      status !== "dismissed" &&
      status !== "actioned"
    ) {
      res.status(400).json({
        error:
          "Choose a valid report status.",
      });

      return;
    }

    const [
      existingReport,
    ] = await db
      .select()
      .from(
        reportsTable,
      )
      .where(
        eq(
          reportsTable.id,
          reportId,
        ),
      )
      .limit(1);

    if (!existingReport) {
      res.status(404).json({
        error:
          "Report not found.",
      });

      return;
    }

    const reviewedAt =
      status === "open"
        ? null
        : new Date();

    const [
      updatedReport,
    ] = await db
      .update(
        reportsTable,
      )
      .set({
        status,

        reviewedAt,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          reportsTable.id,
          reportId,
        ),
      )
      .returning();

    if (!updatedReport) {
      res.status(500).json({
        error:
          "Could not update the report.",
      });

      return;
    }

    res.json({
      id:
        updatedReport.id,

      reportedProfileId:
        updatedReport.reportedProfileId,

      reason:
        updatedReport.reason,

      description:
        updatedReport.description,

      status:
        updatedReport.status,

      createdAt:
        updatedReport.createdAt.toISOString(),
    });
  },
);

/* -------------------------------------------------------------------------- */
/* Moderator: Activate / Suspend User                                         */
/* -------------------------------------------------------------------------- */

router.patch(
  "/admin/users/:id/status",
  async (req, res) => {
    const user =
      await requireAdmin(
        req,
        res,
      );

    if (!user) return;

    const userId =
      req.params.id;

    const status =
      req.body?.status;

    if (
      status !== "active" &&
      status !== "suspended"
    ) {
      res.status(400).json({
        error:
          "Choose a valid account status.",
      });

      return;
    }

    const [
      targetUser,
    ] = await db
      .select()
      .from(
        usersTable,
      )
      .where(
        eq(
          usersTable.id,
          userId,
        ),
      )
      .limit(1);

    if (!targetUser) {
      res.status(404).json({
        error:
          "User not found.",
      });

      return;
    }

    const [
      updatedUser,
    ] = await db
      .update(
        usersTable,
      )
      .set({
        accountStatus:
          status,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          usersTable.id,
          userId,
        ),
      )
      .returning({
        id:
          usersTable.id,

        status:
          usersTable.accountStatus,
      });

    if (!updatedUser) {
      res.status(500).json({
        error:
          "Could not update the account status.",
      });

      return;
    }

    res.json(
      updatedUser,
    );
  },
);

export default router;