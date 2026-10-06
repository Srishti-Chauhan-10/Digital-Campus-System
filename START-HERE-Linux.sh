#!/usr/bin/env bash
# ============================================================
#   UTTAR BUNIYADI ASHRAM SHALA - DIGITAL CAMPUS SYSTEM
#   Linux par website chalane ke liye ehe file run karo
# ============================================================
cd "$(dirname "$0")" || exit 1

echo ""
echo "  =========================================="
echo "   UTTAR BUNIYADI ASHRAM SHALA"
echo "   Digital Campus System"
echo "  =========================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  [ERROR] Node.js install nathi che."
  echo ""
  echo "  Terminal ma ehe lakhyo:"
  echo "      sudo apt update && sudo apt install -y nodejs npm"
  echo ""
  echo "  Pachhi ehe script fari chalavo."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "  Pehli var: install thai ja rahi che (1-2 minute)..."
  echo ""
  npm install || { echo "  [ERROR] Install fail thayu."; exit 1; }
fi

echo ""
echo "  Website start thai ja rahi che..."

LAN=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
[ -n "$LAN" ] && echo "  Phone/Tablet mate: http://$LAN:3000"

( sleep 4
  if command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:3000
  else open http://localhost:3000 2>/dev/null; fi ) &

npm start

echo ""
echo "  Server band thai gaya."
