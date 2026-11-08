/** Row types mirroring supabase/migrations. Kept by hand for the MVP. */

export type DestinationCategory =
  | 'historical'
  | 'religious'
  | 'attraction'
  | 'viewpoint'
  | 'cultural'
  | 'museum'
  | 'food'
  | 'shopping'
  | 'park'
  | 'nature';

/**
 * Compact destination record kept on the phone for every landmark (curated and
 * imported). Enough for the map, proximity alerts, lists and search.
 */
export type DestinationSummary = {
  id: string;
  slug: string;
  name: string;
  name_ur: string | null;
  category: DestinationCategory;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  short_description: string;
  image_url: string | null;
  is_landmark: boolean;
  popularity: number;
  featured: boolean;
  source: 'curated' | 'osm';
};

/** Full destination row, fetched online for the details screen. */
export type Destination = DestinationSummary & {
  description: string;
  history: string | null;
  culture: string | null;
  significance: string | null;
  local_customs: string | null;
  food: string | null;
  shopping: string | null;
  tips: string | null;
  opening_hours: string | null;
  entry_fee: string | null;
  best_time: string | null;
  wikipedia_url: string | null;
  image_credit: string | null;
  image_license: string | null;
  image_page_url: string | null;
  /** Set when parts of the text shown are AI translations. */
  machine_translated?: boolean;
};

/** A searchable place (city, town, neighbourhood, university...). */
export type Place = {
  id: string;
  name: string;
  name_ur: string | null;
  kind: string;
  district: string | null;
  province: string | null;
  latitude: number;
  longitude: number;
  rank: number;
};

export type DestinationTranslation = {
  destination_id: string;
  locale: string;
  name: string;
  short_description: string | null;
  description: string | null;
  history: string | null;
  culture?: string | null;
  significance: string | null;
  local_customs?: string | null;
  food?: string | null;
  shopping?: string | null;
  tips: string | null;
  /** Some sections were translated by AI (shown to the reader). */
  machine_translated?: boolean;
};

export type ServiceCategory =
  | 'restaurant'
  | 'hotel'
  | 'hospital'
  | 'police'
  | 'fuel'
  | 'atm'
  | 'pharmacy'
  | 'shopping'
  | 'attraction';

export type NearbyService = {
  id: string;
  name: string;
  category: ServiceCategory;
  city: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  rating: number | null;
  source: 'osm' | 'seed';
};

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type HazardType = 'flood' | 'accident' | 'road_works' | 'landslide' | 'fog' | 'snow' | 'closure' | 'blockade' | 'other';

/**
 * A road alert: official/curated (road_alerts) or reported by a traveller
 * (hazard_reports, source "traveller"). Both feed the map, journeys and alerts.
 */
export type RoadAlert = {
  id: string;
  title: string;
  description: string;
  alert_type: 'closure' | 'rain' | 'flood' | 'fog' | 'smog' | 'snow' | 'landslide' | 'traffic' | 'other' | 'accident' | 'road_works' | 'blockade';
  severity: AlertSeverity;
  region: string;
  city: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
  starts_at: string;
  ends_at: string | null;
  source: string;
  /** Traveller reports only. */
  reporter_id?: string;
  confirmations?: number;
  dismissals?: number;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_city: string | null;
  visibility: 'public' | 'friends';
  allow_friend_requests: boolean;
  created_at: string;
};

export type ProfileSummary = Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>;

export type TripStatus = 'todo' | 'in_progress' | 'visited';

export type TripItem = {
  id: string;
  user_id: string;
  destination_id: string;
  status: TripStatus;
  notes: string | null;
  planned_date: string | null;
  visited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  user_id: string;
  destination_id: string;
  rating: number;
  body: string;
  image_url: string | null;
  created_at: string;
  author: ProfileSummary | null;
};

export type RatingSummary = { destination_id: string; average_rating: number; review_count: number };

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  requester: ProfileSummary | null;
  addressee: ProfileSummary | null;
};

export type CommunityPost = {
  id: string;
  author_id: string;
  body: string;
  /** For a video post: the poster frame. */
  image_url: string | null;
  video_url: string | null;
  video_duration_ms: number | null;
  destination_id: string | null;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  author: ProfileSummary | null;
  destination: Pick<Destination, 'id' | 'name' | 'city'> | null;
  likes: { count: number }[];
  comments: { count: number }[];
  shares: { count: number }[];
  my_like: { user_id: string }[];
  my_save: { user_id: string }[];
  /** The newest comment (at most one), shown under the post in the feed. */
  top_comment: Pick<PostComment, 'id' | 'author_id' | 'body' | 'created_at' | 'author'>[];
};

export type PostComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: ProfileSummary | null;
};

export type Story = {
  id: string;
  author_id: string;
  image_url: string;
  caption: string | null;
  place_name: string | null;
  destination_id: string | null;
  created_at: string;
  expires_at: string;
  author: ProfileSummary | null;
};

export type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  a: ProfileSummary | null;
  b: ProfileSummary | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type AppNotification = {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'message' | 'sos' | string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type LocationShare = {
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  is_active: boolean;
  /** 'selected' = only the friends in location_share_viewers. */
  audience: 'friends' | 'selected';
  started_at: string | null;
  expires_at: string | null;
  updated_at: string;
};

export type TrustedContact = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string | null;
  created_at: string;
};
