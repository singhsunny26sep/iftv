import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {moderateScale, scale} from '../../utils/Scalling';

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  textColor,
}) {
  const isPrimary = variant === 'primary';
  const isWhite = variant === 'white';

  const ButtonContent = () => (
    <>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        style={[
          styles.text,
          textColor
            ? {color: textColor}
            : isPrimary
            ? styles.textDark
            : styles.textLight,
        ]}>
        {title}
      </Text>
    </>
  );

  return isPrimary ? (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient
        colors={['#24CEF0', '#24EBCA']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={[styles.base, styles.primary]}>
        <ButtonContent />
      </LinearGradient>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.base, isWhite ? styles.white : styles.neutral]}>
      <ButtonContent />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: scale(50),
    borderRadius: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    shadowColor: '#24CEF0',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primary: {},
  neutral: {
    backgroundColor: '#2C2F3A',
  },
  text: {
    fontWeight: 'bold',
    fontSize: scale(16),
  },
  textDark: {
    color: '#001012',
  },
  textLight: {
    color: '#FFFFFF',
  },
  icon: {
    marginRight: 8,
  },
  white: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
