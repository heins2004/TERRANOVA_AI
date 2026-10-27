"""Demo data definitions for TERRANOVA AI demo seeding."""
from datetime import datetime, timedelta, timezone

DEMO_ACCOUNTS = [
    {"email": "heinsdevasia@gmail.com", "full_name": "Heins Devasia", "role": "Administrator", "city": "kochi", "org": "TERRANOVA Admin", "desig": "Lead Administrator", "avatar": "avatar-01"},
    {"email": "citizen1@test.com", "full_name": "Aarav Sharma", "role": "Citizen", "city": "kochi", "org": "Community Forum", "desig": "Resident", "avatar": "avatar-02"},
    {"email": "citizen2@test.com", "full_name": "Aditi Rao", "role": "Citizen", "city": "bengaluru", "org": "Civic Action Trust", "desig": "Volunteer", "avatar": "avatar-03"},
    {"email": "citizen3@test.com", "full_name": "Rohan Mehta", "role": "Citizen", "city": "mumbai", "org": "Public Transit Commuters", "desig": "Member", "avatar": "avatar-04"},
    {"email": "citizen4@test.com", "full_name": "Priya Swaminathan", "role": "Citizen", "city": "chennai", "org": "Green City Initiative", "desig": "Environmental Advocate", "avatar": "avatar-05"},
    {"email": "citizen5@test.com", "full_name": "Vikram Malhotra", "role": "Citizen", "city": "delhi", "org": "Delhi Pedestrian Coalition", "desig": "Coordinator", "avatar": "avatar-06"},
    {"email": "planner1@test.com", "full_name": "Kavita Deshmukh", "role": "Urban Planner", "city": "pune", "org": "Urban Planning Council", "desig": "Chief Urban Planner", "avatar": "avatar-07"},
    {"email": "planner2@test.com", "full_name": "Arjun Das", "role": "Urban Planner", "city": "hyderabad", "org": "Metropolitan Development Authority", "desig": "Senior Infrastructure Planner", "avatar": "avatar-08"},
    {"email": "planner3@test.com", "full_name": "Meenakshi Sundaram", "role": "Urban Planner", "city": "kochi", "org": "City Planning Bureau", "desig": "Principal Spatial Architect", "avatar": "avatar-09"},
    {"email": "gov1@test.com", "full_name": "Rajesh Chauhan", "role": "Government Official", "city": "kochi", "org": "Kochi Municipal Corporation", "desig": "Executive Engineer", "avatar": "avatar-10"},
    {"email": "gov2@test.com", "full_name": "Ananya Nair", "role": "Government Official", "city": "bengaluru", "org": "Urban Development Directorate", "desig": "Joint Commissioner", "avatar": "avatar-11"},
    {"email": "gov3@test.com", "full_name": "Sanjay Tripathi", "role": "Government Official", "city": "mumbai", "org": "Metropolitan Region Authority", "desig": "Director of Public Works", "avatar": "avatar-12"},
]

