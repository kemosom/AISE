"""
Fictional teaching data for MAI5124 Lab 02.

The scenario uses a Spotify-style music-streaming product because the interface
is familiar to most students. These are NOT Spotify internal requirements or
historical decisions.
"""

HISTORICAL_REQUIREMENTS = [
    {"text": "Add low data streaming mode for unreliable mobile networks", "label": "HIGH"},
    {"text": "Support screen reader labels and larger lyric text", "label": "HIGH"},
    {"text": "Translate synchronized lyrics into the listener language", "label": "HIGH"},
    {"text": "Improve playback recovery when the network drops", "label": "HIGH"},
    {"text": "Protect account sessions with stronger security controls", "label": "HIGH"},
    {"text": "Download playlists for reliable offline playback", "label": "HIGH"},
    {"text": "Improve discovery recommendations using listening context", "label": "HIGH"},
    {"text": "Reduce application crashes during audio playback", "label": "HIGH"},
    {"text": "Personalize AI DJ mixes using listening context and session activity", "label": "HIGH"},

    {"text": "Collaborative queue voting for group listening", "label": "MEDIUM"},
    {"text": "Discover concerts and live events near the listener", "label": "MEDIUM"},
    {"text": "Generate concise podcast episode summaries", "label": "MEDIUM"},
    {"text": "Add a sleep timer to the mobile player", "label": "MEDIUM"},
    {"text": "Add configurable crossfade between tracks", "label": "MEDIUM"},
    {"text": "Add smart filters to personal playlists", "label": "MEDIUM"},

    {"text": "Allow profile theme colour customization", "label": "LOW"},
    {"text": "Add animated achievement badges to profiles", "label": "LOW"},
    {"text": "Add seasonal icons in the home screen", "label": "LOW"},
    {"text": "Add decorative avatar frames for listeners", "label": "LOW"},
    {"text": "Add animated canvas backgrounds to profile pages", "label": "LOW"},
    {"text": "Add extra sharing stickers for social posts", "label": "LOW"},
]


VALIDATION_REQUIREMENTS = [
    {"text": "Add offline playback recovery for unstable connections", "label": "HIGH"},
    {"text": "Improve accessibility labels in the music player", "label": "HIGH"},
    {"text": "Recommend nearby live concerts for followed artists", "label": "MEDIUM"},
    {"text": "Add a group listening vote button", "label": "MEDIUM"},
    {"text": "Add decorative profile colour themes", "label": "LOW"},
    {"text": "Add seasonal animated profile badges", "label": "LOW"},
]


CANDIDATE_REQUIREMENTS = [
    {
        "id": "REQ-201",
        "title": "AI DJ Context Mix",
        "description": "Use listening context to adapt an AI DJ mix for focus, commute, or workout sessions.",
        "user_votes": 72,
        "business_value": 9,
        "strategic_fit": 10,
        "effort": 3,
        "accessibility_impact": False,
        "visual_feature": "ai_dj",
    },
    {
        "id": "REQ-202",
        "title": "Live Lyrics Translation",
        "description": "Translate synchronized lyrics into the listener's selected language during playback.",
        "user_votes": 80,
        "business_value": 8,
        "strategic_fit": 8,
        "effort": 2,
        "accessibility_impact": True,
        "visual_feature": "lyrics_translation",
    },
    {
        "id": "REQ-203",
        "title": "Collaborative Queue Voting",
        "description": "Allow group-session listeners to vote tracks up or down in the shared queue.",
        "user_votes": 95,
        "business_value": 7,
        "strategic_fit": 6,
        "effort": 3,
        "accessibility_impact": False,
        "visual_feature": "queue_voting",
    },
    {
        "id": "REQ-204",
        "title": "Low Data Mode",
        "description": "Reduce streaming bitrate and prefetch intelligently on unreliable mobile networks.",
        "user_votes": 65,
        "business_value": 9,
        "strategic_fit": 9,
        "effort": 2,
        "accessibility_impact": True,
        "visual_feature": "data_saver",
    },
    {
        "id": "REQ-205",
        "title": "Lossless Audio",
        "description": "Add a lossless audio quality option for premium listeners.",
        "user_votes": 99,
        "business_value": 8,
        "strategic_fit": 7,
        "effort": 5,
        "accessibility_impact": False,
        "visual_feature": "lossless",
    },
    {
        "id": "REQ-206",
        "title": "Accessible Lyrics Mode",
        "description": "Provide larger high-contrast lyrics and improved screen reader navigation.",
        "user_votes": 48,
        "business_value": 7,
        "strategic_fit": 8,
        "effort": 2,
        "accessibility_impact": True,
        "visual_feature": "accessible_lyrics",
    },
    {
        "id": "REQ-207",
        "title": "Concert Discovery",
        "description": "Recommend concerts and live events near the listener based on artists they follow.",
        "user_votes": 76,
        "business_value": 6,
        "strategic_fit": 7,
        "effort": 2,
        "accessibility_impact": False,
        "visual_feature": "concerts",
    },
    {
        "id": "REQ-208",
        "title": "Podcast AI Summaries",
        "description": "Generate short AI summaries and key moments for long podcast episodes.",
        "user_votes": 68,
        "business_value": 8,
        "strategic_fit": 9,
        "effort": 4,
        "accessibility_impact": False,
        "visual_feature": "podcast_summary",
    },
]
