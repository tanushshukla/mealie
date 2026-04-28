import { useTags } from "../../hooks/useOrganizers";

interface FilterBarProps {
  activeTag: string;
  onTagChange: (tag: string) => void;
  maxTime: number;
  onTimeChange: (t: number) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}

export function FilterBar({ activeTag, onTagChange, maxTime, onTimeChange, view, onViewChange }: FilterBarProps) {
  const { data: tags } = useTags();
  const allTabs = ["All", ...(tags?.map((t) => t.name) ?? [])];

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border mb-3.5 flex-wrap">
      <div className="flex gap-1 overflow-x-auto flex-shrink-0 max-w-full">
        {allTabs.slice(0, 12).map((tab) => (
          <button
            key={tab}
            onClick={() => onTagChange(tab)}
            className={`px-3.5 py-2 rounded-[999px] text-[13px] font-medium whitespace-nowrap transition-colors ${
              activeTag === tab
                ? "bg-text text-bg"
                : "text-text-muted hover:text-text hover:bg-bg-elev"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        <div className="flex items-center gap-2 bg-bg-elev border border-border rounded-[999px] px-3.5 py-2 text-[13px]">
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
            {maxTime}
            <small className="font-normal text-text-muted ml-0.5 text-[10px]">min</small>
          </span>
        </div>
        <div className="flex bg-bg-elev border border-border rounded-[999px] p-1">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 rounded-[999px] text-[13px] transition-colors ${
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
