import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  useGetMyProfile,
  useUpdateMyProfile,
  type ProfileInput,
} from "@workspace/api-client-react";

const emptyForm: ProfileInput = {
  fullName: "",
  dateOfBirth: "2000-01-01",
  gender: "",
  height: undefined,
  maritalStatus: "",
  community: "",
  motherTongue: "",
  state: "Uttarakhand",
  district: "",
  currentCity: "",
  nativePlace: "",
  about: "",
  education: "",
  college: "",
  profession: "",
  jobTitle: "",
  company: "",
  workLocation: "",
  incomeRange: "",
  familyInformation: "",
  lifestyleInformation: "",
  hobbies: "",
  languages: "",
  foodPreferences: "",
  culturalInterests: "",
  familyValues: "",
  visibility: "private",

  preferredAgeMin: 24,
  preferredAgeMax: 35,
  preferredHeightMin: undefined,
  preferredHeightMax: undefined,
  preferredLocation: "",
  preferredDistrict: "",
  preferredEducation: "",
  preferredProfession: "",
  preferredCommunity: "",
  preferredMaritalStatus: "",
  preferredFamilyValues: "",
  otherPreferences: "",
};

export default function EditProfile() {
  const [, setLocation] = useLocation();

  const profile = useGetMyProfile();
  const updateProfile = useUpdateMyProfile();

  const [form, setForm] = useState<ProfileInput>(emptyForm);

  useEffect(() => {
  const p = profile.data;

  if (!p) return;

  setForm((current) => ({
    ...current,

    fullName: p.fullName ?? "",
    gender: p.gender ?? "",
    height: p.height ?? undefined,
    maritalStatus: p.maritalStatus ?? "",

    community: p.community ?? "",
    district: p.district ?? "",
    currentCity: p.city ?? "",
    nativePlace: p.nativePlace ?? "",

    about: p.about ?? "",
    education: p.education ?? "",
    profession: p.profession ?? "",
    hobbies: p.hobbies ?? "",
    languages: p.languages ?? "",
    familyValues: p.familyValues ?? "",

    visibility: p.visibility ?? "private",

    preferredAgeMin:
      p.preferences?.preferredAgeMin ?? current.preferredAgeMin,

    preferredAgeMax:
      p.preferences?.preferredAgeMax ?? current.preferredAgeMax,

    preferredHeightMin:
      p.preferences?.preferredHeightMin ??
      current.preferredHeightMin,

    preferredHeightMax:
      p.preferences?.preferredHeightMax ??
      current.preferredHeightMax,

    preferredLocation:
      p.preferences?.preferredLocation ??
      current.preferredLocation,

    preferredDistrict:
      p.preferences?.preferredDistrict ??
      current.preferredDistrict,

    preferredEducation:
      p.preferences?.preferredEducation ??
      current.preferredEducation,

    preferredProfession:
      p.preferences?.preferredProfession ??
      current.preferredProfession,

    preferredCommunity:
      p.preferences?.preferredCommunity ??
      current.preferredCommunity,

    preferredMaritalStatus:
      p.preferences?.preferredMaritalStatus ??
      current.preferredMaritalStatus,

    preferredFamilyValues:
      p.preferences?.preferredFamilyValues ??
      current.preferredFamilyValues,

    otherPreferences:
      p.preferences?.otherPreferences ??
      current.otherPreferences,
  }));
}, [profile.data]);

  function updateField<K extends keyof ProfileInput>(
    field: K,
    value: ProfileInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateProfile.mutate(
      {
        data: form,
      },
      {
        onSuccess: () => {
          setLocation("/my-profile");
        },
      },
    );
  }

  if (profile.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Profile not found
          </h1>

          <button
            type="button"
            onClick={() => setLocation("/profile-setup")}
            className="rounded-lg bg-primary px-5 py-2 text-primary-foreground"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Edit Profile
          </h1>

          <p className="mt-2 text-muted-foreground">
            Update your profile information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* BASIC INFORMATION */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Basic Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Full Name"
                value={form.fullName ?? ""}
                onChange={(value) =>
                  updateField("fullName", value)
                }
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={form.dateOfBirth ?? ""}
                  onChange={(e) =>
                    updateField(
                      "dateOfBirth",
                      e.target.value,
                    )
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <SelectField
                label="Gender"
                value={form.gender ?? ""}
                options={[
                  "Male",
                  "Female",
                  "Other",
                ]}
                onChange={(value) =>
                  updateField("gender", value)
                }
              />

              <Field
                label="Height"
                value={
                  form.height !== undefined
                    ? String(form.height)
                    : ""
                }
                onChange={(value) =>
                  updateField(
                    "height",
                    value === ""
                      ? undefined
                      : Number(value),
                  )
                }
                type="number"
                placeholder="Height in cm"
              />

              <SelectField
                label="Marital Status"
                value={form.maritalStatus ?? ""}
                options={[
                  "Never Married",
                  "Divorced",
                  "Widowed",
                  "Separated",
                ]}
                onChange={(value) =>
                  updateField(
                    "maritalStatus",
                    value,
                  )
                }
              />

              <Field
                label="Community"
                value={form.community ?? ""}
                onChange={(value) =>
                  updateField(
                    "community",
                    value,
                  )
                }
              />
            </div>
          </section>

          {/* LOCATION & CULTURE */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Location & Culture
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Mother Tongue"
                value={form.motherTongue ?? ""}
                onChange={(value) =>
                  updateField(
                    "motherTongue",
                    value,
                  )
                }
              />

              <Field
                label="State"
                value={form.state ?? ""}
                onChange={(value) =>
                  updateField("state", value)
                }
              />

              <Field
                label="District"
                value={form.district ?? ""}
                onChange={(value) =>
                  updateField(
                    "district",
                    value,
                  )
                }
              />

              <Field
                label="Current City"
                value={form.currentCity ?? ""}
                onChange={(value) =>
                  updateField(
                    "currentCity",
                    value,
                  )
                }
              />

              <Field
                label="Native Place"
                value={form.nativePlace ?? ""}
                onChange={(value) =>
                  updateField(
                    "nativePlace",
                    value,
                  )
                }
              />

              <Field
                label="Languages"
                value={form.languages ?? ""}
                onChange={(value) =>
                  updateField(
                    "languages",
                    value,
                  )
                }
              />
            </div>
          </section>

          {/* EDUCATION & CAREER */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Education & Career
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Education"
                value={form.education ?? ""}
                onChange={(value) =>
                  updateField(
                    "education",
                    value,
                  )
                }
              />

              <Field
                label="College"
                value={form.college ?? ""}
                onChange={(value) =>
                  updateField(
                    "college",
                    value,
                  )
                }
              />

              <Field
                label="Profession"
                value={form.profession ?? ""}
                onChange={(value) =>
                  updateField(
                    "profession",
                    value,
                  )
                }
              />

              <Field
                label="Job Title"
                value={form.jobTitle ?? ""}
                onChange={(value) =>
                  updateField(
                    "jobTitle",
                    value,
                  )
                }
              />

              <Field
                label="Company"
                value={form.company ?? ""}
                onChange={(value) =>
                  updateField(
                    "company",
                    value,
                  )
                }
              />

              <Field
                label="Work Location"
                value={form.workLocation ?? ""}
                onChange={(value) =>
                  updateField(
                    "workLocation",
                    value,
                  )
                }
              />

              <Field
                label="Income Range"
                value={form.incomeRange ?? ""}
                onChange={(value) =>
                  updateField(
                    "incomeRange",
                    value,
                  )
                }
              />
            </div>
          </section>

          {/* ABOUT */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold">
              About You
            </h2>

            <div className="space-y-5">
              <TextAreaField
                label="About"
                value={form.about ?? ""}
                onChange={(value) =>
                  updateField("about", value)
                }
              />

              <TextAreaField
                label="Hobbies"
                value={form.hobbies ?? ""}
                onChange={(value) =>
                  updateField(
                    "hobbies",
                    value,
                  )
                }
              />

              <TextAreaField
                label="Cultural Interests"
                value={form.culturalInterests ?? ""}
                onChange={(value) =>
                  updateField(
                    "culturalInterests",
                    value,
                  )
                }
              />

              <TextAreaField
                label="Lifestyle Information"
                value={
                  form.lifestyleInformation ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "lifestyleInformation",
                    value,
                  )
                }
              />

              <TextAreaField
                label="Food Preferences"
                value={form.foodPreferences ?? ""}
                onChange={(value) =>
                  updateField(
                    "foodPreferences",
                    value,
                  )
                }
              />

              <TextAreaField
                label="Family Values"
                value={form.familyValues ?? ""}
                onChange={(value) =>
                  updateField(
                    "familyValues",
                    value,
                  )
                }
              />

              <TextAreaField
                label="Family Information"
                value={
                  form.familyInformation ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "familyInformation",
                    value,
                  )
                }
              />
            </div>
          </section>

          {/* PARTNER PREFERENCES */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Partner Preferences
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Minimum Age"
                type="number"
                value={
                  form.preferredAgeMin !==
                  undefined
                    ? String(
                        form.preferredAgeMin,
                      )
                    : ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredAgeMin",
                    value === ""
                      ? undefined
                      : Number(value),
                  )
                }
              />

              <Field
                label="Maximum Age"
                type="number"
                value={
                  form.preferredAgeMax !==
                  undefined
                    ? String(
                        form.preferredAgeMax,
                      )
                    : ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredAgeMax",
                    value === ""
                      ? undefined
                      : Number(value),
                  )
                }
              />

              <Field
                label="Minimum Height"
                type="number"
                value={
                  form.preferredHeightMin !==
                  undefined
                    ? String(
                        form.preferredHeightMin,
                      )
                    : ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredHeightMin",
                    value === ""
                      ? undefined
                      : Number(value),
                  )
                }
              />

              <Field
                label="Maximum Height"
                type="number"
                value={
                  form.preferredHeightMax !==
                  undefined
                    ? String(
                        form.preferredHeightMax,
                      )
                    : ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredHeightMax",
                    value === ""
                      ? undefined
                      : Number(value),
                  )
                }
              />

              <Field
                label="Preferred Location"
                value={
                  form.preferredLocation ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredLocation",
                    value,
                  )
                }
              />

              <Field
                label="Preferred District"
                value={
                  form.preferredDistrict ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredDistrict",
                    value,
                  )
                }
              />

              <Field
                label="Preferred Education"
                value={
                  form.preferredEducation ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredEducation",
                    value,
                  )
                }
              />

              <Field
                label="Preferred Profession"
                value={
                  form.preferredProfession ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredProfession",
                    value,
                  )
                }
              />

              <Field
                label="Preferred Community"
                value={
                  form.preferredCommunity ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredCommunity",
                    value,
                  )
                }
              />

              <SelectField
                label="Preferred Marital Status"
                value={
                  form.preferredMaritalStatus ??
                  ""
                }
                options={[
                  "Never Married",
                  "Divorced",
                  "Widowed",
                  "Separated",
                ]}
                onChange={(value) =>
                  updateField(
                    "preferredMaritalStatus",
                    value,
                  )
                }
              />

              <Field
                label="Preferred Family Values"
                value={
                  form.preferredFamilyValues ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "preferredFamilyValues",
                    value,
                  )
                }
              />
            </div>

            <div className="mt-5">
              <TextAreaField
                label="Other Preferences"
                value={
                  form.otherPreferences ?? ""
                }
                onChange={(value) =>
                  updateField(
                    "otherPreferences",
                    value,
                  )
                }
              />
            </div>
          </section>

          {/* VISIBILITY */}
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="mb-5 text-xl font-semibold">
              Profile Visibility
            </h2>

            <SelectField
              label="Visibility"
              value={form.visibility ?? "private"}
              options={[
                "public",
                "private",
              ]}
              onChange={(value) =>
                updateField(
                  "visibility",
                  value as "public" | "private",
                )
              }
            />
          </section>

          {/* BUTTONS */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                setLocation("/my-profile")
              }
              className="rounded-lg border px-6 py-3"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground disabled:opacity-50"
            >
              {updateProfile.isPending
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>

          {updateProfile.isError && (
            <p className="text-center text-sm text-destructive">
              Failed to update profile. Please try
              again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-lg border bg-background px-3 py-2"
      >
        <option value="">Select</option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        rows={4}
        className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2"
      />
    </div>
  );
}