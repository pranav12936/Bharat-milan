import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Redirect, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation } from "@tanstack/react-query";

type SetupData = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  height: number | undefined;
  maritalStatus: string;

  religion: string;
  motherTongue: string;
  community: string;
  caste: string;
  subCaste: string;

  currentCity: string;
  district: string;
  nativePlace: string;

  education: string;
  college: string;
  profession: string;
  company: string;
  incomeRange: string;
  visaWorkStatus: string;

  bodyType: string;
  smoking: string;
  drinking: string;
  foodPreferences: string;

  hobbies: string;
  languages: string;
  culturalInterests: string;
  about: string;

  fatherStatus: string;
  motherStatus: string;
  familyType: string;
  familyValues: string;

  preferredAgeMin: number;
  preferredAgeMax: number;
  preferredHeightMin: number | undefined;
  preferredHeightMax: number | undefined;
  preferredLocation: string;
  preferredDistrict: string;
  preferredReligion: string;
  preferredEducation: string;
  preferredProfession: string;
  preferredIncome: string;
  preferredCommunity: string;
  preferredMaritalStatus: string;
  preferredFamilyValues: string;
  otherPreferences: string;
};

const emptyData: SetupData = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  height: undefined,
  maritalStatus: "",

  religion: "",
  motherTongue: "",
  community: "",
  caste: "",
  subCaste: "",

  currentCity: "",
  district: "",
  nativePlace: "",

  education: "",
  college: "",
  profession: "",
  company: "",
  incomeRange: "",
  visaWorkStatus: "",

  bodyType: "",
  smoking: "",
  drinking: "",
  foodPreferences: "",

  hobbies: "",
  languages: "",
  culturalInterests: "",
  about: "",

  fatherStatus: "",
  motherStatus: "",
  familyType: "",
  familyValues: "",

  preferredAgeMin: 24,
  preferredAgeMax: 35,
  preferredHeightMin: undefined,
  preferredHeightMax: undefined,
  preferredLocation: "",
  preferredDistrict: "",
  preferredReligion: "",
  preferredEducation: "",
  preferredProfession: "",
  preferredIncome: "",
  preferredCommunity: "",
  preferredMaritalStatus: "",
  preferredFamilyValues: "",
  otherPreferences: "",
};

const steps = [
  {
    number: 1,
    title: "About You",
    short: "Basics",
    description: "Start with the essentials",
  },
  {
    number: 2,
    title: "Your Roots",
    short: "Identity",
    description: "Share your background",
  },
  {
    number: 3,
    title: "Life & Work",
    short: "Lifestyle",
    description: "Tell us about your life",
  },
  {
    number: 4,
    title: "Family & Values",
    short: "Family",
    description: "What matters to you",
  },
  {
    number: 5,
    title: "Your Preferences",
    short: "Partner",
    description: "Describe your preferences",
  },
];

