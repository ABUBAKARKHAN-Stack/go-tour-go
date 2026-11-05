import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * Vector illustrations for onboarding and auth, drawn in the redesign palette.
 * They scale to any width, need no network and weigh almost nothing.
 */

type Props = { size?: number; width?: number; height?: number };

const SAND = '#B5583A';
const SAND_DARK = '#9E4A2F';
const SAND_DEEP = '#7E3622';
const MARBLE = '#F4EEE6';
const MARBLE_EDGE = '#E0D5C4';
const TEAL = '#0F4C4A';
const TERRACOTTA = '#C8643B';
const LEAF = '#2F7D5B';
const LEAF_DARK = '#276B4E';

function Minaret({ cx, top, base = 246 }: { cx: number; top: number; base?: number }) {
  const h = base - top;
  return (
    <G>
      <Rect x={cx - 6} y={top} width={12} height={h} fill={SAND} />
      <Rect x={cx - 7} y={top + h * 0.3} width={14} height={3} fill={SAND_DARK} />
      <Rect x={cx - 7} y={top + h * 0.6} width={14} height={3} fill={SAND_DARK} />
      <Rect x={cx - 9} y={top - 6} width={18} height={6} fill={SAND_DARK} />
      <Path d={`M${cx - 7} ${top - 6} Q${cx - 7} ${top - 18} ${cx} ${top - 21} Q${cx + 7} ${top - 18} ${cx + 7} ${top - 6} Z`} fill={MARBLE} />
    </G>
  );
}

function Dome({ cx, base, w, h }: { cx: number; base: number; w: number; h: number }) {
  return (
    <G>
      <Path
        d={`M${cx - w / 2} ${base} Q${cx - w / 2} ${base - h * 0.8} ${cx} ${base - h} Q${cx + w / 2} ${base - h * 0.8} ${cx + w / 2} ${base} Z`}
        fill={MARBLE}
        stroke={MARBLE_EDGE}
        strokeWidth={1.5}
      />
      <Path d={`M${cx} ${base - h} L${cx} ${base - h - 9}`} stroke={TERRACOTTA} strokeWidth={2} />
    </G>
  );
}

/** Red-sandstone Mughal mosque under the mountains, with a map pin and a dashed route. */
export function LandmarkScene({ size = 360 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 360 360">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6E3D9" />
          <Stop offset="1" stopColor="#FBF8F3" />
        </LinearGradient>
      </Defs>
      <Rect width={360} height={360} fill="url(#sky)" />
      <Circle cx={268} cy={96} r={34} fill="#F2C48D" opacity={0.85} />
      <Path d="M0 214 L58 146 L98 178 L150 104 L204 170 L250 120 L300 166 L360 116 L360 236 L0 236 Z" fill="#C7D8D4" />
      <Path d="M150 104 L137 123 L146 119 L151 126 L159 118 L163 121 Z" fill="#FFFFFF" />
      <Path d="M250 120 L240 134 L247 131 L252 137 L258 131 L261 133 Z" fill="#FFFFFF" />
      <Path d="M58 146 L50 156 L56 154 L60 158 L64 154 L67 156 Z" fill="#FFFFFF" />
      <Path d="M0 244 Q90 208 180 234 T360 230 L360 276 L0 276 Z" fill="#A8C3BC" />
      <Rect y={254} width={360} height={106} fill="#EFE3D0" />
      <Path d="M168 360 C186 326 132 304 168 282 C188 270 196 266 192 256" stroke="#E3D2B8" strokeWidth={24} strokeLinecap="round" fill="none" />

      {/* Mosque */}
      <Rect x={66} y={244} width={228} height={12} fill={SAND_DARK} />
      <Rect x={108} y={200} width={144} height={46} fill={SAND} />
      {[116, 129, 142, 205, 218, 231].map((x) => (
        <Path key={x} d={`M${x} 238 L${x} 222 Q${x + 4.5} 214 ${x + 9} 222 L${x + 9} 238 Z`} fill={SAND_DEEP} opacity={0.85} />
      ))}
      <Rect x={158} y={192} width={44} height={54} fill="#C46A48" />
      <Path d="M167 246 L167 216 Q180 200 193 216 L193 246 Z" fill={SAND_DEEP} />
      <Dome cx={180} base={194} w={52} h={36} />
      <Dome cx={130} base={201} w={30} h={22} />
      <Dome cx={230} base={201} w={30} h={22} />
      <Minaret cx={80} top={148} />
      <Minaret cx={280} top={148} />
      <Minaret cx={106} top={176} base={244} />
      <Minaret cx={254} top={176} base={244} />

      {/* Trees */}
      <Circle cx={44} cy={258} r={11} fill={LEAF_DARK} />
      <Circle cx={58} cy={250} r={15} fill={LEAF} />
      <Circle cx={304} cy={251} r={14} fill={LEAF} />
      <Circle cx={320} cy={259} r={10} fill={LEAF_DARK} />

      {/* Route and pin */}
      <Path d="M54 118 C86 72 150 58 188 80" stroke={TERRACOTTA} strokeWidth={2.2} strokeDasharray="4 7" strokeLinecap="round" fill="none" />
      <Circle cx={54} cy={118} r={4} fill={TERRACOTTA} />
      <Path d="M200 112 C200 112 176 88 176 72 A24 24 0 1 1 224 72 C224 88 200 112 200 112 Z" fill={TERRACOTTA} />
      <Circle cx={200} cy={72} r={9} fill="#FFFFFF" />
    </Svg>
  );
}

