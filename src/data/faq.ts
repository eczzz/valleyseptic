// FAQ items extracted/derived from the source site's avada_faq CPT entries.
// Each entry maps to a Question/Answer pair that's rendered both in the
// /faq-items/ archive and (where appropriate) inside city/service pages.

export type FAQItem = {
  slug: string;
  city: "Abbotsford" | "Chilliwack" | "Langley" | "Mission";
  q: string;
  a: string;
};

const baseAnswers = {
  ideal_time: (city: string) =>
    `In ${city}, the best time of year to pump or service a septic tank is typically late spring through early fall. Drier ground makes truck access easier, the drainfield is less likely to be saturated, and warmer weather means a faster, cleaner job. If you're approaching the typical 3-5 year mark, book in May or June to avoid the late-fall rush.`,
  seasonal_effects: (city: string) =>
    `${city} sees significant wet-to-dry swings through the year. Heavy fall and winter rain can saturate the drainfield and slow effluent absorption. Summer dry spells, by contrast, are when small drainage issues become obvious. Watch for pooling water, sluggish drains, or alarms after extended rain, and schedule inspections accordingly.`,
  odors: (city: string) =>
    `Yes — routine septic tank cleaning is one of the most effective ways to control odours around your ${city} property. Smells typically come from a tank near or past capacity, a clogged effluent filter, or a venting issue. Pumping plus a quick inspection usually resolves them in a single visit.`,
  delay_risks: (city: string) =>
    `Delaying septic tank cleaning in ${city} creates real environmental risks: untreated effluent can surface in the yard, leach into nearby creeks or groundwater, and contaminate well water on neighbouring properties. Local bylaws also expose homeowners to fines if waste discharges to the surrounding environment.`,
  rural_frequency: (city: string) =>
    `Rural ${city} properties often have larger tanks but also higher daily water usage from hobby farming, suite tenants, or commercial activity. Most rural homes need pumping every 2-4 years rather than the 3-5 year guideline for typical urban homes. We help homeowners build a personalized schedule.`,
  regulations: (city: string) =>
    `In ${city}, septic tank maintenance is governed by the BC Sewerage System Regulation and local bylaws. Tanks must be installed and inspected by Registered Onsite Wastewater Practitioners (ROWPs), and waste must be hauled to approved facilities. We handle compliance documentation as part of every service.`,
  cleaning_signs: (city: string) =>
    `In ${city}'s climate and soil conditions, signs your tank needs cleaning include slow-draining fixtures, gurgling pipes, sewage odours near the tank or drainfield, unusually green grass over the field, and standing water in the yard. If your tank hasn't been pumped in 3-5 years, schedule a check even if you don't see warning signs.`,
  avoid_flushing: (city: string) =>
    `To keep your septic system healthy in ${city}, avoid flushing wipes (even "flushable"), feminine products, paper towels, dental floss, cooking grease, harsh chemicals, paint, and pharmaceuticals. Stick to human waste and toilet paper. Use septic-safe cleaners, and don't pour fats, oils, or grease down kitchen drains.`,
};

function makeItems(city: FAQItem["city"], slugBase: string): FAQItem[] {
  return [
    {
      slug: `is-there-an-ideal-time-of-year-to-schedule-septic-tank-cleaning-in-${slugBase}`,
      city,
      q: `Is there an ideal time of year to schedule septic tank cleaning in ${city}?`,
      a: baseAnswers.ideal_time(city),
    },
    {
      slug: `how-do-${slugBase}s-seasonal-changes-affect-septic-tank-performance`,
      city,
      q: `How do ${city}'s seasonal changes affect septic tank performance?`,
      a: baseAnswers.seasonal_effects(city),
    },
    {
      slug: `can-septic-tank-cleaning-help-with-reducing-odors-around-my-${slugBase}-property`,
      city,
      q: `Can septic tank cleaning help with reducing odors around my ${city} property?`,
      a: baseAnswers.odors(city),
    },
    {
      slug: `are-there-environmental-risks-if-i-delay-cleaning-my-septic-tank-in-${slugBase}`,
      city,
      q: `Are there environmental risks if I delay cleaning my septic tank in ${city}?`,
      a: baseAnswers.delay_risks(city),
    },
    {
      slug: `how-does-the-frequency-of-septic-tank-cleaning-vary-for-rural-properties-in-${slugBase}`,
      city,
      q: `How does the frequency of septic tank cleaning vary for rural properties in ${city}?`,
      a: baseAnswers.rural_frequency(city),
    },
    {
      slug: `what-specific-regulations-apply-to-septic-tank-maintenance-in-${slugBase}`,
      city,
      q: `What specific regulations apply to septic tank maintenance in ${city}?`,
      a: baseAnswers.regulations(city),
    },
    {
      slug: `how-can-i-tell-if-my-septic-tank-needs-cleaning-in-${slugBase}s-climate-and-soil-conditions`,
      city,
      q: `How can I tell if my septic tank needs cleaning in ${city}'s climate and soil conditions?`,
      a: baseAnswers.cleaning_signs(city),
    },
    {
      slug: `what-should-i-avoid-flushing-to-ensure-my-septic-system-works-well-in-${slugBase}`,
      city,
      q: `What should I avoid flushing to ensure my septic system works well in ${city}?`,
      a: baseAnswers.avoid_flushing(city),
    },
  ];
}

export const FAQ_ITEMS: FAQItem[] = [
  ...makeItems("Abbotsford", "abbotsford"),
  ...makeItems("Chilliwack", "chilliwack"),
  ...makeItems("Langley", "langley"),
  ...makeItems("Mission", "mission"),
  // Source site has an extra "-cloned" duplicate for Chilliwack — preserved
  // for URL parity with the WordPress sitemap.
  {
    slug: "how-can-i-tell-if-my-septic-tank-needs-cleaning-in-chilliwacks-climate-and-soil-conditions-cloned",
    city: "Chilliwack",
    q: "How can I tell if my septic tank needs cleaning in Chilliwack's climate and soil conditions?",
    a: baseAnswers.cleaning_signs("Chilliwack"),
  },
];

export function faqsForCity(city: FAQItem["city"]) {
  return FAQ_ITEMS.filter(f => f.city === city);
}
