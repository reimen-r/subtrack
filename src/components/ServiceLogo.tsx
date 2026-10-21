import React, { useState, useEffect } from 'react';
import {
  RiNetflixFill,
  RiSpotifyFill,
  RiOpenaiFill,
  RiYoutubeFill,
  RiAppleFill,
  RiAmazonFill,
  RiNotionFill,
  RiDiscordFill,
  RiSlackFill,
  RiDropboxFill,
  RiPlaystationFill,
  RiXboxFill,
  RiSteamFill,
  RiPatreonFill,
  RiMediumFill,
  RiSoundcloudFill,
} from 'react-icons/ri';
import {
  FaGithub,
  FaGoogle,
  FaFigma,
  FaStrava,
  FaLinkedin,
  FaTwitch,
  FaMicrosoft,
} from 'react-icons/fa6';
import {
  SiHbo,
  SiParamountplus,
  SiCrunchyroll,
  SiAudible,
  SiDuolingo,
  Si1Password,
  SiTidal,
  SiDeezer,
  SiSubstack,
  SiVimeo,
} from 'react-icons/si';
import {
  Tv,
  Music,
  Code2,
  Sparkles,
  Cloud,
  Layers,
  Dumbbell,
  Film,
  Package,
  PenTool,
  BookOpen,
  Gamepad2,
  GraduationCap,
  Zap,
  Briefcase,
  BadgeDollarSign,
  CreditCard,
  Server,
  Shield,
  Globe,
  Radio,
  Newspaper,
  Compass,
} from 'lucide-react';
import { getBrandLogoUrl } from '../utils/subscriptionUtils';

// Custom precision SVG Brand Vectors for platforms without direct standard exports
const DisneyPlusIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Disney+">
    <path d="M11.75 3C7.47 3 4 6.47 4 10.75c0 3.02 1.74 5.64 4.27 6.92-.12-.76-.17-1.57-.13-2.42.08-1.52.54-3.08 1.41-4.43 1.15-1.78 2.87-3.03 4.97-3.64-.81-2.41-1.95-4.18-2.77-4.18zm8.12 11.23c-1.39-1.25-3.26-1.98-5.26-1.98-1.36 0-2.66.35-3.79.98-.31-.56-.56-1.16-.73-1.79.93-.38 1.94-.59 3-.59 2.22 0 4.28.87 5.82 2.31.25.24.47.49.68.75-.24.11-.48.22-.72.32zm2.08 3.51h-2.15v2.15h-1.38v-2.15h-2.15v-1.38h2.15v-2.15h1.38v2.15h2.15v1.38z" />
  </svg>
);

const HuluIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Hulu">
    <path d="M2.5 17.5V6.5h3.2v4.1h3.6V6.5h3.2v11h-3.2v-4.1H5.7v4.1H2.5zm11.5 0V11h3.1v1.1c.6-.8 1.5-1.3 2.7-1.3 2.1 0 3.7 1.5 3.7 3.8v2.9h-3.1v-2.7c0-.9-.6-1.5-1.5-1.5-.9 0-1.8.6-1.8 1.7v2.5H14z" />
  </svg>
);

const AdobeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Adobe">
    <path d="M14.58 3H24v18l-9.42-18zM9.42 3H0v18l9.42-18zM12 9.17L16.27 21h-2.79l-1.42-4.15H9.6L12 9.17z" />
  </svg>
);

const NintendoSwitchIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Nintendo">
    <path d="M8.2 2H4C2.9 2 2 2.9 2 4v16c0 1.1.9 2 2 2h4.2c2.3 0 4.2-1.9 4.2-4.2V6.2C12.4 3.9 10.5 2 8.2 2zm-1.8 6.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm13.6-6.5h-4.2c-2.3 0-4.2 1.9-4.2 4.2v13.6c0 2.3 1.9 4.2 4.2 4.2h4.2c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1.8 13.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
  </svg>
);

const CanvaIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Canva">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <path d="M15.5 8.5C14.5 7.5 13 7 11.5 7 8.5 7 6.5 9.5 6.5 12.5s2 5.5 5 5.5c1.8 0 3.2-.8 4-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Fallback Lucide Icon Dictionary
const LUCIDE_ICON_MAP: Record<string, React.ElementType> = {
  Tv,
  Music,
  Code2,
  Sparkles,
  Cloud,
  Layers,
  Dumbbell,
  Film,
  Package,
  PenTool,
  BookOpen,
  Gamepad2,
  GraduationCap,
  Zap,
  Briefcase,
  BadgeDollarSign,
  CreditCard,
  Server,
  Shield,
  Globe,
  Radio,
  Newspaper,
  Compass,
};

