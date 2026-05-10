import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Footer from '../../components/Footer';
import { AppBar, Toolbar, Typography, Button, Container, Box, TextField, Alert, CircularProgress, Link, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import loginBg from '../../assets/login.register-hcu.jpg';

const mapFirebaseError = (msg) => {
  if (!msg) return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  if (msg.includes('invalid-credential') || msg.includes('user-not-found') || msg.includes('wrong-password'))
    return 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
  if (msg.includes('too-many-requests'))
    return 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
  if (msg.includes('network-request-failed'))
    return 'ไม่สามารถเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต';
  if (msg.includes('บัญชีนี้ไม่ได้รับอนุญาต'))
    return msg;
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่';
};

function LoginPage({ role }) {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = role === 'officer'
      ? 'เข้าสู่ระบบ (เจ้าหน้าที่) | มฉก.'
      : 'เข้าสู่ระบบ | มฉก.';
  }, [role]);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, resetPassword } = useAuth();

  // Forgot password dialog state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState(null); // 'success' | 'error' | null
  const [forgotMsg, setForgotMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    }

    if (!formData.password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const raw = formData.username.trim();
      const email = raw.includes('@') ? raw : `${raw}@hcu.ac.th`;
      await login(email, formData.password, role);
    } catch (error) {
      setErrors({ submit: mapFirebaseError(error.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail.trim()) {
      setForgotStatus('error');
      setForgotMsg('กรุณากรอกอีเมล');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotStatus(null);
      const raw = forgotEmail.trim();
      const email = raw.includes('@') ? raw : `${raw}@hcu.ac.th`;
      await resetPassword(email);
      setForgotStatus('success');
      setForgotMsg(`ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ ${email} แล้ว กรุณาตรวจสอบอีเมล`);
    } catch (err) {
      setForgotStatus('error');
      if (err.message?.includes('user-not-found')) {
        setForgotMsg('ไม่พบบัญชีที่ใช้อีเมลนี้');
      } else {
        setForgotMsg('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundImage: `url(${loginBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 0,
      }
    }}>
      {/* AppBar */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ background: 'transparent', zIndex: 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, color: '#fff', fontSize: '1.1rem', lineHeight: 1.2 }}>
            ระบบรับเรื่องร้องเรียน มฉก.
          </Typography>

        </Toolbar>
      </AppBar>

      {/* Login Form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="sm">
          <Box sx={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(30px)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            p: { xs: 3, sm: 5 },
          }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Box sx={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 12px 30px rgba(214, 21, 20, 0.3)',
              }}>
                <LockIcon sx={{ color: '#fff', fontSize: 44 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#111827' }}>
                {role === 'officer' ? 'เจ้าหน้าที่เข้าสู่ระบบ' : 'ยินดีต้อนรับกลับ'}
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>
                {role === 'officer' ? 'เข้าถึงแดชบอร์ดการจัดการ' : 'เข้าถึงบัญชีของคุณ'}
              </Typography>
            </Box>

            {/* Error Alert */}
            {errors.submit && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', fontWeight: 600 }}>
                {errors.submit}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="ชื่อผู้ใช้"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={Boolean(errors.username)}
                helperText={errors.username}
                fullWidth
                variant="outlined"
                placeholder="ชื่อนักศึกษา หรือรหัสนักศึกษา"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#D61514', mr: 1.5 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="รหัสผ่าน"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={Boolean(errors.password)}
                helperText={errors.password}
                fullWidth
                variant="outlined"
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#D61514', mr: 1.5 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                sx={{
                  py: 1.8,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  mt: 2,
                  background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'เข้าสู่ระบบ'}
              </Button>
            </Box>

            {/* Register Link */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                ยังไม่มีบัญชี?{' '}
                <Box
                  component="button"
                  onClick={() => navigate(role === 'officer' ? '/officer/register' : '/register')}
                  sx={{
                    background: 'none',
                    border: 'none',
                    color: '#D61514',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  ลงทะเบียน
                </Box>
              </Typography>
            </Box>
          </Box>

          {/* Forgot Password Link */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              ลืมรหัสผ่าน?{' '}
              <Link
                onClick={() => { setForgotOpen(true); setForgotEmail(''); setForgotStatus(null); setForgotMsg(''); }}
                sx={{ color: '#fff', fontWeight: 700, cursor: 'pointer', textDecorationColor: '#fff' }}
              >
                รีเซ็ตที่นี่
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#D61514', pb: 0 }}>รีเซ็ตรหัสผ่าน</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, mt: 1 }}>
            กรอกชื่อผู้ใช้หรืออีเมล ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้
          </Typography>
          {forgotStatus === 'success' && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '10px', fontWeight: 600 }}>{forgotMsg}</Alert>
          )}
          {forgotStatus === 'error' && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontWeight: 600 }}>{forgotMsg}</Alert>
          )}
          {forgotStatus !== 'success' && (
            <TextField
              label="ชื่อผู้ใช้หรืออีเมล"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              fullWidth
              size="small"
              onKeyDown={(e) => e.key === 'Enter' && handleForgotSubmit()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#D61514', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setForgotOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>ปิด</Button>
          {forgotStatus !== 'success' && (
            <Button
              onClick={handleForgotSubmit}
              variant="contained"
              disabled={forgotLoading}
              sx={{ borderRadius: '10px', fontWeight: 700, bgcolor: '#D61514', '&:hover': { bgcolor: '#AA020B' } }}
            >
              {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'ส่งลิงก์รีเซ็ต'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Footer />
    </Box>
  );
}

export default LoginPage;
