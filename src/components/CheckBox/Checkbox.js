import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale, moderateScale } from '../../utils/Scalling';
import { COLORS } from '../../theme/Colors';

export default function Checkbox({ checked, onChange, label, disabled }) {
  const handlePress = () => {
    if (disabled) return;
    onChange && onChange(!checked);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.8}>
      <View style={[styles.box, checked && styles.boxChecked, disabled && styles.boxDisabled]}>
        {checked ? <Icon name="checkmark" size={16} color={COLORS.white} /> : null}
      </View>
      {label ? <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: scale(18),
    height: scale(18),
    borderRadius: moderateScale(4),
    borderWidth: 1,
    borderColor: '#AAB6C5',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: '#24D8E1',
    borderColor: '#24D8E1',
  },
  boxDisabled: {
    opacity: 0.6,
  },
  label: {
    marginLeft: scale(8),
    color: COLORS.white,
    fontSize: moderateScale(13),
  },
  labelDisabled: {
    opacity: 0.7,
  },
});


