import type { AnalyzeSuccess } from "@/types/analysis";
import type { MusicAnalyzeSuccess } from "@/types/music-analysis";

export const DEMO_VIDEO_ANALYSIS: AnalyzeSuccess = {
  ok: true,
  keyframe_count: 14,
  video_duration_seconds: 24,
  palette: [
    { role: "Vibrant", hex: "#E85D3B", populationPercent: 28 },
    { role: "DarkVibrant", hex: "#1A2E4A", populationPercent: 22 },
    { role: "Muted", hex: "#8B7355", populationPercent: 18 },
    { role: "LightMuted", hex: "#D4C4B0", populationPercent: 16 },
    { role: "DarkMuted", hex: "#2C1810", populationPercent: 16 },
  ],
  music: {
    title: "After Hours",
    artist: "The Weeknd",
    album: "After Hours",
    genres: ["synth-pop", "r&b"],
    bpm: 108,
    spotify_id: null,
    confidence: 82,
  },
  claude: {
    vibe_summary:
      "Tight cuts, warm grade, hypnotic motion — this clip slaps because every frame earns its place.",
    aesthetic_tags: ["cinematic", "moody", "hyperedit", "warm-grade"],
    target_audience: "Editors who worship pacing and color",
    scores: {
      color_harmony: 87,
      edit_pacing: 92,
      motion_feel: 88,
      subject_framing: 84,
      overall_vibe: 91,
    },
    cinematography: {
      framing_composition: "Center-weighted with intentional negative space.",
      lens_and_motion: "Shallow depth, handheld micro-drift.",
      depth_focus_light: "Warm key, crushed shadows, lifted mids.",
    },
    color_grade: {
      palette_mood: "Burnt orange meets midnight blue.",
      contrast_curve: "Soft rolloff, punchy mids.",
      skin_environment: "Skin stays warm against cool shadows.",
    },
    edit_style: {
      pacing_badge: "HYPER",
      cut_pattern: "Beat-synced micro-cuts every 0.5–1.2s.",
      transitions: "Hard cuts with occasional speed ramps.",
    },
    why_it_works: [
      { title: "Rhythm", detail: "Cuts land on the downbeat." },
      { title: "Palette", detail: "Complementary warm/cool tension." },
    ],
    how_to_edit_like_this: [{ summary: "Cut on transients, grade warm shadows cool." }],
  },
};

export const DEMO_MUSIC_ANALYSIS: MusicAnalyzeSuccess = {
  ok: true,
  track: {
    id: "demo",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    album_art_url: "https://i.scdn.co/image/ab67616d0000b273ce4f1737ef0ac2c5e2c9a0b2",
    release_year: 2011,
    duration_ms: 244000,
    explicit: false,
    spotify_url: "https://open.spotify.com/track/demo",
  },
  features: {
    tempo_bpm: 104,
    key: "F# minor",
    energy: 0.82,
    danceability: 0.58,
    valence: 0.41,
    acousticness: 0.02,
    instrumentalness: 0.89,
    loudness_db: -6.2,
    speechiness: 0.04,
    time_signature: 4,
  },
  claude: {
    vibe_summary: "Synth-drenched nostalgia with a hook that never lets go.",
    aesthetic_tags: ["dream pop", "nostalgic", "euphoric"],
    target_listener: "Night-drive playlist curators",
    scores: {
      hook_strength: 96,
      production_density: 88,
      emotional_range: 91,
      originality: 85,
      mix_clarity: 90,
      overall_vibe: 94,
    },
    sonic_textures: [],
    energy_arc: [],
    arrangement: { structure: "Build-release", density_strategy: "Layered", signature_moment: "Synth drop" },
    mix_profile: { low_end: "Tight", midrange: "Lush", high_end: "Airy", width: "Wide" },
    why_it_works: [{ title: "Hook", detail: "Melody sticks immediately." }],
    how_to_produce: [],
  },
};
