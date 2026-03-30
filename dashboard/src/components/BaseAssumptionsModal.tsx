interface Props {
  onClose: () => void;
}

export default function BaseAssumptionsModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
          <h2 className="text-lg font-bold text-gray-900">Base Project Assumptions</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            These assumptions apply to all utility territories unless overridden
          </p>
        </div>

        <div className="px-6 py-4 space-y-5 text-sm">
          {/* Project sizing */}
          <Section title="Project Sizing">
            <Row label="Nameplate capacity" value="5 MW (AC)" />
            <Row label="Energy storage" value="20 MWh (4-hour duration)" />
            <Row label="Technology" value="Lithium-ion + PCS" />
            <Row label="Footprint" value="0.25–1.0 acres" />
          </Section>

          {/* CapEx */}
          <Section title="Capital Costs (Base Case)">
            <Row label="Total CapEx" value="$2,379/kW ($11.9M for 5 MW)" bold />
            <div className="mt-2 ml-3 space-y-1 text-xs text-gray-500">
              <Row label="Development (pre-NTP)" value="$449/kW ($2.6M)" />
              <Row label="Batteries" value="~$152/kWh x 23.56 MWh" />
              <Row label="Power conversion systems" value="~$143/kW ($846K)" />
              <Row label="Balance of plant" value="~$560/kW ($3.3M)" />
              <Row label="Other (taxes, insurance)" value="$820K" />
              <Row label="Contingency (3.5%)" value="$387K" />
              <Row label="Initial working capital" value="$133K" />
            </div>
          </Section>

          {/* OpEx */}
          <Section title="Operating Costs (Year 1 Base)">
            <Row label="Total OpEx" value="$23.69/kW-year" bold />
            <div className="mt-2 ml-3 space-y-1 text-xs text-gray-500">
              <Row label="O&M general" value="$3.57/kW-yr" />
              <Row label="Insurance" value="$6.69/kW-yr (2.0%/yr esc.)" />
              <Row label="Property tax" value="$6.63/kW-yr (0–3%/yr esc.)" />
              <Row label="Asset management" value="$2.55/kW-yr" />
              <Row label="Service agreements" value="$0.86/kW-yr" />
              <Row label="Land lease" value="$3.40/kW-yr" />
            </div>
            <div className="mt-2">
              <Row label="General escalation" value="2.5%/year" />
            </div>
          </Section>

          {/* Development timeline */}
          <Section title="Development Timeline">
            <Row label="Total time (land to COD)" value="30–42 months" bold />
            <div className="mt-2 ml-3 space-y-1 text-xs text-gray-500">
              <Row label="Land option to IA" value="12–18 months" />
              <Row label="IA to NTP" value="6–12 months" />
              <Row label="Construction (NTP to COD)" value="12 months" />
            </div>
          </Section>

          {/* Financial */}
          <Section title="Financial Assumptions">
            <Row label="Discount rate (contract)" value="7%" />
            <Row label="Discount rate (merchant)" value="8%" />
            <Row label="ITC" value="30% (FEOC-compliant)" />
            <Row label="Useful life" value="20 years" />
            <Row label="Battery augmentation" value="Year 10 (~$1.5M)" />
          </Section>

          {/* Land */}
          <Section title="Land Costs (Base Range)">
            <Row label="Option (rural/exurban)" value="$10–15K/year" />
            <Row label="Option (suburban/urban)" value="$15–25K/year" />
            <Row label="Lease (rural/exurban)" value="$50–75K/year" />
            <Row label="Lease (suburban/urban)" value="$75–125K/year" />
            <Row label="Escalation" value="2.5%/year" />
          </Section>

          {/* Confidence bands */}
          <Section title="Confidence Bands">
            <Row label="CapEx" value="±15%" />
            <Row label="Merchant revenue" value="±25%" />
          </Section>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
          Source: PSE 2026 BAFO model + BGE ISC RFP analysis. Last updated: Mar 29, 2026.
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={bold ? 'font-bold text-gray-900' : 'text-gray-900'}>{value}</span>
    </div>
  );
}
