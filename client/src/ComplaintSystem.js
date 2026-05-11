// ─────────────────────────────────────────────────────────────────────────────
// ComplaintSystem.js — หน้าหลักสำหรับผู้ใช้ (role='user')
// ควบคุม: home | dashboard | report | check status
// ทำงานร่วมกับ: Sidebar, DashboardPage, ReportPage, CheckStatusPage, NotificationBell
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/user/DashboardPage';
import ReportPage from './pages/user/ReportPage';
import CheckStatusPage from './pages/user/CheckStatusPage';
import {
  Typography,
  Box,
  Container,
  Button,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import logoHcu from './assets/logo-hcu.png';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SearchIcon from '@mui/icons-material/Search';
import NotificationBell from './components/NotificationBell';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SecurityIcon from '@mui/icons-material/Security';
import HubIcon from '@mui/icons-material/Hub';
import ApartmentIcon from '@mui/icons-material/Apartment';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import BarChartIcon from '@mui/icons-material/BarChart';

function ComplaintSystem() {
  const { user, logout, userRole, sessionExpiring, extendSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // derive current view from URL path
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/report')) return 'report';
    if (path.includes('/check')) return 'check';
    return 'home';
  };
  const view = getCurrentView();

  useEffect(() => {
    const titles = {
      home: 'หน้าหลัก | ระบบร้องเรียน มฉก.',
      dashboard: 'แดชบอร์ด | ระบบร้องเรียน มฉก.',
      report: 'แจ้งเรื่องร้องเรียน | ระบบร้องเรียน มฉก.',
      check: 'ตรวจสอบสถานะ | ระบบร้องเรียน มฉก.',
    };
    document.title = titles[view] || 'ระบบร้องเรียน มฉก.';
  }, [view]);

  const goTo = (key) => {
    const paths = {
      home: '/complaints',
      dashboard: '/complaints/dashboard',
      report: '/complaints/report',
      check: '/complaints/check',
    };
    navigate(paths[key] || '/complaints');
  };
  // modal แสดงข้อมูลเกี่ยวกับระบบ
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoContent, setInfoContent] = useState('');
  // เก็บ ID ของเรื่องร้องเรียนเมื่อคลิก notification (เพื่อเปิดตรวจสอบสถานะโดยตรง)
  const [checkComplaintId, setCheckComplaintId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // สำหรับ user profile menu



  const openReport = () => {
    goTo('report');
  };

  const openCheck = () => {
    goTo('check');
  };

  // เมื่อคลิก notification → เปิดหน้า check status พร้อมโหลดเรื่องร้องเรียนนั้นๆ
  const handleNotifClick = (notif) => {
    setCheckComplaintId(notif.complaintId || null);
    goTo('check');
  };

  const openAbout = () => {
    setInfoContent('ระบบจัดการข้อร้องเรียนภายในมหาวิทยาลัย\nเวอร์ชันสาธิต - สำหรับการพัฒนาเท่านั้น');
    setInfoDialogOpen(true);
  };





  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8F9FA' }}>
      <Sidebar
          userRole={userRole}
          onNavigate={(key) => {
            if (key === 'home') goTo('home');
            if (key === 'dashboard') goTo('dashboard');
            if (key === 'report') openReport();
            if (key === 'check') openCheck();
            if (key === 'about') openAbout();
          }}
          current={view}
          onLogout={async () => { await logout(); }}
        />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Yellow Header */}
        <Box sx={{ background: '#FFBD00', py: 1.5, px: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', position: 'sticky', top: 0, zIndex: 1100 }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box component="img" src={logoHcu} alt="HCU Logo" sx={{ height: 44, width: 'auto', objectFit: 'contain' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <NotificationBell iconColor="#AA020B" onNotifClick={handleNotifClick} />
                <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ color: '#AA020B', '&:hover': { backgroundColor: 'rgba(170, 2, 11, 0.1)' } }}
              >
                <AccountCircleIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 180 } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled sx={{ fontWeight: 700, color: '#D61514', fontSize: '0.9rem', opacity: '1 !important' }}>
                  {user?.displayName || user?.email}
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={async () => { setAnchorEl(null); await logout(); }}
                  sx={{ color: '#D61514', gap: 1, '&:hover': { bgcolor: '#FEE2E2' } }}
                >
                  <LogoutIcon fontSize="small" />
                  ออกจากระบบ
                </MenuItem>
              </Menu>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
          {view === 'home' ? (
            <Container maxWidth="lg" sx={{ py: 4 }}>
              {/* Hero Section */}
              <Card sx={{ position: 'relative', mb: 6, borderRadius: 3, overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  image={require('./assets/Photo_university.jpg')}
                  alt="มหาวิทยาลัย"
                  sx={{ height: 300, objectFit: 'cover' }}
                />
                <CardContent sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  bgcolor: 'rgba(0,0,0,0.5)',
                  borderRadius: 3,
                }}>
                  <Box sx={{ textAlign: 'center', color: '#fff' }}>
                    <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>
                      ระบบจัดการข้อร้องเรียน
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.95, color: '#fff', maxWidth: 560, mx: 'auto', lineHeight: 1.8 }}>
                      ระบบกลางรับเรื่องร้องเรียนและแก้ไขปัญหา เพื่อพัฒนาคุณภาพบริการภายในมหาวิทยาลัย
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* CTA Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 6, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large" 
                  onClick={openReport}
                  sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 700 }}
                  startIcon={<ReportProblemIcon />}
                >
                  ส่งเรื่องร้องเรียน
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="large" 
                  onClick={() => openCheck()}
                  sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 700 }}
                  startIcon={<SearchIcon />}
                >
                  ตรวจสอบสถานะ
                </Button>
              </Box>

              {/* Features Section */}
              <Box sx={{ mb: 6 }}>
                <Typography variant="h4" align="center" sx={{ fontWeight: 800, mb: 1.5, color: '#222' }}>
                  ระบบนี้ช่วยอะไรคุณได้บ้าง?
                </Typography>
                <Typography align="center" sx={{ color: '#555', mb: 1, maxWidth: '660px', mx: 'auto', fontSize: '0.97rem', lineHeight: 1.85 }}>
                  ยกระดับธรรมาภิบาลข้อมูลและการจัดการข้อร้องเรียนด้วย{' '}
                  <Box component="span" sx={{ color: '#D61514', fontWeight: 700 }}>ระบบดิจิทัลอัจฉริยะ</Box>
                  {' '}ที่แม่นยำ โปร่งใส และตรวจสอบได้จริง
                </Typography>
                <Box sx={{ width: 50, height: 3, background: '#D61514', mx: 'auto', borderRadius: 2, mb: 4 }} />

                <Grid container spacing={3}>
                  {/* Card 1 - AI-Assisted */}
                  <Grid item xs={6}>
                    <Card sx={{
                      height: '100%', borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      transition: 'transform 0.22s, box-shadow 0.22s',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 32px rgba(0,0,0,0.13)' },
                    }}>
                      <Box sx={{ p: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box sx={{ background: 'rgba(214,21,20,0.1)', borderRadius: '12px', p: 1.2, display: 'flex' }}>
                            <AssignmentIcon sx={{ color: '#D61514', fontSize: '1.8rem' }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: '#222', fontSize: '0.97rem', lineHeight: 1.3 }}>ส่งเรื่องร้องเรียนได้ง่าย</Typography>
                            <Chip label="AI-Assisted" size="small" sx={{ background: '#D61514', color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 20, mt: 0.4 }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.85, fontSize: '0.87rem' }}>
                          ระบบ AI-Assisted ช่วยวิเคราะห์คำอธิบายปัญหาและแนะนำหมวดหมู่ให้อัตโนมัติ ลดความผิดพลาดในการกรอกข้อมูล
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Card 2 - Real-time Tracking */}
                  <Grid item xs={6}>
                    <Card sx={{
                      height: '100%', borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      transition: 'transform 0.22s, box-shadow 0.22s',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 32px rgba(0,0,0,0.13)' },
                    }}>
                      <Box sx={{ p: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box sx={{ background: 'rgba(255,189,0,0.15)', borderRadius: '12px', p: 1.2, display: 'flex' }}>
                            <NotificationsActiveIcon sx={{ color: '#AE7517', fontSize: '1.8rem' }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: '#222', fontSize: '0.97rem', lineHeight: 1.3 }}>ตรวจสอบสถานะได้ตลอดเวลา</Typography>
                            <Chip label="Real-time Tracking" size="small" sx={{ background: '#FFBD00', color: '#AA020B', fontWeight: 700, fontSize: '0.7rem', height: 20, mt: 0.4 }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.85, fontSize: '0.87rem' }}>
                          ติดตามสถานะเชิงประจักษ์ผ่านระบบ Stepper Progress และรับการแจ้งเตือนแบบเรียลไทม์ในทุกขั้นตอนการดำเนินงาน
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Card 3 - Data Governance */}
                  <Grid item xs={6}>
                    <Card sx={{
                      height: '100%', borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      transition: 'transform 0.22s, box-shadow 0.22s',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 32px rgba(0,0,0,0.13)' },
                    }}>
                      <Box sx={{ p: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box sx={{ background: 'rgba(25,118,210,0.1)', borderRadius: '12px', p: 1.2, display: 'flex' }}>
                            <SecurityIcon sx={{ color: '#1565C0', fontSize: '1.8rem' }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: '#222', fontSize: '0.97rem', lineHeight: 1.3 }}>ข้อมูลเป็นความลับ</Typography>
                            <Chip label="Data Governance" size="small" sx={{ background: '#1565C0', color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 20, mt: 0.4 }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.85, fontSize: '0.87rem' }}>
                          มั่นใจด้วยระบบปกปิดตัวตน (Data Masking) และการควบคุมสิทธิ์เข้าถึงข้อมูลตามบทบาท (RBAC) เพื่อความเป็นกลางสูงสุด
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Card 4 - Dynamic System */}
                  <Grid item xs={6}>
                    <Card sx={{
                      height: '100%', borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      transition: 'transform 0.22s, box-shadow 0.22s',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 32px rgba(0,0,0,0.13)' },
                    }}>
                      <Box sx={{ p: 3.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box sx={{ background: 'rgba(46,125,50,0.1)', borderRadius: '12px', p: 1.2, display: 'flex' }}>
                            <HubIcon sx={{ color: '#2E7D32', fontSize: '1.8rem' }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: '#222', fontSize: '0.97rem', lineHeight: 1.3 }}>การจัดการเชิงพลวัต</Typography>
                            <Chip label="Dynamic System" size="small" sx={{ background: '#2E7D32', color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 20, mt: 0.4 }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.85, fontSize: '0.87rem' }}>
                          เชื่อมโยงฐานข้อมูลรวมศูนย์เพื่อความถูกต้องของอัตลักษณ์บุคคล และรองรับการขยายขอบเขตหน่วยงานได้ทันที
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Quick Stats Bar */}
              <Box sx={{ background: '#1A1A2E', borderRadius: '16px', py: 4, px: 3, mb: 6 }}>
                <Grid container spacing={2} justifyContent="center" alignItems="center" textAlign="center">
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ borderRight: { sm: '1px solid rgba(255,255,255,0.12)' }, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                        <ApartmentIcon sx={{ color: '#FFBD00', fontSize: '1.5rem' }} />
                        <Typography sx={{ color: '#FFBD00', fontWeight: 900, fontSize: '1.8rem', lineHeight: 1 }}>7+</Typography>
                      </Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        หน่วยงานภายในที่เชื่อมต่อกับระบบ
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ borderRight: { sm: '1px solid rgba(255,255,255,0.12)' }, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                        <VpnLockIcon sx={{ color: '#FFBD00', fontSize: '1.5rem' }} />
                        <Typography sx={{ color: '#FFBD00', fontWeight: 900, fontSize: '1.15rem', lineHeight: 1 }}>@hcu.ac.th</Typography>
                      </Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        รองรับบัญชีมหาวิทยาลัยเพื่อความปลอดภัยของข้อมูล
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                        <BarChartIcon sx={{ color: '#FFBD00', fontSize: '1.5rem' }} />
                        <Typography sx={{ color: '#FFBD00', fontWeight: 900, fontSize: '1.15rem', lineHeight: 1 }}>RBAC + NLP</Typography>
                      </Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        เทคโนโลยีควบคุมสิทธิ์และประมวลผลภาษาธรรมชาติ
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Container>
          ) : view === 'dashboard' ? (
            <DashboardPage onBack={() => goTo('home')} />
          ) : view === 'report' ? (
            <ReportPage onBack={() => goTo('home')} onCheck={() => goTo('check')} />
          ) : (
            <CheckStatusPage
              onBack={() => { goTo('home'); setCheckComplaintId(null); }}
              initialComplaintId={checkComplaintId}
            />
          )}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      {/* ─── Info Dialog ─────────────────────────────── */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#E8ECFF', color: '#5E72E4' }}>ข้อมูล</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography>{infoContent}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)} variant="contained" color="primary">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Session Timeout Warning Dialog ─────────────────── */}
      <Dialog open={sessionExpiring} maxWidth="xs" fullWidth disableEscapeKeyDown>
        <DialogTitle sx={{
          bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          ⏰ เซสชันใกล้หมดอายุ
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            ระยะเวลาการใช้งานของคุณกำลังจะสิ้นสุดในอีก <strong>2 นาที</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: '#757575' }}>
            ต้องการใช้งานต่อหรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => { logout(); }}
            variant="outlined"
            sx={{ color: '#757575', borderColor: '#BDBDBD', '&:hover': { borderColor: '#757575' } }}
          >
            ออกจากระบบ
          </Button>
          <Button
            onClick={extendSession}
            variant="contained"
            sx={{ bgcolor: '#D61514', '&:hover': { bgcolor: '#AA020B' }, fontWeight: 700 }}
          >
            ใช้งานต่อ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ComplaintSystem;
