import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Container, Grid,
  Box, Chip,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import bgHcu from '../../assets/bg-hcu.jpg';
import Footer from '../../components/Footer';

function LandingPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'ยินดีต้อนรับ | ระบบร้องเรียน มฉก.'; }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* ─── Hero — full viewport ────────────────────────── */}
      <Box sx={{
        minHeight: '100vh',
        backgroundImage: `url(${bgHcu})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(170,2,11,0.90) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.60) 100%)',
          zIndex: 0,
        },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Box sx={{ maxWidth: 680 }}>
            {/* Official badge */}
            <Box sx={{ mb: 3 }}>
              <Chip
                label="✦  ระบบอย่างเป็นทางการ มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ"
                sx={{
                  background: 'rgba(255,189,0,0.14)',
                  border: '1px solid rgba(255,189,0,0.45)',
                  color: '#FFBD00', fontWeight: 700,
                  fontSize: '0.77rem', letterSpacing: '0.3px',
                  height: 32, borderRadius: '100px',
                }}
              />
            </Box>

            {/* Title */}
            <Typography sx={{
              color: '#fff', fontWeight: 900,
              fontSize: { xs: '2.4rem', md: '3.4rem' },
              lineHeight: 1.15, mb: 2.5, letterSpacing: '-0.5px',
            }}>
              ยินดีต้อนรับสู่
              <Box component="span" sx={{ color: '#FFBD00', display: 'block' }}>
                ระบบจัดการข้อร้องเรียน
              </Box>
            </Typography>

            {/* Subtitle */}
            <Typography sx={{
              color: 'rgba(255,255,255,0.78)',
              fontSize: { xs: '1rem', md: '1.08rem' },
              lineHeight: 1.9, mb: 5, maxWidth: 540,
            }}>
              นวัตกรรมการจัดการสารสนเทศ ด้วยเทคโนโลยี AI และระบบดิจิทัลอัจฉริยะ
              เพื่อยกระดับมาตรฐานการบริการและคุณภาพชีวิตภายในมหาวิทยาลัย
            </Typography>

            {/* CTA buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 5 }}>
              <Button
                variant="contained" size="large"
                onClick={() => navigate('/login')}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  background: '#FFBD00', color: '#AA020B',
                  fontWeight: 800, px: 4, py: 1.6, fontSize: '1rem',
                  borderRadius: '12px', textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(255,189,0,0.4)',
                  transition: 'all 0.2s',
                  '&:hover': { background: '#e8aa00', transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(255,189,0,0.5)' },
                }}
              >
                เข้าสู่ระบบ
              </Button>
              <Button
                variant="outlined" size="large"
                onClick={() => navigate('/register')}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)', color: '#fff',
                  fontWeight: 700, px: 4, py: 1.6, fontSize: '1rem',
                  borderRadius: '12px', textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#fff', background: 'rgba(255,255,255,0.1)', transform: 'translateY(-2px)' },
                }}
              >
                สมัครใช้งาน
              </Button>
            </Box>

            {/* Trust indicators */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {['ปลอดภัย 100%', 'ใช้งานฟรี', 'ข้อมูลเป็นความลับ'].map((text) => (
                <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <CheckCircleIcon sx={{ fontSize: '1rem', color: '#FFBD00' }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.72)' }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>

        {/* Scroll indicator */}
        <Box sx={{
          position: 'absolute', bottom: 28, left: '50%',
          transform: 'translateX(-50%)', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          color: 'rgba(255,255,255,0.45)',
          animation: 'bounce 2s infinite',
          '@keyframes bounce': {
            '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
            '50%': { transform: 'translateX(-50%) translateY(8px)' },
          },
        }}>
          <Typography sx={{ fontSize: '0.65rem', letterSpacing: '2.5px', textTransform: 'uppercase', mb: 0.3 }}>
            เลื่อนลง
          </Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: '1.6rem' }} />
        </Box>
      </Box>

      {/* ─── Stats Bar ────────────────────────────────────── */}
      <Box sx={{ display: 'none' }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="center" alignItems="center" textAlign="center">
            {[
              { icon: <ApartmentIcon sx={{ fontSize: '1.5rem' }} />, value: '7+', label: 'หน่วยงานภายในที่เชื่อมต่อ', large: true },
              { icon: <VpnLockIcon sx={{ fontSize: '1.5rem' }} />, value: '@hcu.ac.th', label: 'รองรับบัญชีมหาวิทยาลัยเพื่อความปลอดภัย', large: false },
              { icon: <BarChartIcon sx={{ fontSize: '1.5rem' }} />, value: 'RBAC + NLP', label: 'เทคโนโลยีควบคุมสิทธิ์และประมวลผลภาษา', large: false },
            ].map((stat, i) => (
              <Grid item xs={12} sm={4} key={i}>
                <Box sx={{ px: 3, borderRight: i < 2 ? { sm: '1px solid rgba(255,255,255,0.1)' } : {} }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ color: '#FFBD00' }}>{stat.icon}</Box>
                    <Typography sx={{ color: '#FFBD00', fontWeight: 900, lineHeight: 1, fontSize: stat.large ? '2rem' : '1.2rem' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Footer ────────────────────────────────────────── */}
      <Footer />

    </Box>
  );
}

export default LandingPage;
