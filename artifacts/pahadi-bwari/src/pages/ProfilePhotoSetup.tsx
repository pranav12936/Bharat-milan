
import * as React from "react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  getGetMyProfileQueryKey,
  useCompletePhotoUpload,
  useDeletePhoto,
  useGetMyProfile,
  useRequestUploadUrl,
} from "@workspace/api-client-react";


function errorText(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "error" in error
  ) {
    return String(
      (error as { error?: string }).error ||
        "Something went wrong.",
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

/* =========================================================
   PHOTO CROPPER
   ========================================================= */

function PhotoCropper({
  file,
  onCancel,
  onCrop,
}: {
  file: File;
  onCancel: () => void;
  onCrop: (croppedFile: File) => void;
}) {
  const cropAreaRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageUrl, setImageUrl] = useState("");
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [dragging, setDragging] = useState(false);

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  const [startPosition, setStartPosition] = useState({
    x: 0,
    y: 0,
  });

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);

    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const setupImage = () => {
    const image = imageRef.current;
    const cropArea = cropAreaRef.current;

    if (!image || !cropArea) {
      return;
    }

    const cropWidth = cropArea.clientWidth;
    const cropHeight = cropArea.clientHeight;

    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    if (!imageWidth || !imageHeight) {
      return;
    }

    const coverScale = Math.max(
      cropWidth / imageWidth,
      cropHeight / imageHeight,
    );

    setBaseScale(coverScale);
    setScale(1);

    const displayedWidth =
      imageWidth * coverScale;

    const displayedHeight =
      imageHeight * coverScale;

    setPosition({
      x: (cropWidth - displayedWidth) / 2,
      y: (cropHeight - displayedHeight) / 2,
    });
  };

  const getDisplayedSize = () => {
    const image = imageRef.current;

    if (!image) {
      return {
        width: 0,
        height: 0,
      };
    }

    return {
      width:
        image.naturalWidth *
        baseScale *
        scale,

      height:
        image.naturalHeight *
        baseScale *
        scale,
    };
  };

  const clampPosition = (
    x: number,
    y: number,
    nextScale = scale,
  ) => {
    const cropArea = cropAreaRef.current;
    const image = imageRef.current;

    if (!cropArea || !image) {
      return { x, y };
    }

    const cropWidth = cropArea.clientWidth;
    const cropHeight = cropArea.clientHeight;

    const imageWidth =
      image.naturalWidth *
      baseScale *
      nextScale;

    const imageHeight =
      image.naturalHeight *
      baseScale *
      nextScale;

    const minX = cropWidth - imageWidth;
    const maxX = 0;

    const minY = cropHeight - imageHeight;
    const maxY = 0;

    return {
      x: Math.min(
        maxX,
        Math.max(minX, x),
      ),

      y: Math.min(
        maxY,
        Math.max(minY, y),
      ),
    };
  };

  const startDrag = (
    event: PointerEvent<HTMLImageElement>,
  ) => {
    event.preventDefault();

    setDragging(true);

    setDragStart({
      x: event.clientX,
      y: event.clientY,
    });

    setStartPosition(position);
  };

  const moveDrag = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (!dragging) {
      return;
    }

    const deltaX =
      event.clientX - dragStart.x;

    const deltaY =
      event.clientY - dragStart.y;

    const next = clampPosition(
      startPosition.x + deltaX,
      startPosition.y + deltaY,
    );

    setPosition(next);
  };

  const stopDrag = () => {
    setDragging(false);
  };

  const changeZoom = (value: number) => {
    const nextScale = Number(value);

    const cropArea =
      cropAreaRef.current;

    const image =
      imageRef.current;

    if (!cropArea || !image) {
      setScale(nextScale);
      return;
    }

    const centerX =
      cropArea.clientWidth / 2;

    const centerY =
      cropArea.clientHeight / 2;

    const oldWidth =
      image.naturalWidth *
      baseScale *
      scale;

    const oldHeight =
      image.naturalHeight *
      baseScale *
      scale;

    const oldCenterX =
      position.x + oldWidth / 2;

    const oldCenterY =
      position.y + oldHeight / 2;

    const newWidth =
      image.naturalWidth *
      baseScale *
      nextScale;

    const newHeight =
      image.naturalHeight *
      baseScale *
      nextScale;

    const ratioX =
      oldWidth > 0
        ? (oldCenterX - centerX) /
          oldWidth
        : 0;

    const ratioY =
      oldHeight > 0
        ? (oldCenterY - centerY) /
          oldHeight
        : 0;

    const nextX =
      centerX +
      ratioX * newWidth -
      newWidth / 2;

    const nextY =
      centerY +
      ratioY * newHeight -
      newHeight / 2;

    setScale(nextScale);

    setPosition(
      clampPosition(
        nextX,
        nextY,
        nextScale,
      ),
    );
  };

  const cropImage = async () => {
    const image = imageRef.current;
    const cropArea = cropAreaRef.current;

    if (
      !image ||
      !cropArea ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(true);

      const cropWidth =
        cropArea.clientWidth;

      const cropHeight =
        cropArea.clientHeight;

      const displayedScale =
        baseScale * scale;

      const sourceX =
        Math.max(0, -position.x) /
        displayedScale;

      const sourceY =
        Math.max(0, -position.y) /
        displayedScale;

      const sourceWidth =
        cropWidth /
        displayedScale;

      const sourceHeight =
        cropHeight /
        displayedScale;

      const outputWidth = 1200;
      const outputHeight = 900;

      const canvas =
        document.createElement(
          "canvas",
        );

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const context =
        canvas.getContext("2d");

      if (!context) {
        throw new Error(
          "Could not create image crop.",
        );
      }

      context.imageSmoothingEnabled =
        true;

      context.imageSmoothingQuality =
        "high";

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );

      const blob =
        await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              resolve,
              "image/jpeg",
              0.92,
            );
          },
        );

      if (!blob) {
        throw new Error(
          "Could not create cropped image.",
        );
      }

      const croppedFile =
        new File(
          [blob],
          file.name.replace(
            /\.(jpg|jpeg|png)$/i,
            "",
          ) + "-cropped.jpg",
          {
            type: "image/jpeg",
            lastModified:
              Date.now(),
          },
        );

      onCrop(croppedFile);
    } catch (error) {
      console.error(
        "PHOTO CROP ERROR",
        error,
      );
    } finally {
      setProcessing(false);
    }
  };

  const displayedSize =
    getDisplayedSize();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              Profile photo
            </p>

            <h2 className="mt-1 font-display text-2xl text-primary">
              Position your photo
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Drag and zoom until the photo looks right.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="grid size-10 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-primary disabled:opacity-50"
            aria-label="Close crop editor"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-black p-4">
          <div
            ref={cropAreaRef}
            className="relative mx-auto aspect-[4/3] w-full max-w-xl touch-none overflow-hidden rounded-2xl bg-black"
            onPointerMove={moveDrag}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            onPointerLeave={stopDrag}
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                draggable={false}
                onLoad={setupImage}
                onPointerDown={startDrag}
                className={`absolute max-w-none select-none ${
                  dragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
                }`}
                style={{
                  width: `${displayedSize.width}px`,
                  height: `${displayedSize.height}px`,
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  userSelect: "none",
                  touchAction: "none",
                }}
              />
            )}

            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/90">
              <div className="absolute inset-0">
                <div className="absolute left-1/3 top-0 h-full border-l border-white/30" />
                <div className="absolute left-2/3 top-0 h-full border-l border-white/30" />

                <div className="absolute left-0 top-1/3 w-full border-t border-white/30" />
                <div className="absolute left-0 top-2/3 w-full border-t border-white/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">
                Zoom
              </span>

              <span className="text-xs text-muted-foreground">
                Drag photo to reposition
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                −
              </span>

              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={scale}
                onChange={(event) =>
                  changeZoom(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="w-full accent-primary"
                aria-label="Zoom photo"
              />

              <span className="text-sm text-muted-foreground">
                +
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="min-h-11 rounded-xl border border-border px-5 text-sm font-bold text-primary transition hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={cropImage}
              disabled={
                processing ||
                !imageUrl
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Preparing photo…
                </>
              ) : (
                "Crop & continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE PHOTO SETUP
   ========================================================= */

export default function ProfilePhotoSetup() {
  const queryClient =
    useQueryClient();

  const profile =
    useGetMyProfile({
      query: {
        queryKey:
          getGetMyProfileQueryKey(),
      },
    });

  const requestUrl =
    useRequestUploadUrl();

  const completePhoto =
    useCompletePhotoUpload();

  const deletePhoto =
    useDeletePhoto();

  const [cropFile, setCropFile] =
    useState<File | null>(null);

  const [toast, setToast] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [completing, setCompleting] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [completionStage, setCompletionStage] =
    useState(0);

  const photos =
    profile.data?.photos ?? [];

  const primaryPhoto =
    photos.find(
      (photo) => photo.isPrimary,
    ) ?? photos[0] ?? null;

  /* =====================================================
     SELECT PHOTO
     ===================================================== */

  const onFile = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setToast("");

    if (
      ![
        "image/jpeg",
        "image/png",
      ].includes(file.type)
    ) {
      setToast(
        "Please choose a JPG, JPEG, or PNG image.",
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setToast(
        "Please choose an image under 5 MB.",
      );

      event.target.value = "";
      return;
    }

    setCropFile(file);

    event.target.value = "";
  };

  /* =====================================================
     UPLOAD CROPPED PHOTO
     ===================================================== */

  const uploadCroppedFile =
    async (file: File) => {
      try {
        setUploading(true);
        setToast("");

        /*
         * Request storage upload URL.
         *
         * Authentication is now handled by the
         * custom authentication cookie through
         * the API client's credentials.
         */
        const upload =
          await requestUrl.mutateAsync(
            {
              data: {
                name: file.name,
                size: file.size,
                contentType:
                  file.type as
                    | "image/jpeg"
                    | "image/png",
              },
            },
          );

        /*
         * Upload the actual file.
         *
         * The upload URL is already provided by
         * the backend, so no Clerk Authorization
         * header is required here.
         */
        const stored =
          await fetch(
            upload.uploadURL,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  file.type,
              },
              body: file,
            },
          );

        if (!stored.ok) {
          throw new Error(
            `Photo upload failed (${stored.status}).`,
          );
        }

        await completePhoto.mutateAsync(
          {
            data: {
              objectPath:
                upload.objectPath,

              fileType:
                file.type as
                  | "image/jpeg"
                  | "image/png",

              isPrimary: true,
            },
          },
        );

        await queryClient.invalidateQueries(
          {
            queryKey:
              getGetMyProfileQueryKey(),
          },
        );

        setCropFile(null);

        setToast(
          "Your primary profile photo is ready.",
        );
      } catch (error) {
        console.error(
          "PROFILE PHOTO UPLOAD ERROR",
          error,
        );

        setToast(
          errorText(error),
        );
      } finally {
        setUploading(false);
      }
    };

  /* =====================================================
     DELETE PHOTO
     ===================================================== */

  const removePhoto =
    async () => {
      if (!primaryPhoto) {
        return;
      }

      const confirmed =
        window.confirm(
          "Remove this profile photo?",
        );

      if (!confirmed) {
        return;
      }

      try {
        setToast("");

        await deletePhoto.mutateAsync(
          {
            id: primaryPhoto.id,
          },
        );

        await queryClient.invalidateQueries(
          {
            queryKey:
              getGetMyProfileQueryKey(),
          },
        );

        setToast(
          "Photo removed. You can choose another one.",
        );
      } catch (error) {
        setToast(
          errorText(error),
        );
      }
    };

  /* =====================================================
     COMPLETE PROFILE
     ===================================================== */

  const finishProfile =
    async () => {
      if (!primaryPhoto) {
        setToast(
          "Please add a primary profile photo first.",
        );

        return;
      }

      if (completing || completed) {
        return;
      }

      try {
        setCompleting(true);
        setToast("");
        setCompletionStage(1);

        /*
         * Authentication is now handled by the
         * custom auth session cookie.
         */
        const response =
          await fetch(
            "/api/profile/setup/complete",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials: "include",

              body: JSON.stringify({}),
            },
          );

        const raw =
          await response.text();

        let result: unknown =
          null;

        try {
          result =
            raw
              ? JSON.parse(raw)
              : null;
        } catch {
          result = raw;
        }

        if (!response.ok) {
          if (
            result &&
            typeof result ===
              "object" &&
            "error" in result
          ) {
            throw new Error(
              String(
                (
                  result as {
                    error?: string;
                  }
                ).error ||
                  "Could not complete your profile.",
              ),
            );
          }

          throw new Error(
            `Could not complete your profile (${response.status}).`,
          );
        }

        setCompletionStage(2);

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              450,
            ),
        );

        setCompletionStage(3);

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              650,
            ),
        );

        setCompletionStage(4);

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              500,
            ),
        );

        setCompleted(true);
      } catch (error) {
        console.error(
          "PROFILE COMPLETION ERROR",
          error,
        );

        setCompletionStage(0);

        setToast(
          errorText(error),
        );
      } finally {
        setCompleting(false);
      }
    };

  /* =====================================================
     COMPLETED SCREEN
     ===================================================== */

  if (completed) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <div className="mx-auto flex min-h-[100dvh] max-w-3xl items-center justify-center px-5 py-12">
          <div className="w-full text-center">
            <div className="mx-auto max-w-xl">
              <div className="relative mx-auto mb-8 grid size-28 place-items-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />

                <div className="relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl">
                  <Check
                    size={46}
                    strokeWidth={3}
                    className="animate-[scale-in_0.45s_ease-out]"
                  />
                </div>
              </div>

              <p className="font-mono-ui text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
                Profile complete
              </p>

              <h1 className="mt-3 font-display text-4xl leading-tight text-primary sm:text-5xl">
                Your profile is ready.
              </h1>

              <p className="mx-auto mt-5 max-w-md text-base leading-7 text-muted-foreground">
                Your profile setup has been completed successfully.
              </p>

              <div className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Check size={20} />
                </div>

                <div className="text-left">
                  <p className="text-sm font-bold text-primary">
                    Setup completed
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Your primary photo has been saved.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="mx-auto mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN PAGE
     ===================================================== */

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                Final step
              </p>

              <h1 className="mt-2 font-display text-4xl leading-tight text-primary sm:text-5xl">
                Add your profile photo
              </h1>
            </div>

            <div className="hidden rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary sm:block">
              Step 6 of 6
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-full rounded-full bg-primary transition-all" />
          </div>
        </div>

        {completing && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                {completionStage >= 3 ? (
                  <Check
                    size={22}
                    className="animate-pulse"
                  />
                ) : (
                  <Loader2
                    size={22}
                    className="animate-spin"
                  />
                )}
              </div>

              <div>
                <p className="font-semibold text-primary">
                  {completionStage === 1 &&
                    "Saving your profile..."}

                  {completionStage === 2 &&
                    "Checking your profile..."}

                  {completionStage === 3 &&
                    "Profile details saved..."}

                  {completionStage >= 4 &&
                    "Almost finished..."}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Please wait a moment.
                </p>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm text-primary shadow-sm"
            role="status"
          >
            {toast}
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
          {primaryPhoto ? (
            <>
              <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl bg-secondary">
                <div className="aspect-[4/3]">
                  {primaryPhoto.url ? (
                    <img
                      src={primaryPhoto.url}
                      alt="Your primary profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <ImagePlus
                        size={42}
                      />
                    </div>
                  )}
                </div>

                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl bg-black/65 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm">
                  <Check size={15} />
                  Primary photo
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <label
                  className={`inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-primary transition hover:bg-secondary ${
                    uploading ||
                    completing
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  <Upload size={17} />

                  Change photo

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="sr-only"
                    onChange={onFile}
                    disabled={
                      uploading ||
                      completing
                    }
                  />
                </label>

                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={
                    uploading ||
                    completing ||
                    deletePhoto.isPending
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive/20 px-4 text-sm font-bold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletePhoto.isPending ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  Delete photo
                </button>
              </div>

              <div className="mt-7 border-t border-border pt-7">
                <div className="mb-4">
                  <h2 className="font-display text-2xl text-primary">
                    Ready to finish?
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Your photo will be saved as your primary profile photo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={finishProfile}
                  disabled={
                    completing ||
                    uploading
                  }
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {completing ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Completing profile...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save & Complete Profile
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center sm:py-12">
              <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ImagePlus
                  size={34}
                />
              </div>

              <h2 className="mt-6 font-display text-3xl text-primary">
                Choose your primary photo
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Choose a JPG or PNG image. You can crop, zoom, and reposition it before saving.
              </p>

              <label
                className={`mx-auto mt-7 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 ${
                  uploading ||
                  completing
                    ? "pointer-events-none opacity-60"
                    : ""
                }`}
              >
                <Upload size={18} />

                Choose Profile Photo

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="sr-only"
                  onChange={onFile}
                  disabled={
                    uploading ||
                    completing
                  }
                />
              </label>

              <p className="mt-4 text-xs text-muted-foreground">
                JPG, JPEG, or PNG · Maximum 5 MB
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-5">
          <div className="flex gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Check size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold text-primary">
                Your profile photo is part of your public profile.
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Only upload a photo you are comfortable using as your profile image.
              </p>
            </div>
          </div>
        </div>
      </div>

      {cropFile && (
        <PhotoCropper
          file={cropFile}
          onCancel={() =>
            setCropFile(null)
          }
          onCrop={
            uploadCroppedFile
          }
        />
      )}
    </div>
  );
}