function ageFromDate(date: string): number {
  if (!date) return 0;

  const dob = new Date(`${date}T00:00:00`);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const month = today.getMonth() - dob.getMonth();

  if (
    month < 0 ||
    (month === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

function isAdult(date: string): boolean {
  return ageFromDate(date) >= 18;
}

async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<any> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") ?? "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.error
        ? data.error
        : "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return data;
}

function normalizeProfile(data: any): SetupData {
  const p = data?.profile ?? data ?? {};
  const preferences = data?.preferences ?? p?.preferences ?? {};

  return {
    ...emptyData,

    fullName: p.fullName ?? "",
    dateOfBirth:
      p.dateOfBirth
        ? String(p.dateOfBirth).slice(0, 10)
        : "",
    gender: p.gender ?? "",
    height:
      p.height !== null && p.height !== undefined
        ? Number(p.height)
        : undefined,
    maritalStatus: p.maritalStatus ?? "",

    religion: p.religion ?? "",
    motherTongue: p.motherTongue ?? "",
    community: p.community ?? "",
    caste: p.caste ?? "",
    subCaste: p.subCaste ?? "",

    currentCity: p.currentCity ?? p.city ?? "",
    district: p.district ?? "",
    nativePlace: p.nativePlace ?? "",

    education: p.education ?? "",
    college: p.college ?? "",
    profession: p.profession ?? "",
    company: p.company ?? "",
    incomeRange: p.incomeRange ?? "",
    visaWorkStatus: p.visaWorkStatus ?? "",

    bodyType: p.bodyType ?? "",
    smoking: p.smoking ?? "",
    drinking: p.drinking ?? "",
    foodPreferences: p.foodPreferences ?? "",

    hobbies: p.hobbies ?? "",
    languages: p.languages ?? "",
    culturalInterests: p.culturalInterests ?? "",
    about: p.about ?? "",

    fatherStatus: p.fatherStatus ?? "",
    motherStatus: p.motherStatus ?? "",
    familyType: p.familyType ?? "",
    familyValues: p.familyValues ?? "",

    preferredAgeMin:
      preferences.preferredAgeMin ??
      emptyData.preferredAgeMin,

    preferredAgeMax:
      preferences.preferredAgeMax ??
      emptyData.preferredAgeMax,

    preferredHeightMin:
      preferences.preferredHeightMin ?? undefined,

    preferredHeightMax:
      preferences.preferredHeightMax ?? undefined,

    preferredLocation:
      preferences.preferredLocation ?? "",

    preferredDistrict:
      preferences.preferredDistrict ?? "",

    preferredReligion:
      preferences.preferredReligion ?? "",

    preferredEducation:
      preferences.preferredEducation ?? "",

    preferredProfession:
      preferences.preferredProfession ?? "",

    preferredIncome:
      preferences.preferredIncome ?? "",

    preferredCommunity:
      preferences.preferredCommunity ?? "",

    preferredMaritalStatus:
      preferences.preferredMaritalStatus ?? "",

    preferredFamilyValues:
      preferences.preferredFamilyValues ?? "",

    otherPreferences:
      preferences.otherPreferences ?? "",
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  hint,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="group block">
      <span className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {label}
        {required && (
          <span className="text-accent" aria-hidden="true">
            *
          </span>
        )}
      </span>

      <div className="relative">
        <input
          type={type}
          value={value ?? ""}
          required={required}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-13 w-full rounded-xl border border-border bg-background/70 px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground/65 hover:border-primary/30 focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/10"
        />
      </div>

      {hint && (
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="group block">
      <span className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {label}
        {required && (
          <span className="text-accent" aria-hidden="true">
            *
          </span>
        )}
      </span>

      <div className="relative">
        <select
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className="h-13 w-full appearance-none rounded-xl border border-border bg-background/70 px-4 pr-11 text-[15px] text-foreground outline-none transition-all hover:border-primary/30 focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/10"
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-accent"
        />
      </div>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="group block">
      <span className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {label}
        {required && (
          <span className="text-accent" aria-hidden="true">
            *
          </span>
        )}
      </span>

      <textarea
        value={value}
        required={required}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-xl border border-border bg-background/70 px-4 py-3.5 text-[15px] leading-6 text-foreground outline-none transition-all placeholder:text-muted-foreground/65 hover:border-primary/30 focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/10"
      />
    </label>
  );
}

function Section({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_60px_-35px_hsl(var(--primary)/0.35)] transition-shadow duration-300 hover:shadow-[0_22px_70px_-35px_hsl(var(--primary)/0.45)]">
      <div className="relative border-b border-border bg-gradient-to-br from-secondary/70 via-card to-card px-5 py-6 sm:px-7">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/5 blur-2xl" />

        <div className="relative flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
            {icon}
          </div>

          <div>
            <p className="eyebrow text-accent">{eyebrow}</p>

            <h2 className="mt-1.5 font-display text-2xl text-primary sm:text-3xl">
              {title}
            </h2>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
        {children}
      </div>
    </section>
  );
}

function FullWidth({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="sm:col-span-2">
      {children}
    </div>
  );
}

function ProfileSetupProgress({
  currentStep,
}: {
  currentStep: number;
}) {
  const percentage = ((currentStep - 1) / 4) * 100;

  return (
    <div className="rounded-3xl border border-border bg-card/95 p-4 shadow-[0_18px_60px_-40px_hsl(var(--primary)/0.45)] backdrop-blur sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">Profile journey</p>

          <h2 className="mt-1 font-display text-2xl text-primary">
            {steps[currentStep - 1].title}
          </h2>
        </div>

        <div className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
          Step {currentStep} of 5
        </div>
      </div>

      <div className="relative hidden sm:block">
        <div className="absolute left-[10%] right-[10%] top-6 h-1 rounded-full bg-secondary" />

        <div
          className="absolute left-[10%] top-6 h-1 rounded-full bg-accent transition-all duration-500"
          style={{
            width: `${Math.max(0, Math.min(80, percentage * 0.8))}%`,
          }}
        />

        <div className="relative grid grid-cols-5">
          {steps.map((step) => {
            const completed = step.number < currentStep;
            const active = step.number === currentStep;

            return (
              <div
                key={step.number}
                className="flex flex-col items-center"
              >
                <div
                  className={[
                    "relative z-10 grid size-12 place-items-center rounded-full border-4 border-card text-sm font-black transition-all duration-300",
                    completed
                      ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                      : active
                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25 ring-4 ring-primary/10"
                        : "bg-secondary text-muted-foreground",
                  ].join(" ")}
                >
                  {completed ? (
                    <Check size={19} strokeWidth={3} />
                  ) : (
                    step.number
                  )}
                </div>

                <span
                  className={[
                    "mt-3 text-center text-xs font-bold",
                    active || completed
                      ? "text-primary"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.short}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:hidden">
        {steps.map((step) => {
          const completed = step.number < currentStep;
          const active = step.number === currentStep;

          return (
            <div
              key={step.number}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={[
                  "grid size-9 place-items-center rounded-full text-xs font-black transition-all",
                  completed
                    ? "bg-accent text-accent-foreground"
                    : active
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary text-muted-foreground",
                ].join(" ")}
              >
                {completed ? (
                  <Check size={15} strokeWidth={3} />
                ) : (
                  step.number
                )}
              </div>

              <span
                className={[
                  "text-[10px] font-bold",
                  active
                    ? "text-primary"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {step.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepOne({
  form,
  set,
}: {
  form: SetupData;
  set: (
    key: keyof SetupData,
    value: string | number | undefined,
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <Section
        eyebrow="The essentials"
        title="Let's begin with you"
        description="A few simple details help create the foundation of your profile."
        icon={<UserRound size={21} />}
      >
        <Field
          label="Full name"
          value={form.fullName}
          required
          placeholder="Your full name"
          onChange={(value) => set("fullName", value)}
        />

        <Field
          label="Date of birth"
          value={form.dateOfBirth}
          required
          type="date"
          onChange={(value) => set("dateOfBirth", value)}
        />

        <SelectField
          label="Gender"
          value={form.gender}
          required
          onChange={(value) => set("gender", value)}
          options={[
            "Male",
            "Female",
            "Other",
          ]}
        />

        <Field
          label="Height"
          value={form.height}
          required
          type="number"
          placeholder="e.g. 170"
          hint="Enter height in centimetres"
          onChange={(value) =>
            set(
              "height",
              value === "" ? undefined : Number(value),
            )
          }
        />

        <SelectField
          label="Marital status"
          value={form.maritalStatus}
          required
          onChange={(value) =>
            set("maritalStatus", value)
          }
          options={[
            "Never Married",
            "Divorced",
            "Widowed",
            "Separated",
          ]}
        />
      </Section>

      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
        <div className="flex gap-3">
          <div className="mt-0.5 shrink-0 text-accent">
            <Heart size={18} fill="currentColor" />
          </div>

          <div>
            <p className="text-sm font-bold text-primary">
              Keep it genuine
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Your profile should represent you honestly.
              These details help people understand your
              introduction clearly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTwo({
  form,
  set,
}: {
  form: SetupData;
  set: (
    key: keyof SetupData,
    value: string | number | undefined,
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <Section
        eyebrow="Your roots"
        title="Where you come from"
        description="Share the cultural and location details that are meaningful to you."
        icon={<MapPin size={21} />}
      >
        <SelectField
          label="Religion"
          value={form.religion}
          onChange={(value) => set("religion", value)}
          options={[
            "Hindu",
            "Sikh",
            "Buddhist",
            "Jain",
            "Muslim",
            "Christian",
            "Other",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Mother tongue"
          value={form.motherTongue}
          onChange={(value) =>
            set("motherTongue", value)
          }
          options={[
            "Hindi",
            "Garhwali",
            "Kumaoni",
            "Jaunsari",
            "Punjabi",
            "English",
            "Other",
          ]}
        />

        <Field
          label="Community"
          value={form.community}
          placeholder="Community"
          onChange={(value) => set("community", value)}
        />

        <Field
          label="Caste"
          value={form.caste}
          placeholder="Caste"
          onChange={(value) => set("caste", value)}
        />

        <Field
          label="Sub-caste"
          value={form.subCaste}
          placeholder="Sub-caste"
          onChange={(value) => set("subCaste", value)}
        />

        <Field
          label="Current city"
          value={form.currentCity}
          placeholder="Where you currently live"
          onChange={(value) =>
            set("currentCity", value)
          }
        />

        <Field
          label="District"
          value={form.district}
          placeholder="Your district"
          onChange={(value) => set("district", value)}
        />

        <Field
          label="Native place"
          value={form.nativePlace}
          placeholder="Village, town or city"
          onChange={(value) =>
            set("nativePlace", value)
          }
        />
      </Section>
    </div>
  );
}

function StepThree({
  form,
  set,
}: {
  form: SetupData;
  set: (
    key: keyof SetupData,
    value: string | number | undefined,
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <Section
        eyebrow="Life & work"
        title="The life you're building"
        description="Education, work and everyday preferences give your profile more personality."
        icon={<Sparkles size={21} />}
      >
        <SelectField
          label="Education"
          value={form.education}
          onChange={(value) =>
            set("education", value)
          }
          options={[
            "10th",
            "12th",
            "Diploma",
            "Bachelor's",
            "Master's",
            "Doctorate",
            "Other",
          ]}
        />

        <Field
          label="College / University"
          value={form.college}
          placeholder="Institution name"
          onChange={(value) => set("college", value)}
        />

        <SelectField
          label="Profession"
          value={form.profession}
          onChange={(value) =>
            set("profession", value)
          }
          options={[
            "Student",
            "Government Employee",
            "Private Employee",
            "Business Owner",
            "Teacher",
            "Doctor",
            "Engineer",
            "IT Professional",
            "Defence",
            "Self Employed",
            "Other",
          ]}
        />

        <Field
          label="Company / Organisation"
          value={form.company}
          placeholder="Where you work"
          onChange={(value) => set("company", value)}
        />

        <SelectField
          label="Income range"
          value={form.incomeRange}
          onChange={(value) =>
            set("incomeRange", value)
          }
          options={[
            "Below ₹3 Lakh",
            "₹3–5 Lakh",
            "₹5–10 Lakh",
            "₹10–15 Lakh",
            "₹15–25 Lakh",
            "₹25 Lakh+",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Visa / Work status"
          value={form.visaWorkStatus}
          onChange={(value) =>
            set("visaWorkStatus", value)
          }
          options={[
            "India",
            "Working Abroad",
            "Studying Abroad",
            "Planning to Move Abroad",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Body type"
          value={form.bodyType}
          onChange={(value) =>
            set("bodyType", value)
          }
          options={[
            "Slim",
            "Average",
            "Athletic",
            "Other",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Smoking"
          value={form.smoking}
          onChange={(value) =>
            set("smoking", value)
          }
          options={[
            "Never",
            "Occasionally",
            "Regularly",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Drinking"
          value={form.drinking}
          onChange={(value) =>
            set("drinking", value)
          }
          options={[
            "Never",
            "Occasionally",
            "Regularly",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Food preferences"
          value={form.foodPreferences}
          onChange={(value) =>
            set("foodPreferences", value)
          }
          options={[
            "Vegetarian",
            "Non-Vegetarian",
            "Eggetarian",
            "Vegan",
            "No Preference",
          ]}
        />
      </Section>

      <Section
        eyebrow="Personality"
        title="Beyond the basics"
        description="These details make an introduction feel more human and less like a form."
        icon={<Heart size={21} />}
      >
        <FullWidth>
          <TextAreaField
            label="Hobbies & interests"
            value={form.hobbies}
            placeholder="Tell us what you enjoy doing..."
            onChange={(value) => set("hobbies", value)}
          />
        </FullWidth>

        <Field
          label="Languages"
          value={form.languages}
          placeholder="Languages you speak"
          onChange={(value) => set("languages", value)}
        />

        <Field
          label="Cultural interests"
          value={form.culturalInterests}
          placeholder="Festivals, traditions, interests..."
          onChange={(value) =>
            set("culturalInterests", value)
          }
        />

        <FullWidth>
          <TextAreaField
            label="About you"
            value={form.about}
            required
            rows={6}
            placeholder="Write a short introduction about yourself..."
            onChange={(value) => set("about", value)}
          />
        </FullWidth>
      </Section>
    </div>
  );
}

function StepFour({
  form,
  set,
}: {
  form: SetupData;
  set: (
    key: keyof SetupData,
    value: string | number | undefined,
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <Section
        eyebrow="Family"
        title="The people around you"
        description="Share what feels comfortable about your family and the values you grew up with."
        icon={<Heart size={21} />}
      >
        <SelectField
          label="Father's status"
          value={form.fatherStatus}
          onChange={(value) =>
            set("fatherStatus", value)
          }
          options={[
            "Employed",
            "Business",
            "Retired",
            "Self Employed",
            "Not Applicable",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Mother's status"
          value={form.motherStatus}
          onChange={(value) =>
            set("motherStatus", value)
          }
          options={[
            "Homemaker",
            "Employed",
            "Business",
            "Retired",
            "Self Employed",
            "Not Applicable",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Family type"
          value={form.familyType}
          onChange={(value) =>
            set("familyType", value)
          }
          options={[
            "Joint Family",
            "Nuclear Family",
            "Extended Family",
            "Prefer not to say",
          ]}
        />

        <SelectField
          label="Family values"
          value={form.familyValues}
          onChange={(value) =>
            set("familyValues", value)
          }
          options={[
            "Traditional",
            "Moderate",
            "Liberal",
            "Open to discussion",
          ]}
        />
      </Section>

      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/15 sm:p-8">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 size-44 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative">
          <p className="eyebrow text-primary-foreground/65">
            Pahadi Bwari
          </p>

          <h3 className="mt-2 font-display text-3xl">
            What matters in a family?
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75">
            There is no perfect answer. Your values simply
            help people understand the kind of family
            environment you appreciate.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepFive({
  form,
  set,
}: {
  form: SetupData;
  set: (
    key: keyof SetupData,
    value: string | number | undefined,
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <Section
        eyebrow="Partner preferences"
        title="Who would you like to meet?"
        description="Your preferences guide discovery. They don't have to define everything."
        icon={<Heart size={21} />}
      >
        <Field
          label="Preferred minimum age"
          value={form.preferredAgeMin}
          type="number"
          placeholder="Minimum age"
          onChange={(value) =>
            set(
              "preferredAgeMin",
              value === "" ? undefined : Number(value),
            )
          }
        />

        <Field
          label="Preferred maximum age"
          value={form.preferredAgeMax}
          type="number"
          placeholder="Maximum age"
          onChange={(value) =>
            set(
              "preferredAgeMax",
              value === "" ? undefined : Number(value),
            )
          }
        />

        <Field
          label="Preferred minimum height"
          value={form.preferredHeightMin}
          type="number"
          placeholder="Height in cm"
          onChange={(value) =>
            set(
              "preferredHeightMin",
              value === "" ? undefined : Number(value),
            )
          }
        />

        <Field
          label="Preferred maximum height"
          value={form.preferredHeightMax}
          type="number"
          placeholder="Height in cm"
          onChange={(value) =>
            set(
              "preferredHeightMax",
              value === "" ? undefined : Number(value),
            )
          }
        />

        <Field
          label="Preferred location"
          value={form.preferredLocation}
          placeholder="City / state / country"
          onChange={(value) =>
            set("preferredLocation", value)
          }
        />

        <Field
          label="Preferred district"
          value={form.preferredDistrict}
          placeholder="District"
          onChange={(value) =>
            set("preferredDistrict", value)
          }
        />

        <SelectField
          label="Preferred religion"
          value={form.preferredReligion}
          onChange={(value) =>
            set("preferredReligion", value)
          }
          options={[
            "Hindu",
            "Sikh",
            "Buddhist",
            "Jain",
            "Muslim",
            "Christian",
            "Other",
            "No Preference",
          ]}
        />

        <SelectField
          label="Preferred education"
          value={form.preferredEducation}
          onChange={(value) =>
            set("preferredEducation", value)
          }
          options={[
            "10th",
            "12th",
            "Diploma",
            "Bachelor's",
            "Master's",
            "Doctorate",
            "No Preference",
          ]}
        />

        <SelectField
          label="Preferred profession"
          value={form.preferredProfession}
          onChange={(value) =>
            set("preferredProfession", value)
          }
          options={[
            "Government Employee",
            "Private Employee",
            "Business Owner",
            "Teacher",
            "Doctor",
            "Engineer",
            "IT Professional",
            "Defence",
            "Self Employed",
            "No Preference",
          ]}
        />

        <SelectField
          label="Preferred income"
          value={form.preferredIncome}
          onChange={(value) =>
            set("preferredIncome", value)
          }
          options={[
            "Below ₹3 Lakh",
            "₹3–5 Lakh",
            "₹5–10 Lakh",
            "₹10–15 Lakh",
            "₹15–25 Lakh",
            "₹25 Lakh+",
            "No Preference",
          ]}
        />

        <Field
          label="Preferred community"
          value={form.preferredCommunity}
          placeholder="Community"
          onChange={(value) =>
            set("preferredCommunity", value)
          }
        />

        <SelectField
          label="Preferred marital status"
          value={form.preferredMaritalStatus}
          onChange={(value) =>
            set("preferredMaritalStatus", value)
          }
          options={[
            "Never Married",
            "Divorced",
            "Widowed",
            "Separated",
            "No Preference",
          ]}
        />

        <SelectField
          label="Preferred family values"
          value={form.preferredFamilyValues}
          onChange={(value) =>
            set("preferredFamilyValues", value)
          }
          options={[
            "Traditional",
            "Moderate",
            "Liberal",
            "Open to discussion",
            "No Preference",
          ]}
        />

        <FullWidth>
          <TextAreaField
            label="Anything else?"
            value={form.otherPreferences}
            rows={5}
            placeholder="Anything else you'd like your preferences to mention..."
            onChange={(value) =>
              set("otherPreferences", value)
            }
          />
        </FullWidth>
      </Section>

      <div className="overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-secondary/30 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
            <Sparkles size={25} />
          </div>

          <div>
            <p className="font-display text-2xl text-primary">
              Almost there.
            </p>

            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Once you save these details, you'll move on
              to choosing your primary profile photo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SetupData>(emptyData);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");

  const profileQuery = useQuery({
    queryKey: ["profile-setup"],
    queryFn: () => apiRequest("/api/profile/setup"),
    enabled: isLoaded && !!isSignedIn,
    retry: false,
  });

const saveMutation = useMutation({
  mutationFn: ({
    step,
    data,
  }: {
    step: number;
    data: SetupData;
  }) =>
    apiRequest("/api/profile/setup", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        step,
        data,
      }),
    }),
});
  useEffect(() => {
    if (!profileQuery.data || initialized) return;

    const data = normalizeProfile(profileQuery.data);

    setForm(data);

    const serverStep =
      Number(
        profileQuery.data?.setupStep ??
          profileQuery.data?.profile?.setupStep ??
          1,
      ) || 1;

    setStep(Math.max(1, Math.min(5, serverStep)));

    setInitialized(true);
  }, [profileQuery.data, initialized]);

  const set = (
    key: keyof SetupData,
    value: string | number | undefined,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  };

  const progress = useMemo(
    () => Math.round((step / 5) * 100),
    [step],
  );

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="mt-8 h-28 animate-pulse rounded-3xl bg-muted" />
          <div className="mt-6 h-[500px] animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  if (
    profileQuery.data?.setupCompleted === true ||
    profileQuery.data?.profile?.setupCompleted === true
  ) {
    return <Redirect to="/dashboard" />;
  }

  const validateStep = (): boolean => {
    setError("");

    if (step === 1) {
      if (!form.fullName.trim()) {
        setError("Please enter your full name.");
        return false;
      }

      if (!form.dateOfBirth) {
        setError("Please enter your date of birth.");
        return false;
      }

      if (!isAdult(form.dateOfBirth)) {
        setError(
          "You must be at least 18 years old to create a matrimonial profile.",
        );
        return false;
      }

      if (!form.gender) {
        setError("Please select your gender.");
        return false;
      }

      if (
        form.height === undefined ||
        Number.isNaN(form.height) ||
        form.height < 50 ||
        form.height > 250
      ) {
        setError(
          "Please enter a valid height between 50 and 250 cm.",
        );
        return false;
      }

      if (!form.maritalStatus) {
        setError("Please select your marital status.");
        return false;
      }
    }

    if (step === 2) {
      if (!form.currentCity.trim()) {
        setError("Please enter your current city.");
        return false;
      }

      if (!form.district.trim()) {
        setError("Please enter your district.");
        return false;
      }
    }

    if (step === 3) {
      if (!form.about.trim()) {
        setError(
          "Please add a short introduction about yourself.",
        );
        return false;
      }
    }

    if (step === 5) {
      if (
        form.preferredAgeMin &&
        form.preferredAgeMax &&
        form.preferredAgeMin > form.preferredAgeMax
      ) {
        setError(
          "Preferred minimum age cannot be greater than maximum age.",
        );
        return false;
      }

      if (
        form.preferredHeightMin &&
        form.preferredHeightMax &&
        form.preferredHeightMin >
          form.preferredHeightMax
      ) {
        setError(
          "Preferred minimum height cannot be greater than maximum height.",
        );
        return false;
      }
    }

    return true;
  };

  const saveCurrentStep = async () => {
    if (!validateStep()) return;

    try {
      setError("");

      await saveMutation.mutateAsync({
  step,
  data: form,
});

      if (step < 5) {
        setStep((current) => current + 1);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      setLocation("/profile-photo-setup");
    } catch (mutationError: any) {
      setError(
        mutationError?.message ??
          "Unable to save your profile. Please try again.",
      );
    }
  };

  const goBack = () => {
    if (step === 1) return;

    setStep((current) => current - 1);

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-background">
      {/* Decorative top atmosphere */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,hsl(var(--accent)/0.12),transparent_30%),radial-gradient(circle_at_85%_5%,hsl(var(--primary)/0.12),transparent_34%)]" />

        <div className="absolute -left-24 top-20 size-64 rounded-full bg-accent/5 blur-3xl" />

        <div className="absolute -right-24 top-32 size-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="surface-grid pointer-events-none absolute inset-0 opacity-[0.18]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        {/* Header */}
        <header className="relative overflow-hidden rounded-[2rem] border border-border bg-primary px-5 py-7 text-primary-foreground shadow-2xl shadow-primary/20 sm:px-8 sm:py-9">
          <div className="absolute -right-12 -top-20 size-64 rounded-full bg-accent/20 blur-3xl" />

          <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-primary-foreground/5 blur-3xl" />

          <div className="relative flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold tracking-wide text-primary-foreground/85">
                <Sparkles size={13} />
                YOUR PAHADI BWARI INTRODUCTION
              </div>

              <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                Let people know
                <span className="block text-accent">
                  the real you.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
                Build your profile one thoughtful step at
                a time. You can always update your details
                later.
              </p>
            </div>

            <div className="shrink-0">
              <div className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/10 px-5 py-4 backdrop-blur">
                <p className="text-xs font-semibold text-primary-foreground/60">
                  Profile progress
                </p>

                <div className="mt-1 flex items-end gap-1">
                  <span className="font-display text-3xl">
                    {progress}
                  </span>

                  <span className="mb-1 text-sm text-primary-foreground/60">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative mountain-inspired shapes */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 overflow-hidden opacity-20">
            <div className="absolute -bottom-10 left-[-5%] h-24 w-[55%] rotate-6 bg-primary-foreground/30" />
            <div className="absolute -bottom-12 right-[-5%] h-28 w-[60%] -rotate-6 bg-primary-foreground/20" />
          </div>
        </header>

        {/* Progress */}
        <div className="mt-5">
          <ProfileSetupProgress currentStep={step} />
        </div>

        {/* Main form */}
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void saveCurrentStep();
          }}
          className="mt-6"
        >
          {step === 1 && (
            <StepOne form={form} set={set} />
          )}

          {step === 2 && (
            <StepTwo form={form} set={set} />
          )}

          {step === 3 && (
            <StepThree form={form} set={set} />
          )}

          {step === 4 && (
            <StepFour form={form} set={set} />
          )}

          {step === 5 && (
            <StepFive form={form} set={set} />
          )}

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3.5 text-sm font-medium text-destructive shadow-sm"
            >
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1 || saveMutation.isPending}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition-all hover:border-primary/30 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <p className="hidden text-xs text-muted-foreground sm:block">
                Step {step} of 5
              </p>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-black text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {saveMutation.isPending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                    Saving...
                  </>
                ) : step === 5 ? (
                  <>
                    Save & Continue
                    <Check
                      size={17}
                      className="transition-transform group-hover:scale-110"
                    />
                  </>
                ) : (
                  <>
                    Save & Continue
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Bottom reassurance */}
        <div className="mt-8 text-center">
          <p className="text-xs leading-5 text-muted-foreground">
            Your information is used to create your
            matrimonial profile and can be updated later.
          </p>
        </div>
      </div>
    </main>
  );
}