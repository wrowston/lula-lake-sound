import Link from "next/link";

export default function DashboardAccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-semibold text-xl tracking-tight">
        Inference Partners dashboard
      </h1>
      <p className="max-w-md text-muted-foreground text-sm">
        This area is limited to Inference Partners accounts. If you expected access,
        sign in with the correct organization or contact your administrator.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          className="text-primary text-sm underline underline-offset-4"
          href="/sign-in"
        >
          Sign in
        </Link>
        <Link
          className="text-muted-foreground text-sm underline underline-offset-4"
          href="https://www.inferencepartners.ai/"
        >
          Inference Partners
        </Link>
      </div>
    </div>
  );
}
