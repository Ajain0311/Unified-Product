import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../theme/themeStore';
import { useLanguageStore } from '../../store/languageStore';

export const GrowWithSuperAppScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const { language } = useLanguageStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Core 4 MVP Business Partner categories - Simple, clear and easy to understand
  const partnerOptions = [
    {
      id: 'driver',
      title: language === 'hi' ? 'राइडर / ड्राइवर बनें' : 'Become a Rider / Driver',
      subtitle: language === 'hi' ? 'बाइक, ऑटो या कैब चलाएं और रोज़ाना कमाएं' : 'Drive bike taxi, auto, or cab & earn daily',
      icon: 'bicycle',
      iconColor: '#2563EB',
      bgColor: '#EFF6FF',
      action: () => navigation.navigate('RoleApplication', { role: 'DRIVER' }),
    },
    {
      id: 'restaurant',
      title: language === 'hi' ? 'रेस्टोरेंट / कैफे जोड़ें' : 'Add Your Restaurant / Cafe',
      subtitle: language === 'hi' ? 'ऑनलाइन खाने के ऑर्डर प्राप्त करें और बिक्री बढ़ाएं' : 'Receive online food orders & grow sales',
      icon: 'restaurant',
      iconColor: '#EA580C',
      bgColor: '#FFF7ED',
      action: () => navigation.navigate('RoleApplication', { role: 'RESTAURANT_OWNER' }),
    },
    {
      id: 'hotel',
      title: language === 'hi' ? 'होटल / स्टे रजिस्टर करें' : 'List Hotel / Home Stay',
      subtitle: language === 'hi' ? 'कमरे लिस्ट करें और डायरेक्ट कस्टमर बुकिंग पाएं' : 'List rooms & get verified guest bookings',
      icon: 'business',
      iconColor: '#7C3AED',
      bgColor: '#F5F3FF',
      action: () => navigation.navigate('RoleApplication', { role: 'HOTEL_OWNER' }),
    },
    {
      id: 'seller',
      title: language === 'hi' ? 'दुकानदार / सेलर बनें' : 'Sell on City Bazaar',
      subtitle: language === 'hi' ? 'इलेक्ट्रॉनिक्स, सामान या अपनी दुकान का सामान बेचें' : 'Sell retail goods, mobiles, vehicles & more',
      icon: 'storefront',
      iconColor: '#059669',
      bgColor: '#ECFDF5',
      action: () => navigation.navigate('AddListing'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'पार्टनर बनें' : 'Grow with Zupify'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>
            {language === 'hi' ? 'बिज़नेस जोड़ें और कमाई शुरू करें' : 'Start earning with your vehicle or business'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Simple MVP Callout */}
        <View style={[styles.calloutCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.calloutTitle, { color: theme.textPrimary }]}>
            {language === 'hi' ? 'आप क्या शुरू करना चाहते हैं?' : 'How would you like to partner?'}
          </Text>
          <Text style={[styles.calloutSub, { color: theme.textSecondary }]}>
            {language === 'hi'
              ? 'नीचे से अपनी श्रेणी चुनें और 2 मिनट में अपनी प्रोफाइल जमा करें।'
              : 'Choose a category below to submit your details in 2 minutes.'}
          </Text>
        </View>

        {/* 4 Clean Partner Options */}
        <View style={styles.cardsContainer}>
          {partnerOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
              onPress={item.action}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon as any} size={26} color={item.iconColor} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Simple Bottom Help / Request link */}
        <TouchableOpacity
          style={[styles.customHelpBox, { borderColor: theme.cardBorder }]}
          onPress={() => navigation.navigate('SubmitBusinessRequest', { defaultType: 'NEW_PRODUCT' })}
          activeOpacity={0.7}
        >
          <Ionicons name="bulb-outline" size={18} color={theme.accent} />
          <Text style={[styles.customHelpText, { color: theme.textSecondary }]}>
            {language === 'hi'
              ? 'कोई अन्य बिज़नेस या नया सामान लिस्ट कराना है? यहाँ टैप करें'
              : 'Looking to list a different business or product? Tap here'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  calloutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  calloutTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  calloutSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  customHelpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  customHelpText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
