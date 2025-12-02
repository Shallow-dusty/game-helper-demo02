#!/bin/bash
# 音效占位符生成脚本
# 用于创建静音占位音效文件，避免运行时 404 错误
# 实际音效应替换为真实音频文件

SFX_DIR="public/audio/sfx"
mkdir -p "$SFX_DIR"

# 所需音效列表 (来自 useSoundEffect.ts)
SFX_FILES=(
  "token_place.mp3"
  "cloth_drag.mp3"
  "click_soft.mp3"
  "clock_tick.mp3"
  "clock_tock.mp3"
  "clock_chime.mp3"
  "clock_alarm.mp3"
  "lock_click.mp3"
  "paper_rustle.mp3"
  "wax_seal.mp3"
  "scroll_open.mp3"
  "scroll_close.mp3"
  "bell.mp3"
  "wolf.mp3"
  "owl.mp3"
  "death_toll.mp3"
  "hand_raise.mp3"
  "vote_cast.mp3"
  "gavel.mp3"
  "success.mp3"
  "error.mp3"
  "notification.mp3"
)

echo "🔊 Generating SFX placeholder files..."

# 检查 ffmpeg 是否可用
if command -v ffmpeg &> /dev/null; then
  echo "Using ffmpeg to generate silent audio files..."
  for file in "${SFX_FILES[@]}"; do
    if [ ! -f "$SFX_DIR/$file" ]; then
      # 生成 0.1 秒静音 MP3
      ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 "$SFX_DIR/$file" -y 2>/dev/null
      echo "  ✓ Created: $file"
    else
      echo "  ⊘ Exists: $file"
    fi
  done
else
  echo "ffmpeg not found, creating empty placeholder files..."
  for file in "${SFX_FILES[@]}"; do
    if [ ! -f "$SFX_DIR/$file" ]; then
      touch "$SFX_DIR/$file"
      echo "  ✓ Created empty: $file"
    else
      echo "  ⊘ Exists: $file"
    fi
  done
  echo ""
  echo "⚠️  Note: Empty files created. Replace with real audio for production."
fi

echo ""
echo "✅ Done! SFX files are in: $SFX_DIR"
echo ""
echo "📝 To use real audio:"
echo "   1. Download royalty-free SFX from freesound.org or similar"
echo "   2. Replace placeholder files in $SFX_DIR"
echo "   3. Recommended: Use short clips (0.2-2s), normalized audio"
