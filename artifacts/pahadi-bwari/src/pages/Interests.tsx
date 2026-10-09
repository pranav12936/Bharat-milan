import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Check,
  Heart,
  Loader2,
  X,
} from "lucide-react";

import {
  useListInterests,
  useUpdateInterest,
} from "@workspace/api-client-react";

type InterestItem = {
  id: string;
  status?: string | null;
  createdAt?: string | null;
  profile?: {
    id?: string;
    fullName?: string | null;
    age?: number | null;
    gender?: string | null;
    city?: string | null;
    district?: string | null;
    education?: string | null;
    profession?: string | null;
    about?: string | null;
    photos?: Array<{
      id?: string;
      url?: string | null;
      isPrimary?: boolean | null;
    }>;
  } | null;
};

export default function Interests() {
  const [, setLocation] = useLocation();

  const interests = useListInterests();
  const updateInterest = useUpdateInterest();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const data = interests.data as
    | InterestItem[]
    | {
        received?: InterestItem[];
        sent?: InterestItem[];
      }
    | undefined;

  const received = Array.isArray(data)
    ? data
    : data?.received ?? [];

  const sent = Array.isArray(data)
    ? []
    : data?.sent ?? [];

  function updateStatus(
    id: string,
    status: "accepted" | "declined",
  ) {
    setMessage("");
    setError("");

    updateInterest.mutate(
      {
        id,
        data: {
          status,
        },
      },
      {
        onSuccess: async () => {
          setMessage(
            status === "accepted"
              ? "Interest accepted."
              : "Interest declined.",
          );

          await interests.refetch();
        },
        onError: () => {
          setError(
            "Could not update the interest. Please try again.",
          );
        },
      },
    );
  }

  if (interests.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLocation("/dashboard")}
            className="rounded-full border p-2"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold">
              Interests
            </h1>

            <p className="mt-1 text-muted-foreground">
              Manage interests sent to you and interests you sent.
            </p>
          </div>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border p-4 text-sm">
            <Check className="h-5 w-5" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border p-4 text-sm">
            {error}
          </div>
        )}

        {/* RECEIVED */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full border p-3">
              <Heart className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Interests Received
              </h2>

              <p className="text-sm text-muted-foreground">
                People who have expressed interest in your profile.
              </p>
            </div>
          </div>

          {received.length === 0 ? (
            <EmptyState text="You have no new interests." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {received.map((interest) => (
                <InterestCard
                  key={interest.id}
                  interest={interest}
                  received
                  onAccept={() =>
                    updateStatus(
                      interest.id,
                      "accepted",
                    )
                  }
                  onDecline={() =>
                    updateStatus(
                      interest.id,
                      "declined",
                    )
                  }
                  onOpen={() => {
                    if (interest.profile?.id) {
                      setLocation(
                        `/profiles/${interest.profile.id}`,
                      );
                    }
                  }}
                  loading={updateInterest.isPending}
                />
              ))}
            </div>
          )}
        </section>

        {/* SENT */}
        <section className="mt-6 rounded-2xl border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full border p-3">
              <Heart className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Interests Sent
              </h2>

              <p className="text-sm text-muted-foreground">
                Interests you have sent to other profiles.
              </p>
            </div>
          </div>

          {sent.length === 0 ? (
            <EmptyState text="You have not sent any interests yet." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {sent.map((interest) => (
                <InterestCard
                  key={interest.id}
                  interest={interest}
                  onOpen={() => {
                    if (interest.profile?.id) {
                      setLocation(
                        `/profiles/${interest.profile.id}`,
                      );
                    }
                  }}
                  loading={false}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InterestCard({
  interest,
  received = false,
  onAccept,
  onDecline,
  onOpen,
  loading,
}: {
  interest: InterestItem;
  received?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onOpen?: () => void;
  loading: boolean;
}) {
  const person = interest.profile;

  const primaryPhoto =
    person?.photos?.find(
      (photo) => photo.isPrimary,
    )?.url ??
    person?.photos?.[0]?.url ??
    null;

  return (
    <div className="overflow-hidden rounded-xl border">
      {/* PHOTO */}
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
      >
        <div className="aspect-[4/3] bg-muted">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt={person?.fullName ?? "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="p-4">
          <h3 className="text-lg font-semibold">
            {person?.fullName ?? "Member"}
          </h3>

          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {person?.age != null && (
              <p>Age: {person.age}</p>
            )}

            {person?.gender && (
              <p>{person.gender}</p>
            )}

            {person?.city && (
              <p>{person.city}</p>
            )}

            {person?.district && (
              <p>{person.district}</p>
            )}

            {person?.education && (
              <p>{person.education}</p>
            )}

            {person?.profession && (
              <p>{person.profession}</p>
            )}
          </div>

          {person?.about && (
            <p className="mt-3 line-clamp-2 text-sm">
              {person.about}
            </p>
          )}
        </div>
      </button>

      {/* STATUS */}
      <div className="border-t p-4">
        <div className="mb-3 text-sm">
          <span className="font-medium">
            Status:
          </span>{" "}
          <span className="capitalize text-muted-foreground">
            {interest.status ?? "pending"}
          </span>
        </div>

        {/* RECEIVED ACTIONS */}
        {received &&
          interest.status === "pending" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onAccept}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                Accept
              </button>

              <button
                type="button"
                onClick={onDecline}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Decline
              </button>
            </div>
          )}

        {/* ACCEPTED */}
        {interest.status === "accepted" && (
          <div className="rounded-lg border p-3 text-center text-sm">
            <Check className="mx-auto mb-1 h-5 w-5" />
            Interest accepted
          </div>
        )}

        {/* DECLINED */}
        {interest.status === "declined" && (
          <div className="rounded-lg border p-3 text-center text-sm">
            Interest declined
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <Heart className="mx-auto h-10 w-10 text-muted-foreground" />

      <p className="mt-4 font-medium">
        {text}
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        Check Discover to find profiles.
      </p>
    </div>
  );
}