RAW_PROJECTS = [
    {"stage": "Draft", "title": "Kaloor Athletic Stadium Annex", "cat": "Stadium", "city": "kochi", "cname": "Kochi", "b": 180, "lat": 9.998, "lng": 76.299, "desc": "Modern multi-tier training complex with sports medicine clinic and solar-covered parking."},
    {"stage": "Draft", "title": "Whitefield Arterial Link", "cat": "Road", "city": "bengaluru", "cname": "Bengaluru", "b": 240, "lat": 12.969, "lng": 77.749, "desc": "Four-lane elevated road relieving arterial congestion between tech corridors."},
    {"stage": "Draft", "title": "Viman Nagar Community Clinic", "cat": "Hospital", "city": "pune", "cname": "Pune", "b": 45, "lat": 18.567, "lng": 73.914, "desc": "Comprehensive 50-bed localized outpatient hospital with diagnostic laboratory and pharmacy."},

    {"stage": "Planner invited", "title": "Jubilee Hills Sports Arena", "cat": "Stadium", "city": "hyderabad", "cname": "Hyderabad", "b": 310, "lat": 17.432, "lng": 78.407, "desc": "Indoor gymnastics and badminton facility catering to youth regional tournaments."},
    {"stage": "Planner invited", "title": "Old City Heritage Walkway", "cat": "Park", "city": "ahmedabad", "cname": "Ahmedabad", "b": 60, "lat": 23.022, "lng": 72.571, "desc": "Pedestrianized riverside green boulevard with indigenous shade planting and lighting."},
    {"stage": "Planner invited", "title": "Kakkanad Transit Expressway", "cat": "Road", "city": "kochi", "cname": "Kochi", "b": 210, "lat": 10.015, "lng": 76.345, "desc": "High-capacity grade-separated highway connecting IT parks with national highway grid.", "reject_reason": "Proposed alignment crosses sensitive coastal regulation zone boundary; select higher ground."},

    {"stage": "Site proposed", "title": "Electronic City Central School", "cat": "School", "city": "bengaluru", "cname": "Bengaluru", "b": 75, "lat": 12.839, "lng": 77.677, "desc": "30-classroom smart STEM public academy with automated library and turf athletics grounds.", "prop_name": "Phase 1 Institutional Enclave", "prop_exp": "Centrally positioned adjacent to residential quarters and primary arterial bus routes.", "prop_lat": 12.842, "prop_lng": 77.681},
    {"stage": "Site proposed", "title": "Bandra Kurla Retail Pavilion", "cat": "Mall", "city": "mumbai", "cname": "Mumbai", "b": 420, "lat": 19.065, "lng": 72.868, "desc": "Eco-friendly retail and civic exhibition pavilion built on flood-resilient podium.", "prop_name": "BKC G-Block Parcel 4", "prop_exp": "Offers direct underground pedestrian concourse to metro line interchange.", "prop_lat": 19.068, "prop_lng": 72.871},
    {"stage": "Site proposed", "title": "Guindy Ecological Reserve Park", "cat": "Park", "city": "chennai", "cname": "Chennai", "b": 90, "lat": 13.006, "lng": 80.220, "desc": "Urban wetland restoration and ecological education park with elevated timber walkways.", "prop_name": "South Canal Buffer Parcel", "prop_exp": "Maximizes native vegetation preservation and non-intrusive public recreation zones.", "prop_lat": 13.009, "prop_lng": 72.575},

    {"stage": "Under consideration", "title": "Hennur Multi-Speciality Center", "cat": "Hospital", "city": "bengaluru", "cname": "Bengaluru", "b": 130, "lat": 13.025, "lng": 77.640, "desc": "120-bed hospital expansion focused on intensive care, nephrology, and emergency trauma bays.", "prop_name": "Hennur Main Road Civic Plot", "prop_exp": "Allows dual-direction ambulance ingress and proximity to Outer Ring Road.", "prop_lat": 13.028, "prop_lng": 77.643},
    {"stage": "Under consideration", "title": "Hadapsar Industrial Secondary School", "cat": "School", "city": "pune", "cname": "Pune", "b": 55, "lat": 18.502, "lng": 73.926, "desc": "Comprehensive vocational high school offering robotics, mechanical labs, and rooftop solar.", "prop_name": "Magarpatta South Sector 9", "prop_exp": "Serves rapidly expanding manufacturing worker residential settlements.", "prop_lat": 18.506, "prop_lng": 73.931},
    {"stage": "Under consideration", "title": "Gachibowli Aquatic Stadium", "cat": "Stadium", "city": "hyderabad", "cname": "Hyderabad", "b": 260, "lat": 17.443, "lng": 78.348, "desc": "Olympic-regulation 50m competition pool and diving facility with 4,000 spectator seating.", "prop_name": "Sports University West Quadrant", "prop_exp": "Direct utility connections for high-volume greywater recycling already available.", "prop_lat": 17.447, "prop_lng": 78.352},

    {"stage": "Approved", "title": "Fort Kochi Heritage Plaza", "cat": "Mall", "city": "kochi", "cname": "Kochi", "b": 110, "lat": 9.965, "lng": 76.242, "desc": "Handicrafts marketplace and cultural amphitheatre celebrating indigenous coastal art.", "prop_name": "Old Port Warehouse Yard", "prop_exp": "Restores historic dockside structures while integrating modern fire-safety standards.", "prop_lat": 9.965, "prop_lng": 76.242},
    {"stage": "Approved", "title": "Hebbal Lake Wetland Promenade", "cat": "Park", "city": "bengaluru", "cname": "Bengaluru", "b": 85, "lat": 13.038, "lng": 77.591, "desc": "Biodiversity corridor around Hebbal lake with rain gardens, bird hides, and cycling trail.", "prop_name": "Lake Perimeter Sector B", "prop_exp": "Protects storm overflow catchment while creating barrier-free recreational public space.", "prop_lat": 13.038, "prop_lng": 77.591},
    {"stage": "Approved", "title": "Thane Valley Bypass Flyover", "cat": "Road", "city": "mumbai", "cname": "Mumbai", "b": 380, "lat": 19.218, "lng": 72.978, "desc": "Six-lane viaduct bypassing congested commercial crossroads with noise dampening barriers.", "prop_name": "Ghansoli Link Corridor", "prop_exp": "Engineered over existing industrial right-of-way without displacing private dwellings.", "prop_lat": 19.218, "prop_lng": 72.978},

    {"stage": "OpenForResponse", "title": "Marine Drive Boulevard Overhaul", "cat": "Road", "city": "kochi", "cname": "Kochi", "b": 195, "lat": 9.979, "lng": 76.276, "desc": "Coastal four-lane reconstruction with continuous LED illumination and dual pedestrian flyovers.", "site_change": True},
    {"stage": "OpenForResponse", "title": "Cyberabad District Trauma Center", "cat": "Hospital", "city": "hyderabad", "cname": "Hyderabad", "b": 140, "lat": 17.439, "lng": 78.381, "desc": "24/7 Level-1 trauma care facility serving the western IT and residential corridor."},
    {"stage": "OpenForResponse", "title": "Baner Digital STEM High School", "cat": "School", "city": "pune", "cname": "Pune", "b": 65, "lat": 18.559, "lng": 73.780, "desc": "Modern public secondary campus featuring collaborative makerspaces and zero-carbon design."},

    {"stage": "InProgress", "title": "Salt Lake Football Arena", "cat": "Stadium", "city": "kolkata", "cname": "Kolkata", "b": 220, "lat": 22.569, "lng": 88.406, "desc": "FIFA-standard turf arena with synthetic training tracks and 18,000 covered grandstand seats."},
    {"stage": "InProgress", "title": "Adyar Riverfront Greenway", "cat": "Park", "city": "chennai", "cname": "Chennai", "b": 70, "lat": 13.010, "lng": 80.250, "desc": "Ecological promenade featuring mangrove planting, solar lighting, and public fitness plazas."},
    {"stage": "InProgress", "title": "Connaught Transit Underpass", "cat": "Road", "city": "delhi", "cname": "Delhi", "b": 160, "lat": 28.632, "lng": 77.219, "desc": "Grade-separated vehicular underpass eliminating cross-traffic congestion at busy intersections."},

    {"stage": "Completed", "title": "Kaloor Metro Interchange Mall", "cat": "Mall", "city": "kochi", "cname": "Kochi", "b": 290, "lat": 9.993, "lng": 76.292, "desc": "Integrated multi-level transit retail mall directly connected to metro and bus platforms."},
    {"stage": "Completed", "title": "Koramangala Community Healthcare Center", "cat": "Hospital", "city": "bengaluru", "cname": "Bengaluru", "b": 50, "lat": 12.935, "lng": 77.624, "desc": "Community primary healthcare center with maternal care, diagnostics, and immunization clinic."},
    {"stage": "Completed", "title": "Shivajinagar Heritage City Park", "cat": "Park", "city": "pune", "cname": "Pune", "b": 35, "lat": 18.531, "lng": 73.855, "desc": "Historic municipal park restoration with restored fountain gardens and jogging circuits."},

    {"stage": "Halted", "title": "Sewri Coastal Highway Link", "cat": "Road", "city": "mumbai", "cname": "Mumbai", "b": 480, "lat": 18.998, "lng": 72.855, "desc": "Six-lane marine viaduct connecting industrial harbour areas with suburban expressways.", "halt_reason": "Halted by municipal authority pending supplementary geotechnical analysis of foundation stability."},
    {"stage": "Halted", "title": "Alipore Sports Complex", "cat": "Stadium", "city": "kolkata", "cname": "Kolkata", "b": 175, "lat": 22.532, "lng": 88.330, "desc": "Multipurpose sports complex featuring covered tennis courts and regional athletic tracks.", "halt_reason": "Works halted due to monsoon drainage reassessment requested by local resident association."},
    {"stage": "Halted", "title": "Rohini Commercial District Center", "cat": "Mall", "city": "delhi", "cname": "Delhi", "b": 340, "lat": 28.715, "lng": 77.112, "desc": "Four-storey civic commercial mall with open courtyards and dedicated artisan market stands.", "halt_reason": "Project halted by department order awaiting structural re-certification of foundational piers."},

    {"stage": "Recalled", "title": "Vyttila Multi-Modal Terminal", "cat": "Road", "city": "kochi", "cname": "Kochi", "b": 310, "lat": 9.966, "lng": 76.319, "desc": "Intermodal bus and ferry transit terminal with elevated skywalk connections.", "halt_reason": "Alignment revised following newly approved regional multi-modal transit corridor master plan."},
    {"stage": "Recalled", "title": "Bellandur Science Academy", "cat": "School", "city": "bengaluru", "cname": "Bengaluru", "b": 80, "lat": 12.926, "lng": 77.676, "desc": "State-of-the-art public secondary institution with specialized biotechnology teaching labs.", "halt_reason": "Recalled by education board for relocation to a site with superior arterial bus connectivity."},
    {"stage": "Recalled", "title": "Hitech City Retail Plaza", "cat": "Mall", "city": "hyderabad", "cname": "Hyderabad", "b": 270, "lat": 17.447, "lng": 78.377, "desc": "Contemporary open-air commercial precinct with integrated multi-level park and ride.", "halt_reason": "Recalled for comprehensive redesign to incorporate an integrated subterranean metro concourse."},
]

