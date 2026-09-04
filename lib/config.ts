/**
 * Zonelark — Central config: Uniformat II, ASHRAE lifecycle registry, column schema.
 */

export const CURRENT_YEAR = new Date().getFullYear();
export const HEADER_COLOR = "0F2C3D";
export const ZEBRA_COLOR = "E2EFDA";
export const YELLOW_COLOR = "FFFDE7"; // manual-entry cost column

// ── Uniformat Level 2 labels ──────────────────────────────────────────────
export const UniformatLevel2 = {
  A10: "A10 Foundations",
  A20: "A20 Basement Construction",
  B10: "B10 Superstructure",
  B20: "B20 Exterior Enclosure",
  B30: "B30 Roofing",
  C10: "C10 Interior Construction",
  C20: "C20 Stairs",
  C30: "C30 Interior Finishes",
  D10: "D10 Conveying",
  D20: "D20 Plumbing",
  D30: "D30 HVAC",
  D40: "D40 Fire Protection",
  D50: "D50 Electrical",
  E10: "E10 Equipment",
  E20: "E20 Furnishings",
  F10: "F10 Special Construction",
  F20: "F20 Selective Building Demolition",
  G10: "G10 Site Preparation",
  G20: "G20 Site Improvements",
  G30: "G30 Site Mechanical Utilities",
  G40: "G40 Site Electrical Utilities",
  G90: "G90 Other Site Construction",
} as const;

export type UniformatLabel = (typeof UniformatLevel2)[keyof typeof UniformatLevel2];

// ── ASHRAE / industry lifecycle registry ──────────────────────────────────
export interface LifecycleEntry {
  life: number; // years
  uniformat: UniformatLabel;
  unitCost: number; // USD replacement cost
  maintPct: number; // annual maintenance as fraction of replacement cost
}

