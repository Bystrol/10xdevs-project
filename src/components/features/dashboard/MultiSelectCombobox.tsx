import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectComboboxProps<T extends { id: number; name: string }> {
  items: T[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function MultiSelectCombobox<T extends { id: number; name: string }>({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search items...",
  emptyText = "No items found.",
  className,
  disabled = false,
  id,
}: MultiSelectComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const handleSelect = (item: T) => {
    const newSelectedIds = selectedIds.includes(item.id)
      ? selectedIds.filter((id) => id !== item.id)
      : [...selectedIds, item.id];
    onSelectionChange(newSelectedIds);
  };

  const handleRemove = (itemId: number) => {
    const newSelectedIds = selectedIds.filter((id) => id !== itemId);
    onSelectionChange(newSelectedIds);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {selectedItems.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {selectedItems.length > 0 && selectedItems.length <= 3 && (
              <>
                {selectedItems.map((item) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                  >
                    {item.name}
                    <XIcon className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </>
            )}
            {selectedItems.length > 3 && <span className="text-sm">{selectedItems.length} selected</span>}
          </div>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <CommandItem key={item.id} onSelect={() => handleSelect(item)} className="cursor-pointer">
                    <CheckIcon className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    {item.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedItems.length > 0 && (
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" onClick={handleClearAll} className="w-full justify-center text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
