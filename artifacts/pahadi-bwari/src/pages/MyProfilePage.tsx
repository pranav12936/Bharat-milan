import { Link } from "wouter";
import {
  BriefcaseBusiness,
  Camera,
  ChevronLeft,
  GraduationCap,
  Heart,
  MapPin,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useGetMyProfile } from "@workspace/api-client-react";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function MyProfilePage() {
  const profile = useGetMyProfile({
    query: {
      queryKey: ["/api/profile/me"],
      retry: false,
    },
  });

  if (profile.isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />

          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="h-96 animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-6">
              <div className="h-48 animate-pulse rounded-2xl bg-muted" />
              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
          <UserRound className="mx-auto h-10 w-10 text-muted-foreground" />

          <h1 className="mt-4 text-xl font-semibold">
            Profile not available
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            We could not load your profile.
          </p>

          <button
            type="button"
            onClick={() => profile.refetch()}
            className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>

          <div className="mt-4">
            <Link
              href="/dashboard"
              className="text-sm text-primary hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const person = profile.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full border bg-card hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="text-2xl font-bold">
                My Profile
              </h1>

              <p className="text-sm text-muted-foreground">
                View and manage your profile
              </p>
            </div>
          </div>

          <Link
            href="/edit-profile"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Pencil className="h-4 w-4" />

            <span className="hidden sm:inline">
              Edit Profile
            </span>
          </Link>
        </div>

        {/* Main */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left column */}
          <div className="space-y-5">
            {/* Profile card */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex min-h-[360px] items-center justify-center bg-muted p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-background">
                    <UserRound className="h-14 w-14 text-muted-foreground" />
                  </div>

                  <h2 className="mt-5 text-2xl font-bold">
                    {person.fullName || "Your name"}
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {person.age !== undefined && person.age !== null
                      ? `${person.age} years`
                      : "Age not added"}
                    {person.gender ? ` · ${person.gender}` : ""}
                  </p>

                  {person.city && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {person.city}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <Link
                  href="/manage-photos"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <Camera className="h-4 w-4" />
                  Manage Photos
                </Link>
              </div>
            </div>

            {/* Completion */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Profile completion
                </span>

                <span className="text-sm font-semibold">
                  {person.completion ?? 0}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, person.completion ?? 0),
                    )}%`,
                  }}
                />
              </div>

              {(person.completion ?? 0) < 100 && (
                <Link
                  href="/edit-profile"
                  className="mt-3 inline-block text-xs text-primary hover:underline"
                >
                  Complete your profile
                </Link>
              )}
            </div>

            {/* Privacy */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />

                <div>
                  <p className="font-medium">
                    Profile visibility
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Your profile is{" "}
                    {person.visibility || "private"}.
                  </p>

                  <Link
                    href="/privacy-settings"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    Privacy settings
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* About */}
            {person.about && (
              <Section title="About Me">
                <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {person.about}
                </p>
              </Section>
            )}

            {/* Basic */}
            <Section title="Basic Information">
              <div className="grid gap-x-8 sm:grid-cols-2">
                <div>
                  <InfoRow
                    icon={<UserRound className="h-4 w-4" />}
                    label="Full name"
                    value={person.fullName}
                  />

                  <InfoRow
                    icon={<UserRound className="h-4 w-4" />}
                    label="Gender"
                    value={person.gender}
                  />

                  <InfoRow
                    icon={<Heart className="h-4 w-4" />}
                    label="Marital status"
                    value={person.maritalStatus}
                  />
                </div>

                <div>
                  <InfoRow
                    icon={<UserRound className="h-4 w-4" />}
                    label="Age"
                    value={
                      person.age !== undefined &&
                      person.age !== null
                        ? `${person.age} years`
                        : null
                    }
                  />

                  <InfoRow
                    icon={<UserRound className="h-4 w-4" />}
                    label="Height"
                    value={person.height}
                  />

                  <InfoRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="City"
                    value={person.city}
                  />
                </div>
              </div>
            </Section>

            {/* Roots */}
            {(person.nativePlace ||
              person.district ||
              person.community) && (
              <Section title="Roots & Background">
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <InfoRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="Native place"
                      value={person.nativePlace}
                    />

                    <InfoRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="District"
                      value={person.district}
                    />
                  </div>

                  <div>
                    <InfoRow
                      icon={<Heart className="h-4 w-4" />}
                      label="Community"
                      value={person.community}
                    />
                  </div>
                </div>
              </Section>
            )}

            {/* Education and profession */}
            {(person.education || person.profession) && (
              <Section title="Education & Career">
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <InfoRow
                    icon={<GraduationCap className="h-4 w-4" />}
                    label="Education"
                    value={person.education}
                  />

                  <InfoRow
                    icon={
                      <BriefcaseBusiness className="h-4 w-4" />
                    }
                    label="Profession"
                    value={person.profession}
                  />
                </div>
              </Section>
            )}

            {/* Family */}
            {person.familyValues && (
              <Section title="Family">
                <InfoRow
                  icon={<Heart className="h-4 w-4" />}
                  label="Family values"
                  value={person.familyValues}
                />
              </Section>
            )}

            {/* Hobbies */}
            {person.hobbies && (
              <Section title="Hobbies & Interests">
                <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {person.hobbies}
                </p>
              </Section>
            )}

            {/* Languages */}
            {person.languages && (
              <Section title="Languages">
                <p className="text-sm text-muted-foreground">
                  {person.languages}
                </p>
              </Section>
            )}

            {/* Preferences */}
            {person.preferences && (
              <Section title="Partner Preferences">
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <InfoRow
                      icon={<Heart className="h-4 w-4" />}
                      label="Preferred age"
                      value={
                        person.preferences.preferredAgeMin !==
                          undefined ||
                        person.preferences.preferredAgeMax !==
                          undefined
                          ? `${person.preferences.preferredAgeMin ?? "Any"} – ${
                              person.preferences.preferredAgeMax ?? "Any"
                            }`
                          : null
                      }
                    />

                    <InfoRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="Preferred location"
                      value={
                        person.preferences.preferredLocation
                      }
                    />

                    <InfoRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="Preferred district"
                      value={
                        person.preferences.preferredDistrict
                      }
                    />
                  </div>

                  <div>
                    <InfoRow
                      icon={
                        <GraduationCap className="h-4 w-4" />
                      }
                      label="Preferred education"
                      value={
                        person.preferences.preferredEducation
                      }
                    />

                    <InfoRow
                      icon={
                        <BriefcaseBusiness className="h-4 w-4" />
                      }
                      label="Preferred profession"
                      value={
                        person.preferences.preferredProfession
                      }
                    />

                    <InfoRow
                      icon={<Heart className="h-4 w-4" />}
                      label="Preferred community"
                      value={
                        person.preferences.preferredCommunity
                      }
                    />
                  </div>
                </div>

                {person.preferences.otherPreferences && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Other preferences
                    </p>

                    <p className="mt-1 whitespace-pre-line text-sm leading-6">
                      {person.preferences.otherPreferences}
                    </p>
                  </div>
                )}
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}