/** A map with a landmark's alert radius, the traveller arriving and the notification. */
export function ArrivalScene({ size = 360 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 360 360">
      <Rect width={360} height={360} fill="#F5EFE6" />
      <Path d="M-10 250 C80 230 120 300 200 280 S330 220 370 240 L370 370 L-10 370 Z" fill="#CFE3E6" />
      <Path d="M30 40 C90 20 140 60 120 110 C100 150 40 140 24 100 C14 76 14 50 30 40 Z" fill="#DCEBE8" />
      <Path d="M0 170 L360 120" stroke="#FFFFFF" strokeWidth={16} />
      <Path d="M150 0 L210 360" stroke="#FFFFFF" strokeWidth={12} />
      <Path d="M0 60 L360 210" stroke="#FFFFFF" strokeWidth={8} />
      <Path d="M260 0 L300 360" stroke="#FFFFFF" strokeWidth={6} />
      <Circle cx={196} cy={176} r={92} fill={TERRACOTTA} opacity={0.12} />
      <Circle cx={196} cy={176} r={92} fill="none" stroke={TERRACOTTA} strokeWidth={2} strokeDasharray="7 6" />
      <Circle cx={196} cy={176} r={24} fill={TERRACOTTA} stroke="#FFFFFF" strokeWidth={4} />
      <Path d="M186 186 L186 178 L206 178 L206 186 Z M188 178 Q188 166 196 164 Q204 166 204 178 Z" fill="#FFFFFF" />
      <Path d="M96 300 C120 270 140 250 168 222" stroke={TEAL} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Circle cx={168} cy={222} r={18} fill={TEAL} opacity={0.18} />
      <Circle cx={168} cy={222} r={9} fill={TEAL} stroke="#FFFFFF" strokeWidth={3} />
      {/* Notification card */}
      <Rect x={34} y={30} width={292} height={70} rx={18} fill="#1C1A17" opacity={0.06} />
      <Rect x={30} y={24} width={292} height={70} rx={18} fill="#FFFFFF" />
      <Rect x={44} y={40} width={36} height={36} rx={10} fill={TEAL} />
      <Path d="M62 70 C62 70 52 60 52 53 A10 10 0 1 1 72 53 C72 60 62 70 62 70 Z" fill="#FFFFFF" />
      <Rect x={92} y={42} width={150} height={10} rx={5} fill="#1C1A17" opacity={0.85} />
      <Rect x={92} y={60} width={196} height={8} rx={4} fill="#8A8174" opacity={0.6} />
      <Rect x={92} y={74} width={120} height={8} rx={4} fill="#8A8174" opacity={0.4} />
    </Svg>
  );
}

