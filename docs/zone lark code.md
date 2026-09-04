# Zone Lark

Zone Lark is a facilities intelligence platform. Version 1 focuses on automating the collection, organization, and analysis of facility asset data during Facilities Condition Assessment (FCA) inspections. This is the first iteration of many future versions, and the foundation for a larger facilities asset management and building intelligence ecosystem.

## Version 1

A user walks through a facility and photographs assets on a mobile device. Zone Lark uses image recognition, optical character recognition, and artificial intelligence to identify, translate, categorize, and organize information from those photographs into a structured FCA database — without manual data entry.

The system automatically creates an Excel spreadsheet of all collected asset information and populates standardized FCA fields.

### Excel fields

- Fixed ID Number
- Facility Name
- Facility Type or Usage
- Facility Level or Floor
- Room Number
- Room Name
- Area or Asset Served
- Asset or CMMS ID
- Asset Name
- Asset Manufacturer
- Asset Model Number
- Asset Serial Number
- Asset Approximate Install Year
- Notes and Comments
- FCA Score
- Asset Type
- Asset Size
- Asset Quantity Multiplier
- Unit of Measure
- Asset Repair or Replace Recommendation
- Uniformat Level 2
- Industry Life Expectancy
- Industry Replacement Year
- Industry Life Remaining
- Estimated or Observed Life Remaining
- Observed Replacement Year
- Unit Probable Cost
- Extended Probable Cost
- Depreciated Value
- Annual Maintenance Cost
- Facility Square Feet
- Date of Assessment
- Operational Impact Score
- Energy Impact Score
- Associated supporting calculations

### FCA condition score (1–5)

| Score | Meaning                                                  |
| ----- | -------------------------------------------------------- |
| 1     | Excellent condition; asset may be only 1–2 years old     |
| 2     | Good condition; limited deterioration                    |
| 3     | Expected condition; roughly 50% of useful life remaining |
| 4     | Poor condition; replacement within the next 2–3 years    |
| 5     | Very poor condition; immediate replacement               |

### Operational impact score (1–5)

| Score | Meaning                                                                                                  |
| ----- | -------------------------------------------------------------------------------------------------------- |
| 1     | Negligible impact; no disruption to operations                                                           |
| 2     | Minor impact; limited disruption and readily available workarounds                                       |
| 3     | Moderate impact; noticeable operational degradation                                                      |
| 4     | Major impact; significant business interruption                                                          |
| 5     | Critical or catastrophic; complete loss of service, building closure, or severe operational consequences |

### Energy impact score (1–5)

| Score | Meaning                                                                                |
| ----- | -------------------------------------------------------------------------------------- |
| 1     | Negligible energy impact; highly efficient operation                                   |
| 2     | Minor inefficiencies                                                                   |
| 3     | Measurable energy waste; opportunities for savings                                     |
| 4     | Significant energy waste; poor performance compared to current standards               |
| 5     | Severe energy waste; immediate replacement can be justified from utility savings alone |

### Lifecycle estimates

For HVAC, lighting, plumbing, fire protection, architectural finishes, commercial kitchen equipment, and other facility assets, Zone Lark estimates:

- Useful life remaining
- Replacement year
- Replacement costs
- Annual maintenance costs
- Depreciated value
- Capital planning requirements

Estimates are based on industry standards, observed condition, and collected asset information. Useful life follows ASHRAE, IFMA, and BOMA standards.

### Pricing

Pricing is populated by a pricing engine that references proprietary pricing databases and external supplier databases. The system compares and normalizes pricing from user-supplied cost spreadsheets and from:

- [Grainger](https://www.grainger.com/)
- [SupplyHouse](https://www.supplyhouse.com/)
- [Ferguson Home](https://www.fergusonhome.com/)
- [Floor & Decor](https://www.flooranddecor.com/)
- [Fire Protection Parts](https://fireprotectionparts.net/collections)
- [Fire Alarm Depot](https://firealarmdepot.com/)
- [Restaurant Supply](https://www.restaurantsupply.com/collections/restaurant-equipment)
- [HD Supply](https://hdsupplysolutions.com/)
- [Home Depot](https://www.homedepot.com/)

### Objective

Reduce the time required to complete an FCA by converting field observations, photographs, nameplates, and asset conditions into a complete FCA dataset, while generating capital forecasts, replacement schedules, operational risk scores, energy impact scores, and probable replacement costs. The result should be faster, more accurate, and more scalable than traditional FCA methods.

## Later versions

Future versions expand beyond FCA data collection into:

- Predictive maintenance
- Capital planning
- CMMS integration
- Real-time building intelligence
- Portfolio benchmarking
- Asset lifecycle forecasting
- Autonomous facilities management recommendations

The long-term product is a facilities operating platform for owners, operators, engineers, consultants, and facility managers.
