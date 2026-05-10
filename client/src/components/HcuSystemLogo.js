/**
 * HcuSystemLogo – โลโก้ระบบรับเรื่องร้องเรียน มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ
 *
 * Props:
 *   height   – ความสูงในพิกเซล (default 44)
 *   variant  – 'color'  : พื้นหลังสีขาว/อ่อน  → ข้อความสีแดง HCU
 *              'ongold' : พื้นหลังสีทอง (#FFBD00) → ข้อความสีแดงเข้ม
 *              'light'  : พื้นหลังมืด/สีแดง      → ข้อความสีขาว
 */
import React from 'react';
import { Box } from '@mui/material';

const HcuSystemLogo = ({ height = 44, variant = 'color' }) => {
  /* ── สีข้อความตาม variant ── */
  const textPrimary =
    variant === 'light'  ? '#ffffff' :
    variant === 'ongold' ? '#AA020B' :
    '#D61514';

  const textSecondary =
    variant === 'light'  ? 'rgba(255,255,255,0.72)' :
    variant === 'ongold' ? '#8B0000' :
    '#AA020B';

  /* ── ขนาดฟอนต์ปรับตาม height ── */
  const fsPrimary   = Math.max(11, Math.round(height * 0.295));
  const fsSecondary = Math.max(8,  Math.round(height * 0.175));
  const gap         = Math.round(height * 0.27);

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: `${gap}px` }}>

      {/* ════════════════════════════════
          Badge SVG (56×56 viewBox)
          ════════════════════════════════ */}
      <svg
        width={height}
        height={height}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* ── พื้นหลังแดง ── */}
        <rect x="1" y="1" width="54" height="54" rx="11" fill="#D61514" />

        {/* ── ขอบทอง ── */}
        <rect x="1" y="1" width="54" height="54" rx="11"
          stroke="#FFBD00" strokeWidth="2" />

        {/* ── กรอบด้านในบางๆ ── */}
        <rect x="5" y="5" width="46" height="46" rx="7.5"
          fill="none" stroke="#FFBD00" strokeWidth="0.75" opacity="0.4" />

        {/* ── เพชรตกแต่งมุม ── */}
        <path d="M8 5.5 L10.5 8 L8 10.5 L5.5 8 Z"       fill="#FFBD00" opacity="0.8" />
        <path d="M48 5.5 L50.5 8 L48 10.5 L45.5 8 Z"    fill="#FFBD00" opacity="0.8" />
        <path d="M8 45.5 L10.5 48 L8 50.5 L5.5 48 Z"    fill="#FFBD00" opacity="0.8" />
        <path d="M48 45.5 L50.5 48 L48 50.5 L45.5 48 Z" fill="#FFBD00" opacity="0.8" />

        {/* ════ ไอคอนเอกสาร (document) ════ */}
        {/* ตัวเอกสาร */}
        <rect x="13" y="9" width="22" height="26" rx="2.5" fill="white" />
        {/* มุมพับด้านบนขวา */}
        <path d="M31 9 L35 13 L31 13 Z" fill="#FFCDD2" />
        {/* เส้นข้อความในเอกสาร */}
        <rect x="16" y="16.5" width="10" height="2"  rx="1" fill="#FFCDD2" />
        <rect x="16" y="20.5" width="13" height="2"  rx="1" fill="#FFCDD2" />
        <rect x="16" y="24.5" width="8"  height="2"  rx="1" fill="#FFCDD2" />
        <rect x="16" y="28.5" width="11" height="2"  rx="1" fill="#FFCDD2" />

        {/* ════ ตราประทับทอง (seal) ════ */}
        <circle cx="35" cy="32" r="9.5"  fill="#FFBD00" />
        <circle cx="35" cy="32" r="7.75" fill="none" stroke="#D61514" strokeWidth="1" />
        {/* เครื่องหมายถูก */}
        <path d="M29.5 32 L33.5 35.5 L40.5 27.5"
          stroke="#D61514" strokeWidth="2.3"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* ── เส้นคั่น ── */}
        <line x1="9" y1="40.5" x2="47" y2="40.5"
          stroke="#FFBD00" strokeWidth="0.75" opacity="0.55" />

        {/* ── ข้อความ มฉก. ── */}
        <text
          x="28" y="50.5"
          textAnchor="middle"
          fill="#FFBD00"
          fontSize="7.5"
          fontWeight="700"
          letterSpacing="2"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        >
          มฉก.
        </text>
      </svg>

      {/* ════════════════════════════════
          ข้อความ
          ════════════════════════════════ */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: `${fsPrimary}px`,
            color: textPrimary,
            lineHeight: 1.2,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          ระบบรับเรื่องร้องเรียน
        </Box>
        <Box
          component="span"
          sx={{
            fontWeight: 500,
            fontSize: `${fsSecondary}px`,
            color: textSecondary,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
          }}
        >
          มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ
        </Box>
      </Box>

    </Box>
  );
};

export default HcuSystemLogo;
