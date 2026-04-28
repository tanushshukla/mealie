import { Sidebar } from "./Sidebar";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  groupSlug: string;
}

export function MobileDrawer({ open, onClose, groupSlug }: MobileDrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-72 bg-sidebar-bg h-full shadow-lg z-50">
        <Sidebar groupSlug={groupSlug} onClose={onClose} mobile />
      </div>
    </div>
  );
}
