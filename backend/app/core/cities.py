"""Public reference data for the cities currently supported by TERRANOVA.

This deliberately small placeholder list can be edited without changing the
project APIs.
"""

CITIES = [
    {"slug": "bengaluru", "name": "Bengaluru", "lat": 12.9716, "lng": 77.5946},
    {"slug": "chennai", "name": "Chennai", "lat": 13.0827, "lng": 80.2707},
    {"slug": "kochi", "name": "Kochi", "lat": 9.9312, "lng": 76.2673},
    {"slug": "thiruvananthapuram", "name": "Thiruvananthapuram", "lat": 8.5241, "lng": 76.9366},
    {"slug": "hyderabad", "name": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
    {"slug": "mumbai", "name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
    {"slug": "delhi", "name": "Delhi", "lat": 28.7041, "lng": 77.1025},
    {"slug": "pune", "name": "Pune", "lat": 18.5204, "lng": 73.8567},
]

CITY_SLUGS = {city["slug"] for city in CITIES}