SAMPLE_COMMENTS = [
    ("Support", "This development will bring major infrastructure enhancements to the surrounding neighborhoods."),
    ("Support", "Excellent initiative that will ease long-standing transit congestion and boost economic activity."),
    ("Concern", "Please ensure comprehensive stormwater drainage and sediment traps are installed before monsoon."),
    ("Concern", "Dust suppression measures and noise barriers must be rigorously monitored during excavation."),
    ("Neutral", "Will regular status updates and air quality monitoring logs be published on the portal?"),
    ("Neutral", "Could the planning authority confirm the planned timeline for milestone reviews?"),
]

SAMPLE_CHAT_MESSAGES = [
    "Welcome to the official collaboration channel for this project.",
    "Environmental baseline reports and civil schematics have been uploaded for public review.",
    "Initial site survey and utility relocation mapping have commenced on schedule.",
    "Please submit any technical inquiries directly through this thread for our planning team.",
]

def build_project_timestamps(stage: str, now: datetime):
    """Calculate consistent dates satisfying date rules."""
    one_yr = timedelta(days=365)
    if stage == "OpenForResponse":
        dep = now - timedelta(days=5)
        dl = now + one_yr
        st = now + timedelta(days=400)
        en = now + timedelta(days=765)
    elif stage == "InProgress":
        dep = now - timedelta(days=60)
        dl = now - timedelta(days=10)
        st = now - timedelta(days=5)
        en = now + timedelta(days=300)
    elif stage == "Completed":
        dep = now - timedelta(days=365)
        dl = now - timedelta(days=200)
        st = now - timedelta(days=180)
        en = now - timedelta(days=15)
    elif stage in ("Halted", "Recalled"):
        dep = now - timedelta(days=40)
        dl = now - timedelta(days=15)
        st = now + timedelta(days=90)
        en = now + timedelta(days=365)
    else:  # Pre-deployment stages
        dep = None
        dl = None
        st = now + timedelta(days=90)
        en = now + timedelta(days=365)
    return dep, dl, st, en
