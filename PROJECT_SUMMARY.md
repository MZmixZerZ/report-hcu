# สรุปผลการพัฒนาโครงงาน
## ระบบจัดการข้อร้องเรียนมหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ (Report HCU)

---

## 1. ภาพรวมโครงงาน

โครงงานนี้มีวัตถุประสงค์เพื่อพัฒนาระบบรับและจัดการข้อร้องเรียนสำหรับมหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ (มฉก.) ให้มีประสิทธิภาพ โปร่งใส และลดขั้นตอนการดำเนินงานด้วยเทคโนโลยี โดยแทนที่กระบวนการยื่นเรื่องแบบกระดาษหรือการส่งต่อด้วยตนเอง ด้วยระบบดิจิทัลที่เชื่อมโยงผู้ร้องเรียน เจ้าหน้าที่ และผู้บริหารบนแพลตฟอร์มเดียว

---

## 2. เทคโนโลยีที่ใช้

### 2.1 Frontend
| รายการ | เทคโนโลยี | เวอร์ชัน |
|--------|-----------|---------|
| UI Framework | React | 18.2.0 |
| Component Library | Material-UI (MUI) | 7.3.9 |
| Routing | React Router DOM | 6.20.0 |
| HTTP Client | Axios | 1.3.2 |
| Auth/DB SDK | Firebase SDK | 10.5.0 |

### 2.2 Backend
| รายการ | เทคโนโลยี | เวอร์ชัน |
|--------|-----------|---------|
| Runtime | Node.js | 18+ |
| Web Framework | Express | 4.18.2 |
| Auth/DB Admin | Firebase Admin SDK | 12.0.0 |
| NLP Engine | @xenova/transformers | 2.17.2 |

### 2.3 ฐานข้อมูลและโครงสร้างพื้นฐาน
- **Google Cloud Firestore** (NoSQL) — จัดเก็บข้อมูลทั้งหมด ได้แก่ `users`, `complaints`, `complaintTypes`, `complaintIssues`, `departments`, `routingTokenMemory`
- **Firebase Authentication** — จัดการการล็อกอินและยืนยันตัวตน (Email/Password)

---

## 3. สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Port 3000)                   │
│   React 18 + MUI + Firebase SDK                        │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│   │ Landing  │ │  User    │ │ Officer  │ │  Admin   │ │
│   │   Page   │ │ System   │ │ System   │ │ System   │ │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ Axios (REST API)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   SERVER (Port 5000)                    │
│   Node.js + Express + Firebase Admin SDK                │
│   ┌──────────────┐ ┌───────────────┐ ┌──────────────┐  │
│   │  /complaints │ │    /admin     │ │  /departments│  │
│   └──────┬───────┘ └───────────────┘ └──────────────┘  │
│          │  NLP Pipeline                                │
│   ┌──────▼───────────────────────────────────────────┐  │
│   │  departmentRouter → embedder → routingMemory     │  │
│   └──────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              Google Cloud Firestore
              Firebase Authentication
