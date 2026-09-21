import React from "react";
import styles from "./SocialIconsHorizontal.module.css";
import { FaLinkedin, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const socialLinks = [
  {
    href: "https://chat.whatsapp.com/FMZWuDow9GeA0Og8tm3rGm",
    icon: <FaWhatsapp size={36} />,
    label: "WhatsApp",
    extraClass: styles.orangeBackground
  },
  {
    href: "https://www.instagram.com/studique.in/",
    icon: <FaInstagram size={36} />,
    label: "Instagram",
    extraClass: styles.orangeBackground
  },
  {
    href: "https://www.linkedin.com/company/studiquecommunity",
    icon: <FaLinkedin size={36} />,
    label: "LinkedIn",
    extraClass: styles.orangeBackground
  },
  {
    href: "mailto:community@studique.in",
    icon: <MdEmail size={36} />,
    label: "Email",
    extraClass: styles.orangeBackground
  }
];

const SocialIconsHorizontal = () => (
  <div className={styles.socialIconsContainerHorizontal}>
    <div className={styles.linksHorizontal}>
      {socialLinks.map(({ href, icon, label, extraClass }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Follow us on ${label}`}
          className={`${styles.linkHorizontal} ${extraClass}`}
        >
          <div className={styles.iconBoxHorizontal}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={styles[`span${n}`]}>{n === 5 ? icon : null}</span>
            ))}
          </div>
        </a>
      ))}
    </div>
  </div>
);

export default SocialIconsHorizontal;
