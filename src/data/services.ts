export const SERVICES = [
  {
    slug: "septic-inspection",
    href: "/septic-inspection/",
    title: "Septic Inspections",
    pageH1: "Expert Septic Inspections in the Fraser Valley",
    short: "Comprehensive system checks to prevent issues and ensure optimal performance.",
    long: "Whether you're buying a new home, planning maintenance, or want peace of mind, our certified inspectors evaluate every component of your septic system — from tank baffles to drainfield drainage — and provide a detailed report you can act on.",
    image: "/images/2025/12/septicinspection.webp",
    icon: "🔎",
    bullets: [
      "Real estate / pre-purchase inspections",
      "Annual maintenance inspections",
      "Drainfield evaluations",
      "Camera/dye testing where required",
      "Written report with photos & recommendations",
    ],
  },
  {
    slug: "tank-pumping",
    href: "/tank-pumping/",
    title: "Septic Tank Pumping",
    pageH1: "Expert Septic Tank Pumping in Fraser Valley",
    short: "Regular pumping to remove waste and maintain your septic system's efficiency.",
    long: "Most Fraser Valley homes need their tank pumped every 2-5 years depending on household size and tank capacity. Our fast, mess-free pumping service keeps your system running smoothly and prevents costly backups.",
    image: "/images/2025/12/valley-septic-truck1-2.webp",
    icon: "🚛",
    bullets: [
      "Residential and commercial pumping",
      "Truck access for tight or remote properties",
      "Sludge level measurement and reporting",
      "Discharge handled at approved facilities",
      "Same-week scheduling for most jobs",
    ],
  },
  {
    slug: "grease-trap-service",
    href: "/grease-trap-service/",
    title: "Grease Trap Service",
    pageH1: "Grease Trap Pumping in the Fraser Valley",
    short: "Professional cleaning and maintenance for commercial kitchen grease traps.",
    long: "Restaurants, food processors, and commercial kitchens trust us to keep their grease interceptors compliant and odour-free. We service on a schedule that works for your kitchen and keep records you can show to bylaw or health inspectors.",
    image: "/images/2025/12/grease-trap3.webp",
    icon: "🍳",
    bullets: [
      "Scheduled and emergency pumping",
      "Indoor and outdoor grease interceptors",
      "Compliance documentation provided",
      "After-hours servicing available",
      "Restaurant, food processing & multi-unit",
    ],
  },
  {
    slug: "septic-alarms",
    href: "/septic-alarms/",
    title: "Septic Alarms",
    pageH1: "Septic Alarm Response in the Fraser Valley",
    short: "Fast diagnosis and repair when your septic alarm sounds — day or night.",
    long: "A septic alarm means something needs attention — it doesn't always mean an emergency, but it always means don't ignore it. We respond quickly, diagnose the cause, and get your system back to normal operation.",
    image: "/images/2025/12/septic-alarm2.webp",
    icon: "🚨",
    bullets: [
      "High-water alarm response",
      "Pump troubleshooting & replacement",
      "Float switch service",
      "Control panel diagnostics",
      "24/7 emergency response",
    ],
  },
  {
    slug: "emergency-septic-services",
    href: "/emergency-septic-services/",
    title: "Emergency Septic",
    pageH1: "Call 24/7 — Do Not Hesitate to Call Us",
    short: "24/7 rapid response for urgent septic system problems.",
    long: "Sewage backup, alarm flashing, drains overflowing, or saturated drainfield? Stop pouring water down drains, keep people and pets away from any standing waste, and call us. We answer 24/7 and dispatch as fast as the road allows.",
    image: "/images/2024/09/septicpumptruck-1.webp",
    icon: "📞",
    bullets: [
      "True 24/7 phone answer",
      "Sewage backup response",
      "Saturated drainfield triage",
      "After-hours pumping",
      "Safe containment & cleanup guidance",
    ],
  },
] as const;

export const AREAS = [
  {
    slug: "septic-services-abbotsford",
    href: "/septic-services-abbotsford/",
    city: "Abbotsford",
    pageH1: "Septic Tank Cleaning, Pumping & Septic Services in Abbotsford",
    intro:
      "From Sumas Mountain to Aldergrove and everywhere in between, Valley Septic keeps Abbotsford homes and businesses running smoothly. Whether you're on acreage off Eldridge or in a development near Mt. Lehman, we know the soils, the bylaws, and the local quirks of Abbotsford septic systems.",
    map: "/images/2024/09/abbymap.webp",
    image: "/images/2024/08/abbotsford-septic-and-plumbing.jpg",
  },
  {
    slug: "septic-services-chilliwack",
    href: "/septic-services-chilliwack/",
    city: "Chilliwack",
    pageH1: "Septic Tank Cleaning, Pumping & Septic Services in Chilliwack",
    intro:
      "Valley Septic has been serving the Chilliwack community for years — from Sardis to Yarrow, Greendale to Promontory. Our trucks are based locally so response is fast and pricing stays fair.",
    map: "/images/2024/09/ChilliwackMap.webp",
    image: "/images/2024/08/septic-and-plumbing-services-in-chilliwack.jpg",
  },
  {
    slug: "septic-services-mission",
    href: "/septic-services-mission/",
    city: "Mission",
    pageH1: "Septic Services in Mission, BC",
    intro:
      "Mission's mix of rural acreage and growing residential neighbourhoods means septic systems here run the full gamut — gravity systems, pump systems, and engineered fields. We service them all.",
    map: "/images/2024/09/MissionMap.webp",
    image: "/images/2024/08/septic-and-plumbing-services-in-mission.jpg",
  },
  {
    slug: "septic-services-langley",
    href: "/septic-services-langley/",
    city: "Langley",
    pageH1: "Septic Services in Langley, BC",
    intro:
      "From hobby farms in Fort Langley to acreages in Aldergrove and Otter, Langley properties depend on well-maintained septic systems. Valley Septic provides pumping, inspection, and emergency response across the Township and City.",
    map: "/images/2024/09/LangleyMap.webp",
    image: "/images/2024/08/septic-and-plumbing-services-in-langley.jpg",
  },
  {
    slug: "septic-services-hope",
    href: "/septic-services-hope/",
    city: "Hope",
    pageH1: "Septic Services in Hope, BC",
    intro:
      "Hope's septic systems work hard through cold winters and busy summer weekends. We service the District of Hope, Silver Creek, Flood-Hope, and surrounding areas with the same attention we give every Fraser Valley community.",
    map: "/images/2024/09/hope.webp",
    image: "/images/2024/09/hope.webp",
  },
] as const;

export type Service = (typeof SERVICES)[number];
export type Area = (typeof AREAS)[number];
