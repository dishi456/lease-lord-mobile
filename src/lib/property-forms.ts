export type FieldDef = { key: string; label: string; type: "text" | "number" | "bool" | "select"; options?: { k: string; l: string }[] };

export const PROPERTY_TYPES = [
  { k: "HOUSE", l: "House" },
  { k: "APARTMENT", l: "Apartment" },
  { k: "COMMERCIAL", l: "Commercial" },
  { k: "LAND", l: "Land / Plot" },
  { k: "STUDENT_HOUSING", l: "Student housing" },
  { k: "ROOM", l: "Room" },
  { k: "OTHER", l: "Other" },
];
export const typeLabel = (k: string) => PROPERTY_TYPES.find((t) => t.k === k)?.l ?? k;

// Type-specific fields rendered by the dynamic Add Property form. Values are
// stored in the property's `details` JSON; a few are also mapped to real columns.
export const TYPE_FIELDS: Record<string, FieldDef[]> = {
  HOUSE: [
    { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "bathrooms", label: "Bathrooms", type: "number" },
    { key: "floors", label: "Number of floors", type: "number" },
    { key: "livingRoom", label: "Living room", type: "bool" },
    { key: "diningRoom", label: "Dining room", type: "bool" },
    { key: "kitchen", label: "Kitchen", type: "bool" },
    { key: "garage", label: "Garage", type: "bool" },
    { key: "basement", label: "Basement", type: "bool" },
    { key: "backyard", label: "Backyard", type: "bool" },
    { key: "garden", label: "Garden", type: "bool" },
    { key: "driveway", label: "Driveway", type: "bool" },
    { key: "swimmingPool", label: "Swimming pool", type: "bool" },
  ],
  APARTMENT: [
    { key: "apartmentNumber", label: "Apartment number", type: "text" },
    { key: "buildingName", label: "Building name", type: "text" },
    { key: "floorNumber", label: "Floor number", type: "number" },
    { key: "totalFloors", label: "Total floors", type: "number" },
    { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "bathrooms", label: "Bathrooms", type: "number" },
    { key: "elevator", label: "Elevator", type: "bool" },
    { key: "balcony", label: "Balcony", type: "bool" },
    { key: "gym", label: "Gym access", type: "bool" },
    { key: "parking", label: "Parking", type: "bool" },
    { key: "maintenanceFee", label: "Maintenance fee (₹)", type: "number" },
  ],
  COMMERCIAL: [
    { key: "unitType", label: "Unit type", type: "select", options: [{ k: "OFFICE", l: "Office" }, { k: "RETAIL", l: "Retail shop" }, { k: "WAREHOUSE", l: "Warehouse" }, { k: "INDUSTRIAL", l: "Industrial unit" }] },
    { key: "carpetArea", label: "Carpet area (sqft)", type: "number" },
    { key: "builtUpArea", label: "Built-up area (sqft)", type: "number" },
    { key: "meetingRooms", label: "Meeting rooms", type: "number" },
    { key: "washrooms", label: "Washrooms", type: "number" },
    { key: "parkingCapacity", label: "Parking capacity", type: "number" },
    { key: "reception", label: "Reception", type: "bool" },
    { key: "loadingArea", label: "Loading area", type: "bool" },
    { key: "businessType", label: "Business type", type: "text" },
  ],
  LAND: [
    { key: "plotNumber", label: "Plot number", type: "text" },
    { key: "plotSize", label: "Plot size (sqft)", type: "number" },
    { key: "zoningType", label: "Zoning", type: "select", options: [{ k: "RESIDENTIAL", l: "Residential" }, { k: "COMMERCIAL", l: "Commercial" }, { k: "AGRICULTURAL", l: "Agricultural" }] },
    { key: "roadAccess", label: "Road access", type: "bool" },
    { key: "cornerPlot", label: "Corner plot", type: "bool" },
    { key: "waterConnection", label: "Water connection", type: "bool" },
    { key: "electricityConnection", label: "Electricity connection", type: "bool" },
  ],
  STUDENT_HOUSING: [
    { key: "roomType", label: "Room type", type: "select", options: [{ k: "SHARED", l: "Shared room" }, { k: "PRIVATE", l: "Private room" }] },
    { key: "beds", label: "Number of beds", type: "number" },
    { key: "distanceFromUniversity", label: "Distance from university (km)", type: "number" },
    { key: "wifi", label: "Wi-Fi", type: "bool" },
    { key: "laundry", label: "Laundry", type: "bool" },
    { key: "kitchen", label: "Kitchen", type: "bool" },
    { key: "commonArea", label: "Common area", type: "bool" },
    { key: "studyRoom", label: "Study room", type: "bool" },
  ],
  ROOM: [
    { key: "bathrooms", label: "Bathrooms", type: "number" },
    { key: "kitchen", label: "Kitchen", type: "bool" },
  ],
  OTHER: [],
};

// Pretty-print a stored details map for display.
export function detailLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
