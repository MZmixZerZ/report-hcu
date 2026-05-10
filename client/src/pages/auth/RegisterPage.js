import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import api from '../../api';
import Footer from '../../components/Footer';
import { AppBar, Toolbar, Typography, Button, Container, Box, TextField, Alert, CircularProgress, InputAdornment, FormControl, Select, MenuItem, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import loginBg from '../../assets/login.register-hcu.jpg';

const FACULTY_MAJORS = {
  'คณะกายภาพบำบัด': [
    'สาขาวิชากายภาพบำบัด',
  ],
  'คณะการแพทย์แผนจีน': [
    'การแพทย์แผนจีนบัณฑิต',
  ],
  'คณะเทคนิคการแพทย์': [
    'สาขาวิชาเทคนิคการแพทย์',
  ],
  'คณะนิติศาสตร์': [
    'สาขาวิชานิติศาสตร์',
  ],
  'คณะนิเทศศาสตร์': [
    'กลุ่มวิชาชีพนวัตกรรมการสื่อสารดิจิทัล',
    'กลุ่มวิชาชีพศิลปกรรมสร้างสรรค์',
    'กลุ่มวิชาชีพศิลปะการแสดง',
    'กลุ่มวิชาชีพดนตรีและการขับร้อง',
  ],
  'คณะบริหารธุรกิจ': [
    'หลักสูตรบัญชีบัณฑิต',
    'วิชาเอกการจัดการและการเป็นผู้ประกอบการ',
    'วิชาเอกการตลาด',
    'วิชาเอกการจัดการธุรกิจระหว่างประเทศ',
    'วิชาเอกธุรกิจดิจิทัล',
    'สาขาวิชาการจัดการโลจิสติกส์และโซ่อุปทาน',
    'สาขาวิชาธุรกิจจีน (หลักสูตรพหุวิทยาการ)',
    'สาขาวิชาการจัดการอุตสาหกรรม (ป.โท)',
    'สาขาวิชาธุรกิจดิจิทัล (ป.โท)',
  ],
  'คณะพยาบาลศาสตร์': [
    'หลักสูตรพยาบาลศาสตรบัณฑิต',
    'สาขาวิชาการพยาบาลเวชปฏิบัติชุมชน (ป.โท)',
  ],
  'คณะเภสัชศาสตร์': [
    'หลักสูตรเภสัชศาสตรบัณฑิต (Doctor of Pharmacy)',
  ],
  'คณะวิทยาศาสตร์และเทคโนโลยี': [
    'สาขาวิชาวิทยาการคอมพิวเตอร์',
    'สาขาวิชาวิทยาศาสตร์การแพทย์',
    'สาขาวิชาปัญญาประดิษฐ์',
    'สาขาวิชาวิทยาการหุ่นยนต์สุขภาพ (หลักสูตรพหุวิทยาการ) (หลักสูตรนานาชาติ)',
  ],
  'คณะศิลปศาสตร์': [
    'สาขาวิชาภาษาอังกฤษ',
    'สาขาวิชาภาษาอังกฤษและภาษาจีน',
    'สาขาวิชาการสื่อสารภาษาไทยเป็นภาษาที่สอง',
  ],
  'คณะสังคมสงเคราะห์ศาสตร์และสวัสดิการสังคม': [
    'หลักสูตรสังคมสงเคราะห์ศาสตรบัณฑิต',
    'สาขาวิชาการบริหารสวัสดิการสังคม (ป.โท)',
    'สาขาวิชาการบริหารสวัสดิการสังคม (ป.เอก)',
  ],
  'คณะสาธารณสุขศาสตร์ และสิ่งแวดล้อม': [
    'สาขาวิชาการจัดการเวชระเบียนและเวชสถิติโรงพยาบาล',
    'สาขาวิชาอาชีวอนามัยและความปลอดภัย',
    'สาขาวิชาสาธารณสุขชุมชน',
    'สาขาวิชาการบริการทางการแพทย์',
    'สาขาวิชาการจัดการและบรรเทาสาธารณภัย',
  ],
  'วิทยาลัยจีนศึกษา': [
    'สาขาวิชาภาษาจีนธุรกิจ',
    'สาขาวิชาภาษาและวัฒนธรรมจีน',
    'สาขาวิชาจีนศึกษา',
    'สาขาวิชาการสอนภาษาจีน',
    'สาขาวิชาภาษาจีนเพื่อการสื่อสารเชิงธุรกิจ',
  ],
};
const STATIC_FACULTIES = Object.keys(FACULTY_MAJORS);

function RegisterPage({ role }) {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = role === 'officer'
      ? 'ลงทะเบียน (เจ้าหน้าที่) | มฉก.'
      : 'ลงทะเบียน | มฉก.';
  }, [role]);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  // userType: 'student' | 'staff'
  const [userType, setUserType] = useState('student');
  // Student fields
  const [faculty, setFaculty] = useState('');
  const [facultyOptions, setFacultyOptions] = useState(STATIC_FACULTIES);
  const [major, setMajor] = useState('');
  const majorOptions = faculty ? (FACULTY_MAJORS[faculty] || []) : [];
  // Staff fields
  const [department, setDepartment] = useState('');
  const [subDepartment, setSubDepartment] = useState('');
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  useEffect(() => {
    // Load faculty list from admin endpoint
    api.get('/admin/faculties').then(r => {
      const fetched = r.data.map(f => f.label);
      if (fetched.length > 0) setFacultyOptions(fetched);
    }).catch(() => {});
    // Load department list from public endpoint
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/departments/public`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setDepartmentOptions(data); })
      .catch(() => {});
  }, []);

  // Get sub-departments for the currently selected department
  const selectedDeptObj = departmentOptions.find(d => d.name === department);
  const subDepts = selectedDeptObj?.subDepartments || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'กรุณากรอกรหัสนักศึกษา / รหัสบุคลากร';
    } else if (/\s/.test(formData.username)) {
      newErrors.username = 'รหัสไม่ควรมีช่องว่าง';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }

    if (role !== 'officer') {
      if (userType === 'student') {
        if (!faculty) newErrors.faculty = 'กรุณาเลือกคณะที่สังกัด';
        if (!major.trim()) newErrors.major = 'กรุณากรอกสาขาวิชา';
      } else {
        if (!department) newErrors.department = 'กรุณาเลือกหน่วยงานที่สังกัด';
      }
    }

    if (!formData.password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (formData.password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      setLoading(true);
      const email = `${formData.username.trim()}@hcu.ac.th`;
      const displayName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      if (userType === 'student') {
        await register(email, formData.password, displayName, role, faculty, 'student', faculty, major.trim());
      } else {
        await register(email, formData.password, displayName, role, '', 'staff', department, subDepartment);
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
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
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>
            COMPLAINT HUB
          </Typography>
          <Button color="inherit" onClick={() => navigate(role === 'officer' ? '/officer/login' : '/login')} startIcon={<ArrowBackIcon />} sx={{ color: '#fff', fontWeight: 600 }}>
            กลับ
          </Button>
        </Toolbar>
      </AppBar>

      {/* Registration Form */}
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
                <PersonIcon sx={{ color: '#fff', fontSize: 44 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#111827' }}>
                {role === 'officer' ? 'สมัครเจ้าหน้าที่' : 'ลงทะเบียน'}
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>
                สร้างบัญชีใหม่และเริ่มต้นวันนี้
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
                label="รหัสนักศึกษา / รหัสบุคลากร"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={Boolean(errors.username)}
                helperText={errors.username || 'ใช้เป็น Username สำหรับเข้าสู่ระบบ ไม่ต้องมีช่องว่าง'}
                fullWidth
                placeholder="เช่น 6501234567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#D61514', mr: 1.5 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="ชื่อ"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName}
                  fullWidth
                  placeholder="เช่น สมชาย"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#D61514', mr: 1.5 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="นามสกุล"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName}
                  fullWidth
                  placeholder="เช่น ใจดี"
                />
              </Box>
              <TextField
                label="รหัสผ่าน"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={Boolean(errors.password)}
                helperText={errors.password}
                fullWidth
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#D61514', mr: 1.5 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="ยืนยันรหัสผ่าน"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword}
                fullWidth
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#D61514', mr: 1.5 }} />
                    </InputAdornment>
                  ),
                }}
              />
              {role !== 'officer' && (
                <>
                  {/* User Type Toggle */}
                  <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', mb: 1.5 }}>
                      ประเภทผู้ใช้ <span style={{ color: '#EF4444' }}>*</span>
                    </Typography>
                    <ToggleButtonGroup
                      value={userType}
                      exclusive
                      onChange={(_, v) => { if (v) { setUserType(v); setFaculty(''); setMajor(''); setDepartment(''); setSubDepartment(''); setErrors({}); } }}
                      fullWidth
                      sx={{ borderRadius: '12px', overflow: 'hidden' }}
                    >
                      <ToggleButton value="student" sx={{ py: 1.2, fontWeight: 700, fontSize: '0.9rem', gap: 1 }}>
                        <SchoolIcon fontSize="small" /> นักศึกษา
                      </ToggleButton>
                      <ToggleButton value="staff" sx={{ py: 1.2, fontWeight: 700, fontSize: '0.9rem', gap: 1 }}>
                        <BusinessIcon fontSize="small" /> บุคลากร
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Student: คณะ + สาขาวิชา */}
                  {userType === 'student' && (
                    <>
                      <Box>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', mb: 1 }}>
                          คณะที่สังกัด <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        <FormControl fullWidth error={Boolean(errors.faculty)}>
                          <Select
                            value={faculty}
                            onChange={(e) => { setFaculty(e.target.value); setMajor(''); }}
                            displayEmpty
                            startAdornment={<InputAdornment position="start"><SchoolIcon sx={{ color: '#D61514', ml: 1.5 }} /></InputAdornment>}
                            sx={{ borderRadius: '12px' }}
                          >
                            <MenuItem value="" disabled><em style={{ color: '#9CA3AF' }}>-- เลือกคณะ --</em></MenuItem>
                            {facultyOptions.map(f => (
                              <MenuItem key={f} value={f}>{f}</MenuItem>
                            ))}
                          </Select>
                          {errors.faculty && <Typography variant="caption" sx={{ color: '#EF4444', mt: 0.5, ml: 2 }}>{errors.faculty}</Typography>}
                        </FormControl>
                      </Box>
                      {majorOptions.length > 0 && (
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', mb: 1 }}>
                            สาขาวิชา / หลักสูตร <span style={{ color: '#EF4444' }}>*</span>
                          </Typography>
                          <FormControl fullWidth error={Boolean(errors.major)}>
                            <Select
                              value={major}
                              onChange={(e) => setMajor(e.target.value)}
                              displayEmpty
                              startAdornment={<InputAdornment position="start"><SchoolIcon sx={{ color: '#6366F1', ml: 1.5 }} /></InputAdornment>}
                              sx={{ borderRadius: '12px' }}
                            >
                              <MenuItem value="" disabled><em style={{ color: '#9CA3AF' }}>-- เลือกสาขาวิชา --</em></MenuItem>
                              {majorOptions.map(m => (
                                <MenuItem key={m} value={m}>{m}</MenuItem>
                              ))}
                            </Select>
                            {errors.major && <Typography variant="caption" sx={{ color: '#EF4444', mt: 0.5, ml: 2 }}>{errors.major}</Typography>}
                          </FormControl>
                        </Box>
                      )}
                    </>
                  )}

                  {/* Staff: หน่วยงานหลัก + หน่วยงานย่อย */}
                  {userType === 'staff' && (
                    <>
                      <Box>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', mb: 1 }}>
                          หน่วยงานที่สังกัด <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        <FormControl fullWidth error={Boolean(errors.department)}>
                          <Select
                            value={department}
                            onChange={(e) => { setDepartment(e.target.value); setSubDepartment(''); }}
                            displayEmpty
                            startAdornment={<InputAdornment position="start"><BusinessIcon sx={{ color: '#D61514', ml: 1.5 }} /></InputAdornment>}
                            sx={{ borderRadius: '12px' }}
                          >
                            <MenuItem value="" disabled><em style={{ color: '#9CA3AF' }}>-- เลือกหน่วยงาน --</em></MenuItem>
                            {departmentOptions.map(d => (
                              <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                            ))}
                          </Select>
                          {errors.department && <Typography variant="caption" sx={{ color: '#EF4444', mt: 0.5, ml: 2 }}>{errors.department}</Typography>}
                        </FormControl>
                      </Box>
                      {subDepts.length > 0 && (
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', mb: 1 }}>
                            หน่วยงานย่อย <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(ถ้ามี)</span>
                          </Typography>
                          <FormControl fullWidth>
                            <Select
                              value={subDepartment}
                              onChange={(e) => setSubDepartment(e.target.value)}
                              displayEmpty
                              startAdornment={<InputAdornment position="start"><BusinessIcon sx={{ color: '#6366F1', ml: 1.5 }} /></InputAdornment>}
                              sx={{ borderRadius: '12px' }}
                            >
                              <MenuItem value=""><em style={{ color: '#9CA3AF' }}>-- ไม่ระบุ / ไม่มี --</em></MenuItem>
                              {subDepts.map(s => (
                                <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}
                    </>
                  )}
                </>
              )}
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'ลงทะเบียน'}
              </Button>
            </Box>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                มีบัญชีแล้ว?{' '}
                <Box
                  component="button"
                  onClick={() => navigate(role === 'officer' ? '/officer/login' : '/login')}
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
                  เข้าสู่ระบบ
                </Box>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}

export default RegisterPage;
