import Link from "next/link";
import AuthForm from "@/app/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <Link className="auth-home-link" href="/">
        ← Back to ASCOL CSIT HUB
      </Link>
      <AuthForm selectableRole mode="signup" />
    </main>
  );
}
