import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import { COLORS } from './Index';

const THEME = {
  Light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      // Primary Colors
      primary: COLORS.primary,
      primaryLight: COLORS.primaryLight,
      primaryDark: COLORS.primaryDark,
      
      // Secondary Colors
      secondary: COLORS.secondary,
      secondaryLight: COLORS.secondaryLight,
      secondaryDark: COLORS.secondaryDark,
      
      // Accent Colors
      accent: COLORS.accent,
      accentLight: COLORS.accentLight,
      accentDark: COLORS.accentDark,
      
      // Neutral Colors
      black: COLORS.black,
      white: COLORS.white,
      grey: COLORS.grey,
      GREY: COLORS.GREY,
      lavender: COLORS.lavender,
      
      // Status Colors
      red: COLORS.red,
      green: COLORS.green,
      yellow: COLORS.yellow,
      blue: COLORS.blue,
      darkblue: COLORS.darkblue,
      maroon: COLORS.maroon,
    },
  },
  Dark: { 
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      // Primary Colors
      primary: COLORS.primary,
      primaryLight: COLORS.primaryLight,
      primaryDark: COLORS.primaryDark,
      
      // Secondary Colors
      secondary: COLORS.secondary,
      secondaryLight: COLORS.secondaryLight,
      secondaryDark: COLORS.secondaryDark,
      
      // Accent Colors
      accent: COLORS.accent,
      accentLight: COLORS.accentLight,
      accentDark: COLORS.accentDark,
      
      // Neutral Colors
      black: COLORS.black,
      white: COLORS.white,
      grey: COLORS.grey,
      GREY: COLORS.GREY,
      lavender: COLORS.lavender,
      
      // Status Colors
      red: COLORS.red,
      green: COLORS.green,
      yellow: COLORS.yellow,
      blue: COLORS.blue,
      darkblue: COLORS.darkblue,
      maroon: COLORS.maroon,
    },
  },
};

export default THEME;
