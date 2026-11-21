import type { StoryId } from '../game/types';

export function TitleEmblemSvg() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="h-9 w-9 shrink-0"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18" fill="#451A03" stroke="#F59E0B" strokeWidth="2" />
      <path
        d="M10 25 Q15 21 20 24 Q25 21 30 25 L30 14 Q25 11 20 14 Q15 11 10 14 Z"
        fill="#FEF3C7"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      <line x1="20" y1="14" x2="20" y2="24" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="20" cy="9.5" r="2.2" fill="#FDE047" />
    </svg>
  );
}

export function TitleBackdropSvg() {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tb_sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#162038" />
          <stop offset="48%" stopColor="#6D2812" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <radialGradient id="tb_sun" cx="52%" cy="38%" r="44%">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#tb_sky)" />
      <rect width="1440" height="900" fill="url(#tb_sun)" />
      <path
        d="M0 640 Q260 520 560 595 T1120 560 T1440 610 L1440 900 L0 900 Z"
        fill="#451A03"
        opacity="0.58"
      />
      <path
        d="M0 715 Q380 615 740 680 T1440 660 L1440 900 L0 900 Z"
        fill="#24130B"
        opacity="0.9"
      />
      <path d="M1210 740 L1210 470 L1250 470 L1250 740 Z" fill="#1C1008" opacity="0.86" />
      <circle cx="1230" cy="435" r="105" fill="#1B3B28" opacity="0.86" />
      <circle cx="1150" cy="465" r="72" fill="#14532D" opacity="0.8" />
      <circle cx="1310" cy="460" r="76" fill="#14532D" opacity="0.8" />
    </svg>
  );
}

