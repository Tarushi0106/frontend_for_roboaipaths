# Robotic Arm Controller — Complete Setup Guide

This project integrates a **React frontend** with an **ESP8266 backend** to control a robotic arm with 4 servos via WiFi.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Hardware Requirements](#hardware-requirements)
3. [Frontend Setup](#frontend-setup)
4. [Backend Setup (ESP8266)](#backend-setup-esp8266)
5. [WiFi Connection](#wifi-connection)
6. [Testing with Postman](#testing-with-postman)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────┐
│          Your Computer / Phone                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  React Frontend (Web App)                       │ │
│  │  - URL: http://localhost:5173                   │ │
│  │  - Controls: D-Pad, Joystick, Buttons           │ │
│  │  - Sends: GET /setServo?servo=N&angle=A        │ │
│  │  - Reads: GET /status                           │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────────────┘
               │
               │ WiFi (RoboticArm_Kit)
               │ IP: 192.168.4.1
               │
┌──────────────▼───────────────────────────────────────┐
│          ESP8266 (NodeMCU)                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Arduino Sketch (Backend)                       │ │
│  │  - Runs as WiFi Access Point                    │ │
│  │  - Listens on port 80                           │ │
│  │  - Endpoints: /status, /setServo, /            │ │
│  │  - Communicates via I2C (Wire) to PCA9685      │ │
│  └─────────────────────────────────────────────────┘ │
│                        │                            │
│  ┌────────────────────┴─────────────────────────┐  │
│  │         PCA9685 (I2C Servo Driver)           │  │
│  │  - Controls 4 servo channels (CH 0,1,2,4)    │  │
│  │  - Each servo: 0°-180° range                 │  │
│  └────────────────────┬─────────────────────────┘  │
└───────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    Servo 1         Servo 2         Servo 3        Servo 4
    (Base)        (Shoulder)        (Elbow)       (Gripper)
```

---

## 🔧 Hardware Requirements

### What You Need

| Item | Description | Purpose |
|------|-------------|---------|
| **ESP8266 NodeMCU** | Microcontroller board | Backend server, WiFi AP |
| **PCA9685** | 16-channel PWM servo driver | Controls 4 servos |
| **4x Servo Motors** | SG90 or similar hobby servos | Robotic arm joints |
| **Micro USB Cable** | Power & programming | Powers ESP8266, uploads code |
| **USB Power Supply** | 5V 2A minimum | Powers ESP8266 & servos |
| **I2C Wires** | 4x jumper wires | Connects ESP8266 to PCA9685 |
| **Computer** | Windows/Mac/Linux | Runs Arduino IDE & frontend |

### Wiring Diagram

```
ESP8266 NodeMCU          PCA9685 Module
─────────────────────────────────────────
D2 (GPIO4)  ───── SDA (Serial Data)
D1 (GPIO5)  ───── SCL (Serial Clock)
GND         ───── GND
5V          ───── VCC (if externally powered)

PCA9685                  Servo Motors
─────────────────────────────────────────
CH0 (Pin)   ───── Servo 1 Signal (Base)
CH1 (Pin)   ───── Servo 2 Signal (Shoulder)
CH2 (Pin)   ───── Servo 3 Signal (Elbow)
CH4 (Pin)   ───── Servo 4 Signal (Gripper)
GND         ───── All Servo GND
5V          ───── All Servo VCC
```

---

## 💻 Frontend Setup

### Prerequisites
- Node.js (v16+) and npm installed
- Git (to clone or manage repo)

### Installation

1. **Navigate to the frontend folder:**
```powershell
cd E:\frontend_for_roboaipaths\remote-control-app
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Start the development server:**
```powershell
npm run dev
```

You should see output like:
```
➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

4. **Open in browser:**
Navigate to `http://localhost:5173/` in your web browser.

### Frontend Features

- **D-Pad Controls** (Left/Right/Up/Down)
  - Left/Right → Base servo (Servo 1)
  - Up/Down → Shoulder servo (Servo 2)

- **Joystick Controls**
  - X-axis → Elbow servo (Servo 3)
  - Y-axis → Gripper servo (Servo 4)

- **Angle Display** → Shows real-time servo positions (0°-180°)

- **Step Size Adjustment** → Change sensitivity (1°-15°)

- **Connection Panel**
  - IP Input: Enter backend IP (default: 192.168.4.1)
  - Connect Button: Test connection to ESP8266
  - Status Indicator: Shows connected/disconnected/connecting

### Frontend Code Structure

```
src/
├── components/
│   ├── RoboticArmController.jsx  ← Main controller component
│   ├── DPad.jsx                  ← D-Pad controls
│   ├── Joystick.jsx              ← Joystick controls
│   ├── Button.jsx                ← Reusable button component
│   ├── RemoteControl.jsx         ← Remote UI wrapper
│   └── *.css                     ← Component styles (blue & yellow theme)
├── sounds/
│   └── sounds.jsx                ← Audio feedback
├── App.jsx                       ← Main app component
└── main.jsx                      ← Entry point
```

---

## 🛠️ Backend Setup (ESP8266)

### Prerequisites
- Arduino IDE (v1.8.19+) installed
- USB Micro cable

### Step 1: Install Board Support

1. Open **Arduino IDE**
2. Go to **File → Preferences**
3. In **"Additional Boards Manager URLs"**, paste:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Click **OK**
5. Go to **Tools → Board → Boards Manager**
6. Search for `esp8266`
7. Install **"esp8266 by ESP8266 Community"**

### Step 2: Install Required Libraries

1. Go to **Sketch → Include Library → Manage Libraries**
2. Search for and install:
   - `Adafruit PWMServoDriver` (by Adafruit)
   - `Wire` (usually pre-installed)

### Step 3: Open the Sketch

1. Go to **File → Open**
2. Navigate to: `E:\frontend_for_roboaipaths\ESP8266_Backend.ino`
3. Click **Open**

### Step 4: Configure Board Settings

1. Go to **Tools → Board** → Select **"NodeMCU 1.0 (ESP-12E Module)"**
2. Go to **Tools → Port** → Select the COM port (e.g., COM3, COM4)
3. Go to **Tools → Upload Speed** → Set to **115200**

### Step 5: Upload the Sketch

1. **Plug in the micro USB cable** to the ESP8266
2. Click the **Upload** button (right arrow icon)
3. Wait for **"Upload complete"** message

### Step 6: Verify via Serial Monitor

1. Go to **Tools → Serial Monitor** (or press **Ctrl+Shift+M**)
2. Set baud rate to **115200** (bottom right)
3. You should see:
   ```
   === Robotic Arm AP ===
   SSID: RoboticArm_Kit
   PASS: 12345678
   Open: http://192.168.4.1
   HTTP server started
   ```

### Backend Code Overview

**File:** `ESP8266_Backend.ino`

**Key Functions:**
- `setup()` → Initializes WiFi AP, I2C, PCA9685, HTTP server
- `loop()` → Handles incoming HTTP requests
- `handleRoot()` → Serves embedded HTML UI at `/`
- `handleSetServo()` → Processes `/setServo?servo=N&angle=A` requests
- `handleStatus()` → Returns current servo angles as JSON
- `writeJoint()` → Sends PWM signal to servo via PCA9685

**API Endpoints:**

| Endpoint | Method | Parameters | Response |
|----------|--------|-----------|----------|
| `/` | GET | — | HTML UI page |
| `/setServo` | GET | `servo=1..4`, `angle=0..180` | `OK` |
| `/status` | GET | — | `{"a1":90,"a2":45,"a3":120,"a4":10,"ip":"192.168.4.1","mode":"AP"}` |

---

## 📶 WiFi Connection

### How It Works

The ESP8266 runs as a **WiFi Access Point (AP)**, not a WiFi client. This means:
- It **creates** a WiFi network instead of joining one
- Your computer/phone connects **to** the ESP8266
- No router needed for the connection to work

### Connect to the ESP8266 WiFi

1. **After uploading the sketch**, look for WiFi networks on your computer
2. Find network named: **`RoboticArm_Kit`**
3. Enter password: **`12345678`**
4. Your device is now on the same network as the ESP8266

### Verify Connection

- **On Windows:** Open Command Prompt and run:
  ```powershell
  ping 192.168.4.1
  ```
  Should show responses (the ESP8266 is reachable)

- **In Browser:** Visit `http://192.168.4.1/`
  Should show the embedded UI (if sketch is running)

---

## 🧪 Testing with Postman

### Prerequisites
- Postman installed
- ESP8266 powered on and connected
- Computer connected to `RoboticArm_Kit` WiFi

### Test /status Endpoint

1. Open Postman
2. Create a new GET request
3. URL: `http://192.168.4.1/status`
4. Click **Send**
5. **Expected Response:**
   ```json
   {
     "a1": 0,
     "a2": 0,
     "a3": 0,
     "a4": 0,
     "ip": "192.168.4.1",
     "mode": "AP"
   }
   ```

### Test /setServo Endpoint

1. Create a new GET request
2. URL: `http://192.168.4.1/setServo?servo=1&angle=90`
3. Click **Send**
4. **Expected Response:** `OK`

### Test All Servos

```
http://192.168.4.1/setServo?servo=1&angle=90   (Base)
http://192.168.4.1/setServo?servo=2&angle=90   (Shoulder)
http://192.168.4.1/setServo?servo=3&angle=90   (Elbow)
http://192.168.4.1/setServo?servo=4&angle=90   (Gripper)
```

---

## 🎮 Using the Frontend

### Local Testing (Without ESP8266)

1. Run frontend: `npm run dev`
2. Open `http://localhost:5173/`
3. UI controls work (buttons respond)
4. Connection will fail (no ESP8266), but code is correct

### With ESP8266 Connected

1. **Ensure ESP8266 is powered and WiFi is on**
2. Connect computer to `RoboticArm_Kit` WiFi
3. Run frontend: `npm run dev`
4. Open `http://localhost:5173/`
5. In **Connection Panel**:
   - IP should show: `192.168.4.1` (default)
   - Click **Connect** button
   - Status should turn **green** (connected)
6. Click **Power ON**
7. Use D-Pad and Joystick to control servos

### Expected Console Logs

Open browser Console (F12 → Console) and you should see:
```
Sent base -> 95°
Sent shoulder -> 100°
Sent elbow -> 110°
Sent gripper -> 120°
Backend status: {a1: 95, a2: 100, a3: 110, a4: 120, ip: "192.168.4.1", mode: "AP"}
```

---

## 📱 Using on Mobile

1. Power on ESP8266
2. On your phone, connect to WiFi: `RoboticArm_Kit` (password: `12345678`)
3. Open browser and visit: `http://192.168.4.1/`
4. The embedded HTML UI will load (touch-friendly controls)
5. Control servos directly from the mobile UI

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch" in browser

**Cause:** Cannot reach ESP8266
- ✅ Ensure ESP8266 is powered on
- ✅ Ensure you're connected to `RoboticArm_Kit` WiFi
- ✅ Ping `192.168.4.1` to verify connectivity
- ✅ Check Serial Monitor for errors

### Issue: No Serial Monitor output

**Cause:** Wrong COM port or baud rate
- ✅ Try different COM ports (COM3, COM4, etc.)
- ✅ Set baud rate to **115200**
- ✅ Unplug and replug USB cable
- ✅ Check Device Manager to see which COM port ESP8266 uses

### Issue: Upload fails in Arduino IDE

**Cause:** Board/Port not selected correctly
- ✅ Select **Board:** "NodeMCU 1.0 (ESP-12E Module)"
- ✅ Select **Port:** The correct COM port
- ✅ Ensure USB cable is connected

### Issue: No WiFi network "RoboticArm_Kit" appears

**Cause:** Sketch not running
- ✅ Check Serial Monitor output
- ✅ Re-upload the sketch
- ✅ Ensure sketch uploaded successfully

### Issue: Servos don't move

**Cause:** PCA9685 not connected or powered
- ✅ Check I2C wiring (SDA/SCL)
- ✅ Verify PCA9685 I2C address (default: 0x40)
- ✅ Ensure servo power supply is connected
- ✅ Check Serial Monitor for errors

---

## 📊 Servo Mapping

| UI Name | Servo Number | Channel | Use |
|---------|--------------|---------|-----|
| Base | 1 | CH0 | Rotate base left/right (D-Pad) |
| Shoulder | 2 | CH1 | Lift shoulder up/down (D-Pad) |
| Elbow | 3 | CH2 | Move elbow X-axis (Joystick) |
| Gripper | 4 | CH4 | Open/close gripper (Joystick Y-axis) |

---

## 🎨 UI Theme

- **Primary Color:** Blue (`#0066ff`, `--color-blue`)
- **Accent Color:** Yellow (`#ffcc00`, `--color-yellow`)
- **Background:** Dark (`#0b1020`)
- **Text:** Light blue-gray (`#e7ebff`)

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `ESP8266_Backend.ino` | Arduino sketch (backend) |
| `src/components/RoboticArmController.jsx` | Main React component |
| `src/components/DPad.jsx` | D-Pad control component |
| `src/components/Joystick.jsx` | Joystick control component |
| `package.json` | Frontend dependencies |
| `vite.config.js` | Vite configuration |

---

## ✅ Checklist for Full Setup

- [ ] Hardware assembled and wired
- [ ] Micro USB cable connected to ESP8266
- [ ] Arduino IDE installed with ESP8266 board support
- [ ] Adafruit PWMServoDriver library installed
- [ ] Backend sketch uploaded to ESP8266
- [ ] Serial Monitor shows startup messages
- [ ] `RoboticArm_Kit` WiFi network visible
- [ ] Computer connected to `RoboticArm_Kit` WiFi
- [ ] Frontend installed (`npm install`)
- [ ] Frontend running (`npm run dev`)
- [ ] Frontend IP set to `192.168.4.1`
- [ ] Frontend Connect button shows "connected"
- [ ] D-Pad and Joystick controls move servos
- [ ] Postman test shows servo responses

---

## 🚀 Quick Start Summary

```powershell
# 1. Upload sketch to ESP8266 (Arduino IDE)
# 2. Connect computer to RoboticArm_Kit WiFi
# 3. Start frontend
cd E:\frontend_for_roboaipaths\remote-control-app
npm install
npm run dev

# 4. Open http://localhost:5173/
# 5. Set IP to 192.168.4.1
# 6. Click Connect
# 7. Click Power ON
# 8. Use controls!
```

---

## 📞 Support

For issues:
1. Check Serial Monitor output
2. Verify wiring
3. Test with Postman
4. Check browser Console (F12)
5. Ensure all dependencies installed

---

**Happy coding! 🎉**
