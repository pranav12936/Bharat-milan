import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
} from "lucide-react";

import {
  useGetMyProfile,
  useUpdateProfileVisibility,
} from "@workspace/api-client-react";

export default function PrivacySettings() {
  const [, setLocation] = useLocation();

  const profile = useGetMyProfile();
  const updateVisibility = useUpdateProfileVisibility();

  const [visibility, setVisibility] = useState<
    "public" | "private"
  >("private");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile.data?.visibility) {
      setVisibility(profile.data.visibility);
    }
  }, [profile.data?.visibility]);

  function saveSettings() {
    setMessage("");
    setError("");

    updateVisibility.mutate(
      {
        data: {
          visibility,
        },
      },
      {
        onSuccess: async () => {
          setMessage("Privacy settings saved successfully.");
          await profile.refetch();
        },
        onError: () => {
          setError(
            "Could not save privacy settings. Please try again.",
          );
        },
      },
    );
  }

  if (profile.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Profile not found
          </h1>

          <button
            type="button"
            onClick={() => setLocation("/profile-setup")}
            className="mt-5 rounded-lg bg-primary px-5 py-2 text-primary-foreground"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLocation("/my-profile")}
            className="rounded-full border p-2"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold">
              Privacy Settings
            </h1>

            <p className="mt-1 text-muted-foreground">
              Control how your profile is visible to other members.
            </p>
          </div>
        </div>

        {/* SECURITY INFO */}
        <div className="mb-6 flex gap-4 rounded-2xl border bg-card p-5">
          <div className="shrink-0 rounded-full border p-3">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <h2 className="font-semibold">
              Your privacy matters
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              You can change your profile visibility at any time.
            </p>
          </div>
        </div>

        {/* VISIBILITY */}
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">
            Profile Visibility
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose who can discover your profile.
          </p>

          <div className="mt-6 space-y-4">
            {/* PUBLIC */}
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`w-full rounded-xl border p-5 text-left transition ${
                visibility === "public"
                  ? "ring-2"
                  : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-full border p-3">
                  <Eye className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">
                      Public Profile
                    </h3>

                    {visibility === "public" && (
                      <span className="rounded-full border px-3 py-1 text-xs font-medium">
                        Selected
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Your profile can appear in member discovery
                    results.
                  </p>
                </div>
              </div>
            </button>

            {/* PRIVATE */}
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`w-full rounded-xl border p-5 text-left transition ${
                visibility === "private"
                  ? "ring-2"
                  : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-full border p-3">
                  <EyeOff className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">
                      Private Profile
                    </h3>

                    {visibility === "private" && (
                      <span className="rounded-full border px-3 py-1 text-xs font-medium">
                        Selected
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Your profile is hidden from normal discovery
                    results.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* SAVE */}
          <button
            type="button"
            onClick={saveSettings}
            disabled={updateVisibility.isPending}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50"
          >
            {updateVisibility.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Privacy Settings
              </>
            )}
          </button>

          {/* MESSAGE */}
          {message && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border p-4 text-sm">
              <ShieldCheck className="h-5 w-5" />
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border p-4 text-sm">
              {error}
            </div>
          )}
        </section>

        {/* CONTACT PRIVACY */}
        <section className="mt-6 rounded-2xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full border p-3">
              <Lock className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Contact Information
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your private contact information should not be
                displayed publicly on your profile.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}