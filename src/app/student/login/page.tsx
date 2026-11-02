import Link from "next/link";
import AuthForm from "@/app/components/AuthForm";

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;
  return (
    <main className="auth-page auth-page-login">
      <Link className="auth-home-link" href="/">
        ← Back to ASCOL CSIT HUB
      </Link>
      <AuthForm role="student" mode="login" registered={registered === "1"} />
    </main>
  );
}
