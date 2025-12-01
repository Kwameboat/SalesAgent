export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface Seller {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  shop_name: string;
  city: string;
  preferred_tone: string;
  last_posted_at: string | null;
  created_at: string;
  logo_url: string | null;
}

export interface Product {
  id: string;
  seller_id: string;
  product_name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface PlatformContent {
  facebook: {
    posts: string[];
    hashtags: string[];
    bestTime: string;
  };
  instagram: {
    captions: string[];
    reels: string[];
    stories: string[];
    hashtags: string[];
    bestTime: string;
  };
  whatsapp: {
    statusUpdates: string[];
    broadcastMessages: string[];
    quickReplies: string[];
    bestTime: string;
  };
  tiktok: {
    videoScripts: string[];
    hooks: string[];
    hashtags: string[];
    trends: string;
    bestTime: string;
  };
  youtube: {
    videoIdeas: string[];
    descriptions: string[];
    thumbnailTips: string;
    hashtags: string[];
    bestTime: string;
  };
}

export interface GeneratedContent {
  id: string;
  product_id: string;
  seller_id: string;
  date_generated: string;
  captions: string;
  whatsapp_lines: string;
  dm_replies: string;
  strategy: string;
  posting_hour: string;
  facebook_content: PlatformContent['facebook'];
  instagram_content: PlatformContent['instagram'];
  whatsapp_content: PlatformContent['whatsapp'];
  tiktok_content: PlatformContent['tiktok'];
  youtube_content: PlatformContent['youtube'];
  flyer_image_url: string | null;
}