// unitCost = installed replacement cost (USD). Sources: theacoutlet.com, pumpproducts.com (2026 market data).
export const LIFECYCLE_REGISTRY: Record<string, LifecycleEntry> = {
  // HVAC — equipment costs from theacoutlet.com wholesale (2026); installed = ~2–3× equipment
  "Air Handling Unit": {
    life: 20,
    uniformat: UniformatLevel2.D30,
    unitCost: 15_000,
    maintPct: 0.03,
  }, // wholesale avg $1,918 residential; commercial installed $10k–30k
  "Fan Coil Unit": { life: 20, uniformat: UniformatLevel2.D30, unitCost: 4_500, maintPct: 0.03 },
  "Packaged Rooftop Unit": {
    life: 15,
    uniformat: UniformatLevel2.D30,
    unitCost: 25_000,
    maintPct: 0.03,
  }, // wholesale avg $7,981; installed commercial $15k–40k
  "Condensing Unit": { life: 15, uniformat: UniformatLevel2.D30, unitCost: 8_000, maintPct: 0.025 }, // wholesale avg $2,684; installed $6k–12k
  "Mini Split System": {
    life: 15,
    uniformat: UniformatLevel2.D30,
    unitCost: 6_300,
    maintPct: 0.025,
  }, // wholesale avg $6,326 light commercial (theacoutlet.com)
  Chiller: { life: 23, uniformat: UniformatLevel2.D30, unitCost: 90_000, maintPct: 0.02 },
  "Cooling Tower": { life: 20, uniformat: UniformatLevel2.D30, unitCost: 35_000, maintPct: 0.025 },
  Boiler: { life: 25, uniformat: UniformatLevel2.D30, unitCost: 48_000, maintPct: 0.02 },
  "Heat Exchanger": { life: 24, uniformat: UniformatLevel2.D30, unitCost: 12_000, maintPct: 0.02 },
  "Variable Air Volume Box": {
    life: 20,
    uniformat: UniformatLevel2.D30,
    unitCost: 1_800,
    maintPct: 0.03,
  },
  "Exhaust Fan": { life: 20, uniformat: UniformatLevel2.D30, unitCost: 2_200, maintPct: 0.025 },
  "HVAC Control System": {
    life: 15,
    uniformat: UniformatLevel2.D30,
    unitCost: 25_000,
    maintPct: 0.04,
  },
  "Gas Furnace": { life: 18, uniformat: UniformatLevel2.D30, unitCost: 4_000, maintPct: 0.025 }, // theacoutlet.com 7/2026: Goodman 90-95% AFUE 40-60kBtu wholesale $1,400-$1,516; installed ~2.7x
  "Heat Pump Split System": {
    life: 15,
    uniformat: UniformatLevel2.D30,
    unitCost: 6_000,
    maintPct: 0.025,
  }, // theacoutlet.com 7/2026: Goodman 1.5-2 Ton 14.5 SEER2 R-32 system wholesale $2,375-$2,454; installed ~2.5x
  "Packaged Terminal Heat Pump (PTAC)": {
    life: 10,
    uniformat: UniformatLevel2.D30,
    unitCost: 2_200,
    maintPct: 0.035,
  }, // theacoutlet.com 7/2026: Amana J-Series 7k-12k Btu wholesale $1,215-$1,240; self-contained, installed ~1.8x
  "Water Source Heat Pump": {
    life: 20,
    uniformat: UniformatLevel2.D30,
    unitCost: 7_500,
    maintPct: 0.02,
  }, // theacoutlet.com 7/2026: ClimateMaster/Carrier 1 Ton R-454B copper wholesale $3,139-$3,465; installed ~2.3x
  // Plumbing — pumpproducts.com GraphQL API (2026 market data)
  "Domestic Water Heater": {
    life: 12,
    uniformat: UniformatLevel2.D20,
    unitCost: 4_000,
    maintPct: 0.03,
  },
  "Commercial Water Heater": {
    life: 15,
    uniformat: UniformatLevel2.D20,
    unitCost: 9_500,
    maintPct: 0.025,
  },
  "Centrifugal Pump": {
    life: 20,
    uniformat: UniformatLevel2.D20,
    unitCost: 9_000,
    maintPct: 0.025,
  }, // pumpproducts avg $8,968 (23 units, $1,932–$43,146)
  "Sump Pump": { life: 10, uniformat: UniformatLevel2.D20, unitCost: 900, maintPct: 0.04 }, // pumpproducts avg $352 wholesale; commercial grade ~$900 installed
  "Backflow Preventer": {
    life: 15,
    uniformat: UniformatLevel2.D20,
    unitCost: 2_500,
    maintPct: 0.02,
  },
  "Expansion Tank": { life: 25, uniformat: UniformatLevel2.D20, unitCost: 1_800, maintPct: 0.01 },
  // Fire Protection — pumpproducts.com (fire pumps); NFPA 72 market data (FACP)
  "Fire Alarm Control Panel": {
    life: 15,
    uniformat: UniformatLevel2.D40,
    unitCost: 14_000,
    maintPct: 0.04,
  },
  // Addressable Fire Alarm Control Panels, sized by loop/point capacity — firealarm.com 7/2026 (installed ~1.8x equipment, self-contained cabinet)
  "Addressable FACP - 1 Loop (up to 100 pt)": {
    life: 15,
    uniformat: UniformatLevel2.D40,
    unitCost: 2_500,
    maintPct: 0.04,
  }, // e.g. Kidde VS1/FX-64R, Edwards EST IO64, Notifier NFW-50/100X: $774-$2,893, avg ~$1,380
  "Addressable FACP - 4 Loop (up to 250 pt)": {
    life: 15,
    uniformat: UniformatLevel2.D40,
    unitCost: 3_400,
    maintPct: 0.04,
  }, // e.g. Kidde FX-1000/VS4, Edwards EST IO1000R, Advanced AX-CTL-4: $1,118-$3,839, avg ~$1,900
  "Addressable FACP - Networked/Large (500+ pt)": {
    life: 15,
    uniformat: UniformatLevel2.D40,
    unitCost: 5_400,
    maintPct: 0.04,
  }, // e.g. Notifier NFS-320, Simplex 4010/4100, Silent Knight IFP-2100/300ECS: $1,346-$5,385, avg ~$3,000
  "Sprinkler System": {
    life: 30,
    uniformat: UniformatLevel2.D40,
    unitCost: 45_000,
    maintPct: 0.01,
  },
  "Fire Suppression System": {
    life: 20,
    uniformat: UniformatLevel2.D40,
    unitCost: 28_000,
    maintPct: 0.03,
  },
  "Fire Pump": { life: 20, uniformat: UniformatLevel2.D40, unitCost: 20_000, maintPct: 0.03 }, // pumpproducts avg $10,377 (small); commercial 750GPM $18k–45k
  "Fire Extinguisher": { life: 12, uniformat: UniformatLevel2.D40, unitCost: 75, maintPct: 0.05 }, // grainger.com 7/2026: Class ABC handheld $49–$82; NFPA 10 hydrostatic retest cycle = 12yr life
  "Exit/Emergency Light Combo": {
    life: 10,
    uniformat: UniformatLevel2.D40,
    unitCost: 150,
    maintPct: 0.03,
  }, // grainger.com 7/2026: LED exit sign w/ emergency lights, ceiling/wall mount, $107–$237
  // Electrical — ASHRAE / industry benchmarks (se.com & cityelectricsupply.com require login for pricing)
  "Electrical Panelboard": {
    life: 30,
    uniformat: UniformatLevel2.D50,
    unitCost: 7_500,
    maintPct: 0.015,
  },
  "Motor Control Center": {
    life: 25,
    uniformat: UniformatLevel2.D50,
    unitCost: 32_000,
    maintPct: 0.02,
  },
  "Dry Type Transformer": {
    life: 35,
    uniformat: UniformatLevel2.D50,
    unitCost: 20_000,
    maintPct: 0.01,
  }, // CES product: 225kVA 480/208Y NEMA3R (MGM HT225A3B2-D16)
  "Emergency Generator": {
    life: 25,
    uniformat: UniformatLevel2.D50,
    unitCost: 60_000,
    maintPct: 0.04,
  },
  "Automatic Transfer Switch": {
    life: 20,
    uniformat: UniformatLevel2.D50,
    unitCost: 8_500,
    maintPct: 0.025,
  },
  "UPS System": { life: 10, uniformat: UniformatLevel2.D50, unitCost: 15_000, maintPct: 0.04 },
  "Lighting Control System": {
    life: 15,
    uniformat: UniformatLevel2.D50,
    unitCost: 18_000,
    maintPct: 0.025,
  },
  // Equipment / Shell
  Elevator: { life: 25, uniformat: UniformatLevel2.E10, unitCost: 85_000, maintPct: 0.04 },
  "Commercial Kitchen Equipment": {
    life: 12,
    uniformat: UniformatLevel2.E10,
    unitCost: 35_000,
    maintPct: 0.04,
  },
  "Roof Assembly": { life: 20, uniformat: UniformatLevel2.B30, unitCost: 120_000, maintPct: 0.01 },
  "Exterior Window System": {
    life: 25,
    uniformat: UniformatLevel2.B20,
    unitCost: 80_000,
    maintPct: 0.01,
  },
  // Interior Construction — grainger.com (2026 market data)
  "Interior Door & Frame Assembly": {
    life: 30,
    uniformat: UniformatLevel2.C10,
    unitCost: 1_800,
    maintPct: 0.01,
  }, // grainger.com 7/2026: 180min-rated hollow metal frame $747–$778; + door leaf/hardware, installed
  // Interior Finishes — grainger.com (2026 market data)
  "Suspended Ceiling System": {
    life: 20,
    uniformat: UniformatLevel2.C30,
    unitCost: 5_500,
    maintPct: 0.01,
  }, // grainger.com 7/2026: Armstrong 2x4 acoustic tile $203/pkg of 12 (~$2.12/SF material); installed grid+tile ~$5.50/SF, per 1,000 SF
  // Site Improvements — grainger.com (2026 market data)
  Bollard: { life: 20, uniformat: UniformatLevel2.G20, unitCost: 350, maintPct: 0.01 }, // grainger.com 7/2026: bolt-on steel pipe bollard $98–$131; installed w/ concrete footing
  "Site Lighting - Pole Fixture": {
    life: 20,
    uniformat: UniformatLevel2.G20,
    unitCost: 4_500,
    maintPct: 0.025,
  }, // grainger.com 7/2026: LED pole-mount area/parking lot fixture head $910–$1,236; + pole & base, installed
  // Stairs — RSMeans-style planning estimate; no live vendor catalog exists for site-built stair assemblies
  "Interior Stair Assembly": {
    life: 40,
    uniformat: UniformatLevel2.C20,
    unitCost: 22_000,
    maintPct: 0.01,
  }, // steel pan / concrete-filled stair with rails, per flight, installed
  // Furnishings — grainger.com (2026 market data)
  "Fixed Casework & Millwork": {
    life: 20,
    uniformat: UniformatLevel2.E20,
    unitCost: 8_000,
    maintPct: 0.01,
  }, // grainger.com 7/2026: laminate base/wall cabinet runs, per room, installed
  // Special Construction — planning-level estimate for FCA-tracked special-facility equipment
  "Loading Dock Leveler": {
    life: 20,
    uniformat: UniformatLevel2.F10,
    unitCost: 8_500,
    maintPct: 0.02,
  },
  // Selective Demolition / Hazmat — planning-level abatement cost assumption, not a catalog product;
  // life reflects an assumed near-term remediation window, not a service-life estimate
  "Hazardous Material Abatement (ACM/Lead)": {
    life: 5,
    uniformat: UniformatLevel2.F20,
    unitCost: 15_000,
    maintPct: 0,
  },
  // Site Preparation — planning-level remediation cost assumption; life is an assumed action window
  "Contaminated Soil / Hazardous Waste Remediation": {
    life: 5,
    uniformat: UniformatLevel2.G10,
    unitCost: 20_000,
    maintPct: 0,
  },
  // Site Mechanical Utilities — pumpproducts.com-style planning estimate for fuel storage infrastructure
  "Underground Storage Tank (UST) System": {
    life: 30,
    uniformat: UniformatLevel2.G30,
    unitCost: 45_000,
    maintPct: 0.015,
  },
  // Site Electrical Utilities — grainger.com 2026 planning estimate for site power distribution
  "Site Electrical Duct Bank / Distribution": {
    life: 35,
    uniformat: UniformatLevel2.G40,
    unitCost: 30_000,
    maintPct: 0.01,
  },
  // Other Site Construction — planning-level estimate for utility/pedestrian tunnel assets
  "Pedestrian/Utility Tunnel": {
    life: 50,
    uniformat: UniformatLevel2.G90,
    unitCost: 150_000,
    maintPct: 0.01,
  },
  // Fallback
  Unknown: { life: 15, uniformat: UniformatLevel2.D30, unitCost: 5_000, maintPct: 0.03 },
};

