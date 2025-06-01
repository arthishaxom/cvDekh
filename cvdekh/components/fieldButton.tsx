import { ChevronRight } from "lucide-react-native";
import { Button, ButtonText } from "./ui/button";
import { PressableProps } from "react-native";

interface FieldButtonProps extends PressableProps {
  title: string;
}

export const FieldButton: React.FC<FieldButtonProps> = ({
  title,
  ...props
}) => {
  return (
    <Button
      variant="outline"
      className="bg-background-400 w-full h-16 flex-row justify-between border-0"
      {...props}
    >
      <ButtonText className="text-white">{title}</ButtonText>
      <ChevronRight color="white" size={20} />
    </Button>
  );
};