// Comprehensive brand definitions catalog
interface BrandDefinition {
  bg: string;
  icon: React.ElementType;
  textIcon?: boolean;
}

const BRAND_CATALOG: Record<string, BrandDefinition> = {
  // Video & Streaming
  netflix: { bg: '#E50914', icon: RiNetflixFill },
  spotify: { bg: '#1DB954', icon: RiSpotifyFill },
  youtube: { bg: '#FF0000', icon: RiYoutubeFill },
  disney: { bg: '#113CCF', icon: DisneyPlusIcon },
  disneyplus: { bg: '#113CCF', icon: DisneyPlusIcon },
  hbo: { bg: '#002BE7', icon: SiHbo },
  max: { bg: '#002BE7', icon: SiHbo },
  hbomax: { bg: '#002BE7', icon: SiHbo },
  hulu: { bg: '#1CE783', icon: HuluIcon },
  prime: { bg: '#00A8E1', icon: RiAmazonFill },
  amazon: { bg: '#00A8E1', icon: RiAmazonFill },
  primevideo: { bg: '#00A8E1', icon: RiAmazonFill },
  paramount: { bg: '#0064FF', icon: SiParamountplus },
  paramountplus: { bg: '#0064FF', icon: SiParamountplus },
  crunchyroll: { bg: '#F47521', icon: SiCrunchyroll },
  twitch: { bg: '#9146FF', icon: FaTwitch },
  vimeo: { bg: '#1AB7EA', icon: SiVimeo },

  // AI & Developer Tools
  chatgpt: { bg: '#10A37F', icon: RiOpenaiFill },
  openai: { bg: '#10A37F', icon: RiOpenaiFill },
  sora: { bg: '#10A37F', icon: RiOpenaiFill },
  github: { bg: '#24292F', icon: FaGithub },
  copilot: { bg: '#24292F', icon: FaGithub },
  figma: { bg: '#F24E1E', icon: FaFigma },

  // Apple & Big Tech Ecosystem
  apple: { bg: '#000000', icon: RiAppleFill },
  icloud: { bg: '#0071E3', icon: RiAppleFill },
  appletv: { bg: '#000000', icon: RiAppleFill },
  applemusic: { bg: '#FC3C44', icon: RiAppleFill },
  appleone: { bg: '#000000', icon: RiAppleFill },
  google: { bg: '#4285F4', icon: FaGoogle },
  googleone: { bg: '#4285F4', icon: FaGoogle },
  googledrive: { bg: '#0F9D58', icon: FaGoogle },
  microsoft: { bg: '#00A4EF', icon: FaMicrosoft },
  office: { bg: '#D83B01', icon: FaMicrosoft },
  office365: { bg: '#D83B01', icon: FaMicrosoft },
  m365: { bg: '#0078D4', icon: FaMicrosoft },

  // Productivity & Storage
  notion: { bg: '#000000', icon: RiNotionFill },
  slack: { bg: '#4A154B', icon: RiSlackFill },
  discord: { bg: '#5865F2', icon: RiDiscordFill },
  dropbox: { bg: '#0061FF', icon: RiDropboxFill },
  adobe: { bg: '#FA0F00', icon: AdobeIcon },
  creativecloud: { bg: '#FA0F00', icon: AdobeIcon },
  photoshop: { bg: '#001E36', icon: AdobeIcon },
  canva: { bg: '#00C4CC', icon: CanvaIcon },
  onepassword: { bg: '#0A85EA', icon: Si1Password },
  '1password': { bg: '#0A85EA', icon: Si1Password },
  linkedin: { bg: '#0A66C2', icon: FaLinkedin },

  // Music & Audio
  tidal: { bg: '#000000', icon: SiTidal },
  deezer: { bg: '#A238FF', icon: SiDeezer },
  soundcloud: { bg: '#FF5500', icon: RiSoundcloudFill },
  audible: { bg: '#F8991C', icon: SiAudible },

  // Gaming
  playstation: { bg: '#003791', icon: RiPlaystationFill },
  psplus: { bg: '#003791', icon: RiPlaystationFill },
  xbox: { bg: '#107C10', icon: RiXboxFill },
  gamepass: { bg: '#107C10', icon: RiXboxFill },
  nintendo: { bg: '#E60012', icon: NintendoSwitchIcon },
  switch: { bg: '#E60012', icon: NintendoSwitchIcon },
  steam: { bg: '#171A21', icon: RiSteamFill },

  // Lifestyle, Learning & Creators
  duolingo: { bg: '#58CC02', icon: SiDuolingo },
  strava: { bg: '#FC5200', icon: FaStrava },
  patreon: { bg: '#FF424D', icon: RiPatreonFill },
  medium: { bg: '#000000', icon: RiMediumFill },
  substack: { bg: '#FF6719', icon: SiSubstack },
  equinox: { bg: '#18181B', icon: Dumbbell },
  gym: { bg: '#10B981', icon: Dumbbell },
  fitness: { bg: '#10B981', icon: Dumbbell },
};

