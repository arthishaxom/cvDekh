import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export enum ANIMATION_DIRECTION {
  leftToRight = "leftToRight",
  rightToLeft = "rightToLeft",
  topToBottom = "topToBottom",
  bottomToTop = "bottomToTop",
}

export enum ANIMATION_TYPE {
  shiver = "shiver",
  pulse = "pulse",
}

interface SkeletonLoaderProps {
  height?: number;
  width?: number | string;
  className?: string;
  style?: object; // You might want to refine this type further, e.g., ViewStyle from 'react-native'
  backgroundColor?: string;
  direction?: ANIMATION_DIRECTION;
  animationType?: ANIMATION_TYPE;
}

export const SkeletonLoader = ({
  height,
  width,
  style = {},
  className = "rounded-lg",
  backgroundColor = "#DDEAF5",
  direction = ANIMATION_DIRECTION.leftToRight,
  animationType = ANIMATION_TYPE.shiver,
}: SkeletonLoaderProps) => {
  //to create pulse animation by increasing and decreasing opacity of parent
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (animationType !== ANIMATION_TYPE.pulse) {
      return;
    }

    //create pulse effect by repeating opacity animation
    opacity.value = withRepeat(
      withTiming(0.4, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      true,
    );

    return () => {
      //cancel running animations after component unmounts
      cancelAnimation(opacity);
    };
  }, [animationType, opacity]);

  const animatedStyleParent = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      className={"rounded-lg " + className}
      style={[{ height, width }, style, animatedStyleParent]}
    ></Animated.View>
  );
};
