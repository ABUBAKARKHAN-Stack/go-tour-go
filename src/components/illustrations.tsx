import { Image } from 'expo-image';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * Vector illustrations for onboarding and auth, drawn in the redesign palette.
 * They scale to any width, need no network and weigh almost nothing.
 */

type Props = { size?: number; width?: number; height?: number };

const OCEAN = '#19709B';
const SKY = '#2E9FD9';

/** A map with a landmark's alert radius, the traveller arriving and the notification. */
export function ArrivalScene({ size = 360 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 360 360">
      <Rect width={360} height={360} fill="#EEF5FA" />
      <Path d="M-10 250 C80 230 120 300 200 280 S330 220 370 240 L370 370 L-10 370 Z" fill="#CFE8F5" />
      <Path d="M30 40 C90 20 140 60 120 110 C100 150 40 140 24 100 C14 76 14 50 30 40 Z" fill="#E8F2F9" />
      <Path d="M0 170 L360 120" stroke="#FFFFFF" strokeWidth={16} />
      <Path d="M150 0 L210 360" stroke="#FFFFFF" strokeWidth={12} />
      <Path d="M0 60 L360 210" stroke="#FFFFFF" strokeWidth={8} />
      <Path d="M260 0 L300 360" stroke="#FFFFFF" strokeWidth={6} />
      <Circle cx={196} cy={176} r={92} fill={SKY} opacity={0.12} />
      <Circle cx={196} cy={176} r={92} fill="none" stroke={SKY} strokeWidth={2} strokeDasharray="7 6" />
      <Circle cx={196} cy={176} r={24} fill={SKY} stroke="#FFFFFF" strokeWidth={4} />
      <Path d="M186 186 L186 178 L206 178 L206 186 Z M188 178 Q188 166 196 164 Q204 166 204 178 Z" fill="#FFFFFF" />
      <Path d="M96 300 C120 270 140 250 168 222" stroke={OCEAN} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Circle cx={168} cy={222} r={18} fill={OCEAN} opacity={0.18} />
      <Circle cx={168} cy={222} r={9} fill={OCEAN} stroke="#FFFFFF" strokeWidth={3} />
      {/* Notification card */}
      <Rect x={34} y={30} width={292} height={70} rx={18} fill="#15384F" opacity={0.06} />
      <Rect x={30} y={24} width={292} height={70} rx={18} fill="#FFFFFF" />
      <Rect x={44} y={40} width={36} height={36} rx={10} fill={OCEAN} />
      <Path d="M62 70 C62 70 52 60 52 53 A10 10 0 1 1 72 53 C72 60 62 70 62 70 Z" fill="#FFFFFF" />
      <Rect x={92} y={42} width={150} height={10} rx={5} fill="#15384F" opacity={0.85} />
      <Rect x={92} y={60} width={196} height={8} rx={4} fill="#6B8394" opacity={0.6} />
      <Rect x={92} y={74} width={120} height={8} rx={4} fill="#6B8394" opacity={0.4} />
    </Svg>
  );
}

/** A shield with live-location pulses linking the traveller to trusted people. */
export function SafetyScene({ size = 360 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 360 360">
      <Defs>
        <LinearGradient id="calm" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E8F2F9" />
          <Stop offset="1" stopColor="#F6FAFC" />
        </LinearGradient>
      </Defs>
      <Rect width={360} height={360} fill="url(#calm)" />
      <Circle cx={180} cy={176} r={140} fill="none" stroke={OCEAN} strokeOpacity={0.1} strokeWidth={2} />
      <Circle cx={180} cy={176} r={106} fill="none" stroke={OCEAN} strokeOpacity={0.16} strokeWidth={2} />
      <Circle cx={180} cy={176} r={72} fill={OCEAN} opacity={0.08} />
      <Path d="M62 96 C100 120 130 140 150 160" stroke={SKY} strokeWidth={2} strokeDasharray="4 6" fill="none" />
      <Path d="M300 110 C262 130 232 146 212 160" stroke={SKY} strokeWidth={2} strokeDasharray="4 6" fill="none" />
      <Path d="M290 284 C260 256 236 232 214 206" stroke={SKY} strokeWidth={2} strokeDasharray="4 6" fill="none" />
      <Path d="M180 104 C206 122 228 126 246 126 L246 172 C246 214 218 238 180 252 C142 238 114 214 114 172 L114 126 C132 126 154 122 180 104 Z" fill={OCEAN} />
      <Path d="M152 178 L172 198 L210 158" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {[
        [56, 90],
        [304, 104],
        [296, 290],
      ].map(([x, y]) => (
        <G key={`${x}-${y}`}>
          <Circle cx={x} cy={y} r={22} fill="#FFFFFF" />
          <Circle cx={x} cy={y} r={17} fill="#E1F0FA" />
          <Circle cx={x} cy={y - 4} r={6} fill={SKY} />
          <Path d={`M${x - 10} ${y + 11} Q${x} ${y} ${x + 10} ${y + 11} Z`} fill={SKY} />
        </G>
      ))}
    </Svg>
  );
}

/** Figma onboarding art: a traveller walking towards the Badshahi Mosque. Square source, cropped to the frame. */
export function TravellerScene({ size = 360 }: Props) {
  return (
    <Image
      source={require('../../assets/illustrations/onboarding-traveller.webp')}
      style={{ width: size, height: size * 0.94 }}
      contentFit="cover"
      contentPosition="bottom"
      accessible={false}
    />
  );
}
