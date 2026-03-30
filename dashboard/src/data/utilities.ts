import type { UtilityData } from '../types';

export const utilities: UtilityData[] = [
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
    npv_results: {
      npv_per_kw: 1850, npv_total_5mw: 9250000, irr: 0.14, payback_years: 8.5,
      npv_tier: 1,
      sensitivity: { npv_capex_plus_10pct: 1650, npv_revenue_minus_20pct: 1200, npv_discount_8pct: 1620 }
    },
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
    npv_results: {
      npv_per_kw: 1920, npv_total_5mw: 9600000, irr: 0.145, payback_years: 8.0,
      npv_tier: 1,
      sensitivity: { npv_capex_plus_10pct: 1670, npv_revenue_minus_20pct: 1280, npv_discount_8pct: 1700 }
    },
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
    market_type: "contract_based",
    inclusion_rationale: "VPP tariff pending + PJM DERA + CRGA potential",
    revenue: {
      utility_procurement: {
        value: 165,
        source: "ComEd VPP tariff (estimated, pending ICC approval)",
        contract_term_years: 15,
        escalation_rate: 0.02,
        status: "ICC decision expected June 30, 2026"
      },
      iso_capacity_market: { value: 50, source: "PJM BRA", erosion_rate: -0.02 },
      energy_arbitrage: { value: 35, source: "PJM LMP spreads", erosion_rate: -0.05 },
      ancillary_services: { value: 25, source: "PJM regulation", erosion_rate: -0.03 },
      state_incentives: { value: 0, programs: ["CRGA (pending IPA Round 1)"] },
      total_contracted_period: 165,
      total_merchant_period: 110
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
      regulatory_uncertainty: { description: "IL ISO departure study pending; VPP tariff approval uncertain", npv_haircut: 0.15 },
      discount_rate: 0.07
    },
    npv_results: {
      npv_per_kw: 980, npv_total_5mw: 4900000, irr: 0.105, payback_years: 11.5,
      npv_tier: 3,
      sensitivity: { npv_capex_plus_10pct: 730, npv_revenue_minus_20pct: 480, npv_discount_8pct: 820 }
    },
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
    npv_results: {
      npv_per_kw: 1750, npv_total_5mw: 8750000, irr: 0.135, payback_years: 9.0,
      npv_tier: 1,
      sensitivity: { npv_capex_plus_10pct: 1490, npv_revenue_minus_20pct: 1100, npv_discount_8pct: 1750 }
    },
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
    npv_results: {
      npv_per_kw: 1700, npv_total_5mw: 8500000, irr: 0.13, payback_years: 9.2,
      npv_tier: 1,
      sensitivity: { npv_capex_plus_10pct: 1440, npv_revenue_minus_20pct: 1050, npv_discount_8pct: 1700 }
    },
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
    npv_results: {
      npv_per_kw: 1250, npv_total_5mw: 6250000, irr: 0.115, payback_years: 10.0,
      npv_tier: 2,
      sensitivity: { npv_capex_plus_10pct: 1040, npv_revenue_minus_20pct: 750, npv_discount_8pct: 1250 }
    },
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
    npv_results: {
      npv_per_kw: 1150, npv_total_5mw: 5750000, irr: 0.11, payback_years: 10.5,
      npv_tier: 2,
      sensitivity: { npv_capex_plus_10pct: 940, npv_revenue_minus_20pct: 650, npv_discount_8pct: 1150 }
    },
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
    npv_results: {
      npv_per_kw: 1080, npv_total_5mw: 5400000, irr: 0.105, payback_years: 11.0,
      npv_tier: 2,
      sensitivity: { npv_capex_plus_10pct: 870, npv_revenue_minus_20pct: 580, npv_discount_8pct: 1080 }
    },
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
    npv_results: {
      npv_per_kw: 1100, npv_total_5mw: 5500000, irr: 0.11, payback_years: 10.5,
      npv_tier: 2,
      sensitivity: { npv_capex_plus_10pct: 820, npv_revenue_minus_20pct: 580, npv_discount_8pct: 1100 }
    },
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
    npv_results: {
      npv_per_kw: 650, npv_total_5mw: 3250000, irr: 0.085, payback_years: 13.0,
      npv_tier: 3,
      sensitivity: { npv_capex_plus_10pct: 410, npv_revenue_minus_20pct: 250, npv_discount_8pct: 650 }
    },
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
