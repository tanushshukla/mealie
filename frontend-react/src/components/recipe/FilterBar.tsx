import { useTags } from "../../hooks/useOrganizers";

interface FilterBarProps {
  activeTag: string;
  onTagChange: (slug: string) => void;
  maxTime: number;
  onTimeChange: (t: number) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}

export function FilterBar({ activeTag, onTagChange, maxTime, onTimeChange, view, onViewChange }: FilterBarProps) {
  const { data: tags } = useTags();

  const allTabs = [
    { label: "All", value: "All" },
    ...(tags?.map((t) => ({ label: t.name, value: t.slug })) ?? []),
  ];

  return (
    <div className="border-b border-border mb-3.5">
      <div className="flex gap-1 overflow-x-auto py-2 scroll-smooth" style={{ scrollbarWidth: "none" }}>
        {allTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTagChange(tab.value)}
            className={`px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors shrink-0 ${
              activeTag === tab.value
                ? "bg-text text-bg"
                : "text-text-muted hover:text-text hover:bg-bg-elev"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 pb-3">
        <div className="flex items-center gap-2 bg-bg-elev border border-border rounded-full px-3.5 py-2 text-[13px]">
          <span className="text-text-muted">⏱ ≤</span>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={maxTime}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            className="w-24 accent-brand"
          />
          <span className="font-semibold text-text tabular-nums">
            {maxTime}<small className="font-normal text-text-muted ml-0.5 text-[10px]">min</small>
          </span>
        </div>
        <div className="flex bg-bg-elev border border-border rounded-full p-1">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 rounded-full text-[13px] transition-colors ${
                view === v ? "bg-text text-bg" : "text-text-muted"
              }`}
            >
              {v === "grid" ? "⊞" : "☰"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
