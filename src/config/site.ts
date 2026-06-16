export const SITE = {
  name: "Valley Septic",
  fullName: "Valley Septic Services & Tank Pumping",
  url: "https://valleyseptic.ca",
  phone: "(604) 799-8640",
  phoneRaw: "604-799-8640",
  phoneHref: "tel:604-799-8640",
  email: "info@valleyseptic.ca",
  emailHref: "mailto:info@valleyseptic.ca",
  serviceArea: "Fraser Valley, BC",
  defaultDescription:
    "Trusted septic services across the Fraser Valley, BC, including tank pumping, inspections, grease trap cleaning, and 24/7 emergency septic service.",
  gtmId: "GTM-W968ZK8Z",
  ogImage: "/images/2024/09/SepticNewLogo.webp",
  logo: "/images/2024/09/SepticNewLogo-1.webp",
  hours: {
    weekdays: "24/7 Emergency Service",
    note: "Available 24/7 for septic emergencies",
  },
  address: {
    street: "2610 Prairie Ave",
    locality: "Chilliwack",
    region: "British Columbia",
    regionCode: "BC",
    postalCode: "V2R 5B9",
    country: "CA",
    serviceCities: ["Abbotsford", "Chilliwack", "Langley", "Mission", "Hope"],
    full: "2610 Prairie Ave, Chilliwack, BC V2R 5B9",
  },
} as const;

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Services",
    href: "#",
    children: [
      { label: "Tank Pumping", href: "/tank-pumping/" },
      { label: "Emergency Response", href: "/emergency-septic-services/" },
      { label: "Septic Alarms", href: "/septic-alarms/" },
      { label: "Grease Trap Service", href: "/grease-trap-service/" },
      { label: "Septic Inspection", href: "/septic-inspection/" },
    ],
  },
  {
    label: "Service Areas",
    href: "#",
    children: [
      { label: "Abbotsford", href: "/septic-services-abbotsford/" },
      { label: "Langley", href: "/septic-services-langley/" },
      { label: "Mission", href: "/septic-services-mission/" },
      { label: "Hope", href: "/septic-services-hope/" },
      { label: "Chilliwack", href: "/septic-services-chilliwack/" },
    ],
  },
  { label: "Emergency Response", href: "/emergency-septic-services/" },
  { label: "About", href: "/about/" },
  { label: "Contact Us", href: "/contact/" },
];

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};
