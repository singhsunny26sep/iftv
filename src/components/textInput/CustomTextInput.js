import React, { useState } from 'react';
import { StyleSheet, TextInput, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scale,moderateScale,verticalScale } from '../../utils/Scalling';
import { COLORS } from '../../theme/Colors';

const CustomTextInput = ({
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  value,
  onChangeText,
  error,
  maxLength,
  leftIcon,
  placeholderStyle,  
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            <Icon name={leftIcon} size={20} color="#000" />
          </View>
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={COLORS.grey}
          style={[styles.input, error ? styles.inputError : null, placeholderStyle]}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconContainer}>
            <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color="#000" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(16),
  },
  label: {
    fontSize: moderateScale(16),
    marginBottom: scale(8),
    color: COLORS.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(15),
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: scale(50),
  },
  placeholderColor:{
    color:COLORS.black
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: scale(16),
  },
  inputError: {
    borderColor:COLORS.red,
  },
  iconContainer: {
    paddingHorizontal: scale(5),
  },
  errorText: {
    color: 'red',
    fontSize: moderateScale(12),
    marginTop: scale(4),
  },
});

export default CustomTextInput;
