import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search,
  Heart,
  MapPin,
  GraduationCap,
  BriefcaseBusiness,
  Loader2,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  useListProfiles,
  useExpressInterest,
} from "@workspace/api-client-react";

export default function Discover() {
  const [, setLocation] = useLocation();

  const [gender, setGender] = useState("");
  const [location, setProfileLocation] = useState("");
  const [district, setDistrict] = useState("");
  const [education, setEducation] = useState("");
  const [profession, setProfession] = useState("");
  const [community, setCommunity] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const profiles = useListProfiles({
    gender: gender || undefined,
    location: location || undefined,
    district: district || undefined,
    education: education || undefined,
    profession: profession || undefined,
    community: community || undefined,
    maritalStatus: maritalStatus || undefined,
  });

  const expressInterest = useExpressInterest();

  function searchProfiles() {
    setMessage("");
    setError("");

    profiles.refetch();
  }

  function clearFilters() {
    setGender("");
    setProfileLocation("");
    setDistrict("");
    setEducation("");
    setProfession("");
    setCommunity("");
    setMaritalStatus("");

    setMessage("");
    setError("");
  }

  function sendInterest(profileId: string) {
    setMessage("");
    setError("");

    expressInterest.mutate(
      {
        id: profileId,
      },
      {
        onSuccess: async () => {
          setMessage("Interest sent successfully.");
          await profiles.refetch();
        },
        onError: () => {
          setError(
            "Could not send interest. Please try again.",
          );
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Discover Profiles
            </h1>

            <p className="mt-1 text-muted-foreground">
              Find profiles using your preferred filters.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2"
          >
            <SlidersHorizontal className="h-5 w-5" />

            {showFilters
              ? "Hide Filters"
              : "Show Filters"}
          </button>
        </div>

        {/* FILTERS */}
        {showFilters && (
          <section className="mb-8 rounded-2xl border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Search Filters
                </h2>

                <p className="text-sm text-muted-foreground">
                  Narrow down the profiles you want to discover.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-full border p-2"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <SelectField
                label="Gender"
                value={gender}
                options={[
                  "Male",
                  "Female",
                  "Other",
                ]}
                onChange={setGender}
              />

              <InputField
                label="Location"
                value={location}
                placeholder="City or location"
                onChange={setProfileLocation}
              />

              <InputField
                label="District"
                value={district}
                placeholder="District"
                onChange={setDistrict}
              />

              <InputField
                label="Education"
                value={education}
                placeholder="Education"
                onChange={setEducation}
              />

              <InputField
                label="Profession"
                value={profession}
                placeholder="Profession"
                onChange={setProfession}
              />

              <InputField
                label="Community"
                value={community}
                placeholder="Community"
                onChange={setCommunity}
              />

              <SelectField
                label="Marital Status"
                value={maritalStatus}
                options={[
                  "Never Married",
                  "Divorced",
                  "Widowed",
                  "Separated",
                ]}
                onChange={setMaritalStatus}
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={searchProfiles}
                disabled={profiles.isFetching}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50"
              >
                {profiles.isFetching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}

                Search Profiles
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border px-5 py-3 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </section>
        )}

        {/* MESSAGES */}
        {message && (
          <div className="mb-5 rounded-lg border p-4 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border p-4 text-sm">
            {error}
          </div>
        )}

        {/* LOADING */}
        {profiles.isLoading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {/* ERROR */}
        {profiles.isError && (
          <div className="rounded-2xl border p-10 text-center">
            <h2 className="text-xl font-semibold">
              Could not load profiles
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Please try again.
            </p>

            <button
              type="button"
              onClick={() => profiles.refetch()}
              className="mt-5 rounded-lg bg-primary px-5 py-2 text-primary-foreground"
            >
              Try Again
            </button>
          </div>
        )}

        {/* PROFILE GRID */}
        {!profiles.isLoading &&
          !profiles.isError &&
          profiles.data && (
            <ProfileGrid
              data={profiles.data}
              onOpen={(id) =>
                setLocation(`/profiles/${id}`)
              }
              onInterest={sendInterest}
              interestLoading={
                expressInterest.isPending
              }
            />
          )}
      </div>
    </div>
  );
}

function ProfileGrid({
  data,
  onOpen,
  onInterest,
  interestLoading,
}: {
  data: any;
  onOpen: (id: string) => void;
  onInterest: (id: string) => void;
  interestLoading: boolean;
}) {
  const profiles = Array.isArray(data)
    ? data
    : data?.profiles ?? [];

  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center">
        <Search className="mx-auto h-10 w-10 text-muted-foreground" />

        <h2 className="mt-4 text-xl font-semibold">
          No profiles found
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Try changing your filters and search again.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {profiles.map((person: any) => (
        <ProfileCard
          key={person.id}
          person={person}
          onOpen={() => onOpen(person.id)}
          onInterest={() => onInterest(person.id)}
          interestLoading={interestLoading}
        />
      ))}
    </div>
  );
}

function ProfileCard({
  person,
  onOpen,
  onInterest,
  interestLoading,
}: {
  person: any;
  onOpen: () => void;
  onInterest: () => void;
  interestLoading: boolean;
}) {
  const primaryPhoto =
    person.photos?.find(
      (photo: any) => photo.isPrimary,
    )?.url ??
    person.photos?.[0]?.url ??
    null;

  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      {/* PHOTO */}
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/5] bg-muted">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={person.fullName ?? "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {person.age != null && (
            <div className="absolute bottom-3 left-3 rounded-full bg-background px-3 py-1 text-sm font-medium">
              {person.age} years
            </div>
          )}
        </div>
      </button>

      {/* DETAILS */}
      <div className="p-5">
        <button
          type="button"
          onClick={onOpen}
          className="text-left"
        >
          <h2 className="text-xl font-semibold">
            {person.fullName ?? "Member"}
          </h2>
        </button>

        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          {person.city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>
                {person.city}
                {person.district
                  ? `, ${person.district}`
                  : ""}
              </span>
            </div>
          )}

          {person.education && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>{person.education}</span>
            </div>
          )}

          {person.profession && (
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 shrink-0" />
              <span>{person.profession}</span>
            </div>
          )}

          {person.community && (
            <p>
              Community: {person.community}
            </p>
          )}

          {person.maritalStatus && (
            <p>
              {person.maritalStatus}
            </p>
          )}
        </div>

        {person.about && (
          <p className="mt-4 line-clamp-3 text-sm leading-6">
            {person.about}
          </p>
        )}

        {/* ACTIONS */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            View Profile
          </button>

          <button
            type="button"
            onClick={onInterest}
            disabled={interestLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {interestLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4" />
            )}

            Interest
          </button>
        </div>
      </div>
    </article>
  );
}

function InputField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        type="text"
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
        <option value="">All</option>

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