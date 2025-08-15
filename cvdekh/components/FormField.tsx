// components/FormField.tsx
import type React from "react";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  error?: string;
  required?: boolean;
  type?: "text" | "textarea" | "date";
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  error,
  required = false,
  type = "text",
  className = "mb-2",
}) => {
  const Component = multiline ? Textarea : Input;
  const FieldComponent = multiline ? TextareaInput : InputField;

  return (
    <FormControl className={className}>
      <FormControlLabel>
        <FormControlLabelText className="text-typography-500 font-semibold">
          {label} {required && <Text className="text-red-500">*</Text>}
        </FormControlLabelText>
      </FormControlLabel>
      <Component className={multiline ? "" : "h-12"} size="lg">
        <FieldComponent
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          style={multiline ? { textAlignVertical: "top" } : undefined}
        />
      </Component>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </FormControl>
  );
};
