import { Receipt } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GstToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const GstToggle = ({ value, onChange }: GstToggleProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Receipt size={16} className="text-amber-500" />
        </div>
        <div>
          <Label className="text-sm font-medium cursor-pointer" htmlFor="gst-toggle">
            GST Transaction?
          </Label>
          <p className="text-xs text-muted-foreground">Tag for tax reporting</p>
        </div>
      </div>
      <Switch
        id="gst-toggle"
        checked={value}
        onCheckedChange={onChange}
      />
    </div>
  );
};
