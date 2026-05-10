# คู่มือการติดตั้งและการกำหนดค่าระบบรับเรื่องร้องเรียนออนไลน์
## มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ (มฉก.)

**ชื่อระบบ:** ระบบรับเรื่องร้องเรียนออนไลน์ มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ  
**เวอร์ชัน:** 1.0  
**วันที่จัดทำ:** พฤษภาคม 2569  
**ผู้จัดทำ:** ทีมพัฒนาระบบ คณะวิทยาศาสตร์และเทคโนโลยี มฉก.

---

## สารบัญ

1. [บทนำและภาพรวม](#1-บทนำและภาพรวม)
2. [ข้อกำหนดด้านสภาพแวดล้อมของระบบ](#2-ข้อกำหนดด้านสภาพแวดล้อมของระบบ)
3. [การเตรียมความพร้อมและการติดตั้งซอฟต์แวร์พื้นฐาน](#3-การเตรียมความพร้อมและการติดตั้งซอฟต์แวร์พื้นฐาน)
4. [การกำหนดค่า Firebase และบริการฐานข้อมูล](#4-การกำหนดค่า-firebase-และบริการฐานข้อมูล)
5. [การติดตั้งและกำหนดค่าเซิร์ฟเวอร์ (Backend)](#5-การติดตั้งและกำหนดค่าเซิร์ฟเวอร์-backend)
6. [การติดตั้งและกำหนดค่าส่วนติดต่อผู้ใช้ (Frontend)](#6-การติดตั้งและกำหนดค่าส่วนติดต่อผู้ใช้-frontend)
7. [การเริ่มต้นระบบและการตรวจสอบการทำงาน](#7-การเริ่มต้นระบบและการตรวจสอบการทำงาน)
8. [การเตรียมข้อมูลเริ่มต้น (Database Seeding)](#8-การเตรียมข้อมูลเริ่มต้น-database-seeding)
9. [การสร้างบัญชีผู้ดูแลระบบ (Admin Account)](#9-การสร้างบัญชีผู้ดูแลระบบ-admin-account)
10. [ปัญหาที่พบบ่อยและแนวทางแก้ไข](#10-ปัญหาที่พบบ่อยและแนวทางแก้ไข)

---

## 1. บทนำและภาพรวม

### 1.1 วัตถุประสงค์ของคู่มือ

คู่มือฉบับนี้จัดทำขึ้นเพื่ออธิบายขั้นตอนการติดตั้ง กำหนดค่า และเริ่มต้นใช้งานระบบรับเรื่องร้องเรียนออนไลน์ของมหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ (มฉก.) สำหรับผู้ดูแลระบบและวิศวกรซอฟต์แวร์ที่รับผิดชอบในการนำระบบไปติดตั้งบนสภาพแวดล้อมจริง คู่มือฉบับนี้ครอบคลุมทั้งการติดตั้งสภาพแวดล้อมสำหรับการพัฒนา (Development Environment) และการนำขึ้นสู่สภาพแวดล้อมจริง (Production Environment)

### 1.2 ภาพรวมสถาปัตยกรรมระบบ

ระบบถูกพัฒนาตามสถาปัตยกรรม **Client-Server** ประกอบด้วยองค์ประกอบหลัก 3 ส่วน ดังนี้

```
┌─────────────────────────────────────────────────────────────┐
│                    สถาปัตยกรรมระบบ                          │
├──────────────┬──────────────────────┬───────────────────────┤
│  Frontend    │      Backend         │   Firebase Cloud       │
│  (React 18)  │  (Node.js/Express)   │                       │
│  Port: 3000  │     Port: 5000       │  • Authentication      │
│              │                      │  • Cloud Firestore     │
│  ส่วนติดต่อ  │  • REST API          │  • Storage            │
│  ผู้ใช้งาน  │  • NLP Processing    │                       │
│              │  • Business Logic    │                       │
└──────────────┴──────────────────────┴───────────────────────┘
```

| ส่วนประกอบ | เทคโนโลยี | เวอร์ชัน | พอร์ต |
|-----------|----------|---------|------|
| Frontend (Client) | React.js + MUI v5 | 18.2.0 | 3000 |
| Backend (Server) | Node.js + Express.js | 18+ | 5000 |
| ฐานข้อมูล | Google Cloud Firestore | — | — |
| การยืนยันตัวตน | Firebase Authentication | 10.5.0 | — |
| โมดูล NLP | @xenova/transformers | 2.17.2 | — |

### 1.3 โครงสร้างไดเรกทอรีของโครงการ

```
Report HCU/
├── client/                      # ส่วน Frontend (React Application)
│   ├── public/                  # ไฟล์สาธารณะ (HTML template, manifest)
│   ├── src/
│   │   ├── components/          # องค์ประกอบ UI ที่ใช้ร่วมกัน
│   │   ├── pages/               # หน้าจอแยกตามบทบาทผู้ใช้
│   │   │   ├── auth/            # หน้าสาธารณะ (Landing, Login, Register)
│   │   │   ├── user/            # หน้าสำหรับนักศึกษา/บุคลากร
│   │   │   ├── officer/         # หน้าสำหรับเจ้าหน้าที่
│   │   │   └── admin/           # หน้าสำหรับผู้ดูแลระบบ
│   │   ├── App.js               # จุดเริ่มต้นหลักของ React Application
│   │   ├── AuthContext.js       # Context สำหรับจัดการสถานะการยืนยันตัวตน
│   │   ├── api.js               # ตัวกลางสำหรับเรียก REST API
│   │   └── firebase.js          # การกำหนดค่า Firebase Client SDK
│   └── package.json
│
└── server/                      # ส่วน Backend (Node.js Application)
    ├── config/
    │   └── firebase.js          # การกำหนดค่า Firebase Admin SDK
    ├── routes/
    │   ├── complaints.js        # เส้นทาง API สำหรับเรื่องร้องเรียน
    │   ├── admin.js             # เส้นทาง API สำหรับผู้ดูแลระบบ
    │   └── departments.js       # เส้นทาง API สำหรับหน่วยงาน
    ├── utils/
    │   └── embedder.js          # โมดูลประมวลผล NLP
    ├── server.js                # จุดเริ่มต้นหลักของ Express Server
    ├── .env                     # ตัวแปรสภาพแวดล้อม (ไม่ควรบันทึกใน Version Control)
    └── package.json
```

---

## 2. ข้อกำหนดด้านสภาพแวดล้อมของระบบ

### 2.1 ข้อกำหนดขั้นต่ำของฮาร์ดแวร์สำหรับเซิร์ฟเวอร์

| รายการ | ข้อกำหนดขั้นต่ำ | ข้อกำหนดที่แนะนำ |
|--------|----------------|-----------------|
| หน่วยประมวลผล (CPU) | 2 คอร์ ความถี่ 2.0 GHz | 4 คอร์ ความถี่ 2.5 GHz หรือสูงกว่า |
| หน่วยความจำ (RAM) | 4 GB | 8 GB หรือสูงกว่า |
| พื้นที่จัดเก็บข้อมูล (Storage) | 10 GB (SSD) | 20 GB SSD หรือสูงกว่า |
| การเชื่อมต่ออินเทอร์เน็ต | ความเร็ว 10 Mbps | ความเร็ว 50 Mbps ขึ้นไป |

> **หมายเหตุ:** โมดูล NLP (`@xenova/transformers`) จะดาวน์โหลดโมเดลภาษาขนาดประมาณ 120 MB ในการเริ่มต้นครั้งแรก จึงจำเป็นต้องมีการเชื่อมต่ออินเทอร์เน็ตและพื้นที่จัดเก็บข้อมูลที่เพียงพอ

### 2.2 ข้อกำหนดของซอฟต์แวร์

| ซอฟต์แวร์ | เวอร์ชันที่รองรับ | หมายเหตุ |
|----------|-----------------|---------|
| Node.js | 18.0.0 หรือสูงกว่า | ต้องการ LTS (Long-Term Support) |
| npm | 9.0.0 หรือสูงกว่า | มาพร้อมกับ Node.js |
| Git | 2.30.0 หรือสูงกว่า | สำหรับโคลนโครงการ |
| เว็บเบราว์เซอร์ | Chrome 100+, Firefox 100+, Edge 100+ | สำหรับการเข้าถึงระบบ |

### 2.3 บัญชีบริการภายนอกที่จำเป็น

ก่อนเริ่มต้นการติดตั้ง ผู้ดูแลระบบจำเป็นต้องมีบัญชีและดำเนินการตามรายการดังต่อไปนี้

| รายการ | วิธีการได้รับ |
|--------|------------|
| บัญชี Google (สำหรับ Firebase) | ลงทะเบียนที่ [accounts.google.com](https://accounts.google.com) |
| โครงการ Firebase | สร้างที่ [console.firebase.google.com](https://console.firebase.google.com) |
| Service Account Key (JSON) | ดาวน์โหลดจาก Firebase Console > Project Settings > Service Accounts |

---

## 3. การเตรียมความพร้อมและการติดตั้งซอฟต์แวร์พื้นฐาน

### 3.1 การติดตั้ง Node.js และ npm

**ขั้นตอนที่ 1:** เปิดเว็บเบราว์เซอร์และนำทางไปยัง [https://nodejs.org](https://nodejs.org)

**ขั้นตอนที่ 2:** ดาวน์โหลดตัวติดตั้งเวอร์ชัน **LTS (Long-Term Support)** ที่เหมาะสมกับระบบปฏิบัติการ

**ขั้นตอนที่ 3:** เรียกใช้ตัวติดตั้งและปฏิบัติตามคำแนะนำบนหน้าจอ

**ขั้นตอนที่ 4:** ตรวจสอบการติดตั้งด้วยคำสั่งต่อไปนี้ใน Command Prompt หรือ Terminal

```bash
node --version
# ผลลัพธ์ที่คาดหวัง: v18.x.x หรือสูงกว่า

npm --version
# ผลลัพธ์ที่คาดหวัง: 9.x.x หรือสูงกว่า
```

### 3.2 การรับโครงการ (Clone Repository)

**ขั้นตอนที่ 1:** เปิด Command Prompt (Windows) หรือ Terminal (macOS/Linux)

**ขั้นตอนที่ 2:** นำทางไปยังไดเรกทอรีที่ต้องการติดตั้งระบบ

```bash
cd C:\Projects
# หรือไดเรกทอรีที่ต้องการ
```

**ขั้นตอนที่ 3:** โคลนโครงการจาก Repository

```bash
git clone [URL ของ Repository]
cd "Report HCU"
```

หากได้รับไฟล์โครงการในรูปแบบ `.zip` ให้แตกไฟล์ไปยังไดเรกทอรีที่ต้องการแทน

---

## 4. การกำหนดค่า Firebase และบริการฐานข้อมูล

### 4.1 การสร้างโครงการ Firebase

**ขั้นตอนที่ 1:** เข้าสู่ระบบที่ [Firebase Console](https://console.firebase.google.com)

**ขั้นตอนที่ 2:** คลิก **"Add project"** และกรอกชื่อโครงการ

**ขั้นตอนที่ 3:** เลือกว่าจะเปิดใช้งาน Google Analytics หรือไม่ (เป็นทางเลือก)

**ขั้นตอนที่ 4:** คลิก **"Create project"** และรอให้ระบบสร้างโครงการเสร็จสิ้น

### 4.2 การเปิดใช้งาน Firebase Authentication

**ขั้นตอนที่ 1:** ใน Firebase Console เลือกเมนู **"Authentication"** จากแถบด้านซ้าย

**ขั้นตอนที่ 2:** คลิกแท็บ **"Sign-in method"**

**ขั้นตอนที่ 3:** เปิดใช้งาน **"Email/Password"** โดยคลิกที่รายการดังกล่าว สลับสวิตช์เป็น **"Enable"** แล้วคลิก **"Save"**

### 4.3 การสร้างและกำหนดค่า Cloud Firestore

**ขั้นตอนที่ 1:** เลือกเมนู **"Firestore Database"** จากแถบด้านซ้าย

**ขั้นตอนที่ 2:** คลิก **"Create database"**

**ขั้นตอนที่ 3:** เลือกโหมด **"Start in test mode"** สำหรับสภาพแวดล้อมการพัฒนา (สำหรับสภาพแวดล้อมจริงให้เลือก **"Start in production mode"** และกำหนด Security Rules ตามความเหมาะสม)

**ขั้นตอนที่ 4:** เลือก Cloud Region ที่เหมาะสม (แนะนำ `asia-southeast1` หรือ `us-central1`) แล้วคลิก **"Enable"**

**ขั้นตอนที่ 5:** กำหนด Security Rules สำหรับสภาพแวดล้อมจริง โดยแก้ไขใน **"Rules"** tab ให้มีเนื้อหาดังนี้

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow read: if request.auth != null;
    }
    match /complaints/{complaintId} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4.4 การรับ Service Account Key สำหรับ Backend

**ขั้นตอนที่ 1:** ใน Firebase Console คลิกไอคอน **⚙ (Settings)** ถัดจากชื่อโครงการ แล้วเลือก **"Project settings"**

**ขั้นตอนที่ 2:** คลิกแท็บ **"Service accounts"**

**ขั้นตอนที่ 3:** คลิกปุ่ม **"Generate new private key"** แล้วยืนยันการดาวน์โหลด

**ขั้นตอนที่ 4:** เปลี่ยนชื่อไฟล์ที่ดาวน์โหลดมาเป็น `serviceAccountKey.json` แล้วนำไปวางไว้ในไดเรกทอรี `server/`

```
server/
└── serviceAccountKey.json    ← วางไฟล์ที่นี่
```

> **คำเตือนด้านความปลอดภัย:** ไฟล์ Service Account Key เป็นข้อมูลที่มีความละเอียดอ่อนสูง ต้องไม่บันทึกไว้ใน Version Control (Git) และต้องไม่เผยแพร่สู่สาธารณะ ตรวจสอบให้แน่ใจว่าไฟล์ `serviceAccountKey.json` อยู่ในรายการ `.gitignore`

### 4.5 การรับ Firebase Client Configuration สำหรับ Frontend

**ขั้นตอนที่ 1:** ใน Project Settings คลิกแท็บ **"General"**

**ขั้นตอนที่ 2:** เลื่อนลงไปที่ส่วน **"Your apps"** แล้วคลิกไอคอน **`</>`** (Web App) เพื่อเพิ่มเว็บแอปพลิเคชัน

**ขั้นตอนที่ 3:** กรอกชื่อแอปพลิเคชันและคลิก **"Register app"**

**ขั้นตอนที่ 4:** ระบบจะแสดงค่าการกำหนดค่า (Configuration Object) ในรูปแบบดังนี้ — บันทึกค่าเหล่านี้ไว้เพื่อใช้ในขั้นตอนที่ 6

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 5. การติดตั้งและกำหนดค่าเซิร์ฟเวอร์ (Backend)

### 5.1 การติดตั้ง Dependencies

**ขั้นตอนที่ 1:** เปิด Terminal แล้วนำทางไปยังไดเรกทอรี `server/`

```bash
cd server
```

**ขั้นตอนที่ 2:** ติดตั้ง Node.js packages ทั้งหมดที่ระบบต้องการ

```bash
npm install
```

คำสั่งนี้จะติดตั้ง packages ตามที่ระบุใน `package.json` ซึ่งประกอบด้วย

| Package | เวอร์ชัน | หน้าที่ |
|---------|---------|--------|
| `express` | ^4.18.2 | Web Framework สำหรับสร้าง REST API |
| `cors` | ^2.8.5 | จัดการ Cross-Origin Resource Sharing |
| `dotenv` | ^16.0.3 | โหลดตัวแปรสภาพแวดล้อมจากไฟล์ `.env` |
| `firebase-admin` | ^12.0.0 | Firebase Admin SDK สำหรับเข้าถึง Firestore และ Auth |
| `@xenova/transformers` | ^2.17.2 | โมดูล NLP สำหรับประมวลผลภาษาธรรมชาติ |
| `natural` | ^8.1.1 | ไลบรารีประมวลผลภาษาเสริม |
| `nodemon` | ^2.0.22 | เครื่องมือสำหรับการพัฒนา (รีสตาร์ทอัตโนมัติ) |

> **หมายเหตุ:** การติดตั้งอาจใช้เวลา 5–10 นาที เนื่องจาก `@xenova/transformers` มีขนาดใหญ่และมีขั้นตอนการ build เพิ่มเติม

### 5.2 การกำหนดค่าตัวแปรสภาพแวดล้อม

**ขั้นตอนที่ 1:** สร้างไฟล์ `.env` ในไดเรกทอรี `server/` โดยใช้โปรแกรมแก้ไขข้อความ

**ขั้นตอนที่ 2:** กรอกข้อมูลในรูปแบบต่อไปนี้ โดยแทนที่ค่าที่อยู่ในวงเล็บเหลี่ยมด้วยค่าจริงของระบบ

```env
# การตั้งค่าเซิร์ฟเวอร์
PORT=5000
NODE_ENV=development

# เส้นทางไฟล์ Firebase Service Account Key
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json

# URL ของ Firebase Database
FIREBASE_DATABASE_URL=https://[YOUR_PROJECT_ID].firebaseio.com
```

**คำอธิบายตัวแปรสภาพแวดล้อม:**

| ตัวแปร | ความหมาย | ค่าตัวอย่าง |
|--------|---------|-----------|
| `PORT` | หมายเลขพอร์ตที่เซิร์ฟเวอร์รับฟัง | `5000` |
| `NODE_ENV` | โหมดการทำงานของระบบ (`development` / `production`) | `development` |
| `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` | เส้นทางสัมพัทธ์ไปยังไฟล์ Service Account Key | `./serviceAccountKey.json` |
| `FIREBASE_DATABASE_URL` | URL ของ Firebase Realtime Database | `https://your-project.firebaseio.com` |

### 5.3 การตรวจสอบไฟล์การกำหนดค่า Firebase Admin

เปิดไฟล์ `server/config/firebase.js` และตรวจสอบว่าเส้นทางของ Service Account Key ถูกต้องตามที่กำหนดใน `.env`

```javascript
// ตัวอย่างเนื้อหาในไฟล์ server/config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
```

---

## 6. การติดตั้งและกำหนดค่าส่วนติดต่อผู้ใช้ (Frontend)

### 6.1 การติดตั้ง Dependencies

**ขั้นตอนที่ 1:** เปิด Terminal ใหม่ แล้วนำทางไปยังไดเรกทอรี `client/`

```bash
cd client
```

**ขั้นตอนที่ 2:** ติดตั้ง Node.js packages ทั้งหมด

```bash
npm install
```

คำสั่งนี้จะติดตั้ง packages หลักที่ประกอบด้วย

| Package | เวอร์ชัน | หน้าที่ |
|---------|---------|--------|
| `react` | ^18.2.0 | ไลบรารีหลักสำหรับสร้าง User Interface |
| `react-dom` | ^18.2.0 | จัดการการ render DOM |
| `react-router-dom` | ^6.20.0 | จัดการการนำทางระหว่างหน้าจอ |
| `@mui/material` | ^7.3.9 | คอมโพเนนต์ UI ตาม Material Design |
| `@mui/icons-material` | ^7.3.9 | ชุดไอคอน Material Design |
| `firebase` | ^10.5.0 | Firebase Client SDK |
| `axios` | ^1.3.2 | ไลบรารีสำหรับเรียก HTTP API |

### 6.2 การกำหนดค่า Firebase Client SDK

**ขั้นตอนที่ 1:** เปิดไฟล์ `client/src/firebase.js`

**ขั้นตอนที่ 2:** แก้ไขค่า `firebaseConfig` ให้ตรงกับโครงการ Firebase ที่สร้างไว้ในขั้นตอนที่ 4.5

```javascript
// client/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                     // แทนด้วยค่าจริง
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 6.3 การกำหนดค่า URL ของ Backend API

**ขั้นตอนที่ 1:** เปิดไฟล์ `client/src/api.js`

**ขั้นตอนที่ 2:** ตรวจสอบและแก้ไข Base URL ให้ตรงกับที่อยู่ของเซิร์ฟเวอร์ Backend

```javascript
// client/src/api.js — ตัวอย่างการกำหนดค่า
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});
```

**ขั้นตอนที่ 3:** สร้างไฟล์ `.env` ในไดเรกทอรี `client/` สำหรับสภาพแวดล้อมการพัฒนา

```env
# client/.env
REACT_APP_API_URL=http://localhost:5000/api
```

สำหรับสภาพแวดล้อมจริง (Production) ให้เปลี่ยนค่าเป็น URL ของเซิร์ฟเวอร์จริง เช่น

```env
# client/.env.production
REACT_APP_API_URL=https://your-domain.com/api
```

---

## 7. การเริ่มต้นระบบและการตรวจสอบการทำงาน

### 7.1 การเริ่มต้นเซิร์ฟเวอร์ Backend

**ขั้นตอนที่ 1:** เปิด Terminal และนำทางไปยังไดเรกทอรี `server/`

```bash
cd server
```

**ขั้นตอนที่ 2:** เริ่มต้นเซิร์ฟเวอร์ด้วยคำสั่งใดคำสั่งหนึ่งต่อไปนี้

```bash
# สำหรับสภาพแวดล้อมการพัฒนา (รีสตาร์ทอัตโนมัติเมื่อแก้ไขไฟล์)
npm run dev

# สำหรับสภาพแวดล้อมจริง
npm start
```

**ขั้นตอนที่ 3:** ตรวจสอบว่าเซิร์ฟเวอร์เริ่มต้นสำเร็จจากข้อความใน Terminal

```
🚀 Server running on http://localhost:5000
📁 Firestore connected
```

> **หมายเหตุ:** ในการเริ่มต้นครั้งแรก ระบบจะดาวน์โหลดโมเดล NLP (`paraphrase-multilingual-MiniLM-L12-v2`) ขนาดประมาณ 120 MB ลงในโฟลเดอร์ `.model-cache/` ซึ่งอาจใช้เวลาหลายนาทีขึ้นอยู่กับความเร็วอินเทอร์เน็ต การเริ่มต้นในครั้งถัดไปจะใช้ cache และเริ่มต้นเร็วขึ้น

**ขั้นตอนที่ 4:** ทดสอบการทำงานของ API ด้วยการเปิดเว็บเบราว์เซอร์แล้วเข้าถึง URL ต่อไปนี้

```
http://localhost:5000/api/status
```

ผลลัพธ์ที่คาดหวัง:
```json
{ "status": "Backend is running with Firebase connected" }
```

### 7.2 การเริ่มต้นส่วนติดต่อผู้ใช้ Frontend

**ขั้นตอนที่ 1:** เปิด Terminal ใหม่ (อีกหน้าต่างหนึ่ง) และนำทางไปยังไดเรกทอรี `client/`

```bash
cd client
```

**ขั้นตอนที่ 2:** เริ่มต้น React Development Server

```bash
npm start
```

**ขั้นตอนที่ 3:** เบราว์เซอร์จะเปิดโดยอัตโนมัติและนำทางไปยัง `http://localhost:3000` หรือเปิดเองโดยพิมพ์ URL ดังกล่าวในเบราว์เซอร์

**ขั้นตอนที่ 4:** ตรวจสอบว่าหน้าแรก (Landing Page) แสดงผลถูกต้องโดยไม่มีข้อผิดพลาดใน Console

### 7.3 สรุปขั้นตอนการเริ่มต้นระบบ (ทุกครั้งที่เริ่มใช้งาน)

| ลำดับ | Terminal | ไดเรกทอรี | คำสั่ง | URL |
|------|---------|----------|-------|-----|
| 1 | Terminal 1 | `server/` | `npm run dev` | `http://localhost:5000` |
| 2 | Terminal 2 | `client/` | `npm start` | `http://localhost:3000` |

---

## 8. การเตรียมข้อมูลเริ่มต้น (Database Seeding)

ระบบมีสคริปต์สำหรับเตรียมข้อมูลเริ่มต้นในฐานข้อมูล ซึ่งจำเป็นสำหรับการทดสอบและการนำขึ้นสู่ระบบจริง

### 8.1 การเตรียมข้อมูลคณะและสาขาวิชา

```bash
# ใน Terminal ของ server/
node seed-faculties.js
```

สคริปต์นี้จะนำเข้าข้อมูลคณะและสาขาวิชาทั้งหมดของมหาวิทยาลัยเข้าสู่ Firestore

### 8.2 การเตรียมข้อมูลเจ้าหน้าที่ตัวอย่าง

```bash
node seed-officers.js
```

สคริปต์นี้จะสร้างบัญชีเจ้าหน้าที่ตัวอย่างสำหรับแต่ละหน่วยงาน

### 8.3 การเตรียมข้อมูลเรื่องร้องเรียนตัวอย่าง (สำหรับการทดสอบ)

```bash
node seed-complaints.js
```

> **คำเตือน:** สคริปต์ `seed-complaints.js` ควรใช้เฉพาะในสภาพแวดล้อมการพัฒนาและการทดสอบเท่านั้น ห้ามใช้ในสภาพแวดล้อมจริง

---

## 9. การสร้างบัญชีผู้ดูแลระบบ (Admin Account)

### 9.1 การสร้างบัญชีผ่านหน้าลงทะเบียน

**ขั้นตอนที่ 1:** เข้าถึงระบบที่ `http://localhost:3000` แล้วคลิก **"ลงทะเบียน"**

**ขั้นตอนที่ 2:** กรอกข้อมูลผู้ดูแลระบบและดำเนินการลงทะเบียนตามปกติ

**ขั้นตอนที่ 3:** หลังจากลงทะเบียนแล้ว บัญชีจะมี role เป็น `user` โดยค่าเริ่มต้น

### 9.2 การเปลี่ยน Role เป็น Admin ผ่านสคริปต์

ระบบมีสคริปต์สำหรับเปลี่ยน role ของบัญชีเป็น `admin` โดยตรง

**ขั้นตอนที่ 1:** เปิดไฟล์ `server/create-executive.js` หรือสร้างสคริปต์ที่ต้องการ แล้วแก้ไข UID ของผู้ใช้ที่ต้องการเปลี่ยน role

**ขั้นตอนที่ 2:** รันสคริปต์

```bash
# ใน Terminal ของ server/
node create-executive.js
```

### 9.3 การเปลี่ยน Role ผ่าน Firebase Console (วิธีทางเลือก)

**ขั้นตอนที่ 1:** เข้าสู่ Firebase Console แล้วเลือก **"Firestore Database"**

**ขั้นตอนที่ 2:** นำทางไปยัง Collection **"users"** แล้วค้นหา Document ของผู้ใช้ที่ต้องการ

**ขั้นตอนที่ 3:** คลิก **"Edit field"** ที่ฟิลด์ `role` แล้วเปลี่ยนค่าเป็น `admin`

**ขั้นตอนที่ 4:** คลิก **"Update"** เพื่อบันทึก

---

## 10. ปัญหาที่พบบ่อยและแนวทางแก้ไข

| อาการ | สาเหตุที่เป็นไปได้ | แนวทางแก้ไข |
|------|-----------------|------------|
| `Error: Cannot find module './serviceAccountKey.json'` | ไม่พบไฟล์ Service Account Key | ตรวจสอบว่าไฟล์ `serviceAccountKey.json` อยู่ในไดเรกทอรี `server/` และชื่อไฟล์ถูกต้องตามที่กำหนดใน `.env` |
| `Error: EADDRINUSE :::5000` | พอร์ต 5000 ถูกใช้งานอยู่โดยโปรแกรมอื่น | ปิดโปรแกรมที่ใช้พอร์ต 5000 หรือเปลี่ยนค่า `PORT` ใน `.env` |
| หน้าจอแสดง `Network Error` จาก Frontend | Backend ไม่ได้ทำงานหรือ URL ไม่ถูกต้อง | ตรวจสอบว่า Backend ทำงานอยู่ที่ `http://localhost:5000` และค่า `REACT_APP_API_URL` ใน `.env` ของ Client ถูกต้อง |
| NLP ไม่ทำงาน หรือ autofill ล้มเหลว | โมเดลยังดาวน์โหลดไม่เสร็จ หรือ Connection หมดเวลา | รอให้โมเดลดาวน์โหลดเสร็จสมบูรณ์ในการเริ่มต้นครั้งแรก ตรวจสอบว่าโฟลเดอร์ `.model-cache/` ถูกสร้างขึ้นแล้ว |
| Firebase Authentication Error | ค่า `apiKey` หรือ `authDomain` ผิดพลาด | ตรวจสอบค่าใน `client/src/firebase.js` ให้ตรงกับ Firebase Console |
| `FirebaseError: Missing or insufficient permissions` | Firestore Security Rules ไม่อนุญาต | ตรวจสอบและปรับ Security Rules ใน Firebase Console ตามที่ระบุในหัวข้อ 4.3 |
| `npm install` ล้มเหลวที่ `@xenova/transformers` | ต้องการ build tools สำหรับ C++ | ติดตั้ง `windows-build-tools` (Windows) หรือ `build-essential` (Linux/macOS) |
| ไม่สามารถเชื่อมต่อ Firestore ได้ | `FIREBASE_DATABASE_URL` ผิดรูปแบบ | ตรวจสอบว่า URL อยู่ในรูปแบบ `https://[PROJECT_ID].firebaseio.com` |

### 10.1 การตรวจสอบ Log ของระบบ

สำหรับการวินิจฉัยปัญหาเพิ่มเติม สามารถตรวจสอบ Log ได้จากแหล่งต่อไปนี้

- **Backend Log:** ข้อความที่แสดงใน Terminal ของ `server/`
- **Frontend Log:** เปิด Developer Tools ในเบราว์เซอร์ (กด F12) แล้วดูแท็บ **Console**
- **Firebase Log:** ตรวจสอบที่ Firebase Console > **"Usage and billing"** หรือ **"Firestore"** > **"Data"**

---

*คู่มือการติดตั้งฉบับนี้จัดทำสำหรับระบบรับเรื่องร้องเรียนออนไลน์ มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ หากพบปัญหาในการติดตั้งกรุณาติดต่อทีมพัฒนาระบบ คณะวิทยาศาสตร์และเทคโนโลยี มฉก.*