export function StoryArtwork({ story }: { story: StoryId }) {
  switch (story) {
    case 'zaqueo':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="art_z" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
          </defs>
          <rect width="240" height="120" fill="url(#art_z)" />
          <circle cx="194" cy="28" r="22" fill="#FEF08A" opacity="0.85" />
          <path d="M0 84 Q70 64 150 80 T240 76 L240 120 L0 120 Z" fill="#E7C68E" />
          <rect x="0" y="96" width="240" height="24" fill="#B47B44" />
          {/* Sycamore tree */}
          <rect x="142" y="42" width="18" height="54" rx="5" fill="#6B3E26" stroke="#2A180E" strokeWidth="1.5" />
          <circle cx="151" cy="34" r="34" fill="#15803D" />
          <circle cx="125" cy="44" r="22" fill="#166534" />
          <circle cx="174" cy="42" r="20" fill="#22C55E" />
          {/* Jesus below with golden halo */}
          <ellipse cx="78" cy="64" rx="10" ry="3" fill="none" stroke="#FACC15" strokeWidth="2" />
          <circle cx="78" cy="72" r="7" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.2" />
          <rect x="70" y="79" width="16" height="22" rx="5" fill="#FFFDF7" stroke="#2A180E" strokeWidth="1.2" />
          <rect x="72" y="84" width="12" height="4" fill="#B91C1C" />
          {/* Zaqueo on the branch */}
          <circle cx="151" cy="23" r="6" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.2" />
          <rect x="144" y="29" width="14" height="15" rx="4" fill="#B91C1C" stroke="#2A180E" strokeWidth="1.2" />
        </svg>
      );
    case 'flujo':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="art_f" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
          </defs>
          <rect width="240" height="120" fill="url(#art_f)" />
          <circle cx="176" cy="62" r="44" fill="#FEF08A" opacity="0.7" />
          <rect x="0" y="96" width="240" height="24" fill="#B47B44" />
          {/* Crowd silhouettes */}
          <rect x="28" y="66" width="16" height="32" rx="5" fill="#78716C" opacity="0.55" />
          <rect x="50" y="68" width="16" height="30" rx="5" fill="#64748B" opacity="0.55" />
          {/* Jesus with radiant cloak hem */}
          <ellipse cx="176" cy="31" rx="11" ry="3.5" fill="none" stroke="#FACC15" strokeWidth="2" />
          <circle cx="176" cy="42" r="9" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="163" y="51" width="26" height="47" rx="7" fill="#FFFDF7" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="166" y="62" width="20" height="6" fill="#B91C1C" />
          {/* Woman of faith reaching toward golden spark */}
          <circle cx="104" cy="52" r="8" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="93" y="61" width="22" height="37" rx="6" fill="#9D174D" stroke="#2A180E" strokeWidth="1.3" />
          <circle cx="146" cy="82" r="7" fill="#FDE047" />
          <circle cx="146" cy="82" r="13" fill="#FBBF24" opacity="0.35" />
        </svg>
      );
    case 'bartimeo':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <rect width="240" height="120" fill="#172038" />
          <circle cx="174" cy="58" r="54" fill="#FDE047" opacity="0.32" />
          <circle cx="174" cy="58" r="32" fill="#FEF08A" opacity="0.38" />
          <rect x="0" y="96" width="240" height="24" fill="#78350F" />
          {/* Jericho stone gate arch */}
          <rect x="16" y="34" width="48" height="62" rx="6" fill="#92400E" stroke="#2A180E" strokeWidth="1.5" />
          <rect x="28" y="56" width="24" height="40" rx="12" fill="#451A03" />
          {/* Bartimeo calling out with golden sound rings */}
          <circle cx="96" cy="50" r="8" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="85" y="59" width="22" height="39" rx="6" fill="#B45309" stroke="#2A180E" strokeWidth="1.3" />
          <path d="M116 48 Q124 54 116 62" fill="none" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M124 42 Q136 54 124 68" fill="none" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          {/* Jesus calling */}
          <circle cx="174" cy="42" r="8.5" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="162" y="51" width="24" height="47" rx="6" fill="#FFFDF7" stroke="#2A180E" strokeWidth="1.3" />
        </svg>
      );
    case 'panes':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="art_p" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60C5F1" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>
          </defs>
          <rect width="240" height="120" fill="url(#art_p)" />
          <circle cx="196" cy="26" r="18" fill="#FEF08A" />
          <path d="M0 78 Q120 44 240 82 L240 120 L0 120 Z" fill="#22C55E" />
          {/* Woven basket with 5 loaves & 2 fish */}
          <ellipse cx="120" cy="88" rx="40" ry="15" fill="#92400E" stroke="#2A180E" strokeWidth="1.5" />
          <circle cx="102" cy="76" r="9" fill="#F59E0B" stroke="#78350F" strokeWidth="1.2" />
          <circle cx="120" cy="71" r="9.5" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />
          <circle cx="138" cy="76" r="9" fill="#F59E0B" stroke="#78350F" strokeWidth="1.2" />
          <ellipse cx="111" cy="86" rx="12" ry="5" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
          <ellipse cx="130" cy="87" rx="12" ry="5" fill="#0284C7" stroke="#075985" strokeWidth="1.2" />
        </svg>
      );
    case 'tormenta':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="art_t" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B132B" />
              <stop offset="100%" stopColor="#1E3A5F" />
            </linearGradient>
          </defs>
          <rect width="240" height="120" fill="url(#art_t)" />
          <circle cx="164" cy="48" r="28" fill="#FEF08A" opacity="0.28" />
          <path d="M0 84 Q40 68 80 84 T160 84 T240 84 L240 120 L0 120 Z" fill="#0284C7" />
          <path d="M56 66 L184 66 L166 90 L74 90 Z" fill="#78350F" stroke="#2A180E" strokeWidth="1.5" />
          <rect x="116" y="20" width="6" height="48" fill="#92400E" />
          <path d="M122 22 Q158 42 122 58 Z" fill="#FFFBEB" stroke="#CBD5E1" strokeWidth="1.2" />
          {/* Jesus standing calm in golden glow */}
          <circle cx="158" cy="48" r="6" fill="#F6C69F" />
          <rect x="152" y="54" width="12" height="14" rx="4" fill="#FFFDF7" />
        </svg>
      );
    case 'daniel':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <rect width="240" height="120" fill="#172038" />
          <polygon points="84,0 156,0 198,120 42,120" fill="#FDE047" opacity="0.24" />
          <rect x="0" y="96" width="240" height="24" fill="#334155" />
          {/* Daniel praying */}
          <circle cx="120" cy="46" r="8.5" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="109" y="55" width="22" height="43" rx="6" fill="#1E40AF" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="111" y="66" width="18" height="5" fill="#FDE047" />
          {/* Two peaceful lions */}
          <rect x="44" y="74" width="32" height="24" rx="9" fill="#D97706" stroke="#2A180E" strokeWidth="1.3" />
          <circle cx="74" cy="77" r="11" fill="#78350F" />
          <circle cx="74" cy="77" r="7.5" fill="#F59E0B" />
          <rect x="164" y="74" width="32" height="24" rx="9" fill="#D97706" stroke="#2A180E" strokeWidth="1.3" />
          <circle cx="166" cy="77" r="11" fill="#78350F" />
          <circle cx="166" cy="77" r="7.5" fill="#F59E0B" />
        </svg>
      );
    case 'david':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="art_d" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
          </defs>
          <rect width="240" height="120" fill="url(#art_d)" />
          <path d="M0 84 Q120 62 240 84 L240 120 L0 120 Z" fill="#A3B18A" />
          <rect x="0" y="96" width="240" height="24" fill="#B47B44" />
          <rect x="20" y="102" width="110" height="10" rx="5" fill="#38BDF8" />
          {/* Goliath with shield & red crest */}
          <ellipse cx="172" cy="12" rx="14" ry="5" fill="#DC2626" />
          <rect x="148" y="34" width="42" height="64" rx="10" fill="#475569" stroke="#2A180E" strokeWidth="1.5" />
          <circle cx="169" cy="24" r="11" fill="#F59E0B" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="136" y="44" width="14" height="46" rx="4" fill="#94A3B8" stroke="#D97706" strokeWidth="2" />
          {/* David with sling & flying stone */}
          <circle cx="64" cy="53" r="8" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="54" y="62" width="20" height="36" rx="5" fill="#047857" stroke="#2A180E" strokeWidth="1.3" />
          <circle cx="110" cy="40" r="4.5" fill="#E2E8F0" stroke="#2A180E" strokeWidth="1" />
        </svg>
      );
    case 'horno':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="art_h" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B0A0A" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>
          </defs>
          <rect width="240" height="120" fill="url(#art_h)" />
          <circle cx="120" cy="64" r="48" fill="#F59E0B" opacity="0.34" />
          <rect x="0" y="96" width="240" height="24" fill="#78350F" />
          {/* Three friends + radiant Fourth Figure */}
          <rect x="66" y="60" width="18" height="36" rx="5" fill="#0369A1" stroke="#2A180E" strokeWidth="1.2" />
          <circle cx="75" cy="52" r="6.5" fill="#F6C69F" />
          <ellipse cx="120" cy="31" rx="11" ry="3" fill="none" stroke="#FDE047" strokeWidth="2" />
          <rect x="109" y="52" width="22" height="44" rx="6" fill="#FEF9C3" stroke="#D97706" strokeWidth="1.4" />
          <circle cx="120" cy="42" r="8" fill="#FDE047" />
          <rect x="156" y="60" width="18" height="36" rx="5" fill="#0284C7" stroke="#2A180E" strokeWidth="1.2" />
          <circle cx="165" cy="52" r="6.5" fill="#F6C69F" />
        </svg>
      );
    case 'moises':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="art_m" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
          </defs>
          <rect width="240" height="120" fill="url(#art_m)" />
          <rect x="0" y="96" width="240" height="24" fill="#D9A76A" />
          {/* Parted sea walls with foam */}
          <rect x="14" y="20" width="66" height="76" rx="20" fill="#0E7490" opacity="0.88" />
          <rect x="20" y="22" width="54" height="9" rx="4" fill="#E0F2FE" opacity="0.85" />
          <rect x="160" y="20" width="66" height="76" rx="20" fill="#0E7490" opacity="0.88" />
          <rect x="166" y="22" width="54" height="9" rx="4" fill="#E0F2FE" opacity="0.85" />
          {/* Moses with raised glowing staff */}
          <circle cx="118" cy="46" r="8.5" fill="#F6C69F" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="108" y="55" width="20" height="43" rx="6" fill="#7C2D12" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="134" y="26" width="4" height="72" fill="#78350F" />
          <circle cx="136" cy="24" r="5" fill="#FDE047" />
        </svg>
      );
    case 'noe':
      return (
        <svg viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
          <rect width="240" height="120" fill="#DBEAFE" />
          <path d="M40 88 A80 80 0 0 1 200 88" fill="none" stroke="#EF4444" strokeWidth="5" opacity="0.65" />
          <path d="M50 88 A70 70 0 0 1 190 88" fill="none" stroke="#F59E0B" strokeWidth="5" opacity="0.65" />
          <path d="M60 88 A60 60 0 0 1 180 88" fill="none" stroke="#22C55E" strokeWidth="5" opacity="0.65" />
          <path d="M70 88 A50 50 0 0 1 170 88" fill="none" stroke="#3B82F6" strokeWidth="5" opacity="0.65" />
          <rect x="0" y="96" width="240" height="24" fill="#65A30D" />
          {/* Wooden Ark */}
          <rect x="106" y="46" width="114" height="50" rx="12" fill="#78350F" stroke="#2A180E" strokeWidth="1.5" />
          <rect x="122" y="34" width="82" height="16" rx="5" fill="#92400E" stroke="#2A180E" strokeWidth="1.3" />
          <rect x="155" y="38" width="16" height="9" rx="2" fill="#FEF3C7" />
          {/* Cute animal pair */}
          <circle cx="56" cy="86" r="9" fill="#FFFBEB" stroke="#2A180E" strokeWidth="1.2" />
          <circle cx="80" cy="86" r="9" fill="#D97706" stroke="#2A180E" strokeWidth="1.2" />
        </svg>
      );
  }
}
