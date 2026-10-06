#!/bin/bash
# ============================================================
#  Uttar Buniyadi Ashram Shala - Digital Campus System
#  Mac / Linux mate
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
  echo "  Please https://nodejs.org thi install karo."
  echo ""
  exit 1
fi

PORT_TO_USE="${PORT:-3000}"
echo "  Node.js version : $(node -v)"
echo "  Port            : $PORT_TO_USE"
echo ""

# ---- First time: install packages ----
if [ ! -d node_modules ]; then
  echo "  Pehli var: packages install thai ja rahi che (1-2 minute)..."
  echo "  >>> Browser aatyu thi band karo."
  echo ""
  npm install
  if [ $? -ne 0 ]; then
    echo ""
    echo "  [ERROR] Install thai nathi. Internet check karo."
    exit 1
  fi
fi

echo "  Website start thai rahi che..."

# ---- Server start (background) ----
npm start > server.log 2>&1 &
SERVER_PID=$!

# ---- Wait until server is truly ready, then open browser ----
echo "  Server taiyar thay e che..."
for i in $(seq 1 40); do
  if curl -s -o /dev/null http://localhost:$PORT_TO_USE/api/school 2>/dev/null; then
    echo ""
    echo "  ==========================================="
    echo "   ✅ WEBSITE CHALU CHE — READY!"
    echo "  ==========================================="
    echo ""
    echo "      http://localhost:$PORT_TO_USE"
    echo ""
    LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
    if [ -n "$LAN" ]; then
      echo ""
      echo "  >>> Phone / Tablet mate (ee j WiFi par):"
      echo "      http://$LAN:$PORT_TO_USE"
    fi
    (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null) &
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

echo ""
echo "  Band karva mate: Ctrl + C"
echo ""
trap 'kill $SERVER_PID 2>/dev/null' EXIT
wait $SERVER_PID
