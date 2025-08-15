import type React from "react";
import { HStack } from "@/components/ui/hstack";
import { FormField } from "./FormField";

interface DateRangeFieldsProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startLabel?: string;
  endLabel?: string;
  allowPresent?: boolean;
}

export const DateRangeFields: React.FC<DateRangeFieldsProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "Start Date",
  endLabel = "End Date",
  allowPresent = true,
}) => {
  return (
    <HStack className="justify-between mb-2">
      <FormField
        label={startLabel}
        value={startDate}
        onChangeText={onStartDateChange}
        placeholder="MM/YYYY"
        className="flex-1 mr-2"
      />
      <FormField
        label={endLabel}
        value={endDate}
        onChangeText={onEndDateChange}
        placeholder={allowPresent ? "MM/YYYY or Present" : "MM/YYYY"}
        className="flex-1 ml-2"
      />
    </HStack>
  );
};
