// Page body content (real, extracted from the source WordPress site and
// sanitized to semantic HTML). This file is generated from
// source-truth/clean/*.json and is the source of truth for page copy.
// Editing here is fine — just don't expect re-extraction to preserve edits.

import abouT from "../../source-truth/clean/about.json";
import contacT from "../../source-truth/clean/contact.json";
import emergencY from "../../source-truth/clean/emergency-septic-services.json";
import greaseTraP from "../../source-truth/clean/grease-trap-service.json";
import homE from "../../source-truth/clean/home.json";
import septicAlarmS from "../../source-truth/clean/septic-alarms.json";
import septicCalC from "../../source-truth/clean/septic-calculator.json";
import septicInsP from "../../source-truth/clean/septic-inspection.json";
import abbY from "../../source-truth/clean/septic-services-abbotsford.json";
import chilL from "../../source-truth/clean/septic-services-chilliwack.json";
import hopE from "../../source-truth/clean/septic-services-hope.json";
import langL from "../../source-truth/clean/septic-services-langley.json";
import missioN from "../../source-truth/clean/septic-services-mission.json";
import langleyCleaN from "../../source-truth/clean/septic-tank-cleaning-langley.json";
import missionCleaN from "../../source-truth/clean/septic-tank-cleaning-mission.json";
import tankPumP from "../../source-truth/clean/tank-pumping.json";

import postSepticTankPumpAbb from "../../source-truth/clean/post-septic-tank-pumping-in-abbotsford-bc.json";
import postMissionProblems from "../../source-truth/clean/post-septic-services-in-mission-common-problems-we-see.json";
import postInspectTime from "../../source-truth/clean/post-how-long-does-a-septic-inspection-take.json";
import postPerimeter from "../../source-truth/clean/post-the-importance-of-perimeter-drainage.json";
import postWinter from "../../source-truth/clean/post-top-3-tips-for-winter-septic-tank-services.json";
import postCanFreeze from "../../source-truth/clean/post-can-a-septic-tank-freeze.json";
import postSpring from "../../source-truth/clean/post-spring-septic-maintenance-tips.json";
import postTop5Signs from "../../source-truth/clean/post-top-5-signs-your-septic-system-needs-professional-attention.json";
import postHowOftenPump from "../../source-truth/clean/post-how-often-should-you-pump-your-septic-tank-in-the-fraser-valley.json";
import postTipsFreezing from "../../source-truth/clean/post-top-3-tips-for-keep-your-septic-system-from-freezing.json";
import postHowTankWorks from "../../source-truth/clean/post-how-does-a-septic-tank-work.json";
import postHowAlarmWorks from "../../source-truth/clean/post-how-does-a-septic-alarm-work.json";
import postEmergencyGrease from "../../source-truth/clean/post-what-is-emergency-grease-trap-cleaning.json";

export type PageContent = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  ogImage: string;
  datePublished?: string;
  dateModified?: string;
  detectedDate?: string;
  excerpt: string;
  bodyHtml: string;
};

export const PAGES: Record<string, PageContent> = {
  about: abouT as PageContent,
  contact: contacT as PageContent,
  "emergency-septic-services": emergencY as PageContent,
  "grease-trap-service": greaseTraP as PageContent,
  home: homE as PageContent,
  "septic-alarms": septicAlarmS as PageContent,
  "septic-calculator": septicCalC as PageContent,
  "septic-inspection": septicInsP as PageContent,
  "septic-services-abbotsford": abbY as PageContent,
  "septic-services-chilliwack": chilL as PageContent,
  "septic-services-hope": hopE as PageContent,
  "septic-services-langley": langL as PageContent,
  "septic-services-mission": missioN as PageContent,
  "septic-tank-cleaning-langley": langleyCleaN as PageContent,
  "septic-tank-cleaning-mission": missionCleaN as PageContent,
  "tank-pumping": tankPumP as PageContent,
};

export const POST_CONTENT: Record<string, PageContent> = {
  "septic-tank-pumping-in-abbotsford-bc": stripPostPrefix(postSepticTankPumpAbb),
  "septic-services-in-mission-common-problems-we-see": stripPostPrefix(postMissionProblems),
  "how-long-does-a-septic-inspection-take": stripPostPrefix(postInspectTime),
  "the-importance-of-perimeter-drainage": stripPostPrefix(postPerimeter),
  "top-3-tips-for-winter-septic-tank-services": stripPostPrefix(postWinter),
  "can-a-septic-tank-freeze": stripPostPrefix(postCanFreeze),
  "spring-septic-maintenance-tips": stripPostPrefix(postSpring),
  "top-5-signs-your-septic-system-needs-professional-attention": stripPostPrefix(postTop5Signs),
  "how-often-should-you-pump-your-septic-tank-in-the-fraser-valley": stripPostPrefix(postHowOftenPump),
  "top-3-tips-for-keep-your-septic-system-from-freezing": stripPostPrefix(postTipsFreezing),
  "how-does-a-septic-tank-work": stripPostPrefix(postHowTankWorks),
  "how-does-a-septic-alarm-work": stripPostPrefix(postHowAlarmWorks),
  "what-is-emergency-grease-trap-cleaning": stripPostPrefix(postEmergencyGrease),
};

function stripPostPrefix(p: unknown): PageContent {
  const d = p as PageContent;
  return { ...d, slug: d.slug.replace(/^post-/, "") };
}