/** Registry keys for LLM prompts and UI asset-type picklists. */
export const APPROVED_ASSET_TYPES = Object.keys(LIFECYCLE_REGISTRY).sort();

export function getRegistry(assetType: string): LifecycleEntry {
  return LIFECYCLE_REGISTRY[assetType] ?? LIFECYCLE_REGISTRY["Unknown"];
}

const UNIFORMAT_CODE_LOOKUP = new Map(
  Object.entries(UniformatLevel2).map(([code, label]) => [code, label]),
);

/**
 * Canonicalizes a raw "Uniformat Level 2" value from an import (e.g. "A10 - Foundations")
 * against the known code table, so imported labels match the ones the registry produces.
 * Falls back to the trimmed raw value when the code isn't recognized, rather than dropping it.
 */
export function normalizeUniformatLabel(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([A-Za-z]\d{2})/);
  if (match) {
    const label = UNIFORMAT_CODE_LOOKUP.get(match[1].toUpperCase());
    if (label) return label;
  }
  return trimmed;
}

/**
 * A source file's own Uniformat classification (when present) is authoritative — asset-type
 * name matching against the lifecycle registry is only a fallback for rows that omit it.
 */
export function getUniformat(asset: { assetType: string; uniformatLevel2?: string }): string {
  return asset.uniformatLevel2 || getRegistry(asset.assetType).uniformat;
}

