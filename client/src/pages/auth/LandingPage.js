import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Container, Grid, Box, Chip, Divider,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import bgHcu from '../../assets/bg-hcu.jpg';
import Footer from '../../components/Footer';

const STEPS = [
  {
    num: '01',
    icon: <AssignmentIcon sx={{ fontSize: '2rem', color: '#D61514' }} />,
    title: 'แจ้งเรื่องร้องเรียน',
    desc: 'กรอกรายละเอียดปัญหา ระบุสถานที่ และแนบรูปภาพประกอบได้ทันที ใช้เวลาไม่เกิน 3 นาที',
  },
  {
    num: '02',
    icon: <AutoAwesomeIcon sx={{ fontSize: '2rem', color: '#D61514' }} />,
    title: 'ระบบจัดส่งอัตโนมัติ',
    desc: 'AI วิเคราะห์เนื้อหาและส่งเรื่องตรงถึงหน่วยงานที่รับผิดชอบในทันที โดยไม่ต้องผ่านขั้นตอนที่ซับซ้อน',
  },
  {
    num: '03',
    icon: <NotificationsActiveIcon sx={{ fontSize: '2rem', color: '#D61514' }} />,
    title: 'ติดตามและรับผลลัพธ์',
    desc: 'รับการแจ้งเตือน Real-time ทุกขั้นตอน พร้อมบันทึกกิจกรรมครบถ้วน จนกว่าปัญหาจะได้รับการแก้ไข',
  },
];

const FEATURES = [
  {
    icon: <SecurityIcon sx={{ fontSize: '1.8rem' }} />,
    title: 'ความปลอดภัยระดับองค์กร',
    desc: 'รองรับเฉพาะบัญชี @hcu.ac.th ยืนยันตัวตนผ่าน Firebase Authentication ข้อมูลทั้งหมดถูกเข้ารหัสและจัดเก็บอย่างปลอดภัย',
    color: '#D61514',
  },
  {
    icon: <SpeedIcon sx={{ fontSize: '1.8rem' }} />,
    title: 'ดำเนินการรวดเร็ว วัดผลได้',
    desc: 'เจ้าหน้าที่ได้รับแจ้งทันทีผ่าน Socket.IO ลดระยะเวลาดำเนินการจากสัปดาห์เหลือเพียงวัน และติดตามได้ตลอดเวลา',
    color: '#F59E0B',
  },
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: '1.8rem' }} />,
    title: 'AI จัดเส้นทางอัตโนมัติ',
    desc: 'เทคโนโลยี NLP ประมวลผลภาษาไทยเพื่อวิเคราะห์ข้อความและส่งเรื่องตรงสู่หน่วยงานที่รับผิดชอบโดยไม่ต้องจัดการเอง',
    color: '#6D28D9',
  },
  {
    icon: <BarChartIcon sx={{ fontSize: '1.8rem' }} />,
    title: 'โปร่งใสทุกระดับชั้น',
    desc: 'ผู้บริหารและเจ้าหน้าที่คณะเข้าถึง Dashboard สถิติแบบ Real-time ครอบคลุมทุกหน่วยงานและทุกมิติของปัญหา',
    color: '#059669',
  },
];

function LandingPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'ระบบร้องเรียน มฉก. | รายงานปัญหา ติดตามผล'; }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <Box sx={{
        minHeight: '100vh',
        backgroundImage: `url(${bgHcu})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        '&::before': {
          content: '""', position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(170,2,11,0.95) 0%, rgba(8,8,8,0.88) 52%, rgba(0,0,0,0.75) 100%)',
          zIndex: 0,
        },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 10 }}>
          <Grid container spacing={6} alignItems="center">

            {/* ── Left: headline + CTA ── */}
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 3.5 }}>
                <Chip
                  label="ระบบอย่างเป็นทางการ · มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ"
                  sx={{
                    background: 'rgba(255,189,0,0.11)',
                    border: '1px solid rgba(255,189,0,0.38)',
                    color: '#FFBD00', fontWeight: 700,
                    fontSize: '0.74rem', letterSpacing: '0.5px',
                    height: 30, borderRadius: '100px',
                  }}
                />
              </Box>

              <Typography sx={{
                color: '#fff', fontWeight: 900,
                fontSize: { xs: '2.8rem', md: '4.2rem' },
                lineHeight: 1.05, letterSpacing: '-1.5px', mb: 0.5,
              }}>
                ทุกปัญหา
              </Typography>
              <Typography sx={{
                color: '#FFBD00', fontWeight: 900,
                fontSize: { xs: '2.8rem', md: '4.2rem' },
                lineHeight: 1.05, letterSpacing: '-1.5px', mb: 3,
              }}>
                มีผู้รับผิดชอบ
              </Typography>

              {/* Accent line */}
              <Box sx={{ width: 60, height: 4, bgcolor: '#FFBD00', borderRadius: 2, mb: 3.5 }} />

              <Typography sx={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: { xs: '1rem', md: '1.06rem' },
                lineHeight: 2, mb: 5, maxWidth: 510,
              }}>
                แจ้งปัญหาภายในมหาวิทยาลัยผ่านช่องทางออนไลน์ที่ปลอดภัย
                ระบบส่งเรื่องตรงถึงหน่วยงานที่รับผิดชอบโดยอัตโนมัติ
                พร้อมติดตามสถานะแบบ Real-time จนกว่าจะแก้ไขสำเร็จ
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 5.5 }}>
                <Button
                  variant="contained" size="large"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    background: '#FFBD00', color: '#AA020B',
                    fontWeight: 800, px: 4.5, py: 1.7, fontSize: '1rem',
                    borderRadius: '14px', textTransform: 'none',
                    boxShadow: '0 8px 30px rgba(255,189,0,0.45)',
                    transition: 'all 0.22s',
                    '&:hover': { background: '#e8aa00', transform: 'translateY(-2px)', boxShadow: '0 14px 40px rgba(255,189,0,0.55)' },
                  }}
                >
                  เริ่มแจ้งเรื่องเลย
                </Button>
                <Button
                  variant="outlined" size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.4)', color: '#fff',
                    fontWeight: 700, px: 4.5, py: 1.7, fontSize: '1rem',
                    borderRadius: '14px', textTransform: 'none',
                    transition: 'all 0.22s',
                    '&:hover': { borderColor: '#fff', background: 'rgba(255,255,255,0.08)', transform: 'translateY(-2px)' },
                  }}
                >
                  สมัครใช้งาน
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['เข้ารหัสข้อมูลทุกชั้น', 'ไม่มีค่าใช้จ่าย', 'ข้อมูลเป็นความลับ 100%'].map((text) => (
                  <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <CheckCircleIcon sx={{ fontSize: '0.92rem', color: '#FFBD00' }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.62)' }}>{text}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* ── Right: glassmorphism capability card ── */}
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{
                background: 'rgba(255,255,255,0.055)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '24px', p: 4,
              }}>
                <Typography sx={{
                  color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem',
                  letterSpacing: '2.5px', textTransform: 'uppercase', mb: 3, fontWeight: 700,
                }}>
                  ขีดความสามารถของระบบ
                </Typography>

                {[
                  { value: '7+',   label: 'หน่วยงานที่เชื่อมต่อ',        sub: 'กองทรัพยากรบุคคล · อาคาร · ดิจิทัล และอื่น ๆ', color: '#FFBD00' },
                  { value: '5',    label: 'ระดับสิทธิ์การเข้าถึง',        sub: 'Admin · Officer · Faculty · Executive · User',    color: '#A78BFA' },
                  { value: 'AI',   label: 'จัดส่งอัตโนมัติด้วย NLP',     sub: 'วิเคราะห์ข้อความและส่งเรื่องตรงหน่วยงานที่เกี่ยวข้อง', color: '#34D399' },
                  { value: 'RT',   label: 'Real-time Notification',        sub: 'Socket.IO แจ้งเตือนทุก event ทันทีที่เกิดขึ้น',  color: '#60A5FA' },
                ].map((item, i) => (
                  <Box key={i}>
                    {i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', my: 2.5 }} />}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                      <Typography sx={{
                        color: item.color, fontWeight: 900,
                        fontSize: '1.75rem', lineHeight: 1, minWidth: 52, mt: 0.2, letterSpacing: '-1px',
                      }}>
                        {item.value}
                      </Typography>
                      <Box>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.3 }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mt: 0.4, lineHeight: 1.6 }}>
                          {item.sub}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>

          </Grid>
        </Container>

        {/* Scroll indicator */}
        <Box sx={{
          position: 'absolute', bottom: 28, left: '50%',
          transform: 'translateX(-50%)', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          color: 'rgba(255,255,255,0.30)',
          animation: 'bounce 2.2s infinite',
          '@keyframes bounce': {
            '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
            '50%':       { transform: 'translateX(-50%) translateY(9px)' },
          },
        }}>
          <Typography sx={{ fontSize: '0.6rem', letterSpacing: '3px', textTransform: 'uppercase', mb: 0.5 }}>SCROLL</Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: '1.4rem' }} />
        </Box>
      </Box>

      {/* ─── How it Works ────────────────────────────────── */}
      <Box sx={{ py: { xs: 8, md: 11 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography sx={{
              color: '#D61514', fontWeight: 800, fontSize: '0.75rem',
              letterSpacing: '3.5px', textTransform: 'uppercase', mb: 1.5,
            }}>
              ขั้นตอนการใช้งาน
            </Typography>
            <Typography sx={{
              fontWeight: 900, fontSize: { xs: '2rem', md: '2.6rem' },
              color: '#0D0D0D', lineHeight: 1.15, mb: 2,
            }}>
              ง่าย รวดเร็ว ใน 3 ขั้นตอน
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '1rem', maxWidth: 460, mx: 'auto', lineHeight: 1.9 }}>
              ออกแบบมาให้ทุกคนใช้งานได้ทันที ไม่ต้องผ่านการฝึกอบรม ไม่มีขั้นตอนที่ซับซ้อน
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {STEPS.map((step, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Box sx={{ position: 'relative', height: '100%' }}>
                  {/* Connector line */}
                  {i < 2 && (
                    <Box sx={{
                      display: { xs: 'none', md: 'block' },
                      position: 'absolute', top: 38, left: '58%', right: '-38%',
                      height: 2,
                      background: 'linear-gradient(90deg, #E5E7EB 0%, #FCA5A5 60%, #D61514 100%)',
                      zIndex: 0,
                    }} />
                  )}
                  <Box sx={{
                    bgcolor: '#fff',
                    border: '1.5px solid #F3F4F6',
                    borderRadius: '20px', p: 3.5,
                    boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
                    position: 'relative', zIndex: 1, height: '100%',
                    transition: 'all 0.24s',
                    '&:hover': {
                      boxShadow: '0 10px 44px rgba(214,21,20,0.13)',
                      borderColor: '#FCA5A5',
                      transform: 'translateY(-5px)',
                    },
                  }}>
                    {/* Step number watermark */}
                    <Typography sx={{
                      position: 'absolute', top: 14, right: 22,
                      color: '#F3F4F6', fontWeight: 900,
                      fontSize: '3.6rem', lineHeight: 1, userSelect: 'none',
                    }}>
                      {step.num}
                    </Typography>

                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 54, height: 54, borderRadius: '15px',
                      background: 'linear-gradient(135deg, #FEE2E2, #FFF5F5)',
                      mb: 2.5,
                    }}>
                      {step.icon}
                    </Box>

                    <Typography fontWeight={800} fontSize="1.05rem" color="#111" sx={{ mb: 1.2 }}>
                      {step.title}
                    </Typography>
                    <Typography fontSize="0.88rem" color="#6B7280" lineHeight={1.85}>
                      {step.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Features ────────────────────────────────────── */}
      <Box sx={{ py: { xs: 8, md: 11 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography sx={{
              color: '#D61514', fontWeight: 800, fontSize: '0.75rem',
              letterSpacing: '3.5px', textTransform: 'uppercase', mb: 1.5,
            }}>
              คุณสมบัติหลัก
            </Typography>
            <Typography sx={{
              fontWeight: 900, fontSize: { xs: '2rem', md: '2.6rem' },
              color: '#0D0D0D', lineHeight: 1.15, mb: 2,
            }}>
              ระบบที่สร้างขึ้นเพื่อ มฉก. โดยเฉพาะ
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '1rem', maxWidth: 500, mx: 'auto', lineHeight: 1.9 }}>
              ไม่ใช่ระบบสำเร็จรูปทั่วไป แต่ออกแบบตามโครงสร้างองค์กรและกระบวนการทำงานจริงของมหาวิทยาลัย
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {FEATURES.map((f, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Box sx={{
                  bgcolor: '#fff', borderRadius: '20px', p: 3.5,
                  border: '1.5px solid #F3F4F6',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  display: 'flex', gap: 2.5, height: '100%',
                  transition: 'all 0.24s',
                  '&:hover': {
                    boxShadow: '0 8px 36px rgba(0,0,0,0.1)',
                    transform: 'translateY(-4px)',
                    borderColor: f.color + '55',
                  },
                }}>
                  <Box sx={{
                    width: 54, height: 54, borderRadius: '15px', flexShrink: 0,
                    background: f.color + '14',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.color,
                  }}>
                    {f.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={800} fontSize="1rem" color="#111" sx={{ mb: 0.9 }}>{f.title}</Typography>
                    <Typography fontSize="0.87rem" color="#6B7280" lineHeight={1.85}>{f.desc}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Final CTA ───────────────────────────────────── */}
      <Box sx={{
        py: { xs: 8, md: 10 },
        background: 'linear-gradient(135deg, #8B0000 0%, #AA020B 35%, #D61514 65%, #C0392B 100%)',
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', inset: 0,
          backgroundImage: `url(${bgHcu})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.06, zIndex: 0,
        },
        '&::after': {
          content: '""', position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center top, rgba(255,189,0,0.08) 0%, transparent 60%)',
          zIndex: 0,
        },
      }}>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography sx={{
            color: 'rgba(255,255,255,0.55)', fontSize: '0.73rem',
            letterSpacing: '3.5px', textTransform: 'uppercase', fontWeight: 700, mb: 2.5,
          }}>
            พร้อมใช้งานแล้ว
          </Typography>
          <Typography sx={{
            color: '#fff', fontWeight: 900,
            fontSize: { xs: '2.2rem', md: '3rem' },
            lineHeight: 1.15, mb: 2.5, letterSpacing: '-0.5px',
          }}>
            เพราะปัญหาของคุณ
            <Box component="span" sx={{ color: '#FFBD00', display: 'block' }}>ไม่ควรถูกปล่อยทิ้งไว้</Box>
          </Typography>
          <Typography sx={{
            color: 'rgba(255,255,255,0.68)', fontSize: '1.02rem',
            lineHeight: 1.95, mb: 5.5, maxWidth: 520, mx: 'auto',
          }}>
            เข้าสู่ระบบหรือสมัครใช้งานด้วยอีเมล @hcu.ac.th ของคุณ
            เพื่อเริ่มแจ้งเรื่องและติดตามผลได้ทันที โดยไม่มีค่าใช้จ่ายใด ๆ
          </Typography>
          <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained" size="large"
              onClick={() => navigate('/login')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: '#FFBD00', color: '#AA020B', fontWeight: 800,
                px: 5, py: 1.8, fontSize: '1.05rem', borderRadius: '14px',
                textTransform: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
                transition: 'all 0.22s',
                '&:hover': { background: '#e8aa00', transform: 'translateY(-2px)', boxShadow: '0 14px 40px rgba(0,0,0,0.28)' },
              }}
            >
              เข้าสู่ระบบ
            </Button>
            <Button
              variant="outlined" size="large"
              onClick={() => navigate('/register')}
              sx={{
                borderColor: 'rgba(255,255,255,0.45)', color: '#fff', fontWeight: 700,
                px: 5, py: 1.8, fontSize: '1.05rem', borderRadius: '14px',
                textTransform: 'none',
                transition: 'all 0.22s',
                '&:hover': { borderColor: '#fff', background: 'rgba(255,255,255,0.09)', transform: 'translateY(-2px)' },
              }}
            >
              สมัครใช้งาน
            </Button>
          </Box>

          {/* Small trust note */}
          <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', mt: 4.5, fontWeight: 500 }}>
            รองรับเฉพาะบัญชี @hcu.ac.th · ข้อมูลทั้งหมดจัดเก็บอย่างปลอดภัยภายในระบบของมหาวิทยาลัย
          </Typography>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}

export default LandingPage;
