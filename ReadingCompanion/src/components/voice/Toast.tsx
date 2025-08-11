import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { theme } from '../../theme';

export const MiniToast: React.FC<{ visible: boolean; text: string }>=({ visible, text })=>{
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    Animated.timing(opacity,{ toValue: visible?1:0, duration:200, useNativeDriver:true }).start();
  },[visible]);
  return (
    <Animated.View style={[styles.toast,{ opacity }]}> 
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast:{
    position:'absolute',
    top: 12,
    alignSelf:'center',
    backgroundColor:'rgba(0,0,0,0.5)',
    paddingHorizontal:12,
    paddingVertical:8,
    borderRadius:12,
  },
  text:{ color:'#fff' }
});
