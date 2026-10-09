import { useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import {
  useDeletePhoto,
  useGetMyProfile,
  useUpdatePhoto,
  useUploadPhoto,
} from "@workspace/api-client-react";

export default function ManagePhotos() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = useGetMyProfile();
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const updatePhoto = useUpdatePhoto();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const photos = profile.data?.photos ?? [];

  function chooseFiles() {
    setMessage("");
    setError("");
    fileInputRef.current?.click();
  }

  async function handleFiles(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) return;

    setMessage("");
    setError("");

    for (const file of files) {
      if (
        file.type !== "image/jpeg" &&
        file.type !== "image/png"
      ) {
        setError(
          `${file.name}: Only JPG and PNG images are allowed.`,
        );
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(
          `${file.name}: Image must be smaller than 5 MB.`,
        );
        continue;
      }

      try {
        await new Promise<void>((resolve, reject) => {
          uploadPhoto.mutate(
            {
              data: {
                file,
                isPrimary: photos.length === 0,
              },
            },
            {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            },
          );
        });
      } catch {
        setError(
          `Could not upload ${file.name}. Please try again.`,
        );
      }
    }

    setMessage("Photo upload completed.");

    await profile.refetch();

    event.target.value = "";
  }

  function makePrimary(id: string) {
    setMessage("");
    setError("");

    updatePhoto.mutate(
      {
        id,
        data: {
          isPrimary: true,
        },
      },
      {
        onSuccess: async () => {
          setMessage("Primary photo updated.");
          await profile.refetch();
        },
        onError: () => {
          setError(
            "Could not update the primary photo.",
          );
        },
      },
    );
  }

  function removePhoto(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this photo?",
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    deletePhoto.mutate(
      {
        id,
      },
      {
        onSuccess: async () => {
          setMessage("Photo deleted.");
          await profile.refetch();
        },
        onError: () => {
          setError("Could not delete the photo.");
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
            onClick={() =>
              setLocation("/profile-setup")
            }
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
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              setLocation("/my-profile")
            }
            className="rounded-full border p-2"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold">
              Manage Photos
            </h1>

            <p className="mt-1 text-muted-foreground">
              Add, remove, or change your primary photo.
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

        {/* UPLOAD */}
        <section className="mb-8 rounded-2xl border bg-card p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full border p-4">
              <Camera className="h-8 w-8" />
            </div>

            <h2 className="text-xl font-semibold">
              Add Photos
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Upload JPG or PNG images up to 5 MB each.
            </p>

            <button
              type="button"
              onClick={chooseFiles}
              disabled={uploadPhoto.isPending}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50"
            >
              {uploadPhoto.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImagePlus className="h-5 w-5" />
                  Choose Photos
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </div>
        </section>

        {/* PHOTOS */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Your Photos
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {photos.length}{" "}
                {photos.length === 1
                  ? "photo"
                  : "photos"}
              </p>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground" />

              <p className="mt-4 font-medium">
                No photos uploaded
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your first photo above.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border"
                >
                  {/* IMAGE */}
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={photo.url}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />

                    {photo.isPrimary && (
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-semibold">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        Primary
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 p-3">
                    {!photo.isPrimary && (
                      <button
                        type="button"
                        onClick={() =>
                          makePrimary(photo.id)
                        }
                        disabled={
                          updatePhoto.isPending
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                      >
                        <Star className="h-4 w-4" />
                        Make Primary
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removePhoto(photo.id)
                      }
                      disabled={
                        deletePhoto.isPending
                      }
                      className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}