/** A shield with live-location pulses linking the traveller to trusted people. */
export function SafetyScene({ size = 360 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 360 360">
      <Defs>
        <LinearGradient id="calm" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DCEBE8" />
          <Stop offset="1" stopColor="#FBF8F3" />
        </LinearGradient>
      </Defs>
      <Rect width={360} height={360} fill="url(#calm)" />
      <Circle cx={180} cy={176} r={140} fill="none" stroke={TEAL} strokeOpacity={0.1} strokeWidth={2} />
      <Circle cx={180} cy={176} r={106} fill="none" stroke={TEAL} strokeOpacity={0.16} strokeWidth={2} />
      <Circle cx={180} cy={176} r={72} fill={TEAL} opacity={0.08} />
      <Path d="M62 96 C100 120 130 140 150 160" stroke={TERRACOTTA} strokeWidth={2} strokeDasharray="4 6" fill="none" />
      <Path d="M300 110 C262 130 232 146 212 160" stroke={TERRACOTTA} strokeWidth={2} strokeDasharray="4 6" fill="none" />
      <Path d="M290 284 C260 256 236 232 214 206" stroke={TERRACOTTA} strokeWidth={2} strokeDasharray="4 6" fill="none" />
      <Path d="M180 104 C206 122 228 126 246 126 L246 172 C246 214 218 238 180 252 C142 238 114 214 114 172 L114 126 C132 126 154 122 180 104 Z" fill={TEAL} />
      <Path d="M152 178 L172 198 L210 158" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {[
        [56, 90],
        [304, 104],
        [296, 290],
      ].map(([x, y]) => (
        <G key={`${x}-${y}`}>
          <Circle cx={x} cy={y} r={22} fill="#FFFFFF" />
          <Circle cx={x} cy={y} r={17} fill="#F6E3D9" />
          <Circle cx={x} cy={y - 4} r={6} fill={TERRACOTTA} />
          <Path d={`M${x - 10} ${y + 11} Q${x} ${y} ${x + 10} ${y + 11} Z`} fill={TERRACOTTA} />
        </G>
      ))}
    </Svg>
  );
}

/** Wide evening scene for auth headers: same landmark, warmer sky. */
export function HeroScene({ width = 412, height = 300 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 30 360 262" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F2C9A8" />
          <Stop offset="0.6" stopColor="#F6E3D9" />
          <Stop offset="1" stopColor="#FBF8F3" />
        </LinearGradient>
      </Defs>
      <Rect y={0} width={360} height={360} fill="url(#dusk)" />
      <Circle cx={92} cy={118} r={40} fill="#F5D3A4" />
      <Path d="M0 214 L58 146 L98 178 L150 104 L204 170 L250 120 L300 166 L360 116 L360 236 L0 236 Z" fill="#D9C7BE" />
      <Path d="M0 244 Q90 208 180 234 T360 230 L360 276 L0 276 Z" fill="#C9B3A6" />
      <Rect y={254} width={360} height={106} fill="#EFE3D0" />
      <Rect x={66} y={244} width={228} height={12} fill={SAND_DARK} />
      <Rect x={108} y={200} width={144} height={46} fill={SAND} />
      {[116, 129, 142, 205, 218, 231].map((x) => (
        <Path key={x} d={`M${x} 238 L${x} 222 Q${x + 4.5} 214 ${x + 9} 222 L${x + 9} 238 Z`} fill={SAND_DEEP} opacity={0.85} />
      ))}
      <Rect x={158} y={192} width={44} height={54} fill="#C46A48" />
      <Path d="M167 246 L167 216 Q180 200 193 216 L193 246 Z" fill={SAND_DEEP} />
      <Dome cx={180} base={194} w={52} h={36} />
      <Dome cx={130} base={201} w={30} h={22} />
      <Dome cx={230} base={201} w={30} h={22} />
      <Minaret cx={80} top={148} />
      <Minaret cx={280} top={148} />
      <Minaret cx={106} top={176} base={244} />
      <Minaret cx={254} top={176} base={244} />
    </Svg>
  );
}
