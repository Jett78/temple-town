import { cn } from "@/lib/utils";

interface PanelBackdropProps {
  open: boolean;
  onClose: () => void;
}

/** Blurred, dimmed backdrop shown behind the navbar panels. */
export function PanelBackdrop({ open, onClose }: PanelBackdropProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] bg-black/30 backdrop-blur-md transition-opacity duration-400",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={onClose}
    />
  );
}
