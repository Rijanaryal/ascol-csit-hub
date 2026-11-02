import { redirect } from "next/navigation";
import Link from "next/link";
import AssignmentManager from "@/app/components/AssignmentManager";
import LogoutButton from "@/app/components/LogoutButton";
import CampusEmblem from "@/app/components/CampusEmblem";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "teacher") redirect("/teacher/login");

  return (
    <main className="teacher-assignment-page">
      <header className="teacher-dashboard-header">
        <Link className="teacher-dashboard-brand" href="/" aria-label="ASCOL CSIT HUB home">
          <span className="teacher-dashboard-mark"><CampusEmblem /></span>
          <span>
            <strong>Amrit Campus - CSIT</strong>
            <small>ASCOL CSIT HUB · TRIBHUVAN UNIVERSITY</small>
          </span>
        </Link>
        <nav className="teacher-dashboard-nav" aria-label="Teacher portal navigation">
          <Link href="/">Home</Link>
          <Link href="/hub">Student hub</Link>
          <span>Teacher portal</span>
        </nav>
        <LogoutButton />
      </header>
      <section className="teacher-assignment-content" aria-label="Assignment publishing dashboard">
        <AssignmentManager />
      </section>
    </main>
  );
}
