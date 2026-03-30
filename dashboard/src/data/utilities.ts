import type { UtilityData } from '../types';
import { calculatePVRevenue } from '../utils/pvCalculator';

const rawUtilities: UtilityData[] = [
  // ── Tier 1: Active Development Focus ──────────────────────────────────
  {
    utility_id: "BGE_MD",
    utility_name: "Baltimore Gas & Electric",
    utility_short_name: "BGE",
    state: "Maryland",
    state_abbr: "MD",
    iso_rto: "PJM",
    market_type: "contract_based",
    inclusion_rationale: "ISC Program 3 procurement + PJM DERA access",
    revenue: {
      utility_procurement: {
        value: 200,
        source: "BGE ISC Program 3 (estimated)",
        contract_term_years: 15,
        escalation_rate: 0.015,
        status: "RFP pending July 2026"
      },
      iso_capacity_market: { value: 55, source: "PJM BRA", erosion_rate: -0.02 },
      energy_arbitrage: { value: 40, source: "PJM LMP spreads", erosion_rate: -0.05 },
      ancillary_services: { value: 30, source: "PJM regulation", erosion_rate: -0.03 },
      state_incentives: { value: 0, programs: [] },
      total_contracted_period: 200,
      total_merchant_period: 125
    },
    costs: {
      capex_base: 2379, capex_total: 2379,
      opex_base: 23.69, opex_total: 23.69,
      development_timeline_months: 30,
      land_option_annual: 15000
    },
    state_factors: {
      storage_mandate: { exists: false, npv_multiplier: 1.0 },
      tax_incentives: { npv_multiplier: 1.0 },
      labor_requirements: { npv_multiplier: 1.0 },
      permitting: { npv_multiplier: 1.0 }
    },
    utility_factors: {
      interconnection_quality: { tier: 1, avg_timeline_months: 16, application_fee: 75000, npv_multiplier: 1.0 },
      regulatory_posture: { category: "supportive", npv_multiplier: 1.05 }
    },
    risks: {
      regulatory_uncertainty: { description: "None - ISC Program 3 approved by PSC", npv_haircut: 0 },
      discount_rate: 0.07
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "BGE ISC Program 3",
      mammoth_sites: 8,
      key_dates: [
        { date: "2026-07-01", event: "RFP release (estimated)" },
        { date: "2026-09-01", event: "Bid submission deadline (estimated)" },
        { date: "2026-12-31", event: "Awards expected" }
      ],
      notes: "Primary focus market for 2026-2027 development pipeline"
    }
  },

  {
    utility_id: "PSE_WA",
    utility_name: "Puget Sound Energy",
    utility_short_name: "PSE",
    state: "Washington",
    state_abbr: "WA",
    iso_rto: "non-ISO",
    market_type: "contract_based",
    inclusion_rationale: "DSS RFP proven track record + clear distribution IX",
    revenue: {
      utility_procurement: {
        value: 224,
        source: "PSE DSS RFP (2026 BAFO actual)",
        contract_term_years: 20,
        escalation_rate: 0.0,
        status: "Active - 2026 awards made"
      },
      iso_capacity_market: { value: 0 },
      energy_arbitrage: { value: 0 },
      ancillary_services: { value: 0 },
      state_incentives: { value: 0, programs: [] },
      total_contracted_period: 224,
      total_merchant_period: 0
    },
    costs: {
      capex_base: 2379, capex_total: 2504,
      opex_base: 23.69, opex_total: 23.69,
      development_timeline_months: 36,
      land_option_annual: 12000
    },
    state_factors: {
      storage_mandate: { exists: false, npv_multiplier: 1.0 },
      tax_incentives: { npv_multiplier: 1.0 },
      labor_requirements: { prevailing_wage: true, npv_multiplier: 0.95 },
      permitting: { npv_multiplier: 1.0 }
    },
    utility_factors: {
      interconnection_quality: { tier: 1, avg_timeline_months: 14, application_fee: 50000, npv_multiplier: 1.0 },
      regulatory_posture: { category: "supportive", npv_multiplier: 1.05 }
    },
    risks: {
      regulatory_uncertainty: { description: "None - proven DSS program", npv_haircut: 0 },
      discount_rate: 0.07
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "PSE DSS 2026 (awarded)",
      mammoth_sites: 5,
      key_dates: [
        { date: "2026-06-01", event: "2026 DSS COD target" },
        { date: "2027-03-01", event: "Next DSS RFP expected" }
      ],
      notes: "Proven market with track record. Future RFPs expected."
    }
  },

  {
    utility_id: "COMED_IL",
    utility_name: "Commonwealth Edison",
    utility_short_name: "ComEd",
    state: "Illinois",
    state_abbr: "IL",
    iso_rto: "PJM",
    market_type: "merchant_incentive",
    inclusion_rationale: "IL rebate + ITC + PJM DERA + VPP dispatch",
    revenue: {
      utility_procurement: null,
      iso_capacity_market: { value: 0 },
      energy_arbitrage: { value: 0 },
      ancillary_services: { value: 0 },
      state_incentives: { value: 0, programs: [] },
      total_contracted_period: 0,
      total_merchant_period: 0
    },
    revenue_v2: {
      one_time_total: 9500000,
      first_year_total_annual: 1574000,
      streams: [
        {
          name: "Federal ITC (48E)",
          category: "tax_credit",
          type: "one_time",
          color: "#22C55E",
          amount: 3000000,
          timing: "cod",
          notes: "30% of ~$10M project cost; transferable; FEOC risk",
          sources: [
            { label: "26 USC §48E — Clean Electricity Investment Credit", url: "https://www.irs.gov/credits-deductions/clean-electricity-investment-credit", section: "26 USC §48E", excerpt: "30% credit for qualified energy storage technology placed in service after Dec 31, 2024; transferable under §6418" }
          ]
        },
        {
          name: "5-Year MACRS",
          category: "tax_credit",
          type: "one_time",
          color: "#86EFAC",
          amount: 500000,
          timing: "cod",
          notes: "Additive to ITC; tax-position dependent; ~$500K PV",
          sources: [
            { label: "IRS Publication 946 — MACRS", url: "https://www.irs.gov/publications/p946", section: "Chapter 4, Table B-1", excerpt: "Energy storage property classified as 5-year MACRS property; depreciation basis reduced by 50% of ITC amount" }
          ]
        },
        {
          name: "Illinois CRGA Rebate",
          category: "rebate",
          type: "one_time",
          color: "#F97316",
          amount: 6000000,
          timing: "cod",
          notes: "$300/kWh x 20,000 kWh (pre-2030 rate); paid after IA execution + project verification",
          sources: [
            { label: "220 ILCS 5/16-107.6 — Distributed Storage Rebate", url: "https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=022000050K16-107.6", section: "§16-107.6(b)", excerpt: "$300/kWh for applications before Dec 31, 2029; steps down to $250/kWh on Jan 1, 2030. Applies to standalone storage <5 MW interconnected to distribution grid." },
            { label: "220 ILCS 5/16-107.6 — Payment timing", url: "https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=022000050K16-107.6", section: "§16-107.6(d)", excerpt: "Rebate reserved upon application acceptance; disbursed after interconnection agreement execution and project verification by utility." },
            { label: "ArentFox Schiff — IL CRGA storage analysis", url: "https://www.afslaw.com/perspectives/energy-cleantech-counsel/illinois-legislature-authorizes-states-first-procurement", section: "Distributed Storage Rebate section", excerpt: "CRGA sets rebate at $250/kWh nameplate for standalone storage under 5 MW, with early-applicant bonus to $300/kWh pre-2030." },
            { label: "Concentro — IL SB25 developer guide", url: "https://www.concentro.io/blog/illinois-sb25", section: "Storage Rebate Overview", excerpt: "Projects applying before Dec 31, 2029 eligible for $300/kWh; IA dated after Jan 8, 2026 required; 5-year VPP commitment." }
          ]
        },
        {
          name: "RPM Capacity (DERA)",
          category: "capacity",
          type: "annual",
          color: "#3B82F6",
          near_term_annual: 400000,
          long_term_annual: 250000,
          trend: "declining",
          annual_growth_rate: -0.03,
          notes: "First eligible DY 2028/29; ELCC uncertainty; range $304–502K",
          sources: [
            { label: "FERC Order No. 2222 — DER Aggregation", url: "https://www.ferc.gov/media/ferc-order-no-2222", section: "FERC Order 2222", excerpt: "Requires RTOs/ISOs to allow DER aggregations to participate in wholesale markets. PJM implemented via DERA framework." },
            { label: "PJM Manual 18 — DER Aggregation (DERA)", url: "https://www.pjm.com/markets-and-operations/dera", section: "Manual 18: PJM Capacity Market", excerpt: "Distribution-connected resources <10 MW can aggregate into DERA to participate in RPM capacity market, bypassing transmission queue." },
            { label: "PJM RPM auction results", url: "https://www.pjm.com/markets-and-operations/rpm", section: "Base Residual Auction clearing prices", excerpt: "ComEd zone clearing prices used to estimate capacity revenue; ELCC accreditation determines effective capacity value." }
          ]
        },
        {
          name: "Regulation",
          category: "regulation",
          type: "annual",
          color: "#06B6D4",
          near_term_annual: 1000000,
          long_term_annual: 375000,
          trend: "declining",
          annual_growth_rate: -0.05,
          notes: "Post-Oct 2025 redesign; saturation risk from fleet growth; range $250–500K long-term",
          sources: [
            { label: "PJM Manual 12 — Balancing Operations", url: "https://www.pjm.com/-/media/DotCom/documents/manuals/m12.pdf", section: "Section 4.3–4.5: Regulation & Qualifying Resources", excerpt: "Covers regulation market obligations, regulation signals (RegA/RegD), dispatch, and qualification requirements for regulating resources." },
            { label: "PJM Manual 11 — Energy & Ancillary Services", url: "https://www.pjm.com/-/media/DotCom/documents/manuals/m11.pdf", section: "Section 3: Regulation Market", excerpt: "Business rules for regulation market participation including performance scoring and mileage-based compensation." }
          ]
        },
        {
          name: "Energy Arbitrage",
          category: "arbitrage",
          type: "annual",
          color: "#A855F7",
          near_term_annual: 220000,
          long_term_annual: 300000,
          trend: "growing",
          annual_growth_rate: 0.02,
          notes: "ComEd zone weak; 2x worse than BGE/DOM",
          sources: [
            { label: "PJM Data Miner — Day-ahead hourly LMPs", url: "https://dataminer2.pjm.com/feed/da_hrl_lmps", section: "DA_HRL_LMPS dataset", excerpt: "Hourly day-ahead LMP data by pricing node. Arbitrage revenue estimated from peak/off-peak spread in ComEd zone." },
            { label: "PJM Manual 11 — Energy Market Operations", url: "https://www.pjm.com/-/media/DotCom/documents/manuals/m11.pdf", section: "Section 2: Day-ahead & Real-time Markets", excerpt: "Storage resources submit charge/discharge offers into DA and RT markets; LMP = system energy + congestion + losses." }
          ]
        },
        {
          name: "VPP Scheduled Dispatch",
          category: "vpp",
          type: "annual",
          color: "#DC2626",
          near_term_annual: 50000,
          long_term_annual: 50000,
          trend: "stable",
          annual_growth_rate: 0,
          notes: "Voluntary; floor only; ICC rate TBD",
          sources: [
            { label: "220 ILCS 5/16-107.6 — VPP Scheduled Dispatch", url: "https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=022000050K16-107.6", section: "§16-107.6(c)", excerpt: "Utilities must propose scheduled dispatch program by June 1, 2026; compensation for customers providing electricity to grid at scheduled peak times." },
            { label: "ICC Docket P2021-0850 — ComEd VPP tariff", url: "https://icc.illinois.gov/docket/P2021-0850", section: "VPP tariff proceeding", excerpt: "ICC proceeding for ComEd VPP program design, dispatch rates, and customer eligibility. Decision expected June 30, 2026." }
          ]
        },
        {
          name: "VPP Long-Term Additive",
          category: "vpp",
          type: "annual",
          color: "#FCA5A5",
          near_term_annual: 0,
          long_term_annual: 0,
          trend: "tbd",
          annual_growth_rate: 0,
          notes: "Locational value; ICC 2028 proceeding",
          sources: [
            { label: "220 ILCS 5/16-107.6 — VPP Long-Term Program", url: "https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=022000050K16-107.6", section: "§16-107.6(e)", excerpt: "Utilities submit multi-faceted VPP proposals by end of 2027; locational value component to reflect grid congestion and deferral benefits." },
            { label: "ICC Docket P2021-0850", url: "https://icc.illinois.gov/docket/P2021-0850", section: "Future VPP rulemaking", excerpt: "Long-term VPP additive to be determined through ICC 2028 proceeding; rate structure and eligibility TBD." }
          ]
        }
      ]
    },
    costs: {
      capex_base: 2379, capex_total: 2498,
      opex_base: 23.69, opex_total: 25.20,
      development_timeline_months: 36,
      land_option_annual: 12000
    },
    state_factors: {
      storage_mandate: { exists: false, npv_multiplier: 1.0 },
      tax_incentives: { npv_multiplier: 1.0 },
      labor_requirements: { prevailing_wage: true, npv_multiplier: 0.93 },
      permitting: { npv_multiplier: 1.0 }
    },
    utility_factors: {
      interconnection_quality: { tier: 2, avg_timeline_months: 22, application_fee: 150000, npv_multiplier: 0.92 },
      regulatory_posture: { category: "neutral", npv_multiplier: 1.0 }
    },
    risks: {
      regulatory_uncertainty: { description: "IL ISO departure study pending; VPP tariff approval uncertain", npv_haircut: 0 },
      discount_rate: 0.07
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "ComEd VPP tariff (pending)",
      mammoth_sites: 4,
      key_dates: [
        { date: "2026-06-30", event: "ICC VPP tariff decision" },
        { date: "2026-08-26", event: "IPA CRGA Round 1 bids due" }
      ],
      notes: "High uncertainty market. VPP tariff approval is binary event."
    }
  },

  {
    utility_id: "EVERSOURCE_MA",
    utility_name: "Eversource Energy",
    utility_short_name: "Eversource",
    state: "Massachusetts",
    state_abbr: "MA",
    iso_rto: "ISO-NE",
    market_type: "merchant_incentive",
    inclusion_rationale: "ConnectedSolutions $275/kW + SMART + ISO-NE markets + 5GW mandate",
    revenue: {
      utility_procurement: null,
      iso_capacity_market: { value: 70, source: "ISO-NE FCM", erosion_rate: -0.02 },
      energy_arbitrage: { value: 65, source: "ISO-NE LMP spreads", erosion_rate: -0.05 },
      ancillary_services: { value: 25, source: "ISO-NE regulation", erosion_rate: -0.03 },
      state_incentives: { value: 0, programs: ["SMART storage adder", "Clean Peak Energy Standard"] },
      demand_response: { value: 275, programs: ["ConnectedSolutions"], notes: "Annual payment, major value driver" },
      total_contracted_period: 0,
      total_merchant_period: 235
    },
    costs: {
      capex_base: 2379, capex_total: 2579,
      opex_base: 23.69, opex_total: 26.50,
      development_timeline_months: 32,
      land_option_annual: 20000
    },
    state_factors: {
      storage_mandate: { exists: true, target_mw: 5000, target_year: 2030, npv_multiplier: 1.15 },
      tax_incentives: { property_tax_exemption: true, npv_multiplier: 1.12 },
      labor_requirements: { npv_multiplier: 1.0 },
      permitting: { streamlined: true, npv_multiplier: 1.05 }
    },
    utility_factors: {
      interconnection_quality: { tier: 2, avg_timeline_months: 24, application_fee: 200000, npv_multiplier: 0.92 },
      regulatory_posture: { category: "supportive", npv_multiplier: 1.05 }
    },
    risks: {
      regulatory_uncertainty: { npv_haircut: 0 },
      discount_rate: 0.08
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "No active RFP - merchant + incentive market",
      mammoth_sites: 3,
      key_dates: [
        { date: "2026-06-01", event: "ConnectedSolutions summer season begins" },
        { date: "2026-12-31", event: "SMART program block update" }
      ],
      notes: "ConnectedSolutions is the anchor revenue stream. Monitor for program changes."
    }
  },

  {
    utility_id: "NGRID_MA",
    utility_name: "National Grid",
    utility_short_name: "National Grid",
    state: "Massachusetts",
    state_abbr: "MA",
    iso_rto: "ISO-NE",
    market_type: "merchant_incentive",
    inclusion_rationale: "ConnectedSolutions + SMART + ISO-NE markets + 5GW mandate",
    revenue: {
      utility_procurement: null,
      iso_capacity_market: { value: 70, source: "ISO-NE FCM", erosion_rate: -0.02 },
      energy_arbitrage: { value: 60, source: "ISO-NE LMP spreads", erosion_rate: -0.05 },
      ancillary_services: { value: 25, source: "ISO-NE regulation", erosion_rate: -0.03 },
      state_incentives: { value: 0, programs: ["SMART storage adder", "Clean Peak Energy Standard"] },
      demand_response: { value: 275, programs: ["ConnectedSolutions"], notes: "Annual payment, major value driver" },
      total_contracted_period: 0,
      total_merchant_period: 230
    },
    costs: {
      capex_base: 2379, capex_total: 2579,
      opex_base: 23.69, opex_total: 26.50,
      development_timeline_months: 32,
      land_option_annual: 18000
    },
    state_factors: {
      storage_mandate: { exists: true, target_mw: 5000, target_year: 2030, npv_multiplier: 1.15 },
      tax_incentives: { property_tax_exemption: true, npv_multiplier: 1.12 },
      labor_requirements: { npv_multiplier: 1.0 },
      permitting: { streamlined: true, npv_multiplier: 1.05 }
    },
    utility_factors: {
      interconnection_quality: { tier: 2, avg_timeline_months: 22, application_fee: 180000, npv_multiplier: 0.92 },
      regulatory_posture: { category: "supportive", npv_multiplier: 1.05 }
    },
    risks: {
      regulatory_uncertainty: { npv_haircut: 0 },
      discount_rate: 0.08
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "No active RFP - merchant + incentive market",
      mammoth_sites: 2,
      key_dates: [
        { date: "2026-06-01", event: "ConnectedSolutions summer season begins" }
      ],
      notes: "Same revenue stack as Eversource. Central/Western MA territory."
    }
  },

  // ── Tier 2: Strong Merchant Markets ───────────────────────────────────
  {
    utility_id: "PSEG_NJ",
    utility_name: "Public Service Electric & Gas",
    utility_short_name: "PSE&G",
    state: "New Jersey",
    state_abbr: "NJ",
    iso_rto: "PJM",
    market_type: "merchant_incentive",
    inclusion_rationale: "NJ Clean Energy rebates ($300/kWh) + PJM DERA + 2GW mandate",
    revenue: {
      utility_procurement: null,
      iso_capacity_market: { value: 60, source: "PJM BRA", erosion_rate: -0.02 },
      energy_arbitrage: { value: 55, source: "PJM LMP spreads", erosion_rate: -0.05 },
      ancillary_services: { value: 30, source: "PJM regulation", erosion_rate: -0.03 },
      state_incentives: { value: 30, programs: ["NJ Clean Energy Program ongoing"], notes: "$300/kWh upfront rebate reduces net CapEx" },
      total_contracted_period: 0,
      total_merchant_period: 175
    },
    costs: {
      capex_base: 2379, capex_total: 2079,
      opex_base: 23.69, opex_total: 25.00,
      development_timeline_months: 30,
      land_option_annual: 20000
    },
    state_factors: {
      storage_mandate: { exists: true, target_mw: 2000, target_year: 2030, npv_multiplier: 1.12 },
      tax_incentives: { sales_tax_exemption: true, npv_multiplier: 1.06 },
      labor_requirements: { npv_multiplier: 1.0 },
      permitting: { npv_multiplier: 0.97 }
    },
    utility_factors: {
      interconnection_quality: { tier: 2, avg_timeline_months: 20, application_fee: 150000, npv_multiplier: 0.95 },
      regulatory_posture: { category: "neutral", npv_multiplier: 1.0 }
    },
    risks: {
      regulatory_uncertainty: { npv_haircut: 0 },
      discount_rate: 0.08
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "No active RFP - merchant + incentive market",
      mammoth_sites: 2,
      key_dates: [],
      notes: "NJ $300/kWh upfront rebate is a massive CapEx offset (~$6M for 20 MWh)."
    }
  },

  {
    utility_id: "JCPL_NJ",
    utility_name: "Jersey Central Power & Light",
    utility_short_name: "JCP&L",
    state: "New Jersey",
    state_abbr: "NJ",
    iso_rto: "PJM",
    market_type: "merchant_incentive",
    inclusion_rationale: "NJ Clean Energy rebates + PJM DERA + 2GW mandate",
    revenue: {
      utility_procurement: null,
      iso_capacity_market: { value: 58, source: "PJM BRA", erosion_rate: -0.02 },
      energy_arbitrage: { value: 50, source: "PJM LMP spreads", erosion_rate: -0.05 },
      ancillary_services: { value: 28, source: "PJM regulation", erosion_rate: -0.03 },
      state_incentives: { value: 25, programs: ["NJ Clean Energy Program ongoing"] },
      total_contracted_period: 0,
      total_merchant_period: 161
    },
    costs: {
      capex_base: 2379, capex_total: 2129,
      opex_base: 23.69, opex_total: 24.50,
      development_timeline_months: 30,
      land_option_annual: 18000
    },
    state_factors: {
      storage_mandate: { exists: true, target_mw: 2000, target_year: 2030, npv_multiplier: 1.12 },
      tax_incentives: { sales_tax_exemption: true, npv_multiplier: 1.06 },
      labor_requirements: { npv_multiplier: 1.0 },
      permitting: { npv_multiplier: 0.97 }
    },
    utility_factors: {
      interconnection_quality: { tier: 2, avg_timeline_months: 22, application_fee: 140000, npv_multiplier: 0.95 },
      regulatory_posture: { category: "neutral", npv_multiplier: 1.0 }
    },
    risks: {
      regulatory_uncertainty: { npv_haircut: 0 },
      discount_rate: 0.08
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "No active RFP",
      mammoth_sites: 1,
      key_dates: [],
      notes: "Central NJ territory. Same NJ incentive structure as PSE&G."
    }
  },

  {
    utility_id: "ACE_NJ",
    utility_name: "Atlantic City Electric",
    utility_short_name: "ACE",
    state: "New Jersey",
    state_abbr: "NJ",
    iso_rto: "PJM",
    market_type: "merchant_incentive",
    inclusion_rationale: "NJ Clean Energy rebates + PJM DERA + 2GW mandate",
    revenue: {
      utility_procurement: null,
      iso_capacity_market: { value: 55, source: "PJM BRA", erosion_rate: -0.02 },
      energy_arbitrage: { value: 45, source: "PJM LMP spreads", erosion_rate: -0.05 },
      ancillary_services: { value: 25, source: "PJM regulation", erosion_rate: -0.03 },
      state_incentives: { value: 25, programs: ["NJ Clean Energy Program ongoing"] },
      total_contracted_period: 0,
      total_merchant_period: 150
    },
    costs: {
      capex_base: 2379, capex_total: 2129,
      opex_base: 23.69, opex_total: 24.00,
      development_timeline_months: 30,
      land_option_annual: 15000
    },
    state_factors: {
      storage_mandate: { exists: true, target_mw: 2000, target_year: 2030, npv_multiplier: 1.12 },
      tax_incentives: { sales_tax_exemption: true, npv_multiplier: 1.06 },
      labor_requirements: { npv_multiplier: 1.0 },
      permitting: { npv_multiplier: 0.97 }
    },
    utility_factors: {
      interconnection_quality: { tier: 2, avg_timeline_months: 20, application_fee: 120000, npv_multiplier: 0.95 },
      regulatory_posture: { category: "neutral", npv_multiplier: 1.0 }
    },
    risks: {
      regulatory_uncertainty: { npv_haircut: 0 },
      discount_rate: 0.08
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "No active RFP",
      mammoth_sites: 1,
      key_dates: [],
      notes: "Southern NJ territory. Lower energy spreads than northern NJ."
    }
  },

  {
    utility_id: "CONED_NY",
    utility_name: "Consolidated Edison",
    utility_short_name: "ConEd",
    state: "New York",
    state_abbr: "NY",
    iso_rto: "NYISO",
    market_type: "merchant_incentive",
    inclusion_rationale: "VDER value stack + NYISO capacity (NYC zone premium) + 6GW mandate",
    revenue: {
      utility_procurement: null,
      iso_capacity_market: { value: 75, source: "NYISO ICAP (NYC zone)", erosion_rate: -0.02 },
      energy_arbitrage: { value: 70, source: "NYISO LBMP spreads", erosion_rate: -0.05 },
      ancillary_services: { value: 35, source: "NYISO regulation", erosion_rate: -0.03 },
      state_incentives: { value: 20, programs: ["NY storage incentives", "VDER value stack"] },
      total_contracted_period: 0,
      total_merchant_period: 200
    },
    costs: {
      capex_base: 2379, capex_total: 2779,
      opex_base: 23.69, opex_total: 28.00,
      development_timeline_months: 36,
      land_option_annual: 25000
    },
    state_factors: {
      storage_mandate: { exists: true, target_mw: 6000, target_year: 2030, npv_multiplier: 1.12 },
      tax_incentives: { npv_multiplier: 1.0 },
      labor_requirements: { npv_multiplier: 1.0 },
      permitting: { complexity: "high", npv_multiplier: 0.92 }
    },
    utility_factors: {
      interconnection_quality: { tier: 3, avg_timeline_months: 30, application_fee: 300000, npv_multiplier: 0.85 },
      regulatory_posture: { category: "neutral", npv_multiplier: 1.0 }
    },
    risks: {
      regulatory_uncertainty: { description: "SEQRA environmental review complexity", npv_haircut: 0.05 },
      discount_rate: 0.08
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "No active RFP - VDER + merchant market",
      mammoth_sites: 2,
      key_dates: [
        { date: "2026-09-01", event: "NYISO capacity auction (NYC zone)" }
      ],
      notes: "High revenue potential offset by high costs and complex permitting."
    }
  },

  // ── Tier 3: Watch List ────────────────────────────────────────────────
  {
    utility_id: "XCEL_CO",
    utility_name: "Xcel Energy",
    utility_short_name: "Xcel",
    state: "Colorado",
    state_abbr: "CO",
    iso_rto: "non-ISO",
    market_type: "contract_based",
    inclusion_rationale: "DDG RFP pending - watch for 2027 procurement",
    revenue: {
      utility_procurement: {
        value: 140,
        source: "Xcel DDG RFP (estimated, pending)",
        contract_term_years: 15,
        escalation_rate: 0.02,
        status: "Watch - 2027 RFP expected"
      },
      iso_capacity_market: { value: 0 },
      energy_arbitrage: { value: 0 },
      ancillary_services: { value: 0 },
      state_incentives: { value: 0, programs: [] },
      total_contracted_period: 140,
      total_merchant_period: 0
    },
    costs: {
      capex_base: 2379, capex_total: 2379,
      opex_base: 23.69, opex_total: 23.69,
      development_timeline_months: 36,
      land_option_annual: 10000
    },
    state_factors: {
      storage_mandate: { exists: false, npv_multiplier: 1.0 },
      tax_incentives: { npv_multiplier: 1.0 },
      labor_requirements: { npv_multiplier: 1.0 },
      permitting: { streamlined: true, npv_multiplier: 1.05 }
    },
    utility_factors: {
      interconnection_quality: { tier: 2, avg_timeline_months: 24, application_fee: 100000, npv_multiplier: 0.92 },
      regulatory_posture: { category: "neutral", npv_multiplier: 1.0 }
    },
    risks: {
      regulatory_uncertainty: { description: "DDG RFP details unknown - high uncertainty", npv_haircut: 0.20 },
      discount_rate: 0.08
    },
    pv_results: { pv_total: 0, pv_tier: 5 as const },
    development_status: {
      active_rfp: "Xcel DDG RFP (watch - 2027)",
      mammoth_sites: 0,
      key_dates: [
        { date: "2027-03-01", event: "DDG RFP expected (estimated)" }
      ],
      notes: "Watch list market. No active development. Monitor for 2027 RFP."
    }
  }
];

// Compute PV of revenue for each utility
export const utilities: UtilityData[] = rawUtilities.map(u => {
  const pv = calculatePVRevenue(u);
  return { ...u, pv_results: { pv_total: pv.pv_total, pv_tier: pv.pv_tier } };
});