// ── Exact 35-column schema (order is contractual with spreadsheet engine) ──
export const COLUMNS_SCHEMA: string[] = [
  "Fixed ID Number",
  "Facility Name",
  "Facility Type/Usage",
  "Facility Level/Floor",
  "Room Number",
  "Room Name",
  "Area / Asset Served",
  "Asset / CMMS ID (e.g. TAG #)",
  "Asset Name (e.g. AHU-3)",
  "Asset Manufacturer",
  "Asset Model Number",
  "Asset Serial Number",
  "Asset Approximate Install Year",
  "Notes/Comments",
  "FCA 1-5",
  "Asset Type",
  'Asset "Size"',
  "Asset Quantity Multiplier",
  "Unit of Measure",
  "Asset Repair or Replace",
  "Uniformat Level 2",
  "Industry Life Expectancy",
  "Industry Replacement Year",
  "Industry Life Remaining",
  "Estimated / Observed Life Remaining",
  "Observed Replacement Year",
  "Unit Probable Cost ($)\n(MANUAL ENTRY POSSIBLE)",
  "Extended Probable Cost ($)",
  "Depreciated Value",
  "Annual Maintenance",
  "Facility Square Feet",
  "Date of Assessment",
  "Operational Impact (1-5)",
  "Energy Impact (1-5)",
];
