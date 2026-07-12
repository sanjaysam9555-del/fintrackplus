import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Category, Vendor, Partner, ProjectLabel, Project, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLLAPSED_LIMIT = 8;

export interface TransactionFilters {
  categoryIds: string[];
  vendorNames: string[];
  partnerIds: string[];
  labelIds: string[];
  paymentModes: PaymentMethod[];
  projectIds: string[];
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located helper constant used by multiple importers; splitting into a separate module would require updating imports across the app
export const emptyFilters: TransactionFilters = {
  categoryIds: [],
  vendorNames: [],
  partnerIds: [],
  labelIds: [],
  paymentModes: [],
  projectIds: [],
};

// eslint-disable-next-line react-refresh/only-export-components -- co-located helper function used by multiple importers; splitting into a separate module would require updating imports across the app
export const countActiveFilters = (filters: TransactionFilters) =>
  filters.categoryIds.length +
  filters.vendorNames.length +
  filters.partnerIds.length +
  filters.labelIds.length +
  filters.paymentModes.length +
  filters.projectIds.length;

const toggleValue = (arr: string[], value: string) =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

interface TransactionFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  resultCount: number;
  categories: Category[];
  vendors: Vendor[];
  partners: Partner[];
  projectLabels: ProjectLabel[];
  projects: Project[];
}

function FilterSection<T>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const hasMore = items.length > COLLAPSED_LIMIT;
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_LIMIT);

  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <p className="text-sm font-semibold mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {visibleItems.map(renderItem)}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 text-primary hover:bg-primary/10 transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp size={14} /></>
            ) : (
              <>+{items.length - COLLAPSED_LIMIT} more <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

const FilterChip = ({
  label,
  selected,
  onClick,
  dotColor,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  dotColor?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
      selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
    )}
  >
    {dotColor && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />}
    {label}
  </button>
);

export const TransactionFilterSheet = ({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  resultCount,
  categories,
  vendors,
  partners,
  projectLabels,
  projects,
}: TransactionFilterSheetProps) => {
  const activeCount = countActiveFilters(filters);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
          <SheetTitle>Filters</SheetTitle>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onFiltersChange(emptyFilters)}
              className="text-sm text-primary font-medium mr-6"
            >
              Clear all
            </button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FilterSection
            title="Category"
            items={categories}
            renderItem={(cat) => (
              <FilterChip
                key={cat.id}
                label={cat.name}
                selected={filters.categoryIds.includes(cat.id)}
                onClick={() => onFiltersChange({ ...filters, categoryIds: toggleValue(filters.categoryIds, cat.id) })}
                dotColor={cat.color}
              />
            )}
          />

          <FilterSection
            title="Vendor"
            items={vendors}
            renderItem={(v) => (
              <FilterChip
                key={v.id}
                label={v.name}
                selected={filters.vendorNames.includes(v.name)}
                onClick={() => onFiltersChange({ ...filters, vendorNames: toggleValue(filters.vendorNames, v.name) })}
              />
            )}
          />

          <FilterSection
            title="Partner"
            items={partners}
            renderItem={(p) => (
              <FilterChip
                key={p.id}
                label={p.name}
                selected={filters.partnerIds.includes(p.id)}
                onClick={() => onFiltersChange({ ...filters, partnerIds: toggleValue(filters.partnerIds, p.id) })}
                dotColor={p.color}
              />
            )}
          />

          <FilterSection
            title="Label"
            items={projectLabels}
            renderItem={(l) => (
              <FilterChip
                key={l.id}
                label={l.name}
                selected={filters.labelIds.includes(l.id)}
                onClick={() => onFiltersChange({ ...filters, labelIds: toggleValue(filters.labelIds, l.id) })}
                dotColor={l.color}
              />
            )}
          />

          <FilterSection
            title="Payment Mode"
            items={['cash', 'online'] as PaymentMethod[]}
            renderItem={(mode) => (
              <FilterChip
                key={mode}
                label={mode === 'cash' ? 'Cash' : 'Online'}
                selected={filters.paymentModes.includes(mode)}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    paymentModes: toggleValue(filters.paymentModes, mode) as PaymentMethod[],
                  })
                }
              />
            )}
          />

          <FilterSection
            title="Project"
            items={projects}
            renderItem={(proj) => (
              <FilterChip
                key={proj.id}
                label={proj.name}
                selected={filters.projectIds.includes(proj.id)}
                onClick={() => onFiltersChange({ ...filters, projectIds: toggleValue(filters.projectIds, proj.id) })}
                dotColor={proj.color}
              />
            )}
          />
        </div>

        <div className="p-4 border-t border-border safe-bottom">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Show {resultCount} result{resultCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
