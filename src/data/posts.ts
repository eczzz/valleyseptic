export type Post = {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  dateIso: string;
  author: string;
  category: string;
  body: string; // raw HTML/markdown body
};

export const POSTS: Post[] = [
  {
    slug: "how-does-a-septic-alarm-work",
    href: "/how-does-a-septic-alarm-work/",
    title: "How Does a Septic Alarm Work?",
    excerpt:
      "Your septic alarm exists for one reason: to tell you something is wrong before it turns into a costly cleanup. Here's how it works and what to do when it goes off.",
    image: "/images/2025/12/septic-alarm2.webp",
    date: "May 10, 2026",
    dateIso: "2026-05-10",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Your septic alarm exists for one reason: to tell you something is wrong before it turns into a costly cleanup. Most homeowners only hear it once, and when they do they're usually mid-shower, mid-laundry, or in the middle of dinner. Here's a quick guide to what's happening when the alarm sounds, why it's actually a feature (not a failure), and what to do next.</p>
      <h2>The job of a septic alarm</h2>
      <p>A typical residential septic alarm is a high-water alarm tied to a float switch inside your pump tank or treatment chamber. When the water level rises above the operating range — meaning the effluent isn't being moved into the drainfield as fast as it's coming in — the float trips and the alarm sounds.</p>
      <h2>What it usually means</h2>
      <ul>
        <li><strong>The pump isn't keeping up</strong> — the most common cause. This can be a stuck float, a failed pump, or a tripped breaker.</li>
        <li><strong>Heavy water use</strong> — laundry day plus a long shower plus a dishwasher cycle can briefly push the level high enough to trigger the float.</li>
        <li><strong>A saturated drainfield</strong> — the drainfield can't absorb water as fast as you're sending it, so the tank fills up.</li>
        <li><strong>An electrical issue</strong> — a tripped GFCI or a failed control board can stop the pump entirely.</li>
      </ul>
      <h2>What to do when it sounds</h2>
      <ol>
        <li>Silence the alarm if there's a silence button — this won't fix anything, but it'll let you think.</li>
        <li>Stop adding water to the system: no laundry, no dishwasher, short flushes only, no showers if you can manage it.</li>
        <li>Check the breaker for the pump. If it's tripped, don't reset it more than once — that's a sign of an electrical problem.</li>
        <li>Call your septic service provider. If it's after hours and your drains are still working, you can usually wait until morning.</li>
      </ol>
      <p>If you're in the Fraser Valley and your alarm is sounding right now, give us a call. We'll walk you through what to check, and dispatch a truck if you need one.</p>
    `,
  },
  {
    slug: "what-is-emergency-grease-trap-cleaning",
    href: "/what-is-emergency-grease-trap-cleaning/",
    title: "What Is Emergency Grease Trap Cleaning?",
    excerpt:
      "Emergency grease trap cleaning happens when your commercial kitchen's grease trap fails — overflowing into the kitchen, backing up drains, or triggering odour complaints.",
    image: "/images/2025/12/grease-trap3.webp",
    date: "April 2, 2026",
    dateIso: "2026-04-02",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Emergency grease trap cleaning happens when your commercial kitchen's grease trap fails — overflowing into the kitchen, backing up drains, or triggering odour complaints. It's never convenient, and it usually happens at exactly the wrong time: dinner service, Friday night, the morning of a health inspection.</p>
      <h2>How a grease trap fails</h2>
      <p>Most failures come down to one thing: the trap is full. Fats, oils, and grease (FOG) float to the top, solids settle to the bottom, and the trap has a finite working volume. When you exceed that volume, FOG starts pushing through the outlet and into your sanitary line — and from there into the municipal sewer.</p>
      <h2>Signs you have an emergency, not just a maintenance issue</h2>
      <ul>
        <li>Slow drains or standing water in floor drains and dishpit</li>
        <li>Strong sewage or rancid odours that get worse during service</li>
        <li>Visible grease coming out of cleanouts or floor drains</li>
        <li>A health inspector flag during a routine visit</li>
        <li>A spike in your wastewater surcharge bill</li>
      </ul>
      <h2>What we do in an emergency call</h2>
      <ol>
        <li>Pump the trap completely — solids, FOG, and water.</li>
        <li>Scrape the walls and baffles to remove built-up grease.</li>
        <li>Inspect the inlet and outlet for blockages and damage.</li>
        <li>Refill with clean water so the trap is operational again.</li>
        <li>Provide documentation for compliance and reset your service schedule.</li>
      </ol>
      <p>The best emergency grease trap cleaning is the one you never need. Get on a regular service schedule — most kitchens need pumping every 1-3 months, depending on volume.</p>
    `,
  },
  {
    slug: "septic-services-in-mission-common-problems-we-see",
    href: "/septic-services-in-mission-common-problems-we-see/",
    title: "Septic Services in Mission: Common Problems We See",
    excerpt:
      "Mission's mix of rural acreage, older homes, and newer subdivisions means we see a wide range of septic problems. Here are the ones that come up most often.",
    image: "/images/2026/03/missionsepticthingswesee.webp",
    date: "March 18, 2026",
    dateIso: "2026-03-18",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Mission's mix of rural acreage, older homes, and newer subdivisions means we see a wide range of septic problems on any given week. Some are seasonal, some are universal, but a few come up so often we wanted to write them down.</p>
      <h2>1. Drainfields saturated by winter rain</h2>
      <p>Mission gets a lot of rain in November and December. If your drainfield is at the bottom of a slope or close to a high water table, it can stay wet enough through winter that your septic system effectively has nowhere to send effluent. This is the #1 reason we get emergency calls from Mission between November and March.</p>
      <h2>2. Tree roots in the lines</h2>
      <p>Older homes on the Mission bench have decades of cedar and maple roots that find their way into clay or concrete septic lines. We see this most in homes built before the 1990s with original lines still in place.</p>
      <h2>3. Effluent filters that have never been cleaned</h2>
      <p>Most modern Mission systems have an effluent filter on the outlet baffle. They're supposed to be cleaned annually. Most never are — and when they clog, the tank backs up.</p>
      <h2>4. Pump failures from age, not abuse</h2>
      <p>Septic pumps last 8-15 years. We see a lot of original pumps from late-1990s and early-2000s builds finally giving up. If your home is in that range and your pump has never been replaced, plan for it.</p>
      <h2>5. Real-estate-inspection surprises</h2>
      <p>A lot of Mission homes change hands, and septic inspections during a sale turn up old issues — undersized tanks, illegal cesspits, drainfields outside the legal setback. We do these inspections a lot and can help you understand what's worth fixing vs. negotiating.</p>
      <p>If any of these sound familiar, give us a call. We'll have a look and tell you whether it's urgent, scheduled work, or something to keep an eye on.</p>
    `,
  },
  {
    slug: "how-long-does-a-septic-inspection-take",
    href: "/how-long-does-a-septic-inspection-take/",
    title: "How Long Does a Septic Inspection Take?",
    excerpt:
      "A standard residential septic inspection takes 1-3 hours, depending on tank access, system complexity, and what we find.",
    image: "/images/2025/12/septicinspection.webp",
    date: "February 14, 2026",
    dateIso: "2026-02-14",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>A standard residential septic inspection takes 1-3 hours, depending on tank access, system complexity, and what we find. Here's what's happening during that time and why it matters.</p>
      <h2>What gets inspected</h2>
      <ul>
        <li>Tank lid access and condition</li>
        <li>Sludge and scum layer measurements</li>
        <li>Inlet and outlet baffle condition</li>
        <li>Effluent filter (if equipped)</li>
        <li>Pump chamber operation (if pumped system)</li>
        <li>Float switch and alarm function</li>
        <li>Drainfield surface inspection</li>
        <li>Distribution box (where accessible)</li>
      </ul>
      <h2>Why it varies</h2>
      <p>Tanks buried more than 18 inches need excavation to access. Some older systems don't have risers, so we may need to dig. Drainfields with no observation ports take longer to evaluate. Real estate inspections often add water testing and written reports.</p>
      <p>Book in advance — a quick visual check might be 60 minutes, but a thorough pre-purchase inspection on a complex system can take half a day.</p>
    `,
  },
  {
    slug: "the-importance-of-perimeter-drainage",
    href: "/the-importance-of-perimeter-drainage/",
    title: "The Importance of Perimeter Drainage",
    excerpt:
      "Perimeter drainage isn't part of your septic system — but a failing one can kill your drainfield in a single rainy season. Here's why we care about it.",
    image: "/images/2025/12/perimiterhero.webp",
    date: "January 22, 2026",
    dateIso: "2026-01-22",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Perimeter drainage isn't technically part of your septic system. But in the Fraser Valley — where 200mm of rain in a month is normal — a failing perimeter drain can saturate your soil so badly that your drainfield has nowhere to send effluent. Suddenly your septic system "fails" even though nothing inside the tank or pump has changed.</p>
      <h2>The connection between perimeter drains and your drainfield</h2>
      <p>Your drainfield works by letting partially-treated effluent percolate down through soil. If the soil is already saturated from groundwater that your perimeter drain should have intercepted, there's nowhere for the effluent to go. It backs up — sometimes into your tank, sometimes onto the surface.</p>
      <h2>Signs your perimeter drain might be the problem</h2>
      <ul>
        <li>Standing water around foundations after rain</li>
        <li>A drainfield that worked fine for years and suddenly doesn't in winter</li>
        <li>Wet, spongy spots in the yard far from the drainfield</li>
        <li>A sump pump that runs constantly during rain</li>
      </ul>
      <p>If you're troubleshooting septic problems and the system itself checks out, ask your drainage contractor (or us — we know who to recommend) to scope your perimeter drain.</p>
    `,
  },
  {
    slug: "top-3-tips-for-winter-septic-tank-services",
    href: "/top-3-tips-for-winter-septic-tank-services/",
    title: "Top 3 Tips for Winter Septic Tank Services",
    excerpt:
      "Winter is hard on septic systems. Cold, frozen ground, and holiday water usage all combine to expose weaknesses. Three things you can do to stay ahead.",
    image: "/images/2024/08/septic-and-plumbing-services-in-chilliwack.jpg",
    date: "December 5, 2025",
    dateIso: "2025-12-05",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Winter is hard on septic systems. Cold, frozen ground, and holiday water usage all combine to expose weaknesses in your tank, pump, and drainfield. Here are the three things we recommend to every Fraser Valley homeowner before the cold sets in.</p>
      <h2>1. Get your tank pumped before December</h2>
      <p>Pumping in the spring or summer is great, but if you're due, fall is the second-best time. A tank near capacity heading into a freeze is a tank that's much more likely to back up if anything goes wrong.</p>
      <h2>2. Insulate the lid, riser, and any exposed lines</h2>
      <p>A 24" diameter riser in an open lawn can transmit cold straight to your tank. A bag of straw, a sheet of rigid foam, or even a thick blanket of grass clippings helps. For shallow lines from house to tank, insulation matters even more.</p>
      <h2>3. Keep using your system normally</h2>
      <p>This sounds backward, but a septic system in regular use generates enough heat from incoming warm water to stay above freezing. Vacation homes and rarely-used systems are far more vulnerable. If you're going away for weeks, ask your service company about cold-weather precautions.</p>
    `,
  },
  {
    slug: "can-a-septic-tank-freeze",
    href: "/can-a-septic-tank-freeze/",
    title: "Can a Septic Tank Freeze?",
    excerpt:
      "Yes, septic tanks can freeze — but it's rare, and almost always preventable. Here's what causes it and what to do if it happens.",
    image: "/images/2025/12/SepticFreeze.webp",
    date: "November 18, 2025",
    dateIso: "2025-11-18",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Yes, septic tanks can freeze — but it's rare in the Fraser Valley, and almost always preventable. The tank itself rarely freezes solid; what freezes are the inlet/outlet lines, the riser, or sometimes the drainfield. Here's how to keep that from happening.</p>
      <h2>Risk factors</h2>
      <ul>
        <li>Shallow burial (less than 18 inches of cover)</li>
        <li>Compacted snow or driving over the tank/lines (compaction strips out insulation)</li>
        <li>Long vacation periods with no warm water flowing through</li>
        <li>Riser lids without insulation</li>
        <li>Slow drips from leaky fixtures that freeze in the line before reaching the tank</li>
      </ul>
      <h2>If you suspect a frozen line</h2>
      <p>Don't pour boiling water down it — that can crack pipes. Call your septic service. We have safe ways to thaw lines and identify whether you need a repair or just a one-time fix.</p>
    `,
  },
  {
    slug: "spring-septic-maintenance-tips",
    href: "/spring-septic-maintenance-tips/",
    title: "Spring Septic Maintenance Tips",
    excerpt:
      "Spring is the ideal time to check on your septic system after a wet Fraser Valley winter. Here's a short checklist to run through.",
    image: "/images/2024/08/our-core-values-community.jpg",
    date: "October 4, 2025",
    dateIso: "2025-10-04",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Spring is the ideal time to check on your septic system after a wet Fraser Valley winter. Here's a short checklist you can run yourself or call us to do for you.</p>
      <ol>
        <li><strong>Walk the drainfield.</strong> Wet, spongy spots that don't dry out by mid-April are a warning sign.</li>
        <li><strong>Check the sludge level.</strong> If you've gone more than 3 years without pumping, schedule it.</li>
        <li><strong>Clean the effluent filter.</strong> Most homeowners can do this themselves — gloves, a hose, and 10 minutes.</li>
        <li><strong>Test the alarm.</strong> Lift the float switch by hand and confirm the audible/visual alarm works.</li>
        <li><strong>Inspect lids and risers.</strong> Cracks, settling, or damaged gaskets all need attention.</li>
        <li><strong>Note water usage.</strong> If laundry routines or guest stays have increased, you may need to pump sooner.</li>
      </ol>
    `,
  },
  {
    slug: "top-5-signs-your-septic-system-needs-professional-attention",
    href: "/top-5-signs-your-septic-system-needs-professional-attention/",
    title: "Top 5 Signs Your Septic System Needs Professional Attention",
    excerpt:
      "These five symptoms mean something is wrong with your septic system and shouldn't be ignored. Catching them early saves thousands.",
    image: "/images/2024/08/our-core-values-reliability.jpg",
    date: "September 12, 2025",
    dateIso: "2025-09-12",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Most septic problems give you warning signs before they become emergencies. Catching them early saves thousands of dollars and weeks of mess. Here are the five we want every Fraser Valley homeowner to recognize.</p>
      <h2>1. Slow drains throughout the house</h2>
      <p>One slow drain is usually a localized clog. Two or more slow drains, especially the lowest fixtures in the house, point to the septic system.</p>
      <h2>2. Gurgling toilets or pipes</h2>
      <p>Air being pushed back up the line is a sign of partial blockage or a venting issue tied to a full tank.</p>
      <h2>3. Sewage smells around the tank or drainfield</h2>
      <p>A working septic system should not smell. Outdoor odours mean effluent is escaping somewhere it shouldn't.</p>
      <h2>4. Wet, spongy, or unusually green grass over the drainfield</h2>
      <p>Effluent surfacing fertilizes the lawn. It also means your drainfield is overloaded.</p>
      <h2>5. Backups in lowest-level drains</h2>
      <p>Basement showers, floor drains, or laundry tubs are usually the first to back up when the tank is full.</p>
      <p>If you're seeing any of these, call before they become an emergency.</p>
    `,
  },
  {
    slug: "how-often-should-you-pump-your-septic-tank-in-the-fraser-valley",
    href: "/how-often-should-you-pump-your-septic-tank-in-the-fraser-valley/",
    title: "How Often Should You Pump Your Septic Tank in the Fraser Valley?",
    excerpt:
      "Most Fraser Valley homes should pump their tank every 2-5 years. Here's how to figure out where you fall in that range.",
    image: "/images/2024/09/truck1.webp",
    date: "August 8, 2025",
    dateIso: "2025-08-08",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>The honest answer is "it depends" — but it depends on three things you can actually measure: how many people live in the home, how big the tank is, and what you put down the drains. Most Fraser Valley homes land in a 2-5 year window.</p>
      <h2>Quick rule of thumb</h2>
      <ul>
        <li>1-2 people / 1000 gal tank → every 5-6 years</li>
        <li>3-4 people / 1000 gal tank → every 3 years</li>
        <li>5+ people / 1000 gal tank → every 2 years</li>
        <li>Garbage disposal → cut the interval by ~30%</li>
        <li>Older tank / no effluent filter → consider yearly visual checks</li>
      </ul>
      <p>If you want a personalized estimate, try our <a href="/septic-calculator/">septic calculator</a> or give us a call.</p>
    `,
  },
  {
    slug: "top-3-tips-for-keep-your-septic-system-from-freezing",
    href: "/top-3-tips-for-keep-your-septic-system-from-freezing/",
    title: "Top 3 Tips for Keeping Your Septic System from Freezing",
    excerpt:
      "Three things you can do this fall to keep your septic system running through the coldest Fraser Valley nights.",
    image: "/images/2024/08/our-core-values-efficiency.jpg",
    date: "July 12, 2025",
    dateIso: "2025-07-12",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Frozen septic lines are rare in the Fraser Valley but they do happen — usually after a long cold snap, often on properties that have been vacant for a stretch. Three things to do this fall:</p>
      <h2>1. Add cover over shallow components</h2>
      <p>Straw, mulch, or a tarp over shallow lines, risers, and tank lids adds significant insulation.</p>
      <h2>2. Keep the system in regular use</h2>
      <p>If you're traveling, ask a neighbour to run water for a few minutes every couple of days.</p>
      <h2>3. Fix any leaks before winter</h2>
      <p>A dripping faucet that doesn't matter in July becomes an ice plug in the line in January.</p>
    `,
  },
  {
    slug: "how-does-a-septic-tank-work",
    href: "/how-does-a-septic-tank-work/",
    title: "How Does a Septic Tank Work?",
    excerpt:
      "A septic tank does two things: it separates waste into layers, and it gives bacteria time to start breaking it down. Here's the full picture.",
    image: "/images/2024/09/septicpump.webp",
    date: "June 5, 2025",
    dateIso: "2025-06-05",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>A septic tank does two things: it separates waste into layers, and it gives bacteria time to start breaking it down. Everything else — the pumps, the alarms, the drainfield — exists to support those two jobs.</p>
      <h2>What happens inside</h2>
      <ol>
        <li>Wastewater enters through the inlet baffle.</li>
        <li>Solids settle to the bottom as <strong>sludge</strong>.</li>
        <li>Oils and lighter materials float to the top as <strong>scum</strong>.</li>
        <li>The clearer water in the middle — <strong>effluent</strong> — flows out through the outlet baffle to the drainfield.</li>
        <li>Bacteria in the tank slowly digest the sludge and scum layers.</li>
      </ol>
      <h2>Why pumping matters</h2>
      <p>Bacteria reduce sludge but don't eliminate it. Over years, the sludge layer thickens until it starts pushing effluent into the drainfield before it's had time to settle. That's how drainfields fail. Regular pumping keeps the system in balance.</p>
    `,
  },
  {
    slug: "septic-tank-pumping-in-abbotsford-bc",
    href: "/septic-tank-pumping-in-abbotsford-bc/",
    title: "How Often Should You Pump a Septic Tank in Abbotsford, BC?",
    excerpt:
      "Abbotsford homes range from city lots to acreages on Sumas Mountain. Tank pumping frequency varies — here's a guide based on the homes we service.",
    image: "/images/2024/08/abbotsford-septic-and-plumbing.jpg",
    date: "April 21, 2025",
    dateIso: "2025-04-21",
    author: "Valley Septic",
    category: "Septic Education",
    body: `
      <p>Abbotsford homes range from city lots in clay-rich Clearbrook to acreages on Sumas Mountain with sandy soils. Tank pumping frequency varies depending on where you are and how the original system was sized. Here's what we typically recommend.</p>
      <ul>
        <li><strong>Older Clearbrook / Aldergrove home, 4 people, 1000 gal tank:</strong> every 2-3 years.</li>
        <li><strong>Newer subdivision, 4 people, 1500 gal tank with effluent filter:</strong> every 4-5 years.</li>
        <li><strong>Acreage / hobby farm with rental suite:</strong> every 1-2 years.</li>
        <li><strong>Vacation property in Sumas Prairie:</strong> every 5+ years.</li>
      </ul>
      <p>These are starting points. Run our calculator or give us a call to get a recommendation tuned to your actual usage.</p>
    `,
  },
];