/**
 * Normalizes input name and domain to extract the most accurate brand match
 */
function resolveBrand(name: string, domain?: string): BrandDefinition | null {
  const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normDomain = (domain || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Direct key search in catalog
  for (const [key, brand] of Object.entries(BRAND_CATALOG)) {
    if (normName.includes(key) || normDomain.includes(key)) {
      return brand;
    }
  }

  // 2. Common specific variations
  if (normName.includes('gpt') || normName.includes('chatgpt') || normName.includes('openai')) {
    return BRAND_CATALOG['chatgpt'];
  }
  if (normName.includes('netflix')) return BRAND_CATALOG['netflix'];
  if (normName.includes('spotify')) return BRAND_CATALOG['spotify'];
  if (normName.includes('disney')) return BRAND_CATALOG['disney'];
  if (normName.includes('prime') || normName.includes('amazon')) return BRAND_CATALOG['prime'];
  if (normName.includes('apple') || normName.includes('icloud')) return BRAND_CATALOG['apple'];
  if (normName.includes('youtube')) return BRAND_CATALOG['youtube'];
  if (normName.includes('github') || normName.includes('copilot')) return BRAND_CATALOG['github'];
  if (normName.includes('adobe') || normName.includes('creativecloud')) return BRAND_CATALOG['adobe'];
  if (normName.includes('gimnasio') || normName.includes('gym') || normName.includes('crossfit')) return BRAND_CATALOG['gym'];

  return null;
}

export interface ServiceLogoProps {
  name: string;
  domain?: string;
  logoUrl?: string;
  color?: string;
  iconName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ServiceLogo: React.FC<ServiceLogoProps> = ({
  name,
  domain,
  logoUrl,
  color = '#6366F1',
  iconName,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [domain, logoUrl]);

  // Try identifying dynamic brand
  const matchedBrand = resolveBrand(name, domain);
  const resolvedLogo = !matchedBrand && !imageError ? getBrandLogoUrl(domain, logoUrl) : (logoUrl && !imageError ? logoUrl : '');

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs rounded-xl',
    md: 'w-11 h-11 text-sm rounded-2xl',
    lg: 'w-14 h-14 text-base rounded-2xl',
    xl: 'w-16 h-16 text-xl rounded-3xl',
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 28,
    xl: 34,
  };

  // 2-character initials fallback
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || name.slice(0, 2).toUpperCase();

  const effectiveBgColor = matchedBrand?.bg || color || '#1e293b';

  // Fallback Lucide Icon Component
  const LucideComponent = iconName && LUCIDE_ICON_MAP[iconName]
    ? LUCIDE_ICON_MAP[iconName]
    : CreditCard;

  const BrandIconComponent = matchedBrand?.icon;

  return (
    <div
      id={`logo-${name.toLowerCase().replace(/\s+/g, '-')}`}
      className={`relative flex items-center justify-center font-bold text-white shadow-sm shrink-0 overflow-hidden select-none transition-transform duration-200 ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: effectiveBgColor,
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.25), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
      }}
      title={name}
      aria-label={`${name} brand icon`}
    >
      {/* Specular highlight shine overlay on top */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-x-1.5 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent rounded-full" 
      />

      {/* Render Priority 1: Dynamic Brand Vector Icon */}
      {matchedBrand && BrandIconComponent ? (
        <BrandIconComponent 
          size={iconSizes[size]} 
          className="text-white drop-shadow-sm transition-transform duration-150 active:scale-95" 
        />
      ) : resolvedLogo ? (
        /* Render Priority 2: Remote/Cached Logo Image */
        <img
          src={resolvedLogo}
          alt={`${name} logo`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover p-1 bg-black/20 rounded-[inherit] transition-opacity duration-150"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      ) : iconName && LUCIDE_ICON_MAP[iconName] ? (
        /* Render Priority 3: Lucide Category / Service Icon */
        <LucideComponent 
          size={iconSizes[size]} 
          className="text-white drop-shadow-sm" 
        />
      ) : (
        /* Render Priority 4: High-contrast Monogram initials */
        <span className="tracking-tight drop-shadow-sm font-black text-white/95">{initials}</span>
      )}
    </div>
  );
};
