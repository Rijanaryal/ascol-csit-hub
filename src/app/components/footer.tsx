import { ArrowUpRight } from "lucide-react";
import CampusEmblem from "./CampusEmblem";

export default function Footer() {
  return (
    <footer className="site-footer" id="contribute">
      <div className="footer-main">
        <div className="footer-brand">
          <a className="brand brand-footer" href="#home">
            <span className="brand-mark">
              <CampusEmblem />
            </span>
            <span className="brand-name">
              <strong>Amrit Campus - CSIT</strong>
              <span>ASCOL CSIT HUB · TRIBHUVAN UNIVERSITY</span>
              <span className="brand-location">THAMEL, KATHMANDU</span>
            </span>
          </a>
          <p>
            A student-led academic space for learning, sharing and growing
            together.
          </p>
        </div>
        <div className="footer-column">
          <span className="footer-heading">EXPLORE</span>
          <a href="#notes">Study resources</a>
          <a href="#semesters">By semester</a>
          <a href="#questions">Question bank</a>
        </div>
        <div className="footer-column">
          <span className="footer-heading">THE HUB</span>
          <a href="#notices">Announcements</a>
          <a href="#events">Community</a>
          <a href="mailto:hello@ascolcsithub.com">
            Contact us <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
        <div className="footer-note">
          <span className="footer-note-icon">✳</span>
          <p>
            
           
            <strong>ASCOL CSIT community.</strong>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 ASCOL CSIT HUB · STUDENT-LED PROJECT</span>
        <a href="#home">BACK TO TOP ↑</a>
      </div>
    </footer>
  );
}