```

---

## 4. ระบบบทบาทผู้ใช้งาน (RBAC)

ระบบแบ่งบทบาทออกเป็น 5 ระดับ โดยแต่ละระดับมีสิทธิ์การเข้าถึงที่แตกต่างกัน:

| Role | กลุ่มผู้ใช้ | สิทธิ์หลัก |
|------|-----------|-----------|
| `user` | นักศึกษา / บุคลากร | ยื่นเรื่อง, ติดตามสถานะ, รับแจ้งเตือน |
| `officer` | เจ้าหน้าที่หน่วยงาน | รับเรื่อง, อัปเดตสถานะ, ดู Dashboard หน่วยงานตนเอง |
| `faculty` | หัวหน้าคณะ | ดู Dashboard ของคณะตนเอง |
| `executive` | ผู้บริหาร | ดู Dashboard ภาพรวมทั้งมหาวิทยาลัย |
| `admin` | ผู้ดูแลระบบ | จัดการทุกอย่างในระบบ |

---

## 5. คุณสมบัติหลักของระบบ

### 5.1 ระบบยื่นเรื่องร้องเรียน (User)
- **NLP Autofill** — ผู้ใช้พิมพ์คำอธิบายปัญหา แล้วกดปุ่ม "🔍 ตรวจสอบรายละเอียด" ระบบประมวลผลด้วย NLP แนะนำประเภทปัญหาและปัญหาย่อยอัตโนมัติ
- **Auto-fill คณะที่สังกัด** — ดึงข้อมูลคณะจากบัญชีผู้ใช้ แสดงเป็น read-only ลดการกรอกผิดพลาด
- **ระดับความเร่งด่วน** — กำหนดอัตโนมัติตามประเภทปัญหาที่เลือก
- **การแนบรูปภาพ** — รองรับ JPG / PNG / WEBP
- **ปัญหาไม่อยู่ในรายการ** — ผู้ใช้สามารถส่งปัญหาใหม่รอให้ Admin อนุมัติเพิ่มในระบบ
- **ระดับความเปิดเผย** — เลือกได้ว่าต้องการเปิดเผยตัวตนหรือไม่

### 5.2 ระบบ NLP จัดเส้นทางอัตโนมัติ (Intelligent Routing)
- **Hybrid Scoring** = Keyword Score (3 Tier) + Semantic Score (Sentence Embedding)
- **Tier 1** — ตรงทั้งหมด: +3 (หัวข้อ) / +2 (รายละเอียด)
- **Tier 2** — Partial overlap ≥ 60% โดยใช้ Character N-gram Set (O(1) lookup)
- **Tier 3** — Token ในคำอธิบายหน่วยงาน: +1 (หัวข้อ) / +0.5 (รายละเอียด)
- **Memory Boost** — ระบบเรียนรู้จากผลการจัดเส้นทางที่ผ่านมา บันทึกลง `routingTokenMemory` ใน Firestore และนำกลับมาใช้ boost คะแนน (confidence × BOOST_WEIGHT)

**สูตรคำนวณคะแนน:**
```
typeScore  = kwScore + semScore × 12
issueScore = semScore × 0.65 + (kwScore / maxKw) × 0.35
memBoost   = confidence × 3  (ต่อ token)
```

**NLP Model:** `paraphrase-multilingual-MiniLM-L12-v2` via @xenova/transformers
- รองรับภาษาไทยและภาษาอังกฤษ
- Cache ใน `.model-cache/` หลังดาวน์โหลดครั้งแรก (~120 MB)
- โหลดล่วงหน้าตอน server เริ่มทำงาน (warmup)

### 5.3 ระบบเจ้าหน้าที่ (Officer)
- **RBAC Filtering ฝั่ง Server** — แสดงเฉพาะเรื่องที่ส่งมายังหน่วยงานของเจ้าหน้าที่คนนั้น โดยอ่านจาก `users.department` ใน Firestore ผ่าน token ตรวจสอบ ไม่ไว้ใจ client
- **Dashboard** — สรุปสถิติ: จำนวนทั้งหมด, รอดำเนินการ, กำลังดำเนินการ, เสร็จสิ้น, ฉุกเฉิน
- **Emergency Banner** — แจ้งเตือนเรื่องฉุกเฉินที่ยังค้างอยู่
- **Activity Log** — บันทึกทุกการเปลี่ยนสถานะพร้อมชื่อเจ้าหน้าที่ที่ดำเนินการ (auto-attach จากบัญชี)
- **Real-time Notification** — แจ้งเตือนเมื่อมีเรื่องร้องเรียนใหม่เข้ามา

### 5.4 ระบบผู้ดูแล (Admin)
ประกอบด้วย 7 Tab:

| Tab | ฟีเจอร์ |
|-----|--------|
| Dashboard | สถิติภาพรวม |
| ผู้ใช้งาน | จัดการบัญชี, เปลี่ยน Role, PDPA Masking |
| ประเภทปัญหา | CRUD ประเภทร้องเรียน |
| ปัญหาย่อย | CRUD ปัญหาย่อย + กำหนด urgency |
| คณะ/สาขา | จัดการโครงสร้างคณะและสาขาวิชา |
| เงื่อนไขหน่วยงาน | กำหนด keyword และ department สำหรับ NLP routing |
| คำขอรอพิจารณา | อนุมัติ/ปฏิเสธ ปัญหาใหม่ที่ผู้ใช้ส่งมา |

### 5.5 การบูรณาการระบบฐานข้อมูลรวมศูนย์ (Data Centralization)
- ข้อมูล role, คณะ, หน่วยงาน, สาขา ทุกหน่วยเก็บในแหล่งเดียว (`users` collection)
- ทุก component อ่านผ่าน `AuthContext` ซึ่งโหลดจาก Firestore ทุกครั้งที่ auth state เปลี่ยน
- ระบบ Admin ใช้ `onSnapshot` real-time listener — ข้อมูลอัปเดตโดยไม่ต้อง refresh
- ลด Manual Entry: เจ้าหน้าที่/ผู้ใช้ไม่ต้องพิมพ์ข้อมูลสังกัดเอง

---

## 6. ผลลัพธ์และประโยชน์ที่ได้รับ

### 6.1 ด้านประสิทธิภาพ
- **ลดขั้นตอน** จากกระบวนการเดิม 5–7 ขั้นตอน เหลือ 3 ขั้นตอนหลัก (กรอกข้อมูล → ยืนยัน NLP → ส่งเรื่อง)
- **ลด Manual Entry** บทบาท/คณะ/หน่วยงาน ถูกดึงอัตโนมัติจากฐานข้อมูล
- **การส่งต่อเรื่องอัตโนมัติ** ด้วย NLP Routing ลดการส่งผิดหน่วยงาน

### 6.2 ด้านความโปร่งใส
- ผู้ร้องเรียนสามารถติดตามสถานะเรื่องร้องเรียนได้ตลอดเวลา
- Activity Log บันทึกทุกการเปลี่ยนแปลงพร้อมผู้ดำเนินการ
- ระบบแจ้งเตือน (Notification) แจ้งสถานะแบบ real-time

### 6.3 ด้านความปลอดภัย
- **Firebase Authentication** ตรวจสอบทุก API request ด้วย JWT Token
- **RBAC ฝั่ง Server** — Officer เห็นเฉพาะเรื่องของหน่วยงานตนเอง
- **PDPA Masking** — ชื่อและ Email ของผู้ใช้ถูก mask ในตาราง Admin
- **CORS Whitelist** — อนุญาตเฉพาะ origin ที่กำหนด (Port 3000, 3001, 5173)
- **Input Validation** ทุก endpoint ตรวจสอบ token และ role ก่อนดำเนินการ

---

## 7. ปัญหาและแนวทางแก้ไขที่พบระหว่างพัฒนา

| ปัญหา | สาเหตุ | วิธีแก้ไข |
|-------|--------|---------|
| NLP ส่งเรื่องผิดหน่วยงาน | Keyword สั้นตรงกับหลายหน่วยงาน | เพิ่ม Memory Boost (routingMemory) เรียนรู้จากประวัติ |
| Firestore Composite Index | Query หลายเงื่อนไขพร้อมกัน | กรองข้อมูลฝั่ง Server แทน Firestore query |
| Thai font สีไม่ถูกต้อง | MUI Theme กำหนด `color` ใน Typography variant ตายตัว | Override `color` ตรงใน `sx` prop ทุกจุดที่ต้องการ |
| CORS Block | Frontend/Backend ต่าง Port | กำหนด allowedOrigins whitelist ใน server.js |
| File encoding (ภาษาไทย) | PowerShell ใช้ default encoding | ใช้ `[System.Text.UTF8Encoding]::new($false)` เสมอ |

---

## 8. โครงสร้างไฟล์สำคัญ

```
Report HCU/
├── client/src/
│   ├── AuthContext.js          ← จัดการ auth state + โหลด role จาก Firestore
│   ├── ComplaintSystem.js      ← หน้าหลักผู้ใช้ (user/faculty/executive)
│   ├── components/
│   │   ├── Sidebar.js          ← Navigation sidebar
│   │   └── NotificationBell.js ← Real-time notification
│   └── pages/
│       ├── auth/               ← LandingPage, LoginPage, RegisterPage
│       ├── user/               ← DashboardPage, ReportPage, CheckStatusPage
│       ├── officer/            ← OfficerSystem.js
│       └── admin/              ← AdminSystem.js
│
└── server/
    ├── server.js               ← Entry point, CORS, middleware
    ├── config/firebase.js      ← Firebase Admin SDK init
    ├── routes/
    │   ├── complaints.js       ← API เรื่องร้องเรียน + NLP autofill
    │   └── admin.js            ← API ผู้ดูแลระบบ
    └── utils/
        ├── departmentRouter.js ← NLP Routing Engine (Keyword + Semantic)
        ├── routingMemory.js    ← Memory Boost System (Firestore-backed)
        └── embedder.js         ← Sentence Embedding (MiniLM model)
```

---

## 9. ข้อเสนอแนะสำหรับการพัฒนาต่อ

1. **Mobile Application** — พัฒนา React Native สำหรับ iOS/Android เพื่อรองรับการยื่นเรื่องผ่านมือถือ
2. **Email/SMS Notification** — ส่งแจ้งเตือนออกนอกระบบผ่าน Firebase Extensions + Twilio
3. **Dashboard Analytics** — เพิ่มกราฟเชิงลึก เช่น Trend Analysis, Heatmap ตามตึก/พื้นที่
4. **NLP Model Fine-tuning** — เทรน model เพิ่มเติมด้วยข้อมูลจริงของมหาวิทยาลัยเพื่อความแม่นยำสูงขึ้น
5. **SLA Tracking** — ระบบติดตาม Service Level Agreement กำหนดเวลาดำเนินการแต่ละประเภทปัญหา
6. **Multi-language Support** — รองรับภาษาอังกฤษสำหรับนักศึกษาต่างชาติ

---

*โครงงานพัฒนาโดยนักศึกษา มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ*  
*ปีการศึกษา 2568*
