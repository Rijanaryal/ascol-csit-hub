import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import StudentAssignments from "@/app/components/StudentAssignments";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "student") redirect("/student/login");

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="dashboard-brand" href="/">
          ASCOL <span>CSIT HUB</span>
        </Link>
        <LogoutButton />
      </header>
      <section className="dashboard-welcome">
        <p className="section-kicker">STUDENT SPACE</p>
        <h1>Welcome, {user.name}.</h1>
        <p>
          {user.semester ? `Semester ${user.semester} · ` : ""}
          Your teachers&apos; assignments and class resources, in one place.
        </p>
      </section>
      <section className="dashboard-content">
        <div className="dashboard-section-heading">
          <div>
            <p className="section-kicker">FROM YOUR TEACHERS</p>
            <h2>Your assignments</h2>
            <p className="section-description">
              Published classwork and due dates for your semester.
            </p>
          </div>
        </div>
        <StudentAssignments />
      </section>
    </main>
  );
}
