# ઉત્તર બુનિયાદી આશ્રમ શાળા — ડિજિટલ કેમ્પસ સિસ્ટમ
# Uttar Buniyadi Ashram Shala — Digital Campus System

---

## 🚀 Website kevare chalavi? (How to run)

### 🪟 Windows

1. `START-HERE-Windows.bat` par **double-click** karo
2. Pehli var 1–2 minute lage che (packages install thay che)
3. Browser **automatic** khul ja che
4. Site kholo: **http://localhost:3000**

### 🍎 Mac

1. Terminal (Terminal) kholo
2. Eo folder ma jao:
   ```bash
   cd path/to/UBAS-Digital-Campus
   ```
3. Eo command pelo:
   ```bash
   chmod +x start-here-mac-linux.sh
   ./start-here-mac-linux.sh
   ```
4. Site kholo: **http://localhost:3000**

### 🐧 Linux

Same as Mac — `chmod +x start-here-mac-linux.sh` pachhi `./start-here-mac-linux.sh`

---

## ❓ Error aave to? (If you get an error)

**"Node.js install nathi che"**
→ [nodejs.org](https://nodejs.org) thi Node.js download karo, install karo, pachhi script pehli var fari run karo.

**"Port 3000 busy che"**
→ Ek j port par dusri app chale che. Command ma `PORT` badlo:
```bash
PORT=4000 npm start
```
Pachhi browser ma **http://localhost:4000** kholo.

**Band karvu che**
→ Black/terminal window ma **Ctrl + C** dabao.

---

## 🔑 Login (Login taiyari che)

### 🎒 Student (Vidyarthi)

| Standard | Roll No. | Password |
|----------|----------|----------|
| ધોરણ ૯ (Std 9) | `1` to `80` | `student9` |
| ધોરણ ૧૦ (Std 10) | `1` to `80` | `student10` |

> Roll no. `1`–`80` — ketle pan roll no. try karo, tamne j vidyarthi ni yadi malbe.

### 👩‍🏫 Teacher (Shikshak)

| Naam | Mobile No. | Password |
|------|------------|----------|
| સમીર સાહેબ | `9427518906` | `teacher` |
| સંગીતા મેડમ | `6352866818` | `teacher` |
| વિનય સાહેબ | `9428687041` | `teacher` |

Teacher login **mobile number** thi thay che — name automatic dikhyo che.

---

## 📁 Folder ma shu che? (What is inside)

```
UBAS-Digital-Campus/
├── START-HERE-Windows.bat    ← Windows mate double-click karo
├── start-here-mac-linux.sh    ← Mac/Linux mate
├── README-GUIDE.txt           ← Eo file
├── package.json
├── server/                    ← Server code (login, AI, database)
│   ├── index.js               ← Main server
│   ├── api.js                 ← All API routes
│   ├── db.js                  ← Database setup
│   ├── seed.js                ← First-time data
│   ├── supervise.js           ← Auto-restart
│   ├── data/syllabus.js       ← All subjects & chapters
│   └── ai/
│       ├── doubtEngine.js     ← "Axon" AI
│       └── chapters.js        ← AI knowledge
├── client/dist/               ← Built website (ready)
├── data/
│   └── school.db              ← Saara data (students, marks)
└── node_modules/              ← Automatic install thay che
```

---

## ✨ Features

- 🎒 **Student portal** — results, syllabus, Axon AI, complaints, helpline
- 👩‍🏫 **Teacher portal** — marks entry, chapters, doubts, complaints, student list
- 💡 **Axon AI** — only precise answers; anything unsure goes to the teacher
- 📢 **Complaints** — hostel, campus, and separate bullying section
- ☎️ **Helpline** — emergency numbers included
- 📊 **Results** — 3 exams, all 3 years of data

---

## ⚠️ Important

- Data `data/school.db` ma che — **eje backup na leva** (copy leva).
- Internet j Connection thai joi etle server chale che.
- Website **localhost** par chale che — mare khalo band kare to band thai ja che.
