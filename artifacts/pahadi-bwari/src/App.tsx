import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Compass,
  ChevronDown,
  Eye,
  FileText,
  Flag,
  GraduationCap,
    Heart,
  ImagePlus,
  Images,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  PhoneCall,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import {
  getGetAdminStatsQueryKey, getGetDashboardQueryKey, getGetMyProfileQueryKey,
  getGetProfileQueryKey, getHealthCheckQueryKey, getListAdminReportsQueryKey,
  getListInterestsQueryKey, getListProfilesQueryKey, useCreateReport, useDeletePhoto,
  useExpressInterest, useGetAdminStats, useGetDashboard, useGetMyProfile, useGetProfile,
  useCompletePhotoUpload, useHealthCheck, useListAdminReports, useListInterests, useListProfiles,
  useRequestUploadUrl, useUpdateInterest, useUpdateMyProfile, useUpdatePhoto,
  useUpdateProfileVisibility, useUploadPhoto,
  ReportInputReason, InterestUpdateStatus, type ProfileInput, type PublicProfile,
  setAuthTokenGetter,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import ProfilePhotoSetup from "./pages/ProfilePhotoSetup";
import image2 from "./images/2.jpg";
import hero from "./images/hero.jpg";
import image3 from "./images/3.jpg";
import image4 from "./images/4.jpg";
import image5 from "./images/5.jpg";
import last from "./images/last.avif"
import image6 from "./images/6.jpeg"
import ProfileSetup from "./pages/ProfileSetup";
import { AuthProvider, useAuth } from "./Auth/auth";

const queryClient = new QueryClient();
function initials(name = '') {
  return (
    name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'PB'
  );
}

function errorText(error: unknown) {
  if (error && typeof error === 'object' && 'error' in error) {
    return String((error as { error?: string }).error);
  }

  return 'Something went wrong. Please try again in a moment.';
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center">
      <img
        src={image6}
        alt="BharatMilan"
        className={compact ? "h-14 w-auto object-contain" : "h-24 w-auto object-contain"}
      />
    </div>
  );
}

function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'quiet' | 'outline' | 'danger';
}) {
  const variants = {
    primary:
      'bg-[#8f1731] text-white shadow-sm hover:bg-[#741229]',
    quiet:
      'bg-secondary text-secondary-foreground hover:bg-secondary/75',
    outline:
      'border border-border bg-card text-foreground hover:border-[#8f1731]/40 hover:bg-secondary/40',
    danger:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  return (
    <button
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function TextInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
      )}

      <input
        className="focus-ring h-11 w-full rounded-xl border border-input bg-background/70 px-3.5 text-sm outline-none transition focus:border-[#8f1731]"
        {...props}
      />
    </label>
  );
}

function SelectInput({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
      )}

      <select
        className="focus-ring h-11 w-full rounded-xl border border-input bg-background/70 px-3.5 text-sm outline-none transition focus:border-[#8f1731]"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
      )}

      <textarea
        className="focus-ring min-h-28 w-full resize-y rounded-xl border border-input bg-background/70 px-3.5 py-3 text-sm outline-none transition focus:border-[#8f1731]"
        {...props}
      />
    </label>
  );
}

function Toast({
  message,
  tone = 'success',
  onClose,
}: {
  message: string;
  tone?: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);

    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 flex max-w-sm items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm shadow-xl ${tone === 'success'
          ? 'border-[#8f1731]/20'
          : 'border-destructive/30'
        }`}
      role="status"
      data-testid="status-toast"
    >
      <span
        className={`grid size-7 place-items-center rounded-full ${tone === 'success'
            ? 'bg-[#8f1731]/10 text-[#8f1731]'
            : 'bg-destructive/10 text-destructive'
          }`}
      >
        {tone === 'success' ? (
          <Check size={15} />
        ) : (
          <CircleAlert size={15} />
        )}
      </span>

      <span>{message}</span>

      <button
        onClick={onClose}
        aria-label="Close notification"
        data-testid="button-close-toast"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-secondary ${className}`}
    />
  );
}

/* =========================================================
   PUBLIC WEBSITE
   ========================================================= */

function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
        <Logo />

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <Link
            href="/about"
            className="transition hover:text-primary"
            data-testid="link-about"
          >
            About
          </Link>

          <Link
            href="/how-it-works"
            className="transition hover:text-primary"
            data-testid="link-how-it-works"
          >
            How it works
          </Link>

          <Link
            href="/safety"
            className="transition hover:text-primary"
            data-testid="link-safety"
          >
            Safety
          </Link>

          <a
            href="#featured"
            className="transition hover:text-primary"
          >
            Featured
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="focus-ring hidden min-h-11 items-center rounded-xl px-4 text-sm font-semibold hover:bg-secondary sm:inline-flex"
            data-testid="link-sign-in-header"
          >
            Sign in
          </Link>

          <Link
            href="/sign-up"
            className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-red-600 px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-red-700"
            data-testid="link-sign-up-header"
          >
            Free Registration
          </Link>
        </div>
      </div>
    </header>
  );
}



function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#171313] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">

        <div>
          <Logo />

          <p className="mt-6 max-w-sm text-sm leading-7 text-white/60">
            A modern matrimonial platform for adults around the world
            looking for meaningful introductions, genuine connections,
            and a thoughtful path toward marriage.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            Discover
          </p>

          <div className="mt-5 grid gap-3 text-sm text-white/70">
            <Link href="/about" className="hover:text-white">
              About us
            </Link>

            <Link href="/how-it-works" className="hover:text-white">
              How it works
            </Link>

            <Link href="/safety" className="hover:text-white">
              Safety
            </Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            Account
          </p>

          <div className="mt-5 grid gap-3 text-sm text-white/70">
            <Link href="/sign-up" className="hover:text-white">
              Create profile
            </Link>

            <Link href="/sign-in" className="hover:text-white">
              Sign in
            </Link>

            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            Privacy
          </p>

          <div className="mt-5 grid gap-3 text-sm text-white/70">
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy policy
            </Link>

            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>

            <Link href="/safety" className="hover:text-white">
              Safety guidelines
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-white/40">
        © 2026 Bharat Milan · Built for meaningful connections worldwide
      </div>
    </footer>
  );
}


function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#fffaf8] text-[#201717]">
      <PublicHeader />
      {children}
      <Footer />
    </div>
  );
}


function MountainScene() {
  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-[2rem]">
      <img
        src={image5}
        alt="Indian wedding couple"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <div className="absolute bottom-7 left-7 right-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
          Meaningful introductions
        </p>

        <p className="mt-2 font-display text-3xl italic">
          Where two stories begin.
        </p>
      </div>
    </div>
  );
}


function Home() {
  const health = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
    },
  });

  return (
    <PublicLayout>
      <main>

        {/* =========================================================
            HERO
        ========================================================== */}

        <section className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[#5f1018]">

          <img src={hero} alt="Bharat Milan"
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          <div className="relative mx-auto flex min-h-[calc(100vh-76px)] max-w-[1440px] items-end px-5 pb-12 pt-20 lg:px-10 lg:pb-20">

            <div className="max-w-3xl text-white">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-4 py-2 text-xs font-semibold backdrop-blur-md">
                <span className="size-2 rounded-full bg-red-400" />
                A modern matrimonial platform
              </div>

              <h1 className="font-display text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.88] tracking-[-0.045em]">
                Find someone
                <br />
                <em className="text-[#ffb1a7]">
                  forever connection
                </em>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-white/80 md:text-xl md:leading-8">
                Meet genuine people, discover meaningful profiles,
                and take your time getting to know someone who shares
                your values.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">

                <Link
                  href="/sign-up"
                  className="focus-ring inline-flex min-h-13 items-center gap-3 rounded-xl bg-[#c92835] px-6 text-sm font-bold text-white shadow-xl transition hover:bg-[#b51f2b]"
                  data-testid="link-hero-join"
                >
                  Create your profile
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#discover"
                  className="focus-ring inline-flex min-h-13 items-center rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Explore Bharat Milan
                </a>

              </div>

              <div className="mt-8 flex flex-wrap gap-5 text-xs text-white/70">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Privacy focused
                </span>

                <span className="flex items-center gap-2">
                  <BadgeCheck size={16} />
                  Genuine profiles
                </span>

                <span className="flex items-center gap-2">
                  <LockKeyhole size={16} />
                  Contact details protected
                </span>
              </div>

            </div>
          </div>
        </section>


        {/* =========================================================
            SEARCH / DISCOVER
        ========================================================== */}

        <section
          id="discover"
          className="relative z-10 mx-auto -mt-10 max-w-6xl px-5"
        >
          <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-2xl md:p-7">

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Start discovering
              </p>

              <h2 className="mt-2 font-display text-3xl text-[#211719] md:text-4xl">
                Who would you like to meet?
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-4">

              <div className="rounded-xl border border-black/10 bg-[#fffaf8] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  Looking for
                </p>

                <p className="mt-1 text-sm font-semibold">
                  A life partner
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-[#fffaf8] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  Location
                </p>

                <p className="mt-1 text-sm font-semibold">
                  Anywhere
                </p>
              </div>

              <div className="rounded-xl border border-black/10 bg-[#fffaf8] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  Age
                </p>

                <p className="mt-1 text-sm font-semibold">
                  21 – 35
                </p>
              </div>

              <Link
                href="/sign-up"
                className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                Start exploring
                <Search size={17} />
              </Link>

            </div>

            <p className="mt-4 text-xs text-black/45">
              You can use detailed filters after creating your profile.
            </p>

          </div>
        </section>


        {/* =========================================================
            TRUST BAR
        ========================================================== */}

        <section className="border-b border-black/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-3 lg:px-10">

            <div className="flex items-center gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-red-50 text-primary">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p className="font-bold">Privacy first</p>
                <p className="mt-1 text-sm text-black/55">
                  Your contact details stay protected.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-red-50 text-primary">
                <BadgeCheck size={22} />
              </div>

              <div>
                <p className="font-bold">Meaningful profiles</p>
                <p className="mt-1 text-sm text-black/55">
                  Learn about people before connecting.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-red-50 text-primary">
                <Heart size={22} />
              </div>

              <div>
                <p className="font-bold">Your pace</p>
                <p className="mt-1 text-sm text-black/55">
                  Take your time with every introduction.
                </p>
              </div>
            </div>

          </div>
        </section>


        {/* =========================================================
            INTRODUCTION
        ========================================================== */}

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-10">

          <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center">

            <div className="overflow-hidden rounded-[2rem]">

              <img
                src={image5}
                alt="Happy couple in traditional wedding clothing"
                className="h-[560px] w-full object-cover transition duration-700 hover:scale-[1.02]"
                loading="lazy"
              />

            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                More than a profile
              </p>

              <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-tight text-[#27191b] md:text-7xl">
                Get to know
                <br />
                the person
                <br />
                <em className="text-primary">
                  behind the profile.
                </em>
              </h2>

              <p className="mt-8 max-w-xl text-lg leading-8 text-black/60">
                A good introduction is about more than a photograph.
                Discover someone's education, work, location, interests,
                family context, and what they are looking for.
              </p>

              <div className="mt-9 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-black/10 bg-white p-5">
                  <Compass className="text-primary" size={22} />

                  <h3 className="mt-4 font-bold">
                    Detailed discovery
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-black/55">
                    Find profiles using meaningful filters rather than
                    endless random scrolling.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-5">
                  <LockKeyhole className="text-primary" size={22} />

                  <h3 className="mt-4 font-bold">
                    Private by design
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-black/55">
                    Important personal contact information stays protected.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =========================================================
            HOW IT WORKS
        ========================================================== */}

        <section className="bg-[#f5e9e6] px-5 py-24 lg:px-10">

          <div className="mx-auto max-w-7xl">

            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                How it works
              </p>

              <h2 className="mt-4 font-display text-5xl leading-none text-[#27191b] md:text-7xl">
                Simple.
                <br />
                <em>Thoughtful.</em>
                <br />
                Human.
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">

              <Feature
                number="01"
                icon={<UserRound size={22} />}
                title="Create your profile"
                body="Tell people about yourself, your interests, your work, your background, and what you are looking for."
              />

              <Feature
                number="02"
                icon={<Search size={22} />}
                title="Discover people"
                body="Explore profiles using age, location, education, profession, community, and other available filters."
              />

              <Feature
                number="03"
                icon={<Heart size={22} />}
                title="Make an introduction"
                body="Send an interest when you find someone you genuinely want to know better."
              />

            </div>

          </div>

        </section>


        {/* =========================================================
            FEATURED PEOPLE VISUAL
        ========================================================== */}

        <section
          id="featured"
          className="mx-auto max-w-7xl px-5 py-24 lg:px-10"
        >

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                People & stories
              </p>

              <h2 className="mt-4 font-display text-5xl leading-none text-[#27191b] md:text-6xl">
                Everyone has
                <br />
                <em>a story.</em>
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-black/55">
              Your future should not be reduced to a swipe.
              Take a closer look at the people and stories behind
              every introduction.
            </p>

          </div>


          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <div className="group overflow-hidden rounded-[1.7rem] bg-black">
              <div className="relative h-[500px]">
                <img
                  src={image2} alt=" Bharat Milan"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
                    Meaningful
                  </p>

                  <p className="mt-1 font-display text-3xl">
                    Connections
                  </p>
                </div>
              </div>
            </div>


            <div className="group overflow-hidden rounded-[1.7rem] bg-black">
              <div className="relative h-[500px]">
                <img
                  src={image3}
                  alt="Couple smiling outdoors"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
                    Genuine
                  </p>

                  <p className="mt-1 font-display text-3xl">
                    Introductions
                  </p>
                </div>
              </div>
            </div>


            <div className="flex min-h-[500px] flex-col justify-between rounded-[1.7rem] bg-primary p-8 text-white">

              <div>
                <Heart size={30} />

                <p className="mt-8 font-display text-4xl leading-tight">
                  Your story
                  <br />
                  deserves
                  <br />
                  <em>a beginning.</em>
                </p>
              </div>

              <Link
                href="/sign-up"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-primary transition hover:bg-white/90"
              >
                Create your profile
                <ArrowRight size={17} />
              </Link>

            </div>

          </div>

        </section>


        {/* =========================================================
            WORLDWIDE
        ========================================================== */}

        <section className="bg-[#171313] px-5 py-24 text-white lg:px-10">

          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff9e94]">
                Wherever life takes you
              </p>

              <h2 className="mt-5 font-display text-5xl leading-[0.95] md:text-7xl">
                From your
                <br />
                hometown
                <br />
                <em>to anywhere.</em>
              </h2>

              <p className="mt-8 max-w-xl text-lg leading-8 text-white/60">
                Your roots can stay important even when your life takes
                you somewhere completely different. Bharat Milan is
                designed for people living in India and around the world.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                {['India', 'USA', 'Canada', 'UK', 'Australia', 'UAE', 'Worldwide'].map(
                  (place) => (
                    <span
                      key={place}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70"
                    >
                      {place}
                    </span>
                  ),
                )}
              </div>

            </div>


            <div className="relative overflow-hidden rounded-[2rem]">

              <img
                src={image4}
                alt="Couple enjoying an outdoor moment"
                className="h-[580px] w-full object-cover"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              <div className="absolute bottom-7 left-7">
                <p className="font-display text-3xl italic">
                  Wherever you are,
                </p>

                <p className="mt-1 text-sm text-white/70">
                  your story still has roots.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* =========================================================
            PRIVACY
        ========================================================== */}

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-10">

          <div className="rounded-[2rem] border border-black/10 bg-white p-7 md:p-12">

            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">

              <div>
                <div className="grid size-14 place-items-center rounded-2xl bg-red-50 text-primary">
                  <ShieldCheck size={27} />
                </div>

                <h2 className="mt-6 font-display text-5xl leading-none text-[#27191b]">
                  Your privacy
                  <br />
                  <em>comes first.</em>
                </h2>
              </div>

              <div className="grid gap-7 sm:grid-cols-2">

                <div>
                  <h3 className="font-bold">
                    Contact information protected
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-black/55">
                    Your private contact details aren't displayed on
                    public profile pages.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold">
                    You control visibility
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-black/55">
                    Your profile visibility can be changed through
                    your privacy settings.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold">
                    Report suspicious profiles
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-black/55">
                    If something doesn't feel right, you can report
                    a profile for moderation.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold">
                    Take your time
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-black/55">
                    There is no need to rush a conversation or
                    share personal information early.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =========================================================
            FINAL CTA
        ========================================================== */}

        <section className="relative min-h-[620px] overflow-hidden bg-primary">

          <img
            src={last}
            alt="Couple celebrating together"
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-primary/75 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-primary/30 to-transparent" />

          <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-end px-5 pb-16 lg:px-10">

            <div className="max-w-3xl text-white">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">
                Your next chapter
              </p>

              <h2 className="mt-5 font-display text-6xl leading-[0.88] md:text-8xl">
                Maybe your
                <br />
                story starts
                <br />
                <em>here.</em>
              </h2>

              <p className="mt-7 max-w-xl text-lg leading-8 text-white/75">
                Create your profile, discover meaningful people,
                and take the first step when you are ready.
              </p>

              <Link
                href="/sign-up"
                className="focus-ring mt-8 inline-flex min-h-13 items-center gap-3 rounded-xl bg-white px-6 text-sm font-bold text-primary shadow-xl transition hover:bg-white/90"
                data-testid="link-final-join"
              >
                Create your profile
                <ArrowRight size={18} />
              </Link>

            </div>

          </div>

        </section>


        {/* =========================================================
            HEALTH STATUS
        ========================================================== */}

        <div className="mx-auto max-w-7xl px-5 py-5 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-black/35 lg:px-10">
          {health.isLoading
            ? 'Preparing your welcome'
            : health.isError
              ? 'Welcome desk is temporarily unavailable'
              : 'Bharat Milan is ready to welcome you'}
        </div>

      </main>
    </PublicLayout>
  );
}


