// Placeholder sample data for design review. To be replaced by the backend API.

export type ProjectCategory =
  | "Road"
  | "Hospital"
  | "School"
  | "Stadium"
  | "Mall"
  | "Park";

export type ProjectStage =
  | "OpenForResponse"
  | "InProgress"
  | "Completed"
  | "Halted";

export type ProjectCommentReply = {
  author: string;
  badge: "Government response" | "Project planner";
  text: string;
};

export type ProjectComment = {
  author: string;
  stance: "Support" | "Concern" | "Neutral";
  text: string;
  reply?: ProjectCommentReply;
};

export type SampleProject = {
  id: number;
  name: string;
  city: string;
  category: ProjectCategory;
  budgetCrore: number;
  daysLeft: number;
  stance: {
    support: number;
    concern: number;
    neutral: number;
  };
  stage: ProjectStage;
  haltReason?: string;
  lat: number;
  lng: number;
  description: string;
  gradient: string;
  comments: ProjectComment[];
};

export const CATEGORY_GRADIENTS: Record<ProjectCategory, string> = {
  Road: "radial-gradient(circle at 85% 15%, rgba(14, 165, 233, 0.35), transparent 70%)",
  Hospital: "radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.35), transparent 70%)",
  School: "radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.35), transparent 70%)",
  Stadium: "radial-gradient(circle at 85% 15%, rgba(168, 85, 247, 0.35), transparent 70%)",
  Mall: "radial-gradient(circle at 85% 15%, rgba(236, 72, 153, 0.35), transparent 70%)",
  Park: "radial-gradient(circle at 85% 15%, rgba(34, 197, 94, 0.35), transparent 70%)",
};

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 1,
    name: "Marine Drive Link Road",
    city: "Kochi",
    category: "Road",
    budgetCrore: 186,
    daysLeft: 21,
    stance: { support: 212, concern: 64, neutral: 48 },
    stage: "OpenForResponse",
    lat: 9.98,
    lng: 76.28,
    description:
      "A four-lane arterial link road along the backwaters with a dedicated cycle track, continuous LED lighting, and two grade-separated pedestrian crossings.",
    gradient: CATEGORY_GRADIENTS.Road,
    comments: [
      {
        author: "Ravi M.",
        stance: "Support",
        text: "This link will cut my daily commute significantly. Please ensure the cycle lane is physically segregated.",
        reply: {
          author: "Project owner, Urban Development Dept.",
          badge: "Government response",
          text: "The dedicated cycle lane stays in the approved master design with bollard segregation.",
        },
      },
      {
        author: "Meera S.",
        stance: "Concern",
        text: "What happens to the existing mature rain trees along the canal edge during construction?",
        reply: {
          author: "Lead planner",
          badge: "Project planner",
          text: "The alignment retains over 80% of mature trees; compensatory replanting will occur along the outer greenway.",
        },
      },
      {
        author: "Joseph K.",
        stance: "Neutral",
        text: "When will the traffic diversion schedule be announced for the southern entry point?",
      },
    ],
  },
  {
    id: 2,
    name: "District Hospital Wing",
    city: "Kochi",
    category: "Hospital",
    budgetCrore: 92,
    daysLeft: 34,
    stance: { support: 301, concern: 22, neutral: 40 },
    stage: "OpenForResponse",
    lat: 9.93,
    lng: 76.27,
    description:
      "A modern 200-bed multispecialty wing with an expanded pediatric trauma center, oxygen plant, and covered ambulance bay.",
    gradient: CATEGORY_GRADIENTS.Hospital,
    comments: [
      {
        author: "Dr. Ananya P.",
        stance: "Support",
        text: "The trauma unit expansion has been desperately needed for the coastal sector. Full support.",
        reply: {
          author: "Director of Health Services",
          badge: "Government response",
          text: "Tendering for Level-1 trauma equipment will run in parallel with civil works to expedite commissioning.",
        },
      },
      {
        author: "Siddharth N.",
        stance: "Concern",
        text: "Will patient visitor parking overflow into adjacent residential lanes during peak hours?",
        reply: {
          author: "Chief Architect",
          badge: "Project planner",
          text: "A 2-level basement parking deck with 350 car bays is planned inside the campus boundary.",
        },
      },
      {
        author: "Farhana K.",
        stance: "Neutral",
        text: "Are outpatient pharmacy counters planned on the ground level for elderly accessibility?",
      },
    ],
  },
  {
    id: 3,
    name: "Whitefield Skywalk and Bus Bay",
    city: "Bengaluru",
    category: "Road",
    budgetCrore: 240,
    daysLeft: 12,
    stance: { support: 140, concern: 190, neutral: 60 },
    stage: "OpenForResponse",
    lat: 12.97,
    lng: 77.75,
    description:
      "An elevated covered pedestrian walkway linking the metro station directly to an integrated 8-berth bus transfer terminal.",
    gradient: CATEGORY_GRADIENTS.Road,
    comments: [
      {
        author: "Vikram R.",
        stance: "Support",
        text: "Eliminating at-grade pedestrian crossing across the junction will eliminate a major bottleneck.",
        reply: {
          author: "BBMP Infrastructure Cell",
          badge: "Government response",
          text: "Escalator and lift shafts on all 4 corners will ensure universal accessibility.",
        },
      },
      {
        author: "Deepa T.",
        stance: "Concern",
        text: "The bus bay entrance looks narrow and could cause backing up during morning rush hour.",
        reply: {
          author: "Transit Operations Specialist",
          badge: "Project planner",
          text: "Simulation models show 90-second dwell times per bus with dedicated deceleration entry lanes.",
        },
      },
      {
        author: "Karthik G.",
        stance: "Neutral",
        text: "Can real-time feeder bus display screens be placed directly inside the skywalk concourse?",
      },
    ],
  },
  {
    id: 4,
    name: "Government Model School Block",
    city: "Pune",
    category: "School",
    budgetCrore: 38,
    daysLeft: 45,
    stance: { support: 160, concern: 8, neutral: 20 },
    stage: "OpenForResponse",
    lat: 18.52,
    lng: 73.85,
    description:
      "Twenty state-of-the-art digital classrooms, composite STEM laboratories, rooftop solar array, and a multipurpose turf sports field.",
    gradient: CATEGORY_GRADIENTS.School,
    comments: [
      {
        author: "Sunita M.",
        stance: "Support",
        text: "A huge upgrade for local students. The solar rooftop is a great sustainable touch.",
        reply: {
          author: "District Education Officer",
          badge: "Government response",
          text: "Net metering will offset school power bills, funding annual lab supply budgets.",
        },
      },
      {
        author: "Prakash J.",
        stance: "Concern",
        text: "Construction noise may disrupt classes in the existing primary building during exam periods.",
        reply: {
          author: "Site Project Manager",
          badge: "Project planner",
          text: "Heavy acoustic barriers and restricted drilling schedules have been mandated for class hours.",
        },
      },
      {
        author: "Aakash D.",
        stance: "Neutral",
        text: "Will community sporting clubs be allowed to book the turf ground on weekends?",
      },
    ],
  },
  {
    id: 5,
    name: "Sports Complex Annex",
    city: "Hyderabad",
    category: "Stadium",
    budgetCrore: 410,
    daysLeft: 9,
    stance: { support: 120, concern: 150, neutral: 70 },
    stage: "OpenForResponse",
    lat: 17.38,
    lng: 78.48,
    description:
      "A 15,000-seat multi-discipline indoor arena equipped for international gymnastics, badminton, and basketball competitions.",
    gradient: CATEGORY_GRADIENTS.Stadium,
    comments: [
      {
        author: "Naveen C.",
        stance: "Support",
        text: "Hyderabad has lacked a premier indoor gymnastics arena. This will attract national championships.",
        reply: {
          author: "Sports Authority of Telangana",
          badge: "Government response",
          text: "The venue has been planned to meet BWF and FIG tier-1 tournament certification.",
        },
      },
      {
        author: "Radhika K.",
        stance: "Concern",
        text: "The budget seems high when municipal water infrastructure in surrounding wards needs upgrading.",
        reply: {
          author: "Urban Planning Directorate",
          badge: "Project planner",
          text: "Over 40% of financing is derived through public-private concession models without municipal debt.",
        },
      },
      {
        author: "Mahesh B.",
        stance: "Neutral",
        text: "Will there be subsidized academy memberships for youth from underprivileged backgrounds?",
      },
    ],
  },
  {
    id: 6,
    name: "Riverside Retail Quarter",
    city: "Ahmedabad",
    category: "Mall",
    budgetCrore: 530,
    daysLeft: 28,
    stance: { support: 90, concern: 170, neutral: 44 },
    stage: "OpenForResponse",
    lat: 23.02,
    lng: 72.57,
    description:
      "A pedestrian-first commercial quarter built on an elevated flood-resilient podium, featuring open plazas and artisanal markets.",
    gradient: CATEGORY_GRADIENTS.Mall,
    comments: [
      {
        author: "Harish S.",
        stance: "Support",
        text: "Riverfront commercial activation will create employment and enhance tourism.",
        reply: {
          author: "Municipal Commissioner Office",
          badge: "Government response",
          text: "Local artisan stalls receive guaranteed reservation at subsidized lease rates.",
        },
      },
      {
        author: "Bhavna P.",
        stance: "Concern",
        text: "Flood levels during monsoons could threaten lower concourses despite the podium height.",
        reply: {
          author: "Hydrology Consultant",
          badge: "Project planner",
          text: "The plinth level is calibrated to the 100-year return flood standard plus 1.5m freeboard.",
        },
      },
      {
        author: "Chirag T.",
        stance: "Neutral",
        text: "Is there a direct pedestrian link connecting to the existing riverfront promenade?",
      },
    ],
  },
  {
    id: 7,
    name: "Outer Ring Road Phase 2",
    city: "Delhi",
    category: "Road",
    budgetCrore: 1250,
    daysLeft: 17,
    stance: { support: 260, concern: 330, neutral: 90 },
    stage: "OpenForResponse",
    lat: 28.61,
    lng: 77.2,
    description:
      "A 24 km expressway expansion featuring 6 cloverleaf interchanges, wildlife underpasses, and intelligent traffic management sensors.",
    gradient: CATEGORY_GRADIENTS.Road,
    comments: [
      {
        author: "Gurpreet S.",
        stance: "Support",
        text: "Crucial for bypassing heavy inter-state freight trucks around congested city centers.",
        reply: {
          author: "NHAI Corridor Division",
          badge: "Government response",
          text: "Automated weigh-in-motion gantries and electronic tolling will keep freight throughput seamless.",
        },
      },
      {
        author: "Kavita W.",
        stance: "Concern",
        text: "Air quality along the corridor must be monitored with strict dust suppression measures.",
        reply: {
          author: "Environmental Compliance Lead",
          badge: "Project planner",
          text: "Continuous real-time PM2.5 sensors and misting cannons are incorporated into the contractor KPI.",
        },
      },
      {
        author: "Arjun N.",
        stance: "Neutral",
        text: "Will emergency vehicle breakdown shoulders be enforced with automatic camera fines?",
      },
    ],
  },
  {
    id: 8,
    name: "Community Clinic",
    city: "Mumbai",
    category: "Hospital",
    budgetCrore: 24,
    daysLeft: 52,
    stance: { support: 75, concern: 6, neutral: 18 },
    stage: "OpenForResponse",
    lat: 19.07,
    lng: 72.88,
    description:
      "A localized primary healthcare center providing free maternal care, immunization, diagnostics, and 24/7 emergency stabilization.",
    gradient: CATEGORY_GRADIENTS.Hospital,
    comments: [
      {
        author: "Geeta B.",
        stance: "Support",
        text: "Mothers currently have to travel 6 kilometers for infant vaccinations. This clinic is a blessing.",
        reply: {
          author: "BMC Health Committee",
          badge: "Government response",
          text: "The immunization desk will operate seven days a week with digital vaccination cards.",
        },
      },
      {
        author: "Roshan S.",
        stance: "Concern",
        text: "Will adequate bio-waste management be ensured so discarded syringes don't mix with municipal trash?",
        reply: {
          author: "Infection Control Architect",
          badge: "Project planner",
          text: "A dedicated barcode-tracked bio-medical waste room with secure autoclave storage is included.",
        },
      },
      {
        author: "Pratima V.",
        stance: "Neutral",
        text: "Can a generic medicine dispensary (Jan Aushadhi) counter be included at the front entrance?",
      },
    ],
  },
  {
    id: 9,
    name: "Riverfront Walkway",
    city: "Chennai",
    category: "Park",
    budgetCrore: 64,
    daysLeft: 0,
    stance: { support: 180, concern: 40, neutral: 30 },
    stage: "InProgress",
    lat: 13.03,
    lng: 80.26,
    description:
      "A 3 km ecological riverside promenade featuring native mangrove planting, energy-efficient solar lanterns, and open-air exercise hubs.",
    gradient: CATEGORY_GRADIENTS.Park,
    comments: [
      {
        author: "Kannan T.",
        stance: "Support",
        text: "The mangrove buffer will dramatically protect the banks from soil erosion during cyclone seasons.",
        reply: {
          author: "Greater Chennai Corporation",
          badge: "Government response",
          text: "Over 12,000 native mangrove saplings are already nursery-prepared for phase 1 planting.",
        },
      },
      {
        author: "Lavanya R.",
        stance: "Concern",
        text: "Are CCTV cameras and SOS call points placed at frequent intervals along the walkway?",
        reply: {
          author: "Smart City Security Cell",
          badge: "Project planner",
          text: "Solar-powered SOS call poles with emergency intercoms are situated every 150 meters.",
        },
      },
      {
        author: "Mani V.",
        stance: "Neutral",
        text: "Are trash receptacles designed to prevent stray animals from foraging?",
      },
    ],
  },
  {
    id: 10,
    name: "Bypass Junction Upgrade",
    city: "Kochi",
    category: "Road",
    budgetCrore: 78,
    daysLeft: 0,
    stance: { support: 310, concern: 25, neutral: 60 },
    stage: "Completed",
    lat: 10.1,
    lng: 76.35,
    description:
      "A grade-separated underpass that replaced a notorious bottleneck intersection, reducing junction transit wait times by 80%.",
    gradient: CATEGORY_GRADIENTS.Road,
    comments: [
      {
        author: "Shyam C.",
        stance: "Support",
        text: "Travel time from the airport bypass has reduced from 45 minutes to under 8 minutes.",
        reply: {
          author: "Kerala PWD Roads Division",
          badge: "Government response",
          text: "Smart adaptive signaling on side slips has further smoothed turning radius movements.",
        },
      },
      {
        author: "Bindu L.",
        stance: "Concern",
        text: "Stormwater pumping in the underpass during sudden torrential downpours was a worry during monsoon.",
        reply: {
          author: "Chief Drainage Engineer",
          badge: "Project planner",
          text: "Dual high-discharge submersible pumps with redundant diesel generator backups were successfully commissioned.",
        },
      },
      {
        author: "Anto T.",
        stance: "Neutral",
        text: "Signage for the southern exit could use larger retro-reflective boards for nighttime drivers.",
      },
    ],
  },
  {
    id: 11,
    name: "Mall Redevelopment",
    city: "Mumbai",
    category: "Mall",
    budgetCrore: 320,
    daysLeft: 0,
    stance: { support: 88, concern: 210, neutral: 35 },
    stage: "Halted",
    haltReason:
      "The owning official halted this project pending a fresh environmental review and stormwater impact assessment.",
    lat: 19.07,
    lng: 72.88,
    description:
      "Comprehensive redevelopment of an ageing suburban commercial center into a mixed-use retail and co-working campus.",
    gradient: CATEGORY_GRADIENTS.Mall,
    comments: [
      {
        author: "Dinesh K.",
        stance: "Concern",
        text: "Local sewage drains cannot handle triple the wastewater volume without an on-site treatment plant.",
        reply: {
          author: "State Environmental Committee",
          badge: "Government response",
          text: "Civil work is halted until a revised Zero-Liquid-Discharge sewage treatment plan is vetted.",
        },
      },
      {
        author: "Varun H.",
        stance: "Support",
        text: "The old structure was a major fire hazard. Modernizing the building is necessary for safety.",
        reply: {
          author: "Structural Safety Assessor",
          badge: "Project planner",
          text: "The revised plan will incorporate modern NFPA-standard fire suppression before work resumes.",
        },
      },
      {
        author: "Smita D.",
        stance: "Neutral",
        text: "Will existing retail tenants be offered right of first refusal when the redesign is completed?",
      },
    ],
  },
];

// India decorative polygon outline coordinates from prototype
export const INDIA_OUTLINE: [number, number][] = [
  [74, 37],
  [77, 35.5],
  [79, 34],
  [78, 32.5],
  [80, 30.5],
  [84, 28.5],
  [88, 27.5],
  [89, 26.7],
  [92, 27],
  [95, 28.5],
  [97, 28],
  [95, 26],
  [94, 24],
  [93, 22],
  [91, 24.5],
  [89, 25],
  [88.5, 22.5],
  [87, 21.5],
  [85, 19.5],
  [83, 17.5],
  [80.3, 15.5],
  [80.2, 13],
  [79.8, 10.5],
  [78.2, 8.7],
  [77.5, 8],
  [76.5, 9],
  [75.5, 11.5],
  [74.8, 13.5],
  [73.8, 16],
  [72.8, 19],
  [72.9, 21],
  [70.5, 21],
  [69, 22.3],
  [68.2, 23.7],
  [70, 24.5],
  [71, 25.5],
  [70.5, 28],
  [72, 29.5],
  [74, 31],
  [74.5, 33],
  [73.5, 34.5],
];
