import { Button } from "@/components/ui/button";
import type { FilterViewModel, LocationDto, WasteTypeDto } from "@/types";
import * as React from "react";
import { DateRangePicker } from "./DateRangePicker";
import { MultiSelectCombobox } from "./MultiSelectCombobox";

interface FiltersPanelProps {
  wasteTypes: WasteTypeDto[];
  locations: LocationDto[];
  onFilterChange: (filters: FilterViewModel) => void;
  onFilterReset: () => void;
  isLoading: boolean;
}

export function FiltersPanel({ wasteTypes, locations, onFilterChange, onFilterReset, isLoading }: FiltersPanelProps) {
  const [localFilters, setLocalFilters] = React.useState<FilterViewModel>({
    dateRange: {
      from: undefined,
      to: undefined,
    },
    wasteTypeIds: [],
    locationIds: [],
  });

  // Update local filters when props change (for reset functionality)
  React.useEffect(() => {
    setLocalFilters({
      dateRange: {
        from: undefined,
        to: undefined,
      },
      wasteTypeIds: [],
      locationIds: [],
    });
  }, []);

  const handleDateRangeChange = (dateRange: { from: Date | undefined; to: Date | undefined }) => {
    const newFilters = { ...localFilters, dateRange };
    setLocalFilters(newFilters);
  };

  const handleWasteTypeChange = (wasteTypeIds: number[]) => {
    const newFilters = { ...localFilters, wasteTypeIds };
    setLocalFilters(newFilters);
  };

  const handleLocationChange = (locationIds: number[]) => {
    const newFilters = { ...localFilters, locationIds };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterViewModel = {
      dateRange: {
        from: undefined,
        to: undefined,
      },
      wasteTypeIds: [],
      locationIds: [],
    };
    setLocalFilters(resetFilters);
    onFilterReset();
  };

  // Validation: endDate cannot be earlier than startDate
  const isValidDateRange =
    !localFilters.dateRange.from ||
    !localFilters.dateRange.to ||
    localFilters.dateRange.from <= localFilters.dateRange.to;

  const canApply = isValidDateRange;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card overflow-hidden">
      <h3 className="text-lg font-semibold">Filters</h3>

      <div className="grid gap-4">
        {/* Date Range Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="date-range">
            Date Range
          </label>
          <DateRangePicker
            dateRange={localFilters.dateRange}
            onDateRangeChange={handleDateRangeChange}
            disabled={isLoading}
          />
          {!isValidDateRange && <p className="text-sm text-destructive">End date cannot be earlier than start date</p>}
        </div>

        {/* Waste Types */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="waste-types">
            Waste Types
          </label>
          <MultiSelectCombobox
            id="waste-types"
            items={wasteTypes}
            selectedIds={localFilters.wasteTypeIds}
            onSelectionChange={handleWasteTypeChange}
            placeholder="Select waste types..."
            searchPlaceholder="Search waste types..."
            emptyText="No waste types found."
            disabled={isLoading}
          />
        </div>

        {/* Locations */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="locations">
            Locations
          </label>
          <MultiSelectCombobox
            id="locations"
            items={locations}
            selectedIds={localFilters.locationIds}
            onSelectionChange={handleLocationChange}
            placeholder="Select locations..."
            searchPlaceholder="Search locations..."
            emptyText="No locations found."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleApply} disabled={isLoading || !canApply} className="flex-1">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Reset
        </Button>
      </div>
    </div>
  );
}