function Feature({
  number,
  icon,
  title,
  body,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-[1.5rem] border border-black/10 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">
        <div className="grid size-12 place-items-center rounded-xl bg-red-50 text-primary">
          {icon}
        </div>

        <span className="font-mono-ui text-xs font-bold text-black/25">
          {number}
        </span>
      </div>

      <h3 className="mt-7 font-display text-3xl text-[#27191b]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-black/55">
        {body}
      </p>

      <div className="mt-6 h-px w-10 bg-primary transition-all duration-300 group-hover:w-20" />

    </div>
  );
}
/* =========================================================
   PUBLIC INFORMATION PAGES
   ========================================================= */

function SimplePublicPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  children: ReactNode;
}) {
  return (
    <PublicLayout>
      <main className="page-enter">
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-20 lg:px-10">
          <p className="eyebrow text-[#8f1731]">{eyebrow}</p>

          <h1 className="mt-5 max-w-4xl font-display text-6xl leading-[.9] text-[#641126] md:text-8xl">
            {title}
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
            {intro}
          </p>
        </section>

        <section className="border-t border-[#eadde0] bg-[#fffafa]">
          <div className="prose prose-lg mx-auto max-w-4xl px-5 py-16 prose-headings:font-display prose-headings:font-normal prose-headings:text-[#641126] prose-p:text-muted-foreground prose-li:text-muted-foreground lg:px-10">
            {children}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function About() {
  return (
    <SimplePublicPage
      eyebrow="About us"
      title={
        <>
          A better beginning
          <br />
          <em>starts with context.</em>
        </>
      }
      intro="Bharat Milan is a matrimonial platform for adults with Uttarakhand roots, wherever they live in the world."
    >
      <h2>People first, profiles second.</h2>

      <p>
        A profile should help someone understand the person behind
        the information. That means making room for values, education,
        work, family context, location, and the details that make an
        introduction meaningful.
      </p>

      <h2>From Uttarakhand to anywhere.</h2>

      <p>
        Your connection to Uttarakhand does not depend on where you
        currently live. Bharat Milan is designed for people around the
        world who share those roots.
      </p>

      <h2>Your choices remain yours.</h2>

      <p>
        Members decide what to share, when to share it, and whether
        they want to continue an introduction.
      </p>
    </SimplePublicPage>
  );
}

function HowItWorks() {
  return (
    <SimplePublicPage
      eyebrow="How it works"
      title={
        <>
          Four simple steps.
          <br />
          <em>No unnecessary noise.</em>
        </>
      }
      intro="Create your profile, discover relevant people, express interest, and decide what happens next."
    >
      <div className="not-prose grid gap-4">
        {[
          [
            '01',
            'Create your introduction',
            'Add the details that help someone understand your life, values, education, work, and background.',
          ],
          [
            '02',
            'Choose your visibility',
            'Your profile visibility is under your control.',
          ],
          [
            '03',
            'Discover people',
            'Use filters to find relevant profiles instead of endlessly scrolling.',
          ],
          [
            '04',
            'Send interest',
            'If you want to know someone better, send an interest and let them decide what happens next.',
          ],
        ].map(([number, heading, body]) => (
          <div
            className="grid gap-5 rounded-2xl border border-[#eadde0] bg-white p-6 md:grid-cols-[70px_1fr]"
            key={number}
          >
            <span className="font-mono-ui text-sm font-bold text-[#8f1731]">
              {number}
            </span>

            <div>
              <h3 className="font-display text-3xl text-[#641126]">
                {heading}
              </h3>

              <p className="mt-2 leading-7 text-muted-foreground">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SimplePublicPage>
  );
}

function Safety() {
  return (
    <SimplePublicPage
      eyebrow="Safety guidelines"
      title={
        <>
          Take your time.
          <br />
          <em>Protect your privacy.</em>
        </>
      }
      intro="A respectful matrimonial platform depends on everyone using it thoughtfully."
    >
      <h2>Keep personal information private.</h2>

      <p>
        Avoid sharing your address, financial information, passwords,
        identity documents, or other sensitive information during an
        early conversation.
      </p>

      <h2>Meet thoughtfully.</h2>

      <p>
        When you decide to meet someone, tell a trusted person where
        you are going and choose an appropriate public setting.
      </p>

      <h2>Be careful with requests for money.</h2>

      <p>
        Never send money simply because someone you met online asks
        you to. Pause and verify information independently.
      </p>

      <h2>Report concerns.</h2>

      <p>
        If you encounter suspicious, abusive, misleading, or
        inappropriate behaviour, use the report functionality
        available on the platform.
      </p>
    </SimplePublicPage>
  );
}

function Contact() {
  return (
    <SimplePublicPage
      eyebrow="Contact"
      title={
        <>
          Have a question?
          <br />
          <em>We're listening.</em>
        </>
      }
      intro="Questions about your profile, privacy, reports, or how Bharat Milan works?"
    >
      <div className="not-prose grid gap-4 sm:grid-cols-2">
        <a
          href="mailto:namaste@pahadibwari.in"
          className="hover-lift rounded-2xl border border-[#eadde0] bg-white p-6"
          data-testid="link-contact-email"
        >
          <PhoneCall className="text-[#8f1731]" size={22} />

          <h2 className="mt-5 font-display text-3xl text-[#641126]">
            Email the team
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            namaste@pahadibwari.in
          </p>
        </a>

        <div className="rounded-2xl border border-[#eadde0] bg-white p-6">
          <ShieldCheck className="text-[#8f1731]" size={22} />

          <h2 className="mt-5 font-display text-3xl text-[#641126]">
            Safety concern
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Report a profile directly from its page so the moderation
            team receives the relevant context.
          </p>
        </div>
      </div>
    </SimplePublicPage>
  );
}

function Legal({ type }: { type: 'privacy' | 'terms' }) {
  return (
    <SimplePublicPage
      eyebrow={
        type === 'privacy'
          ? 'Privacy policy'
          : 'Terms & disclaimer'
      }
      title={
        type === 'privacy' ? (
          <>
            Your information.
            <br />
            <em>Your choice.</em>
          </>
        ) : (
          <>
            Clear terms for
            <br />
            <em>meaningful beginnings.</em>
          </>
        )
      }
      intro={
        type === 'privacy'
          ? 'We collect information needed to operate the matrimonial service and protect the platform.'
          : 'Bharat Milan provides introductions between adults and does not guarantee compatibility, identity, conduct, or outcomes.'
      }
    >
      <h2>In short</h2>

      <p>
        Use the service honestly, protect your own information, and
        treat every member with dignity.
      </p>

      <h2>Information and visibility</h2>

      <p>
        Profile information is displayed according to your visibility
        settings. Private contact information is not intended to be
        displayed on public profile pages.
      </p>

      <h2>Responsible use</h2>

      <p>
        Do not impersonate another person, harass members, solicit
        money, misuse personal information, or create profiles for
        people without their consent.
      </p>

      <h2>Questions</h2>

      <p>
        For policy questions, contact namaste@pahadibwari.in.
      </p>
    </SimplePublicPage>
  );
}

/* =========================================================
   AUTHENTICATION
   ========================================================= */

function SignInPage({ signUp = false }: { signUp?: boolean }) {
  const [, navigate] = useLocation();
  const { login, register, sendOTP, verifyOTP } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");

  const handlePasswordAuth = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (signUp) {
        await register({
          name,
          email,
          password,
        });
      } else {
        await login({
          email,
          password,
        });
      }

      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

 
const handleSendOTP = async () => {
  setError("");
  setLoading(true);

  try {
    await sendOTP({
      phone: mobile,
    });

    setOtpSent(true);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Could not send OTP.",
    );
  } finally {
    setLoading(false);
  }
};



const handleVerifyOTP = async () => {
  setError("");

  const cleanedOtp = otp.replace(/\D/g, "").slice(0, 6);

  if (cleanedOtp.length !== 6) {
    setError("Please enter the 6-digit OTP.");
    return;
  }

  setLoading(true);

  try {
    await verifyOTP({
      phone: mobile.trim(),
      otp: cleanedOtp,
    });

    navigate("/");
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "OTP verification failed.",
    );
  } finally {
    setLoading(false);
  }
};




  return (
    <div className="grain flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">
            {signUp ? "Create your account" : "Welcome back"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {signUp
              ? "Create your Bharat Milan account"
              : "Sign in to your Bharat Milan account"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {mode === "password" ? (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            {signUp && (
              <input
                className="w-full rounded-lg border bg-background px-4 py-3"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            )}

            <input
              type="email"
              className="w-full rounded-lg border bg-background px-4 py-3"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <input
              type="password"
              className="w-full rounded-lg border bg-background px-4 py-3"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : signUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <input
              type="tel"
              className="w-full rounded-lg border bg-background px-4 py-3"
              placeholder="Mobile number"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
            />

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <>
                <input
                  inputMode="numeric"
                  className="w-full rounded-lg border bg-background px-4 py-3"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                />

                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              navigate(signUp ? "/sign-in" : "/sign-up");
            }}
            className="text-sm text-primary hover:underline"
          >
            {signUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "password" ? "otp" : "password")}
          className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "password"
            ? "Continue with mobile OTP"
            : "Continue with email and password"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MEMBER AREA
   ========================================================= */
function MemberShell({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: '/dashboard', label: 'Overview', icon: BarChart3 },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/interests', label: 'Interests', icon: Heart },
    { href: '/my-profile', label: 'My profile', icon: UserRound },
  ];

  const manage = [
    { href: '/edit-profile', label: 'Edit profile', icon: Pencil },
    { href: '/manage-photos', label: 'Photos', icon: ImagePlus },
    { href: '/privacy-settings', label: 'Privacy', icon: LockKeyhole },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setLocation('/');
    }
  };

  return (
    <div className="grain flex min-h-[100dvh] bg-background">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Logo compact />

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 md:hidden"
            aria-label="Close navigation"
            data-testid="button-close-navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* MEMBER INTRODUCTION */}
        <div className="mt-10 rounded-2xl border border-sidebar-border bg-sidebar-accent/70 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-sidebar-primary font-semibold text-sidebar-primary-foreground">
              PB
            </span>

            <div>
              <p className="text-sm font-semibold">
                Your introduction
              </p>

              <p className="font-mono-ui text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                Member space
              </p>
            </div>
          </div>
        </div>

        {/* MAIN NAV */}
        <nav className="mt-8 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
              data-testid={`link-nav-${label
                .toLowerCase()
                .replace(' ', '-')}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        {/* YOUR DETAILS */}
        <div className="mt-8 px-3 font-mono-ui text-[9px] uppercase tracking-[.16em] text-sidebar-foreground/45">
          Your details
        </div>

        <nav className="mt-2 space-y-1">
          {manage.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
              data-testid={`link-manage-${label
                .toLowerCase()
                .replace(' ', '-')}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        {/* BOTTOM ACTIONS */}
        <div className="mt-auto space-y-2">
          <Link
            href="/safety"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
            data-testid="link-member-safety"
          >
            <ShieldCheck size={17} />
            Safety
          </Link>

          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
            data-testid="button-log-out"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {open && (
        <button
          className="fixed inset-0 z-30 bg-primary/20 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation overlay"
          data-testid="button-navigation-overlay"
        />
      )}

      {/* MAIN CONTENT */}
      <div className="min-w-0 flex-1">
        {/* HEADER */}
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-xl lg:px-10">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-border p-2 md:hidden"
            aria-label="Open navigation"
            data-testid="button-open-navigation"
          >
            <Menu size={20} />
          </button>

          <div className="hidden md:block">
            <p className="eyebrow text-muted-foreground">
              Member space
            </p>

            <p className="mt-1 text-sm font-semibold">
              A calm place to look around.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
              data-testid="link-member-contact"
            >
              Need help?
            </Link>

            <Link
              href="/my-profile"
              className="grid size-9 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent"
              data-testid="link-member-avatar"
            >
              PB
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page-enter mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="min-h-[100dvh] bg-[#f7f1e8]" />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/sign-in" />;
  }

  return <MemberShell>{children}</MemberShell>;
}

function AuthOnly({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="min-h-[100dvh] bg-background" />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/sign-in" />;
  }

  return <>{children}</>;
}

function OnboardingGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="min-h-[100dvh] bg-[#f7f1e8]" />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/sign-in" />;
  }

  return <>{children}</>;
}

function PageHeading({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-[#d8c9bd] pb-7 md:flex-row md:items-end">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8f1731]">
          {eyebrow}
        </p>

        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.95] text-[#641126] md:text-6xl">
          {title}
        </h1>

        {body && (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6d595e]">
            {body}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-[#d8c9bd] bg-[#fbf7f1]/70 p-8 text-center">
      <div>
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#8f1731]/8 text-[#8f1731]">
          {icon}
        </div>

        <h3 className="mt-4 font-display text-3xl text-[#641126]">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#75656a]">
          {body}
        </p>

        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

function ProfileAvatar({
  profile,
  large = false,
}: {
  profile: PublicProfile;
  large?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  const primaryPhoto = profile.photos?.find(
    (photo) => photo.isPrimary === true,
  );

  const imageUrl = primaryPhoto?.url ?? profile.photoUrl;

  const sizeClass = large ? 'size-28' : 'size-16';
  const textClass = large ? 'text-4xl' : 'text-xl';

  if (!imageUrl || imageError) {
    return (
      <div
        className={`${sizeClass} ${textClass} grid shrink-0 place-items-center rounded-2xl bg-[#8f1731] font-display text-white`}
      >
        {initials(profile.fullName)}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden rounded-2xl`}>
      <img
        src={imageUrl}
        alt={`${profile.fullName} profile`}
        className={`${sizeClass} object-cover`}
        loading="lazy"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

function ProfileCard({ profile }: { profile: PublicProfile }) {
  return (
    <Link
      href={`/profiles/${profile.id}`}
      className="group block overflow-hidden rounded-[28px] border border-[#E5D8C9] bg-[#FFFDF8] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#657A92]/45 hover:shadow-[0_18px_45px_rgba(41,40,39,0.12)]"
      data-testid={`card-profile-${profile.id}`}
    >
      {/* PROFILE IMAGE */}
      <div className="relative aspect-[4/4.7] overflow-hidden bg-[#F4EEE5]">
        {profile.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt={`${profile.fullName} profile`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#657A92] font-display text-5xl text-[#FFFDF8]">
            {initials(profile.fullName)}
          </div>
        )}

        {/* IMAGE GRADIENT */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#292827]/90 via-[#292827]/35 to-transparent p-5 pt-24 text-[#FFFDF8]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5D58F]" />

            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#F5D58F]">
              Bharat Milan member
            </p>
          </div>

          <h3 className="mt-1 truncate font-display text-[1.65rem] leading-tight font-semibold">
            {profile.fullName}
          </h3>

          <p className="mt-1 text-xs text-[#FFFDF8]/75">
            {profile.age} years
            {profile.gender ? ` · ${profile.gender}` : ''}
          </p>
        </div>
      </div>

      {/* PROFILE DETAILS */}
      <div className="p-5">
        {/* LOCATION */}
        <div className="flex items-center gap-2 text-xs font-medium text-[#657A92]">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#F4EEE5]">
            <MapPin
              size={14}
              className="text-[#657A92]"
            />
          </span>

          <span className="truncate">
            {profile.city || "Location not added"}
            {profile.district ? ` · ${profile.district}` : ''}
          </span>
        </div>

        {/* EDUCATION + PROFESSION */}
        <div className="mt-4 space-y-2.5">
          {profile.education && (
            <div className="flex items-center gap-2 text-xs font-medium text-[#657A92]">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#F4EEE5]">
                <GraduationCap
                  size={14}
                  className="text-[#657A92]"
                />
              </span>

              <span className="truncate">
                {profile.education}
              </span>
            </div>
          )}

          {profile.profession && (
            <div className="flex items-center gap-2 text-xs font-medium text-[#657A92]">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#F4EEE5]">
                <BriefcaseBusiness
                  size={14}
                  className="text-[#657A92]"
                />
              </span>

              <span className="truncate">
                {profile.profession}
              </span>
            </div>
          )}
        </div>

        {/* VIEW PROFILE */}
        <div className="mt-5 flex items-center justify-between border-t border-[#E5D8C9] pt-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#657A92]">
            View profile
          </span>

          <span className="grid size-8 place-items-center rounded-lg bg-[#F4EEE5] text-[#657A92] transition-all duration-200 group-hover:bg-[#E97C68] group-hover:text-[#FFFDF8]">
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Dashboard() {
  return <DashboardSafe />;
}

function DashboardLoading() {
  return (
    <div className="space-y-7">
      <div className="overflow-hidden rounded-[28px] border border-[#DDD2C5] bg-[#657A92] p-7 shadow-sm sm:p-9">
        <div className="max-w-3xl">
          <Skeleton className="h-3 w-28 bg-white/20" />
          <Skeleton className="mt-5 h-12 w-3/4 bg-white/20 sm:h-16" />
          <Skeleton className="mt-4 h-5 w-full max-w-xl bg-white/15" />
          <Skeleton className="mt-2 h-5 w-4/5 max-w-lg bg-white/15" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Skeleton className="h-[360px] rounded-[24px]" />
        <Skeleton className="h-[360px] rounded-[24px]" />
      </div>
    </div>
  );
}

function DashboardSafe() {
  const dashboard = useGetDashboard({
    query: {
      queryKey: getGetDashboardQueryKey(),
    },
  });

  if (dashboard.isLoading) {
    return <DashboardLoading />;
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <QueryError
        message={errorText(dashboard.error)}
        retry={() => dashboard.refetch()}
      />
    );
  }

  const {
    profile,
    recentProfiles = [],
    sentInterests = [],
    receivedInterests = [],
    acceptedInterests = [],
  } = dashboard.data;

  /*
   * ------------------------------------------------------------
   * EMPTY PROFILE STATE
   * ------------------------------------------------------------
   */

  if (!profile) {
    return (
      <div className="space-y-7">
        <section className="overflow-hidden rounded-[28px] bg-[#657A92] shadow-sm">
          <div className="relative px-6 py-9 sm:px-10 sm:py-12">
            <div className="absolute -right-20 -top-24 size-72 rounded-full bg-[#F5D58F]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 size-72 rounded-full bg-[#E97C68]/20 blur-3xl" />

            <div className="relative max-w-3xl">
              <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5D58F]">
                Welcome to Bharat Milan
              </p>

              <h1 className="mt-4 font-display text-4xl font-black leading-[1.02] tracking-tight text-[#FFFDF8] sm:text-6xl">
                Your profile is
                <br />
                waiting for you.
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-6 text-[#F4EEE5]/85 sm:text-base">
                Create your introduction, add your details, and let your
                profile become the starting point for meaningful connections.
              </p>

              <Link
                href="/profile-setup"
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F5D58F] px-5 text-sm font-bold text-[#292827] shadow-sm transition hover:bg-[#E6A54A]"
                data-testid="link-dashboard-profile-setup"
              >
                Complete your profile
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#DDD2C5] bg-[#F4EEE5] p-5">
            <div className="grid size-10 place-items-center rounded-xl bg-[#E97C68]/15 text-[#C65F4E]">
              <UserRound size={19} />
            </div>

            <h2 className="mt-5 font-display text-2xl font-black text-[#292827]">
              Your introduction
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#5F6264]">
              Tell people about yourself, your roots, interests, and what
              matters to you.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDD2C5] bg-[#FBF8F3] p-5">
            <div className="grid size-10 place-items-center rounded-xl bg-[#657A92]/12 text-[#657A92]">
              <Compass size={19} />
            </div>

            <h2 className="mt-5 font-display text-2xl font-black text-[#292827]">
              Discover profiles
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#5F6264]">
              Explore profiles using location, education, profession and other
              preferences.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDD2C5] bg-[#F4EEE5] p-5">
            <div className="grid size-10 place-items-center rounded-xl bg-[#F5D58F]/35 text-[#B87920]">
              <ShieldCheck size={19} />
            </div>

            <h2 className="mt-5 font-display text-2xl font-black text-[#292827]">
              Your privacy
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#5F6264]">
              Choose whether your profile is visible in discovery. Private
              contact details stay protected.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * DASHBOARD VALUES
   * ------------------------------------------------------------
   */

  const profileName =
    profile.fullName?.trim() || "Your profile";

  const profileAge =
    typeof profile.age === "number"
      ? profile.age
      : profile.age
        ? Number(profile.age)
        : null;

  const profileLocation = [
    profile.city,
    profile.district,
  ]
    .filter(Boolean)
    .join(" · ");

  const completion =
    typeof profile.completion === "number"
      ? Math.max(0, Math.min(100, profile.completion))
      : 0;

  const visibility =
    profile.visibility === "public"
      ? "Public"
      : "Private";

  const receivedCount =
    Array.isArray(receivedInterests)
      ? receivedInterests.length
      : 0;

  const sentCount =
    Array.isArray(sentInterests)
      ? sentInterests.length
      : 0;

  const acceptedCount =
    Array.isArray(acceptedInterests)
      ? acceptedInterests.length
      : 0;

  const recentCount =
    Array.isArray(recentProfiles)
      ? recentProfiles.length
      : 0;

  /*
   * ------------------------------------------------------------
   * HERO
   * ------------------------------------------------------------
   */

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] bg-[#657A92] shadow-sm">
        <div className="absolute -right-24 -top-28 size-80 rounded-full bg-[#F5D58F]/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-[#E97C68]/15 blur-3xl" />

        <div className="relative grid gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-11">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5D58F]">
              Your Bharat Milan space
            </p>

            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-[1.02] tracking-tight text-[#FFFDF8] sm:text-5xl lg:text-6xl">
              Welcome back,
              <br />
              {profileName}.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#F4EEE5]/85 sm:text-base">
              Keep your profile fresh, explore relevant introductions, and
              take things at your own pace.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/discover"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F5D58F] px-5 text-sm font-bold text-[#292827] shadow-sm transition hover:bg-[#E6A54A]"
                data-testid="link-dashboard-discover"
              >
                Discover profiles
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/my-profile"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
                data-testid="link-dashboard-my-profile"
              >
                View my profile
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-[230px]">
            <div className="rounded-2xl border border-white/15 bg-[#394A5D]/55 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
                  Profile
                </span>

                <span className="font-display text-3xl font-black text-[#F5D58F]">
                  {completion}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#F5D58F] transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-white/65">
                {completion >= 100
                  ? "Your profile is complete."
                  : "A few more details can make your introduction richer."}
              </p>

              {completion < 100 && (
                <Link
                  href="/edit-profile"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#F5D58F] hover:text-white"
                  data-testid="link-dashboard-complete-profile"
                >
                  Complete profile
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

    

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/discover"
          className="group rounded-2xl border border-[#DDD2C5] bg-[#F4EEE5] p-5 transition hover:-translate-y-0.5 hover:border-[#657A92]/40 hover:shadow-sm"
          data-testid="card-dashboard-discover"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#657A92]/12 text-[#657A92]">
              <Compass size={19} />
            </span>

            <ArrowRight
              size={16}
              className="text-[#8A8B8A] transition group-hover:translate-x-0.5 group-hover:text-[#657A92]"
            />
          </div>

          <p className="mt-5 font-mono-ui text-[10px] font-bold uppercase tracking-[0.15em] text-[#777978]">
            Profiles to explore
          </p>

          <p className="mt-1 font-display text-4xl font-black text-[#292827]">
            {recentCount}
          </p>
        </Link>

        <Link
          href="/interests"
          className="group rounded-2xl border border-[#DDD2C5] bg-[#FBF8F3] p-5 transition hover:-translate-y-0.5 hover:border-[#E97C68]/45 hover:shadow-sm"
          data-testid="card-dashboard-received-interests"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#E97C68]/12 text-[#C65F4E]">
              <Heart size={19} />
            </span>

            <ArrowRight
              size={16}
              className="text-[#8A8B8A] transition group-hover:translate-x-0.5 group-hover:text-[#C65F4E]"
            />
          </div>

          <p className="mt-5 font-mono-ui text-[10px] font-bold uppercase tracking-[0.15em] text-[#777978]">
            Received interests
          </p>

          <p className="mt-1 font-display text-4xl font-black text-[#292827]">
            {receivedCount}
          </p>
        </Link>

        <Link
          href="/interests"
          className="group rounded-2xl border border-[#DDD2C5] bg-[#F4EEE5] p-5 transition hover:-translate-y-0.5 hover:border-[#F5D58F] hover:shadow-sm"
          data-testid="card-dashboard-sent-interests"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#F5D58F]/35 text-[#B87920]">
              <ArrowRight size={19} />
            </span>

            <ArrowRight
              size={16}
              className="text-[#8A8B8A] transition group-hover:translate-x-0.5 group-hover:text-[#B87920]"
            />
          </div>

          <p className="mt-5 font-mono-ui text-[10px] font-bold uppercase tracking-[0.15em] text-[#777978]">
            Sent interests
          </p>

          <p className="mt-1 font-display text-4xl font-black text-[#292827]">
            {sentCount}
          </p>
        </Link>

        <Link
          href="/interests"
          className="group rounded-2xl border border-[#DDD2C5] bg-[#FBF8F3] p-5 transition hover:-translate-y-0.5 hover:border-[#657A92]/40 hover:shadow-sm"
          data-testid="card-dashboard-accepted-interests"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#657A92]/12 text-[#657A92]">
              <BadgeCheck size={19} />
            </span>

            <ArrowRight
              size={16}
              className="text-[#8A8B8A] transition group-hover:translate-x-0.5 group-hover:text-[#657A92]"
            />
          </div>

          <p className="mt-5 font-mono-ui text-[10px] font-bold uppercase tracking-[0.15em] text-[#777978]">
            Accepted interests
          </p>

          <p className="mt-1 font-display text-4xl font-black text-[#292827]">
            {acceptedCount}
          </p>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="overflow-hidden rounded-[24px] border border-[#DDD2C5] bg-[#FBF8F3]">
          <div className="border-b border-[#DDD2C5] bg-[#F4EEE5] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.17em] text-[#657A92]">
                  My profile
                </p>

                <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-[#292827]">
                  Your introduction
                </h2>
              </div>

              <Link
                href="/edit-profile"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#DDD2C5] bg-[#FBF8F3] text-[#657A92] transition hover:bg-[#657A92] hover:text-white"
                aria-label="Edit profile"
                data-testid="button-dashboard-edit-profile"
              >
                <Pencil size={17} />
              </Link>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#657A92] text-white shadow-sm">
                {profile.photos?.find(
                  (photo) => photo.isPrimary,
                )?.url ? (
                  <img
                    src={
                      profile.photos.find(
                        (photo) => photo.isPrimary,
                      )?.url
                    }
                    alt={profileName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-3xl font-black">
                    {initials(profileName)}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-display text-3xl font-black text-[#292827]">
                  {profileName}
                </h3>

                <p className="mt-1 text-sm text-[#666967]">
                  {profileAge
                    ? `${profileAge} years`
                    : "Age not added"}
                  {profile.gender
                    ? ` · ${profile.gender}`
                    : ""}
                </p>

                {profileLocation && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#777978]">
                    <MapPin
                      size={14}
                      className="shrink-0 text-[#C65F4E]"
                    />

                    <span className="truncate">
                      {profileLocation}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {profile.education && (
                <div className="rounded-xl bg-[#F4EEE5] p-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      size={16}
                      className="text-[#657A92]"
                    />

                    <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[#777978]">
                      Education
                    </span>
                  </div>

                  <p className="mt-2 truncate text-sm font-semibold text-[#292827]">
                    {profile.education}
                  </p>
                </div>
              )}

              {profile.profession && (
                <div className="rounded-xl bg-[#F4EEE5] p-4">
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness
                      size={16}
                      className="text-[#C65F4E]"
                    />

                    <span className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[#777978]">
                      Profession
                    </span>
                  </div>

                  <p className="mt-2 truncate text-sm font-semibold text-[#292827]">
                    {profile.profession}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#DDD2C5] bg-[#FFFDF8] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono-ui text-[9px] font-bold uppercase tracking-[0.15em] text-[#777978]">
                  Profile completion
                </p>

                <p className="mt-1 text-sm font-semibold text-[#292827]">
                  {completion}% complete
                </p>
              </div>

              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#DDD2C5]">
                <div
                  className="h-full rounded-full bg-[#657A92]"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <Link
              href="/my-profile"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#657A92] hover:text-[#394A5D]"
              data-testid="link-dashboard-profile-details"
            >
              View full profile
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] bg-[#394A5D] text-white shadow-sm">
          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.17em] text-[#F5D58F]">
                  Privacy
                </p>

                <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white">
                  You choose the window.
                </h2>
              </div>

              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#F5D58F]">
                {profile.visibility === "public" ? (
                  <Eye size={20} />
                ) : (
                  <LockKeyhole size={20} />
                )}
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-xl ${
                    profile.visibility === "public"
                      ? "bg-[#F5D58F]/20 text-[#F5D58F]"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {profile.visibility === "public" ? (
                    <Eye size={18} />
                  ) : (
                    <LockKeyhole size={18} />
                  )}
                </span>

                <div>
                  <p className="text-xs text-white/55">
                    Current visibility
                  </p>

                  <p className="mt-0.5 text-lg font-bold text-white">
                    {visibility}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-white/65">
                {profile.visibility === "public"
                  ? "Your profile can appear to relevant signed-in members in discovery."
                  : "Your profile is currently hidden from discovery while you prepare or take a pause."}
              </p>
            </div>

            <div className="mt-5 flex gap-3 rounded-2xl bg-[#FFFDF8]/8 p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#F5D58F]"
              />

              <p className="text-xs leading-5 text-white/60">
                Email, phone number, password, exact home address and private
                family information are not shown on public profile pages.
              </p>
            </div>

            <Link
              href="/privacy-settings"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#F5D58F] px-5 text-sm font-bold text-[#292827] transition hover:bg-[#E6A54A]"
              data-testid="link-dashboard-privacy"
            >
              Manage privacy
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.17em] text-[#C65F4E]">
              Explore
            </p>

            <h2 className="mt-2 font-display text-4xl font-black tracking-tight text-[#292827]">
              Profiles you may notice.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666967]">
              Take a look around and use your preferences to find profiles
              that match what you are looking for.
            </p>
          </div>

          <Link
            href="/discover"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#657A92] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#394A5D]"
            data-testid="link-dashboard-view-all"
          >
            View all profiles
            <ArrowRight size={15} />
          </Link>
        </div>

        {recentProfiles.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentProfiles.slice(0, 3).map((person) => (
              <ProfileCard
                key={person.id}
                profile={person}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-[#DDD2C5] bg-[#F4EEE5] p-8">
            <div className="max-w-xl">
              <div className="grid size-11 place-items-center rounded-xl bg-[#657A92]/12 text-[#657A92]">
                <Compass size={20} />
              </div>

              <h3 className="mt-5 font-display text-3xl font-black text-[#292827]">
                The trail is quiet for now.
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#666967]">
                Try opening Discover and adjusting your preferences. New
                relevant profiles can appear as the community grows.
              </p>

              <Link
                href="/discover"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#657A92]"
                data-testid="link-dashboard-empty-discover"
              >
                Explore Discover
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </section>


      <section className="overflow-hidden rounded-[24px] border border-[#DDD2C5] bg-[#F4EEE5]">
        <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#E97C68]/15 text-[#C65F4E]">
                <Sparkles size={19} />
              </span>

              <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.17em] text-[#C65F4E]">
                Keep moving
              </p>
            </div>

            <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-[#292827] sm:text-4xl">
              A thoughtful profile starts with honest details.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666967]">
              You do not need to do everything at once. Update a detail,
              explore a few profiles, or review your interests whenever it
              feels right.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/edit-profile"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#657A92] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#394A5D]"
              data-testid="link-dashboard-edit"
            >
              Edit profile
              <Pencil size={15} />
            </Link>

            <Link
              href="/interests"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CFC4B8] bg-[#FBF8F3] px-5 text-sm font-bold text-[#292827] transition hover:border-[#657A92]/50 hover:text-[#657A92]"
              data-testid="link-dashboard-interests"
            >
              View interests
              <Heart size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
function QueryError({ message, retry }: { message: string; retry: () => void }) { return <div className="grid min-h-64 place-items-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><CircleAlert className="mx-auto text-destructive" /><h2 className="mt-3 font-display text-3xl text-primary">The path is temporarily closed</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p><Button variant="outline" className="mt-5" onClick={retry} data-testid="button-retry">Try again</Button></div>; }
function Discover() {
  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    location: '',
    district: '',
    education: '',
    profession: '',
    community: '',
    maritalStatus: '',
  });

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(
    () => ({
      page,
      pageSize: 12,
      ...Object.fromEntries(
        Object.entries(filters)
          .filter(([, value]) => value)
          .map(([key, value]) => [
            key,
            ['ageMin', 'ageMax'].includes(key)
              ? Number(value)
              : value,
          ]),
      ),
    }),
    [filters, page],
  );

  const profiles = useListProfiles(params, {
    query: {
      queryKey: getListProfilesQueryKey(params),
    },
  });

  const items = profiles.data?.items ?? [];
  const total = profiles.data?.total ?? 0;
  const totalPages = profiles.data?.totalPages ?? 0;
  const currentPage = profiles.data?.page ?? page;

  const clearFilters = () => {
    setPage(1);
    setFilters({
      ageMin: '',
      ageMax: '',
      location: '',
      district: '',
      education: '',
      profession: '',
      community: '',
      maritalStatus: '',
    });
  };

  return (
    <>
      <PageHeading
        eyebrow="Discover"
        title="Relevant, not endless."
        body="Search the community with enough context to know why an introduction might make sense."
        action={
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Settings2 size={16} />
            {showFilters ? 'Hide filters' : 'Refine search'}
          </Button>
        }
      />

      {showFilters && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextInput
              label="Age from"
              type="number"
              min="18"
              value={filters.ageMin}
              onChange={(e) => {
                setPage(1);
                setFilters({
                  ...filters,
                  ageMin: e.target.value,
                });
              }}
              data-testid="input-filter-age-min"
            />

            <TextInput
              label="Age to"
              type="number"
              min="18"
              value={filters.ageMax}
              onChange={(e) => {
                setPage(1);
                setFilters({
                  ...filters,
                  ageMax: e.target.value,
                });
              }}
              data-testid="input-filter-age-max"
            />

            <TextInput
              label="Location"
              value={filters.location}
              onChange={(e) => {
                setPage(1);
                setFilters({
                  ...filters,
                  location: e.target.value,
                });
              }}
              placeholder="Dehradun or Delhi"
              data-testid="input-filter-location"
            />

            <TextInput
              label="District"
              value={filters.district}
              onChange={(e) => {
                setPage(1);
                setFilters({
                  ...filters,
                  district: e.target.value,
                });
              }}
              placeholder="Almora, Pauri…"
              data-testid="input-filter-district"
            />

            <TextInput
              label="Education"
              value={filters.education}
              onChange={(e) => {
                setPage(1);
                setFilters({
                  ...filters,
                  education: e.target.value,
                });
              }}
              data-testid="input-filter-education"
            />

            <TextInput
              label="Profession"
              value={filters.profession}
              onChange={(e) => {
                setPage(1);
                setFilters({
                  ...filters,
                  profession: e.target.value,
                });
              }}
              data-testid="input-filter-profession"
            />

            <TextInput
              label="Community"
              value={filters.community}
              onChange={(e) => {
                setPage(1);
                setFilters({
                  ...filters,
                  community: e.target.value,
                });
              }}
              data-testid="input-filter-community"
            />

            <SelectInput
              label="Marital status"
              value={filters.maritalStatus}
              onChange={(e) => {
                setPage(1);
                setFilters({
                  ...filters,
                  maritalStatus: e.target.value,
                });
              }}
              data-testid="select-filter-marital"
            >
              <option value="">Any status</option>
              <option value="Never married">Never married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </SelectInput>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {profiles.data
            ? `${total} introductions`
            : 'Looking across the community…'}
        </p>

        <span className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">
          Page {currentPage}
        </span>
      </div>

      {profiles.isLoading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton className="h-56" key={item} />
          ))}
        </div>
      ) : profiles.isError ? (
        <div className="mt-5">
          <QueryError
            message={errorText(profiles.error)}
            retry={() => profiles.refetch()}
          />
        </div>
      ) : items.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={<Search size={22} />}
            title="No introductions match yet"
            body="Try widening one of your filters. A thoughtful search can still be an open one."
            action={
              <Button
                variant="quiet"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                Clear filters
              </Button>
            }
          />
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setPage(Math.max(1, page - 1))
            }
            disabled={page === 1}
            aria-label="Previous page"
            data-testid="button-previous-page"
          >
            <ChevronLeft size={16} />
          </Button>

          <span className="grid min-h-10 place-items-center rounded-xl bg-secondary px-4 font-mono-ui text-xs">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() =>
              setPage(Math.min(totalPages, page + 1))
            }
            disabled={page === totalPages}
            aria-label="Next page"
            data-testid="button-next-page"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </>
  );
}

function ProfilePage() {
  const { id = '' } = useParams<{ id: string }>();
  const { isAuthenticated: member } = useAuth();
  const profile = useGetProfile(id, { query: { queryKey: getGetProfileQueryKey(id), enabled: Boolean(id) } });
  const interest = useExpressInterest();
  const report = useCreateReport();
  const [toast, setToast] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<keyof typeof ReportInputReason>('other');
  const [reportDescription, setReportDescription] = useState('');
  if (profile.isLoading) return member ? <MemberShell><Skeleton className="h-80" /></MemberShell> : <PublicLayout><main className="mx-auto max-w-7xl px-5 py-16 lg:px-10"><Skeleton className="h-80" /></main></PublicLayout>;
  if (profile.isError || !profile.data) return member ? <MemberShell><QueryError message={errorText(profile.error)} retry={() => profile.refetch()} /></MemberShell> : <PublicLayout><main className="mx-auto max-w-7xl px-5 py-16 lg:px-10"><QueryError message={errorText(profile.error)} retry={() => profile.refetch()} /></main></PublicLayout>;
  const person = profile.data;
  const sendInterest = () => interest.mutate({ id: person.id }, { onSuccess: () => setToast('Interest sent. They will choose whether to respond.'), onError: (error) => setToast(errorText(error)) });
  const sendReport = (event: FormEvent) => { event.preventDefault(); report.mutate({ data: { reportedProfileId: person.id, reason: ReportInputReason[reportReason], description: reportDescription || undefined } }, { onSuccess: () => { setReportOpen(false); setToast('Thank you. Your report has been sent for review.'); }, onError: (error) => setToast(errorText(error)) }); };
  const content = <><div className="mb-6"><Link href={member ? '/discover' : '/'} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="link-back-discover"><ChevronLeft size={16} /> {member ? 'Back to discover' : 'Back home'}</Link></div><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><section className="rounded-2xl border border-border bg-card p-6 md:p-8"><div className="flex flex-col items-start gap-5 sm:flex-row"><ProfileAvatar profile={person} large /><div><p className="eyebrow text-accent">Registered introduction</p><h1 className="mt-2 font-display text-5xl leading-none text-primary">{person.fullName}</h1><p className="mt-3 text-sm text-muted-foreground">{person.age} years · {person.gender} · {person.city}</p></div></div><div className="mt-8 flex flex-wrap gap-2">{[person.education, person.profession, person.community, person.maritalStatus].filter(Boolean).map((item) => <span className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground" key={item}>{item}</span>)}</div><div className="mt-8 flex flex-wrap gap-3"><Button onClick={sendInterest} disabled={interest.isPending} data-testid="button-express-interest">{interest.isPending ? 'Sending…' : 'Express interest'} <Heart size={16} /></Button><Button variant="outline" onClick={() => setReportOpen(!reportOpen)} data-testid="button-open-report"><Flag size={16} /> Report</Button></div>{toast && <p className="mt-4 rounded-xl bg-primary/10 p-3 text-sm text-primary" role="status" data-testid="status-profile-action">{toast}</p>}{reportOpen && <form onSubmit={sendReport} className="mt-6 space-y-4 border-t border-border pt-6"><SelectInput label="Reason" value={reportReason} onChange={(event) => setReportReason(event.target.value as keyof typeof ReportInputReason)} data-testid="select-report-reason">{Object.entries(ReportInputReason).map(([key, value]) => <option value={key} key={key}>{value.replaceAll('_', ' ')}</option>)}</SelectInput><TextArea label="What should the moderation team know?" value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} maxLength={1200} data-testid="textarea-report-description" /><div className="flex gap-2"><Button type="submit" disabled={report.isPending} data-testid="button-submit-report">Send report</Button><Button type="button" variant="quiet" onClick={() => setReportOpen(false)} data-testid="button-cancel-report">Cancel</Button></div></form>}<div className="mt-8 flex items-start gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 shrink-0 text-primary" size={15} /> Contact details are intentionally not shown. Share them only when trust has been built.</div></section><section className="space-y-5"><InfoBlock title="A little about them" body={person.about} /><div className="grid gap-5 sm:grid-cols-2"><InfoBlock title="Family values" body={person.familyValues || 'Not shared yet.'} /><InfoBlock title="Interests & languages" body={[person.hobbies, person.languages].filter(Boolean).join(' · ') || 'Not shared yet.'} /></div><InfoBlock title="Place & work" body={[person.nativePlace && `Native place: ${person.nativePlace}`, person.profession, person.education].filter(Boolean).join(' · ')} /></section></div></>;
  return member ? <MemberShell>{content}</MemberShell> : <PublicLayout><main className="mx-auto max-w-7xl px-5 py-12 lg:px-10">{content}</main></PublicLayout>;
}
function InfoBlock({ title, body }: { title: string; body?: string }) { return <div className="rounded-2xl border border-border bg-card p-6"><p className="eyebrow text-muted-foreground">{title}</p><p className="mt-4 leading-7 text-foreground/80">{body || 'Not shared yet.'}</p></div>; }
function MyProfilePage() {
  const profile = useGetMyProfile({
    query: {
      queryKey: getGetMyProfileQueryKey(),
      retry: false,
    },
  });

  if (profile.isLoading) {
    return <Skeleton className="h-80" />;
  }

  if (profile.isError) {
    const error = profile.error as any;

    const status =
      error?.status ??
      error?.response?.status ??
      error?.statusCode;

    // The backend returns 404 when the signed-in user
    // does not have a profile row yet.
    if (status === 404) {
      return (
        <>
          <PageHeading
            eyebrow="Your introduction"
            title="Create your profile."
            body="Your account is ready. Now add a few details so people can get to know you."
            action={
              <Link
                href="/edit-profile"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"
                data-testid="link-my-profile-create"
              >
                <Pencil size={15} />
                Create profile
              </Link>
            }
          />

          <div className="mt-8 rounded-2xl border border-border bg-card p-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                <UserRound size={30} />
              </div>

              <h2 className="mt-5 font-display text-3xl text-primary">
                Your profile is not complete yet
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Add your name, basic information, location, education,
                profession, interests, and preferences. You can update these
                details whenever you want.
              </p>

              <Link
                href="/edit-profile"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground"
                data-testid="button-create-profile"
              >
                <Pencil size={15} />
                Complete my profile
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </>
      );
    }

    return (
      <QueryError
        message={errorText(profile.error)}
        retry={() => profile.refetch()}
      />
    );
  }

  if (!profile.data) {
    return (
      <QueryError
        message="We could not find your profile."
        retry={() => profile.refetch()}
      />
    );
  }

  const person = profile.data;

  return (
    <>
      <PageHeading
        eyebrow="Your introduction"
        title="This is how people meet you."
        body="Keep it honest, warm, and useful. You can edit every detail whenever your life changes."
        action={
          <Link
            href="/edit-profile"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"
            data-testid="link-my-profile-edit"
          >
            <Pencil size={15} />
            Edit profile
          </Link>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <section className="rounded-2xl border border-border bg-card p-6">
          <ProfileAvatar profile={person} large />

          <h2 className="mt-5 font-display text-4xl text-primary">
            {person.fullName || "Your name"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {person.age} years · {person.city || "Add your city"}
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${person.completion}%` }}
            />
          </div>

          <p className="mt-2 font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground">
            {person.completion}% complete
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <InfoBlock
            title="About"
            body={person.about}
          />

          <InfoBlock
            title="Work & education"
            body={[person.profession, person.education]
              .filter(Boolean)
              .join(" · ")}
          />

          <InfoBlock
            title="Roots"
            body={[person.nativePlace, person.district, person.community]
              .filter(Boolean)
              .join(" · ")}
          />

          <InfoBlock
            title="Visibility"
            body={`Your profile is ${person.visibility}. ${person.visibility === "public"
                ? "It can appear in discovery."
                : "It is hidden from discovery."
              }`}
          />
        </section>
      </div>
    </>
  );
}
const emptyForm: ProfileInput = { fullName: '', dateOfBirth: '1990-01-01', gender: '', height: undefined, maritalStatus: '', community: '', motherTongue: '', state: 'Uttarakhand', district: '', currentCity: '', nativePlace: '', about: '', education: '', college: '', profession: '', jobTitle: '', company: '', workLocation: '', incomeRange: '', familyInformation: '', lifestyleInformation: '', hobbies: '', languages: '', foodPreferences: '', culturalInterests: '', familyValues: '', visibility: 'private', preferredAgeMin: 24, preferredAgeMax: 35, preferredHeightMin: undefined, preferredHeightMax: undefined, preferredLocation: '', preferredDistrict: '', preferredEducation: '', preferredProfession: '', preferredCommunity: '', preferredMaritalStatus: '', preferredFamilyValues: '', otherPreferences: '' };
function EditProfile() {
  const profile = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() },
  });

  const update = useUpdateMyProfile();

  const [form, setForm] = useState<ProfileInput>(emptyForm);
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (profile.data && !initialized) {
      const p = profile.data;
      const preferences = p.preferences ?? {};

      setForm({
        ...emptyForm,

        // ─────────────────────────────────────────────
        // Personal details
        // ─────────────────────────────────────────────
        fullName: p.fullName ?? '',
        dateOfBirth: p.dateOfBirth ?? emptyForm.dateOfBirth,
        gender: p.gender ?? '',
        phone: p.phone ?? '',
        address: p.address ?? '',
        height: p.height ?? undefined,
        maritalStatus: p.maritalStatus ?? '',
        religion: p.religion ?? '',
        community: p.community ?? '',
        caste: p.caste ?? '',
        subCaste: p.subCaste ?? '',
        ethnicBackground: p.ethnicBackground ?? '',
        motherTongue: p.motherTongue ?? '',
        state: p.state ?? '',
        district: p.district ?? '',
        currentCity: p.currentCity ?? p.city ?? '',
        nativePlace: p.nativePlace ?? '',

        // ─────────────────────────────────────────────
        // Education & career
        // ─────────────────────────────────────────────
        education: p.education ?? '',
        qualifications: p.qualifications ?? '',
        college: p.college ?? '',
        profession: p.profession ?? '',
        jobTitle: p.jobTitle ?? '',
        company: p.company ?? '',
        workLocation: p.workLocation ?? '',
        employmentDetails: p.employmentDetails ?? '',
        incomeRange: p.incomeRange ?? '',
        visaWorkStatus: p.visaWorkStatus ?? '',

        // ─────────────────────────────────────────────
        // Lifestyle
        // ─────────────────────────────────────────────
        bodyType: p.bodyType ?? '',
        appearance: p.appearance ?? '',
        lifestyleInformation: p.lifestyleInformation ?? '',
        smoking: p.smoking ?? '',
        drinking: p.drinking ?? '',
        foodPreferences: p.foodPreferences ?? '',
        healthInformation: p.healthInformation ?? '',

        // ─────────────────────────────────────────────
        // Family
        // ─────────────────────────────────────────────
        fatherOccupation: p.fatherOccupation ?? '',
        fatherStatus: p.fatherStatus ?? '',
        motherOccupation: p.motherOccupation ?? '',
        motherStatus: p.motherStatus ?? '',

        siblingsCount:
          p.siblingsCount ?? undefined,

        brothersCount:
          p.brothersCount ?? undefined,

        sistersCount:
          p.sistersCount ?? undefined,

        marriedSiblingsCount:
          p.marriedSiblingsCount ?? undefined,

        unmarriedSiblingsCount:
          p.unmarriedSiblingsCount ?? undefined,

        familyType: p.familyType ?? '',
        familyInformation: p.familyInformation ?? '',

        // ─────────────────────────────────────────────
        // About / interests
        // ─────────────────────────────────────────────
        about: p.about ?? '',
        hobbies: p.hobbies ?? '',
        languages: p.languages ?? '',
        culturalInterests: p.culturalInterests ?? '',
        familyValues: p.familyValues ?? '',

        // ─────────────────────────────────────────────
        // Profile visibility
        // ─────────────────────────────────────────────
        visibility: p.visibility ?? 'private',

        // ─────────────────────────────────────────────
        // Partner preferences
        // ─────────────────────────────────────────────
        preferredAgeMin:
          preferences.preferredAgeMin ??
          emptyForm.preferredAgeMin,

        preferredAgeMax:
          preferences.preferredAgeMax ??
          emptyForm.preferredAgeMax,

        preferredHeightMin:
          preferences.preferredHeightMin ??
          undefined,

        preferredHeightMax:
          preferences.preferredHeightMax ??
          undefined,

        preferredLocation:
          preferences.preferredLocation ?? '',

        preferredDistrict:
          preferences.preferredDistrict ?? '',

        preferredReligion:
          preferences.preferredReligion ?? '',

        preferredCaste:
          preferences.preferredCaste ?? '',

        preferredEducation:
          preferences.preferredEducation ?? '',

        preferredProfession:
          preferences.preferredProfession ?? '',

        preferredCommunity:
          preferences.preferredCommunity ?? '',

        preferredIncomeRange:
          preferences.preferredIncomeRange ?? '',

        preferredMaritalStatus:
          preferences.preferredMaritalStatus ?? '',

        preferredFamilyValues:
          preferences.preferredFamilyValues ?? '',

        otherPreferences:
          preferences.otherPreferences ?? '',
      });

      setInitialized(true);
    }
  }, [profile.data, initialized]);

  const set = (
    key: keyof ProfileInput,
    value: string | number | undefined,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    update.mutate(
      { data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetMyProfileQueryKey(),
          });

          queryClient.invalidateQueries({
            queryKey: getGetDashboardQueryKey(),
          });

          setToast('Your profile is saved.');
        },

        onError: (error) => {
          setToast(errorText(error));
        },
      },
    );
  };

  if (profile.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="Edit profile"
        title="Make it sound like you."
        body="Keep your profile details up to date. You can save now and return later."
        action={
          <Button
            type="submit"
            form="profile-form"
            disabled={update.isPending}
            data-testid="button-save-profile"
          >
            {update.isPending ? 'Saving…' : 'Save changes'}
            <Check size={16} />
          </Button>
        }
      />

      {toast && (
        <p
          className="mt-5 rounded-xl bg-primary/10 p-3 text-sm text-primary"
          role="status"
          data-testid="status-profile-save"
        >
          {toast}
        </p>
      )}

      <form
        id="profile-form"
        onSubmit={submit}
        className="mt-7 space-y-7"
      >
        {/* =====================================================
            PERSONAL DETAILS
        ====================================================== */}
        <FormSection
          title="The basics"
          note="Start with the details someone would want to know first."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Full name"
              required
              value={form.fullName}
              onChange={(e) =>
                set('fullName', e.target.value)
              }
              data-testid="input-profile-full-name"
            />

            <TextInput
              label="Date of birth"
              type="date"
              required
              value={form.dateOfBirth}
              onChange={(e) =>
                set('dateOfBirth', e.target.value)
              }
              data-testid="input-profile-date-of-birth"
            />

            <SelectInput
              label="Gender"
              required
              value={form.gender}
              onChange={(e) =>
                set('gender', e.target.value)
              }
              data-testid="select-profile-gender"
            >
              <option value="">Choose one</option>
              <option value="Woman">Woman</option>
              <option value="Man">Man</option>
              <option value="Non-binary">Non-binary</option>
            </SelectInput>

            <TextInput
              label="Height (cm)"
              type="number"
              min="100"
              max="240"
              value={form.height ?? ''}
              onChange={(e) =>
                set(
                  'height',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-profile-height"
            />

            <SelectInput
              label="Marital status"
              value={form.maritalStatus}
              onChange={(e) =>
                set('maritalStatus', e.target.value)
              }
              data-testid="select-profile-marital"
            >
              <option value="">
                Prefer not to say
              </option>
              <option value="Never married">
                Never married
              </option>
              <option value="Divorced">
                Divorced
              </option>
              <option value="Widowed">
                Widowed
              </option>
            </SelectInput>

            <TextInput
              label="Religion"
              value={form.religion}
              onChange={(e) =>
                set('religion', e.target.value)
              }
              data-testid="input-profile-religion"
            />

            <TextInput
              label="Community"
              value={form.community}
              onChange={(e) =>
                set('community', e.target.value)
              }
              placeholder="Garhwali, Kumaoni…"
              data-testid="input-profile-community"
            />

            <TextInput
              label="Caste"
              value={form.caste}
              onChange={(e) =>
                set('caste', e.target.value)
              }
              data-testid="input-profile-caste"
            />

            <TextInput
              label="Sub-caste"
              value={form.subCaste}
              onChange={(e) =>
                set('subCaste', e.target.value)
              }
              data-testid="input-profile-sub-caste"
            />

            <TextInput
              label="Ethnic background"
              value={form.ethnicBackground}
              onChange={(e) =>
                set(
                  'ethnicBackground',
                  e.target.value,
                )
              }
              data-testid="input-profile-ethnic-background"
            />

            <TextInput
              label="Mother tongue"
              value={form.motherTongue}
              onChange={(e) =>
                set(
                  'motherTongue',
                  e.target.value,
                )
              }
              placeholder="Hindi, Garhwali…"
              data-testid="input-profile-mother-tongue"
            />

            <TextInput
              label="State"
              value={form.state}
              onChange={(e) =>
                set('state', e.target.value)
              }
              data-testid="input-profile-state"
            />

            <TextInput
              label="Phone"
              value={form.phone}
              onChange={(e) =>
                set('phone', e.target.value)
              }
              data-testid="input-profile-phone"
            />

            <TextInput
              label="Address"
              value={form.address}
              onChange={(e) =>
                set('address', e.target.value)
              }
              data-testid="input-profile-address"
            />
          </div>
        </FormSection>

        {/* =====================================================
            PLACE
        ====================================================== */}
        <FormSection
          title="Place & roots"
          note="Share where you are based and where your roots are."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Current city"
              value={form.currentCity}
              onChange={(e) =>
                set('currentCity', e.target.value)
              }
              data-testid="input-profile-city"
            />

            <TextInput
              label="District"
              value={form.district}
              onChange={(e) =>
                set('district', e.target.value)
              }
              data-testid="input-profile-district"
            />

            <TextInput
              label="Native place"
              value={form.nativePlace}
              onChange={(e) =>
                set('nativePlace', e.target.value)
              }
              data-testid="input-profile-native-place"
            />
          </div>
        </FormSection>

        {/* =====================================================
            EDUCATION & CAREER
        ====================================================== */}
        <FormSection
          title="Education & work"
          note="Give people a clearer picture of your education and professional life."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Education"
              value={form.education}
              onChange={(e) =>
                set('education', e.target.value)
              }
              data-testid="input-profile-education"
            />

            <TextInput
              label="Qualifications"
              value={form.qualifications}
              onChange={(e) =>
                set(
                  'qualifications',
                  e.target.value,
                )
              }
              data-testid="input-profile-qualifications"
            />

            <TextInput
              label="College / university"
              value={form.college}
              onChange={(e) =>
                set('college', e.target.value)
              }
              data-testid="input-profile-college"
            />

            <TextInput
              label="Profession"
              value={form.profession}
              onChange={(e) =>
                set('profession', e.target.value)
              }
              data-testid="input-profile-profession"
            />

            <TextInput
              label="Job title"
              value={form.jobTitle}
              onChange={(e) =>
                set('jobTitle', e.target.value)
              }
              data-testid="input-profile-job-title"
            />

            <TextInput
              label="Company"
              value={form.company}
              onChange={(e) =>
                set('company', e.target.value)
              }
              data-testid="input-profile-company"
            />

            <TextInput
              label="Work location"
              value={form.workLocation}
              onChange={(e) =>
                set(
                  'workLocation',
                  e.target.value,
                )
              }
              data-testid="input-profile-work-location"
            />

            <TextInput
              label="Income range"
              value={form.incomeRange}
              onChange={(e) =>
                set(
                  'incomeRange',
                  e.target.value,
                )
              }
              data-testid="input-profile-income"
            />

            <TextInput
              label="Visa / work status"
              value={form.visaWorkStatus}
              onChange={(e) =>
                set(
                  'visaWorkStatus',
                  e.target.value,
                )
              }
              data-testid="input-profile-visa-status"
            />

            <TextArea
              label="Employment details"
              maxLength={1200}
              value={form.employmentDetails}
              onChange={(e) =>
                set(
                  'employmentDetails',
                  e.target.value,
                )
              }
              data-testid="textarea-profile-employment"
            />
          </div>
        </FormSection>

        {/* =====================================================
            ABOUT
        ====================================================== */}
        <FormSection
          title="Your voice"
          note="A few honest lines are often more helpful than a perfect profile."
        >
          <div className="grid gap-4">
            <TextArea
              label="About you"
              maxLength={1200}
              value={form.about}
              onChange={(e) =>
                set('about', e.target.value)
              }
              placeholder="What brings steadiness and joy to your life?"
              data-testid="textarea-profile-about"
            />

            <TextInput
              label="Languages"
              value={form.languages}
              onChange={(e) =>
                set('languages', e.target.value)
              }
              placeholder="Hindi, Garhwali, English"
              data-testid="input-profile-languages"
            />

            <TextInput
              label="Hobbies & interests"
              value={form.hobbies}
              onChange={(e) =>
                set('hobbies', e.target.value)
              }
              data-testid="input-profile-hobbies"
            />

            <TextInput
              label="Cultural interests"
              value={form.culturalInterests}
              onChange={(e) =>
                set(
                  'culturalInterests',
                  e.target.value,
                )
              }
              data-testid="input-profile-cultural-interests"
            />

            <TextInput
              label="Family values"
              value={form.familyValues}
              onChange={(e) =>
                set(
                  'familyValues',
                  e.target.value,
                )
              }
              data-testid="input-profile-family-values"
            />
          </div>
        </FormSection>

        {/* =====================================================
            LIFESTYLE
        ====================================================== */}
        <FormSection
          title="Lifestyle"
          note="These details help create a more complete profile."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Body type"
              value={form.bodyType}
              onChange={(e) =>
                set('bodyType', e.target.value)
              }
              data-testid="input-profile-body-type"
            />

            <TextInput
              label="Appearance"
              value={form.appearance}
              onChange={(e) =>
                set(
                  'appearance',
                  e.target.value,
                )
              }
              data-testid="input-profile-appearance"
            />

            <SelectInput
              label="Smoking"
              value={form.smoking}
              onChange={(e) =>
                set('smoking', e.target.value)
              }
              data-testid="select-profile-smoking"
            >
              <option value="">
                Prefer not to say
              </option>
              <option value="Never">
                Never
              </option>
              <option value="Occasionally">
                Occasionally
              </option>
              <option value="Regularly">
                Regularly
              </option>
            </SelectInput>

            <SelectInput
              label="Drinking"
              value={form.drinking}
              onChange={(e) =>
                set('drinking', e.target.value)
              }
              data-testid="select-profile-drinking"
            >
              <option value="">
                Prefer not to say
              </option>
              <option value="Never">
                Never
              </option>
              <option value="Occasionally">
                Occasionally
              </option>
              <option value="Regularly">
                Regularly
              </option>
            </SelectInput>

            <TextInput
              label="Food preferences"
              value={form.foodPreferences}
              onChange={(e) =>
                set(
                  'foodPreferences',
                  e.target.value,
                )
              }
              data-testid="input-profile-food-preferences"
            />
          </div>

          <div className="mt-4 grid gap-4">
            <TextArea
              label="Lifestyle information"
              maxLength={1200}
              value={form.lifestyleInformation}
              onChange={(e) =>
                set(
                  'lifestyleInformation',
                  e.target.value,
                )
              }
              data-testid="textarea-profile-lifestyle"
            />

            <TextArea
              label="Health information"
              maxLength={1200}
              value={form.healthInformation}
              onChange={(e) =>
                set(
                  'healthInformation',
                  e.target.value,
                )
              }
              data-testid="textarea-profile-health"
            />
          </div>
        </FormSection>

        {/* =====================================================
            FAMILY
        ====================================================== */}
        <FormSection
          title="Family"
          note="Tell people a little about your family background."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Father's occupation"
              value={form.fatherOccupation}
              onChange={(e) =>
                set(
                  'fatherOccupation',
                  e.target.value,
                )
              }
              data-testid="input-profile-father-occupation"
            />

            <TextInput
              label="Father's status"
              value={form.fatherStatus}
              onChange={(e) =>
                set(
                  'fatherStatus',
                  e.target.value,
                )
              }
              data-testid="input-profile-father-status"
            />

            <TextInput
              label="Mother's occupation"
              value={form.motherOccupation}
              onChange={(e) =>
                set(
                  'motherOccupation',
                  e.target.value,
                )
              }
              data-testid="input-profile-mother-occupation"
            />

            <TextInput
              label="Mother's status"
              value={form.motherStatus}
              onChange={(e) =>
                set(
                  'motherStatus',
                  e.target.value,
                )
              }
              data-testid="input-profile-mother-status"
            />

            <TextInput
              label="Total siblings"
              type="number"
              min="0"
              value={form.siblingsCount ?? ''}
              onChange={(e) =>
                set(
                  'siblingsCount',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-profile-siblings"
            />

            <TextInput
              label="Brothers"
              type="number"
              min="0"
              value={form.brothersCount ?? ''}
              onChange={(e) =>
                set(
                  'brothersCount',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-profile-brothers"
            />

            <TextInput
              label="Sisters"
              type="number"
              min="0"
              value={form.sistersCount ?? ''}
              onChange={(e) =>
                set(
                  'sistersCount',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-profile-sisters"
            />

            <TextInput
              label="Married siblings"
              type="number"
              min="0"
              value={
                form.marriedSiblingsCount ?? ''
              }
              onChange={(e) =>
                set(
                  'marriedSiblingsCount',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-profile-married-siblings"
            />

            <TextInput
              label="Unmarried siblings"
              type="number"
              min="0"
              value={
                form.unmarriedSiblingsCount ?? ''
              }
              onChange={(e) =>
                set(
                  'unmarriedSiblingsCount',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-profile-unmarried-siblings"
            />

            <TextInput
              label="Family type"
              value={form.familyType}
              onChange={(e) =>
                set(
                  'familyType',
                  e.target.value,
                )
              }
              data-testid="input-profile-family-type"
            />
          </div>

          <div className="mt-4">
            <TextArea
              label="Family information"
              maxLength={1200}
              value={form.familyInformation}
              onChange={(e) =>
                set(
                  'familyInformation',
                  e.target.value,
                )
              }
              data-testid="textarea-profile-family"
            />
          </div>
        </FormSection>

        {/* =====================================================
            PARTNER PREFERENCES
        ====================================================== */}
        <FormSection
          title="Who you hope to meet"
          note="Preferences guide discovery; they do not make people a checklist."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Preferred age from"
              type="number"
              min="18"
              value={form.preferredAgeMin ?? ''}
              onChange={(e) =>
                set(
                  'preferredAgeMin',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-preference-age-min"
            />

            <TextInput
              label="Preferred age to"
              type="number"
              min="18"
              value={form.preferredAgeMax ?? ''}
              onChange={(e) =>
                set(
                  'preferredAgeMax',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-preference-age-max"
            />

            <TextInput
              label="Preferred height from (cm)"
              type="number"
              min="100"
              max="240"
              value={form.preferredHeightMin ?? ''}
              onChange={(e) =>
                set(
                  'preferredHeightMin',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-preference-height-min"
            />

            <TextInput
              label="Preferred height to (cm)"
              type="number"
              min="100"
              max="240"
              value={form.preferredHeightMax ?? ''}
              onChange={(e) =>
                set(
                  'preferredHeightMax',
                  e.target.value
                    ? Number(e.target.value)
                    : undefined,
                )
              }
              data-testid="input-preference-height-max"
            />

            <TextInput
              label="Preferred location"
              value={form.preferredLocation}
              onChange={(e) =>
                set(
                  'preferredLocation',
                  e.target.value,
                )
              }
              data-testid="input-preference-location"
            />

            <TextInput
              label="Preferred district"
              value={form.preferredDistrict}
              onChange={(e) =>
                set(
                  'preferredDistrict',
                  e.target.value,
                )
              }
              data-testid="input-preference-district"
            />

            <TextInput
              label="Preferred religion"
              value={form.preferredReligion}
              onChange={(e) =>
                set(
                  'preferredReligion',
                  e.target.value,
                )
              }
              data-testid="input-preference-religion"
            />

            <TextInput
              label="Preferred caste"
              value={form.preferredCaste}
              onChange={(e) =>
                set(
                  'preferredCaste',
                  e.target.value,
                )
              }
              data-testid="input-preference-caste"
            />

            <TextInput
              label="Preferred education"
              value={form.preferredEducation}
              onChange={(e) =>
                set(
                  'preferredEducation',
                  e.target.value,
                )
              }
              data-testid="input-preference-education"
            />

            <TextInput
              label="Preferred profession"
              value={form.preferredProfession}
              onChange={(e) =>
                set(
                  'preferredProfession',
                  e.target.value,
                )
              }
              data-testid="input-preference-profession"
            />

            <TextInput
              label="Preferred community"
              value={form.preferredCommunity}
              onChange={(e) =>
                set(
                  'preferredCommunity',
                  e.target.value,
                )
              }
              data-testid="input-preference-community"
            />

            <TextInput
              label="Preferred income range"
              value={form.preferredIncomeRange}
              onChange={(e) =>
                set(
                  'preferredIncomeRange',
                  e.target.value,
                )
              }
              data-testid="input-preference-income"
            />

            <SelectInput
              label="Preferred marital status"
              value={
                form.preferredMaritalStatus
              }
              onChange={(e) =>
                set(
                  'preferredMaritalStatus',
                  e.target.value,
                )
              }
              data-testid="select-preference-marital"
            >
              <option value="">
                Any
              </option>
              <option value="Never married">
                Never married
              </option>
              <option value="Divorced">
                Divorced
              </option>
              <option value="Widowed">
                Widowed
              </option>
            </SelectInput>

            <TextInput
              label="Preferred family values"
              value={
                form.preferredFamilyValues
              }
              onChange={(e) =>
                set(
                  'preferredFamilyValues',
                  e.target.value,
                )
              }
              data-testid="input-preference-values"
            />
          </div>

          <div className="mt-4">
            <TextArea
              label="Other preferences"
              maxLength={1200}
              value={form.otherPreferences}
              onChange={(e) =>
                set(
                  'otherPreferences',
                  e.target.value,
                )
              }
              placeholder="Anything else you'd like to mention?"
              data-testid="textarea-preference-other"
            />
          </div>
        </FormSection>

        {/* =====================================================
            VISIBILITY
        ====================================================== */}
        <FormSection
          title="Profile visibility"
          note="Choose whether other members can discover your profile."
        >
          <div className="max-w-md">
            <SelectInput
              label="Who can discover your profile?"
              value={form.visibility}
              onChange={(e) =>
                set(
                  'visibility',
                  e.target.value,
                )
              }
              data-testid="select-profile-visibility"
            >
              <option value="private">
                Private
              </option>
              <option value="public">
                Public
              </option>
            </SelectInput>
          </div>
        </FormSection>
      </form>
    </>
  );
}
function FormSection({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
      <h2 className="font-display text-3xl text-primary">
        {title}
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        {note}
      </p>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
} function ManagePhotos() {
  const profile = useGetMyProfile({
    query: {
      queryKey: getGetMyProfileQueryKey(),
    },
  });

  const upload = useUploadPhoto();
  const remove = useDeletePhoto();
  const update = useUpdatePhoto();

  const [toast, setToast] = useState('');

  const files = profile.data?.photos ?? [];

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setToast('Please choose a JPG, JPEG, or PNG image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast('Please choose an image under 5 MB.');
      return;
    }

    upload.mutate(
      {
        data: {
          file,
          isPrimary: files.length === 0,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetMyProfileQueryKey(),
          });

          setToast('Photo added to your profile.');
        },

        onError: (error) => setToast(errorText(error)),
      },
    );
  };

  const removePhoto = (id: string) => {
    if (!window.confirm('Remove this photo from your profile?')) {
      return;
    }

    remove.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetMyProfileQueryKey(),
          });

          setToast('Photo removed.');
        },

        onError: (error) => setToast(errorText(error)),
      },
    );
  };

  const setPrimary = (id: string) => {
    update.mutate(
      {
        id,
        data: {
          isPrimary: true,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetMyProfileQueryKey(),
          });

          setToast('Primary photo updated.');
        },

        onError: (error) => setToast(errorText(error)),
      },
    );
  };

  return (
    <>
      <PageHeading
        eyebrow="Photos"
        title="Let people see your world."
        body="A clear, recent photo helps an introduction feel real. You can add JPG, JPEG, or PNG files up to 5 MB."
        action={
          <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground">
            <Plus size={16} />
            Add photo

            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="sr-only"
              onChange={onFile}
              disabled={upload.isPending}
              data-testid="input-upload-photo"
            />
          </label>
        }
      />

      {toast && (
        <p
          className="mt-5 rounded-xl bg-primary/10 p-3 text-sm text-primary"
          role="status"
          data-testid="status-photo-action"
        >
          {toast}
        </p>
      )}

      {profile.isLoading ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
        </div>
      ) : files.length ? (
        <div className="mt-7 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((column) => (
            <div
              key={column}
              className="flex min-w-0 flex-col gap-4"
            >
              {files
                .filter((_, index) => index % 3 === column)
                .map((photo) => (
                  <div
                    key={photo.id}
                    className="h-fit w-full overflow-hidden rounded-2xl border border-border bg-card"
                    data-testid={`card-photo-${photo.id}`}
                  >
                    <div className="w-full bg-secondary">
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt="Your profile"
                          className="block h-auto w-full"
                        />
                      ) : (
                        <div className="flex min-h-64 w-full items-center justify-center text-muted-foreground">
                          <ImagePlus />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 p-3">
                      {photo.isPrimary ? (
                        <span className="rounded-lg bg-primary/10 px-2 py-1 font-mono-ui text-[10px] uppercase tracking-wider text-primary">
                          Primary
                        </span>
                      ) : (
                        <button
                          className="text-xs font-semibold text-accent"
                          onClick={() => setPrimary(photo.id)}
                          data-testid={`button-primary-photo-${photo.id}`}
                        >
                          Make primary
                        </button>
                      )}

                      <button
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removePhoto(photo.id)}
                        aria-label="Remove photo"
                        data-testid={`button-delete-photo-${photo.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            icon={<ImagePlus size={22} />}
            title="Your gallery is empty"
            body="Add one clear photo to help your introduction feel more personal. You are always in control of what you share."
            action={
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-accent">
                Choose a photo

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="sr-only"
                  onChange={onFile}
                  data-testid="input-empty-upload-photo"
                />
              </label>
            }
          />
        </div>
      )}
    </>
  );
}
function PhotoCropper({
  file,
  onCancel,
  onCrop,
}: {
  file: File;
  onCancel: () => void;
  onCrop: (croppedFile: File) => void;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Crop rectangle in editor coordinates.
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [draggingImage, setDraggingImage] =
    useState(false);

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  const [imagePosition, setImagePosition] =
    useState({
      x: 0,
      y: 0,
    });

  const [startImagePosition, setStartImagePosition] =
    useState({
      x: 0,
      y: 0,
    });

  const [resizing, setResizing] = useState<
    'nw' | 'ne' | 'sw' | 'se' | null
  >(null);

  const [resizeStart, setResizeStart] =
    useState({
      x: 0,
      y: 0,
      crop: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
    });

  const [processing, setProcessing] =
    useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);

    setImageUrl(url);
    setImageLoaded(false);
    setZoom(1);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const setupEditor = () => {
    const editor = editorRef.current;
    const image = imageRef.current;

    if (!editor || !image) return;

    const editorWidth = editor.clientWidth;
    const editorHeight = editor.clientHeight;

    if (
      !image.naturalWidth ||
      !image.naturalHeight
    ) {
      return;
    }

    /*
     * Fit the complete original image inside
     * the editor first.
     */
    const fitScale = Math.min(
      editorWidth / image.naturalWidth,
      editorHeight / image.naturalHeight,
    );

    const displayedWidth =
      image.naturalWidth * fitScale;

    const displayedHeight =
      image.naturalHeight * fitScale;

    const imageX =
      (editorWidth - displayedWidth) / 2;

    const imageY =
      (editorHeight - displayedHeight) / 2;

    setImagePosition({
      x: imageX,
      y: imageY,
    });

    /*
     * IMPORTANT:
     * Start with the COMPLETE image selected.
     */
    setCrop({
      x: imageX,
      y: imageY,
      width: displayedWidth,
      height: displayedHeight,
    });

    setImageLoaded(true);
  };

  const getImageDisplaySize = () => {
    const image = imageRef.current;

    if (!image) {
      return {
        width: 0,
        height: 0,
      };
    }

    const editor = editorRef.current;

    if (!editor) {
      return {
        width: 0,
        height: 0,
      };
    }

    const fitScale = Math.min(
      editor.clientWidth / image.naturalWidth,
      editor.clientHeight / image.naturalHeight,
    );

    return {
      width:
        image.naturalWidth *
        fitScale *
        zoom,

      height:
        image.naturalHeight *
        fitScale *
        zoom,
    };
  };

  const moveImage = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!draggingImage || resizing) return;

    const deltaX =
      event.clientX - dragStart.x;

    const deltaY =
      event.clientY - dragStart.y;

    setImagePosition({
      x: startImagePosition.x + deltaX,
      y: startImagePosition.y + deltaY,
    });
  };

  const startImageDrag = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (resizing) return;

    event.preventDefault();

    setDraggingImage(true);

    setDragStart({
      x: event.clientX,
      y: event.clientY,
    });

    setStartImagePosition(
      imagePosition,
    );
  };

  const stopPointer = () => {
    setDraggingImage(false);
    setResizing(null);
  };

  const startResize = (
    handle:
      | 'nw'
      | 'ne'
      | 'sw'
      | 'se',
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setResizing(handle);

    setResizeStart({
      x: event.clientX,
      y: event.clientY,
      crop: { ...crop },
    });
  };

  const resizeCrop = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!resizing) return;

    const editor = editorRef.current;

    if (!editor) return;

    const dx =
      event.clientX -
      resizeStart.x;

    const dy =
      event.clientY -
      resizeStart.y;

    const original =
      resizeStart.crop;

    const minSize = 80;

    let next = {
      ...original,
    };

    if (resizing === 'se') {
      next.width = Math.max(
        minSize,
        original.width + dx,
      );

      next.height = Math.max(
        minSize,
        original.height + dy,
      );
    }

    if (resizing === 'sw') {
      const newX = Math.min(
        original.x + dx,
        original.x +
        original.width -
        minSize,
      );

      next.x = newX;

      next.width =
        original.width -
        (newX - original.x);

      next.height = Math.max(
        minSize,
        original.height + dy,
      );
    }

    if (resizing === 'ne') {
      const newY = Math.min(
        original.y + dy,
        original.y +
        original.height -
        minSize,
      );

      next.y = newY;

      next.height =
        original.height -
        (newY - original.y);

      next.width = Math.max(
        minSize,
        original.width + dx,
      );
    }

    if (resizing === 'nw') {
      const newX = Math.min(
        original.x + dx,
        original.x +
        original.width -
        minSize,
      );

      const newY = Math.min(
        original.y + dy,
        original.y +
        original.height -
        minSize,
      );

      next.x = newX;
      next.y = newY;

      next.width =
        original.width -
        (newX - original.x);

      next.height =
        original.height -
        (newY - original.y);
    }

    // Keep crop rectangle inside editor.
    next.x = Math.max(
      0,
      Math.min(
        next.x,
        editor.clientWidth -
        minSize,
      ),
    );

    next.y = Math.max(
      0,
      Math.min(
        next.y,
        editor.clientHeight -
        minSize,
      ),
    );

    next.width = Math.min(
      next.width,
      editor.clientWidth -
      next.x,
    );

    next.height = Math.min(
      next.height,
      editor.clientHeight -
      next.y,
    );

    setCrop(next);
  };

  const resetToFullPhoto = () => {
    const editor = editorRef.current;
    const image = imageRef.current;

    if (!editor || !image) return;

    const fitScale = Math.min(
      editor.clientWidth /
      image.naturalWidth,
      editor.clientHeight /
      image.naturalHeight,
    );

    const width =
      image.naturalWidth * fitScale;

    const height =
      image.naturalHeight * fitScale;

    const x =
      (editor.clientWidth - width) /
      2;

    const y =
      (editor.clientHeight - height) /
      2;

    setZoom(1);

    setImagePosition({
      x,
      y,
    });

    setCrop({
      x,
      y,
      width,
      height,
    });
  };

  const changeZoom = (
    value: number,
  ) => {
    const nextZoom = Number(value);

    const editor = editorRef.current;
    const image = imageRef.current;

    if (!editor || !image) {
      setZoom(nextZoom);
      return;
    }

    /*
     * Keep the image centered while zooming.
     */
    const oldSize =
      getImageDisplaySize();

    const baseScale = Math.min(
      editor.clientWidth /
      image.naturalWidth,
      editor.clientHeight /
      image.naturalHeight,
    );

    const newWidth =
      image.naturalWidth *
      baseScale *
      nextZoom;

    const newHeight =
      image.naturalHeight *
      baseScale *
      nextZoom;

    const centerX =
      editor.clientWidth / 2;

    const centerY =
      editor.clientHeight / 2;

    const oldCenterX =
      imagePosition.x +
      oldSize.width / 2;

    const oldCenterY =
      imagePosition.y +
      oldSize.height / 2;

    const ratioX =
      oldSize.width > 0
        ? (oldCenterX - centerX) /
        oldSize.width
        : 0;

    const ratioY =
      oldSize.height > 0
        ? (oldCenterY - centerY) /
        oldSize.height
        : 0;

    setImagePosition({
      x:
        centerX +
        ratioX * newWidth -
        newWidth / 2,

      y:
        centerY +
        ratioY * newHeight -
        newHeight / 2,
    });

    setZoom(nextZoom);
  };

  const cropImage = async () => {
    const image = imageRef.current;
    const editor = editorRef.current;

    if (
      !image ||
      !editor ||
      !imageLoaded ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(true);

      const editorWidth =
        editor.clientWidth;

      const editorHeight =
        editor.clientHeight;

      const fitScale = Math.min(
        editorWidth /
        image.naturalWidth,
        editorHeight /
        image.naturalHeight,
      );

      const displayedScale =
        fitScale * zoom;

      /*
       * Crop rectangle -> original image pixels.
       */
      let sourceX =
        (crop.x - imagePosition.x) /
        displayedScale;

      let sourceY =
        (crop.y - imagePosition.y) /
        displayedScale;

      let sourceWidth =
        crop.width /
        displayedScale;

      let sourceHeight =
        crop.height /
        displayedScale;

      /*
       * Keep everything inside the actual image.
       */
      sourceX = Math.max(
        0,
        Math.min(
          sourceX,
          image.naturalWidth,
        ),
      );

      sourceY = Math.max(
        0,
        Math.min(
          sourceY,
          image.naturalHeight,
        ),
      );

      sourceWidth = Math.min(
        sourceWidth,
        image.naturalWidth -
        sourceX,
      );

      sourceHeight = Math.min(
        sourceHeight,
        image.naturalHeight -
        sourceY,
      );

      if (
        sourceWidth <= 1 ||
        sourceHeight <= 1
      ) {
        throw new Error(
          'Please select a valid crop area.',
        );
      }

      /*
       * Do NOT force 4:3.
       *
       * Preserve the user's selected
       * crop proportions.
       *
       * Maximum output dimension:
       * 2400px.
       */
      const maxDimension = 2400;

      const outputScale = Math.min(
        1,
        maxDimension /
        Math.max(
          sourceWidth,
          sourceHeight,
        ),
      );

      const outputWidth = Math.max(
        1,
        Math.round(
          sourceWidth *
          outputScale,
        ),
      );

      const outputHeight = Math.max(
        1,
        Math.round(
          sourceHeight *
          outputScale,
        ),
      );

      const canvas =
        document.createElement(
          'canvas',
        );

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const context =
        canvas.getContext('2d');

      if (!context) {
        throw new Error(
          'Could not create image crop.',
        );
      }

      context.imageSmoothingEnabled =
        true;

      context.imageSmoothingQuality =
        'high';

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
              'image/jpeg',
              0.94,
            );
          },
        );

      if (!blob) {
        throw new Error(
          'Could not create the cropped image.',
        );
      }

      const croppedFile =
        new File(
          [blob],
          file.name.replace(
            /\.(jpg|jpeg|png)$/i,
            '',
          ) + '-edited.jpg',
          {
            type: 'image/jpeg',
            lastModified:
              Date.now(),
          },
        );

      await onCrop(croppedFile);
    } catch (error) {
      console.error(
        'PHOTO CROP ERROR:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Could not crop this photo.',
      );
    } finally {
      setProcessing(false);
    }
  };

  const imageSize =
    getImageDisplaySize();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6">

      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              Photo editor
            </p>

            <h2 className="mt-1 font-display text-2xl text-primary">
              Adjust your photo
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="grid size-10 place-items-center rounded-xl hover:bg-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Editor */}
        <div className="min-h-0 flex-1 bg-black p-4">

          <div
            ref={editorRef}
            className="relative mx-auto h-[55vh] min-h-[320px] max-h-[680px] w-full max-w-4xl touch-none overflow-hidden rounded-2xl bg-black"
            onPointerMove={
              resizing
                ? resizeCrop
                : moveImage
            }
            onPointerUp={
              stopPointer
            }
            onPointerCancel={
              stopPointer
            }
          >

            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Photo being edited"
                draggable={false}
                onLoad={setupEditor}
                onPointerDown={
                  startImageDrag
                }
                className="absolute max-w-none select-none"
                style={{
                  width: `${imageSize.width}px`,
                  height: `${imageSize.height}px`,
                  left: `${imagePosition.x}px`,
                  top: `${imagePosition.y}px`,
                  userSelect: 'none',
                  touchAction: 'none',
                  cursor: draggingImage
                    ? 'grabbing'
                    : 'grab',
                }}
              />
            )}

            {/* Dark overlay outside crop */}
            <div
              className="pointer-events-none absolute inset-0 bg-black/45"
              style={{
                clipPath: `polygon(
                  0 0,
                  100% 0,
                  100% 100%,
                  0 100%,
                  0 0,
                  ${crop.x}px ${crop.y}px,
                  ${crop.x}px ${crop.y + crop.height}px,
                  ${crop.x + crop.width}px ${crop.y + crop.height}px,
                  ${crop.x + crop.width}px ${crop.y}px,
                  ${crop.x}px ${crop.y}px
                )`,
              }}
            />

            {/* Crop selection */}
            {imageLoaded && (
              <div
                className="absolute border-2 border-white"
                style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.width,
                  height: crop.height,
                }}
              >
                {/* Grid */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/3 top-0 h-full border-l border-white/30" />
                  <div className="absolute left-2/3 top-0 h-full border-l border-white/30" />
                  <div className="absolute left-0 top-1/3 w-full border-t border-white/30" />
                  <div className="absolute left-0 top-2/3 w-full border-t border-white/30" />
                </div>

                {/* Handles */}
                {(
                  [
                    ['nw', '-left-2 -top-2'],
                    ['ne', '-right-2 -top-2'],
                    ['sw', '-left-2 -bottom-2'],
                    ['se', '-right-2 -bottom-2'],
                  ] as const
                ).map(
                  ([handle, positionClass]) => (
                    <button
                      key={handle}
                      type="button"
                      onPointerDown={(event) =>
                        startResize(
                          handle,
                          event,
                        )
                      }
                      className={`absolute ${positionClass} z-20 size-5 rounded-full border-2 border-white bg-accent shadow-lg`}
                      aria-label={`Resize crop ${handle}`}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-border bg-card px-5 py-4">

          <div className="flex flex-col gap-4">

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">
                Zoom
              </span>

              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) =>
                  changeZoom(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="w-full accent-primary"
              />

              <span className="w-12 text-right text-xs text-muted-foreground">
                {zoom.toFixed(1)}×
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <button
                type="button"
                onClick={
                  resetToFullPhoto
                }
                disabled={processing}
                className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary"
              >
                Use full photo
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={processing}
                  className="min-h-11 rounded-xl border border-border px-5 text-sm font-bold hover:bg-secondary"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={cropImage}
                  disabled={
                    processing ||
                    !imageLoaded
                  }
                  className="min-h-11 rounded-xl bg-accent px-6 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {processing
                    ? 'Saving…'
                    : 'Save photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
function ManagePhotosReal() {
  const { isAuthenticated } = useAuth();

  const profile = useGetMyProfile({
    query: {
      queryKey: getGetMyProfileQueryKey(),
    },
  });

  const requestUrl = useRequestUploadUrl();
  const complete = useCompletePhotoUpload();
  const remove = useDeletePhoto();
  const update = useUpdatePhoto();

  const [toast, setToast] = useState('');
  const [cropFile, setCropFile] = useState<File | null>(null);

  const files = profile.data?.photos ?? [];

  const busy =
    requestUrl.isPending ||
    complete.isPending;

  const uploadCroppedFile = async (file: File) => {
    try {
      setToast('');

      if (!isAuthenticated) {
        throw new Error(
          'Your sign-in session could not be verified. Please sign in again.',
        );
      }

      console.log(
        'REQUESTING UPLOAD URL FOR CROPPED PHOTO',
        {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      );

      const upload = await requestUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType:
            file.type as
              | 'image/jpeg'
              | 'image/png',
        },
      });

      console.log(
        'CROPPED PHOTO UPLOAD URL RESPONSE',
        upload,
      );

      const stored = await fetch(
        upload.uploadURL,
        {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          credentials: 'include',
          body: file,
        },
      );

      console.log(
        'CROPPED FILE UPLOAD RESPONSE:',
        stored.status,
      );

      if (!stored.ok) {
        throw new Error(
          `Photo upload failed (${stored.status}).`,
        );
      }

      await complete.mutateAsync({
        data: {
          objectPath: upload.objectPath,
          fileType:
            file.type as
              | 'image/jpeg'
              | 'image/png',
          isPrimary: files.length === 0,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: getGetMyProfileQueryKey(),
      });

      setToast(
        'Photo added to your profile.',
      );
    } catch (error) {
      console.error(
        'PHOTO UPLOAD ERROR',
        error,
      );

      setToast(errorText(error));
    } finally {
      setCropFile(null);
    }
  };

  const onFile = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    console.log(
      'PHOTO SELECTED',
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    );

    if (
      ![
        'image/jpeg',
        'image/png',
      ].includes(file.type)
    ) {
      setToast(
        'Please choose a JPG, JPEG, or PNG image.',
      );

      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast(
        'Please choose an image under 5 MB.',
      );

      event.target.value = '';
      return;
    }

    setToast('');
    setCropFile(file);

    // Allows selecting the same photo again.
    event.target.value = '';
  };

  const removePhoto = (id: string) => {
    if (
      !window.confirm(
        'Remove this photo from your profile?',
      )
    ) {
      return;
    }

    remove.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey:
              getGetMyProfileQueryKey(),
          });

          setToast('Photo removed.');
        },

        onError: (error) => {
          setToast(errorText(error));
        },
      },
    );
  };

  const setPrimary = (id: string) => {
    update.mutate(
      {
        id,
        data: {
          isPrimary: true,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey:
              getGetMyProfileQueryKey(),
          });

          setToast(
            'Primary photo updated.',
          );
        },

        onError: (error) => {
          setToast(errorText(error));
        },
      },
    );
  };

  return (
    <>
      <PageHeading
        eyebrow="Photos"
        title="Let people see your world."
        body="Add clear photos to your profile. You can reposition and crop every photo before uploading it."
        action={
          <label
            className={`focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground ${
              busy
                ? 'pointer-events-none opacity-60'
                : ''
            }`}
          >
            <Plus size={16} />

            Add photo

            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="sr-only"
              onChange={onFile}
              disabled={busy}
              data-testid="input-upload-photo"
            />
          </label>
        }
      />

      {toast && (
        <p
          className="mt-5 rounded-xl bg-primary/10 p-3 text-sm text-primary"
          role="status"
          data-testid="status-photo-action"
        >
          {toast}
        </p>
      )}

      {profile.isLoading ? (
        <div className="mt-7 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
        </div>
      ) : files.length ? (
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((column) => (
            <div
              key={column}
              className="flex min-w-0 flex-col gap-4"
            >
              {files
                .filter(
                  (_, index) =>
                    index % 3 === column,
                )
                .map((photo) => (
                  <div
                    key={photo.id}
                    className="h-fit w-full overflow-hidden rounded-2xl border border-border bg-card"
                    data-testid={`card-photo-${photo.id}`}
                  >
                    <div className="w-full overflow-hidden rounded-t-2xl bg-secondary">
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt="Your profile"
                          className="block h-auto w-full"
                        />
                      ) : (
                        <div className="flex min-h-64 w-full items-center justify-center text-muted-foreground">
                          <ImagePlus size={28} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 p-3">
                      {photo.isPrimary ? (
                        <span className="rounded-lg bg-primary/10 px-2 py-1 font-mono-ui text-[10px] uppercase tracking-wider text-primary">
                          Primary
                        </span>
                      ) : (
                        <button
                          className="text-xs font-semibold text-accent"
                          onClick={() =>
                            setPrimary(photo.id)
                          }
                          data-testid={`button-primary-photo-${photo.id}`}
                        >
                          Make primary
                        </button>
                      )}

                      <button
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          removePhoto(photo.id)
                        }
                        aria-label="Remove photo"
                        data-testid={`button-delete-photo-${photo.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            icon={<ImagePlus size={22} />}
            title="Your gallery is empty"
            body="Add one clear photo. You'll be able to position and crop it before it reaches your profile."
            action={
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-accent">
                Choose a photo

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="sr-only"
                  onChange={onFile}
                  disabled={busy}
                  data-testid="input-empty-upload-photo"
                />
              </label>
            }
          />
        </div>
      )}

      {cropFile &&
        createPortal(
          <PhotoCropper
            file={cropFile}
            onCancel={() =>
              setCropFile(null)
            }
            onCrop={uploadCroppedFile}
          />,
          document.body,
        )}
    </>
  );
}

function PrivacySettings() { const profile = useGetMyProfile({ query: { queryKey: getGetMyProfileQueryKey() } }); const visibility = useUpdateProfileVisibility(); const [toast, setToast] = useState(''); const current = profile.data?.visibility ?? 'private'; const change = (value: 'public' | 'private') => visibility.mutate({ data: { visibility: value } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() }); setToast(`Your profile is now ${value}.`); }, onError: (error) => setToast(errorText(error)) }); return <><PageHeading eyebrow="Privacy" title="You choose the window." body="Your contact details are never part of a public profile. Visibility controls whether your introduction appears in discovery." />{toast && <p className="mt-5 rounded-xl bg-primary/10 p-3 text-sm text-primary" role="status" data-testid="status-visibility">{toast}</p>}<div className="mt-7 grid gap-4 md:grid-cols-2"><button onClick={() => change('public')} className={`focus-ring rounded-2xl border p-6 text-left transition ${current === 'public' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`} data-testid="button-visibility-public"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Eye size={21} /></span>{current === 'public' && <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={15} /></span>}</div><h2 className="mt-6 font-display text-3xl text-primary">Public</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Your profile can appear to relevant signed-in members in discovery. Email and other private contact details remain hidden.</p></button><button onClick={() => change('private')} className={`focus-ring rounded-2xl border p-6 text-left transition ${current === 'private' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`} data-testid="button-visibility-private"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-secondary text-muted-foreground"><LockKeyhole size={21} /></span>{current === 'private' && <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={15} /></span>}</div><h2 className="mt-6 font-display text-3xl text-primary">Private</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Only you can see your profile. Use this while you are preparing your introduction or taking a pause.</p></button></div><div className="mt-8 rounded-2xl border border-border bg-secondary/30 p-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-primary" size={20} /><div><h3 className="font-semibold">A useful boundary</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">We will never display your email, phone number, password, exact home address, or private family information on public profile pages.</p></div></div></div></>; }
function Interests() {
  const interests = useListInterests({
    query: { queryKey: getListInterestsQueryKey() },
  });

  const update = useUpdateInterest();
  const [toast, setToast] = useState('');

  if (interests.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (interests.isError || !interests.data) {
    return (
      <QueryError
        message={errorText(interests.error)}
        retry={() => interests.refetch()}
      />
    );
  }

  // New accounts may not have these arrays yet.
  const received = interests.data.received ?? [];
  const sent = interests.data.sent ?? [];

  const respond = (
    id: string,
    status: 'accepted' | 'declined',
  ) => {
    update.mutate(
      {
        id,
        data: {
          status:
            status === 'accepted'
              ? InterestUpdateStatus.accepted
              : InterestUpdateStatus.declined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListInterestsQueryKey(),
          });

          setToast(
            status === 'accepted'
              ? 'Interest accepted.'
              : 'Interest declined.',
          );
        },

        onError: (error) => {
          setToast(errorText(error));
        },
      },
    );
  };

  const row = (
    item: (typeof sent)[number],
    incoming: boolean,
  ) => (
    <div
      className="flex flex-col gap-4 border-b border-border py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
      key={item.id}
      data-testid={`row-interest-${item.id}`}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            {initials(
              incoming
                ? item.senderName
                : item.receiverName,
            )}
          </span>

          <p className="font-semibold">
            {incoming
              ? item.senderName
              : item.receiverName}
          </p>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {incoming
            ? 'Sent you an interest'
            : 'You sent an interest'}{' '}
          · {new Date(item.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {item.status === 'pending' && incoming ? (
          <>
            <Button
              variant="quiet"
              onClick={() =>
                respond(item.id, 'declined')
              }
              data-testid={`button-decline-interest-${item.id}`}
            >
              Decline
            </Button>

            <Button
              onClick={() =>
                respond(item.id, 'accepted')
              }
              data-testid={`button-accept-interest-${item.id}`}
            >
              Accept
            </Button>
          </>
        ) : (
          <span
            className={`rounded-lg px-2.5 py-1.5 font-mono-ui text-[10px] uppercase tracking-wider ${item.status === 'accepted'
                ? 'bg-primary/10 text-primary'
                : item.status === 'declined'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-secondary text-muted-foreground'
              }`}
          >
            {item.status}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <PageHeading
        eyebrow="Interests"
        title="A little clarity."
        body="Interests are private signals, not public metrics. Respond when you have the space to do so."
      />

      {toast && (
        <p
          className="mt-5 rounded-xl bg-primary/10 p-3 text-sm text-primary"
          role="status"
          data-testid="status-interest"
        >
          {toast}
        </p>
      )}

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl text-primary">
              Received
            </h2>

            <span className="rounded-full bg-accent/10 px-2 py-1 font-mono-ui text-[10px] text-accent">
              {received.length}
            </span>
          </div>

          {received.length > 0 ? (
            <div className="mt-3">
              {received.map((item) =>
                row(item, true),
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                icon={<Heart size={20} />}
                title="Nothing incoming"
                body="When someone sends you a considered interest, it will appear here."
              />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl text-primary">
              Sent
            </h2>

            <span className="rounded-full bg-primary/10 px-2 py-1 font-mono-ui text-[10px] text-primary">
              {sent.length}
            </span>
          </div>

          {sent.length > 0 ? (
            <div className="mt-3">
              {sent.map((item) =>
                row(item, false),
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                icon={<Compass size={20} />}
                title="Start with a look around"
                body="Find a profile that feels relevant, then send one thoughtful interest."
                action={
                  <Link
                    href="/discover"
                    className="text-sm font-bold text-accent"
                    data-testid="link-interests-discover"
                  >
                    Discover profiles
                  </Link>
                }
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function Admin() { const stats = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } }); const reports = useListAdminReports({ page: 1, pageSize: 12 }, { query: { queryKey: getListAdminReportsQueryKey({ page: 1, pageSize: 12 }) } }); return <><PageHeading eyebrow="Moderation" title="Keep the space worthy." body="A quiet overview for reviewing the health and safety of the community." /><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Users', stats.data?.totalUsers], ['Public profiles', stats.data?.publicProfiles], ['Pending reports', stats.data?.pendingReports], ['Interests sent', stats.data?.interestsSent]].map(([label, value]) => <div className="rounded-2xl border border-border bg-card p-5" key={label as string}><p className="eyebrow text-muted-foreground">{label as string}</p><p className="mt-3 font-display text-5xl text-primary">{stats.isLoading ? '—' : value as number}</p></div>)}</div><section className="mt-8 rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><p className="eyebrow text-accent">Queue</p><h2 className="mt-2 font-display text-3xl text-primary">Reports to review</h2></div><FileText className="text-muted-foreground" /></div>{reports.isLoading ? <div className="mt-5 space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div> : reports.isError ? <p className="mt-5 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{errorText(reports.error)}</p> : reports.data?.items.length ? <div className="mt-5 divide-y divide-border">{reports.data.items.map((report) => <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" key={report.id} data-testid={`row-report-${report.id}`}><div><p className="font-semibold">{report.reason.replaceAll('_', ' ')}</p><p className="mt-1 text-xs text-muted-foreground">Profile {report.reportedProfileId} · {new Date(report.createdAt).toLocaleDateString()}</p></div><span className="rounded-lg bg-accent/10 px-2.5 py-1.5 font-mono-ui text-[10px] uppercase tracking-wider text-accent">{report.status}</span></div>)}</div> : <EmptyState icon={<Check size={20} />} title="The queue is clear" body="No reports are waiting for review." />}</section></>; }

function NotFound() { return <PublicLayout><main className="grid min-h-[65vh] place-items-center px-5 py-20 text-center"><div><p className="eyebrow text-accent">404 · Trail not found</p><h1 className="mt-4 font-display text-7xl text-primary">This path ends<br /><em>in the clouds.</em></h1><p className="mx-auto mt-5 max-w-md text-muted-foreground">The page you were looking for has moved or never existed.</p><Link href="/" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground" data-testid="link-not-found-home">Return home <ArrowRight size={16} /></Link></div></main></PublicLayout>; }

function HomeRedirect() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    let cancelled = false;

    async function checkProfileSetup() {
      setCheckingProfile(true);

      try {
        const response = await fetch("/api/profile/setup", {
          credentials: "include",
        });

        if (cancelled) return;

        if (!response.ok) {
          setLocation("/profile-setup");
          return;
        }

        const data = await response.json();

        if (data.completed === true) {
          setLocation("/dashboard");
        } else {
          setLocation("/profile-setup");
        }
      } catch {
        if (!cancelled) {
          setLocation("/profile-setup");
        }
      } finally {
        if (!cancelled) {
          setCheckingProfile(false);
        }
      }
    }

    void checkProfileSetup();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background" />
    );
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  if (checkingProfile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-semibold">
            Loading your profile...
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            Please wait
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background" />
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/sign-in/*?" component={() => <SignInPage />} />
        <Route path="/sign-up/*?" component={() => <SignInPage signUp />} />

        <Route path="/" component={HomeRedirect} />
        <Route path="/about" component={About} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/safety" component={Safety} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy-policy" component={() => <Legal type="privacy" />} />
        <Route path="/terms" component={() => <Legal type="terms" />} />

        <Route
          path="/profile-setup"
          component={() => (
            <OnboardingGate>
              <ProfileSetup />
            </OnboardingGate>
          )}
        />

        <Route path="/dashboard" component={() => <Gate><DashboardSafe /></Gate>} />
        <Route path="/discover" component={() => <Gate><Discover /></Gate>} />
        <Route path="/profiles/:id" component={ProfilePage} />
        <Route path="/my-profile" component={() => <Gate><MyProfilePage /></Gate>} />
        <Route path="/edit-profile" component={() => <Gate><EditProfile /></Gate>} />
        <Route path="/manage-photos" component={() => <Gate><ManagePhotosReal /></Gate>} />
        <Route
  path="/profile-photo-setup"
  component={() => (
    <AuthOnly>
      <ProfilePhotoSetup />
    </AuthOnly>
  )}
/>
        <Route path="/profile-photos" component={() => <Gate><ManagePhotosReal /></Gate>} />
        <Route path="/privacy-settings" component={() => <Gate><PrivacySettings /></Gate>} />
        <Route path="/interests" component={() => <Gate><Interests /></Gate>} />
        <Route path="/admin" component={() => <Gate><Admin /></Gate>} />

        <Route path="/not-found" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}
function App() {
  return (
    <AuthProvider>
      <WouterRouter base={basePath}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </WouterRouter>
    </AuthProvider>
  );
}
export default App;
