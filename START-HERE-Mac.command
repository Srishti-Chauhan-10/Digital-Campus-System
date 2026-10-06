#!/bin/bash
# ============================================================
#  Uttar Buniyadi Ashram Shala - Digital Campus System
#  Mac mate — eo file par DOUBLE-CLICK karo
# ============================================================
cd "$(dirname "$0")" || exit 1

echo ""
echo "  =========================================="
echo "   UTTAR BUNIYADI ASHRAM SHALA"
echo "   Digital Campus System"
echo "  =========================================="
echo ""

# ---- Node.js check ----
if ! command -v node >/dev/null 2>&1; then
  echo "  [ERROR] Node.js install nathi che."
  echo ""
  echo "  Please ek vaar Node.js install karo:"
  echo "     1. https://nodejs.org kholo"
  echo "     2. Bade hare 'LTS' button dabao"
  echo "     3. Download ane install karo"
  echo "     4. Eo file pehli var fari double-click karo"
  echo ""
  read -r -p "  Enter dabao window band karva mate..." _
  exit 1
fi

PORT_TO_USE="${PORT:-3000}"
echo "  Node.js version : $(node -v)"
echo "  Port            : $PORT_TO_USE"
echo ""

# ---- First time: install packages ----
if [ ! -d node_modules ]; then
  echo "  Pehli var: packages install thai ja rahi che."
  echo "  (1-2 minute lai shake — internet j hoyu pade)"
  echo "  >>> Browser aatyu thi band karo, installation puru thay."
  echo ""
  npm install
  if [ $? -ne 0 ]; then
    echo ""
    echo "  [ERROR] Install thai nathi. Internet check karo."
    read -r -p "  Enter dabao..." _
    exit 1
  fi
fi

echo ""
echo "  Website start thai rahi che..."

# ---- Server start (background) ----
npm start > server.log 2>&1 &
SERVER_PID=$!

# ---- Server taiyar thay, tab j browser kholo ----
echo "  Server taiyar thay e che, thodi der..."
for i in $(seq 1 40); do
  if curl -s -o /dev/null http://localhost:$PORT_TO_USE/api/school 2>/dev/null; then
    echo ""
    echo "  ==========================================="
    echo "   ✅ WEBSITE CHALU CHE — READY!"
    echo "  ==========================================="
    echo ""
    echo "  Browser ma automatic khulya che."
    echo "  Jo na khue to address ma lakhyo:"
    echo ""
    echo "      http://localhost:$PORT_TO_USE"
    echo ""
    echo "  Band karva mate: eo window ma Ctrl + C"
    echo ""

  # ફોન / ટેબલેટ માટે (એ જ WiFi પર)
  LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
  if [ -n "$LAN" ]; then
    echo ""
    echo "  >>> ફોન / ટેબલેટ માટે (એ જ WiFi પર):"
    echo "    http://$LAN:$PORT_TO_USE"
  fi
    open http://localhost:3000
    break
  fi
  sleep 1
done

if ! curl -s -o /dev/null http://localhost:$PORT_TO_USE/api/school 2>/dev/null; then
  echo ""
  echo "  [ERROR] Server start nahi thaya. Error log:"
  echo "  ------------------------------------"
  cat server.log
  echo "  ------------------------------------"
fi

# Keep window open
echo ""
echo "  Website band karva mate Ctrl + C dabao."
echo ""
trap 'kill $SERVER_PID 2>/dev/null' EXIT
wait $SERVER_PID
