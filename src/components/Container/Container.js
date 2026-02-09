import { Fragment, useCallback } from 'react';
import { Platform, SafeAreaView, StatusBar, StatusBarStyle, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/core';

export function Container(props) {
  const {
    children,
    backgroundColor = '#ffffff',
    fullScreen,
    statusBarBackgroundColor = 'black',
    statusBarStyle = "dark-content",
  } = props;
  
  const statusBarBackgroundColorIos = statusBarBackgroundColor;
  const screenBackgroundColor = backgroundColor;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(fullScreen ?? false);
        StatusBar.setBackgroundColor(statusBarBackgroundColor ?? 'black');
      }
      StatusBar.setBarStyle(statusBarStyle);
    }, [fullScreen, statusBarBackgroundColor, statusBarStyle]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: screenBackgroundColor }}>
      {fullScreen ? (
        <Fragment>{children}</Fragment>
      ) : (
        <Fragment>
          <SafeAreaView style={{ flex: 0, backgroundColor: statusBarBackgroundColorIos }} />
          <SafeAreaView style={{ flex: 1, backgroundColor: screenBackgroundColor }}>
            {children}
          </SafeAreaView>
        </Fragment>
      )}
    </View>
  );
}

