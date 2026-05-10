import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { useAuth } from '../../AuthContext';
import Footer from '../../components/Footer';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Grid,
  InputAdornment,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


function ReportPage({ onBack, onSubmit, onCheck }) {
  const { userFaculty } = useAuth();
  const [topic, setTopic] = useState('');
  const [topicOptions, setTopicOptions] = useState([]);
  const [issueOptions, setIssueOptions] = useState([]); // full objects { id, label, urgencyLabel, urgencyLevel }
  const [issue, setIssue] = useState('');
  const [issueId, setIssueId] = useState('');
  const [urgency, setUrgency] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [error, setError] = useState('');
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillChecked, setAutofillChecked] = useState(false);
  const [autofillError, setAutofillError] = useState('');
  const skipIssueResetRef = useRef(false); // set true when topic changed by autofill
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // Custom issue (not in list) state
  const [customIssueText, setCustomIssueText] = useState('');
  const [customIssueSubmitting, setCustomIssueSubmitting] = useState(false);
  const [customIssueSubmitted, setCustomIssueSubmitted] = useState(false);
  const [customIssueError, setCustomIssueError] = useState('');

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const res = await api.get('/admin/complaint-types');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const types = res.data.map((t) => t.label);
          setTopicOptions(types);
        } else {
          setTopicOptions([]);
        }
      } catch (err) {
        console.error('Failed to fetch complaint types from admin settings', err);
        setTopicOptions([]);
      }
    };
    loadTypes();
  }, []);

  // Fetch issues when topic changes (keep full objects for urgency auto-fill)
  useEffect(() => {
    if (topic) {
      const loadIssues = async () => {
        try {
          const typesRes = await api.get('/admin/complaint-types');
          const typeObj = typesRes.data.find(t => t.label === topic);
          if (typeObj) {
            const issuesRes = await api.get(`/admin/complaint-types/${typeObj.id}/issues`);
            setIssueOptions(issuesRes.data);
          } else {
            setIssueOptions([]);
          }
        } catch (err) {
          console.error('Failed to fetch issues from admin settings', err);
          setIssueOptions([]);
        }
        // Only reset issue/urgency if user manually changed topic (not autofill)
        if (!skipIssueResetRef.current) {
          setIssue('');
          setUrgency('');
        }
        skipIssueResetRef.current = false;
      };
      loadIssues();
    } else {
      setIssueOptions([]);
    }
  }, [topic]);

  // Button-triggered autofill: auto-applies best match, stores alternatives
  const handleAutofill = async () => {
    if (description.trim().length < 5) return;
    setAutofillError('');
    setAutofillChecked(false);
    try {
      setAutofillLoading(true);
      const res = await api.post('/complaints/autofill', { description });
      const sugg = res.data.suggestions || [];
      setAutofillChecked(true);
      if (sugg.length === 0) {
        setAutofillError('ไม่พบคำแนะนำที่ตรงกัน — คุณสามารถเลือกหัวข้อเองได้');
        return;
      }
      // Auto-apply top match — fetch issues directly then set everything
      const best = sugg[0];
      const bestIssue = best.issues[0] || null;
      try {
        const issuesRes = await api.get(`/admin/complaint-types/${best.topicId}/issues`);
        setIssueOptions(issuesRes.data);
      } catch (e) { /* useEffect will retry */ }
      skipIssueResetRef.current = true; // tell useEffect not to reset when topic changes
      setTopic(best.topic);
      if (bestIssue) {
        setIssue(bestIssue.label);
        setUrgency(bestIssue.urgencyLabel || '');
      }
    } catch (err) {
      console.error('Autofill error:', err);
      setAutofillError('เกิดข้อผิดพลาดในการวิเคราะห์ — คุณสามารถเลือกหัวข้อเองได้');
      setAutofillChecked(true);
    } finally { setAutofillLoading(false); }
  };



  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageBase64(ev.target.result);
      setImagePreviewUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleIssueChange = (selectedLabel) => {
    setIssue(selectedLabel);
    if (selectedLabel === '__custom__') {
      setIssueId('');
      setUrgency('ปานกลาง'); // default urgency for custom
      setCustomIssueText('');
      setCustomIssueSubmitted(false);
      setCustomIssueError('');
      return;
    }
    const issueObj = issueOptions.find(o => o.label === selectedLabel);
    setIssueId(issueObj?.id || '');
    if (issueObj?.urgencyLabel) {
      setUrgency(issueObj.urgencyLabel);
    } else {
      setUrgency('');
    }
  };

  const handleSubmitCustomIssue = async () => {
    if (!customIssueText.trim()) { setCustomIssueError('กรุณาระบุชื่อปัญหา'); return; }
    setCustomIssueError('');
    setCustomIssueSubmitting(true);
    try {
      const typesRes = await api.get('/admin/complaint-types');
      const typeObj = typesRes.data.find(t => t.label === topic);
      await api.post('/complaints/custom-issue', {
        topicId: typeObj?.id || '',
        topicLabel: topic,
        customIssueText: customIssueText.trim(),
      });
      setCustomIssueSubmitted(true);
    } catch (err) {
      setCustomIssueError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setCustomIssueSubmitting(false);
    }
  };

  const resetForm = () => {
    setTopic('');
    setIssue('');
    setIssueId('');
    setDate('');
    setLocation('');
    setIsPublic(false);
    setError('');
    setImageBase64('');
    setImagePreviewUrl('');
    setAutofillChecked(false);
    setAutofillError('');
    setCustomIssueText('');
    setCustomIssueSubmitted(false);
    setCustomIssueError('');
  };

  const submit = async () => {
    if (!topic || !issue || !description || !date || !location) {
      setError('*โปรดกรอกข้อมูลให้ครบถ้วน');
      return;
    }
    // For custom issue, require the text to have been submitted to admin first
    if (issue === '__custom__' && !customIssueSubmitted) {
      setError('กรุณากด "ส่งเพื่อพิจารณา" ก่อนการส่งคำร้องเรียน');
      return;
    }
    setError('');

    try {
      const payload = {
        topic,
        issue: issue === '__custom__' ? customIssueText : issue,
        issueId: issue === '__custom__' ? '' : issueId,
        urgency,
        description,
        date,
        location,
        faculty: userFaculty,
        isPublic,
        ...(imageBase64 ? { imageBase64 } : {}),
      };
      const response = await api.post('/complaints', payload);
      const id = response.data.id;
      setSubmittedId(id);

      if (onSubmit) {
        onSubmit(response.data);
      }
    } catch (err) {
      console.error('Failed to submit complaint', err);
      setError('เกิดข้อผิดพลาดขณะส่ง โปรดลองใหม่');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1 }}>
        <Container maxWidth="md" sx={{ py: 4 }}>

        {submittedId ? (
          // Success Message
          <Box sx={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '24px',
            padding: { xs: 3, sm: 5 },
            color: '#fff',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(16, 185, 129, 0.25)',
          }}>
            <CheckCircleIcon sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              ส่งคำร้องสำเร็จ!
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 400, opacity: 0.95 }}>
              ขอบคุณที่ใช้ระบบของเรา เราจะดำเนินการโดยเร็วที่สุด
            </Typography>

            <Divider sx={{ background: 'rgba(255, 255, 255, 0.2)', my: 3 }} />

            <Typography sx={{ mb: 4, fontSize: '1.1rem' }}>
              คุณสามารถตรวจสอบความคืบหน้าได้ที่หน้า "ตรวจสอบสถานะ"
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => { onBack(); setSubmittedId(''); }}
                sx={{
                  color: '#fff',
                  borderColor: '#fff',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                กลับหน้าหลัก
              </Button>
              <Button
                variant="contained"
                onClick={() => { if (onCheck) onCheck(submittedId); }}
                sx={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#059669',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  backdropFilter: 'blur(10px)',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.35)' }
                }}
              >
                ตรวจสอบสถานะ
              </Button>
            </Box>
          </Box>
        ) : (
          // Form
          <Box sx={{
            background: '#fff',
            borderRadius: '24px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            p: { xs: 4, sm: 6 },
          }}>
            {/* Header */}
            <Box sx={{ mb: 5 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#111827', fontSize: { xs: '1.75rem', sm: '2.2rem' } }}>
                แจ้งเรื่องร้องเรียน
              </Typography>
              <Typography sx={{ color: '#666', fontSize: '1.05rem', lineHeight: 1.6 }}>
                กรุณากรอกข้อมูลรายละเอียดเกี่ยวกับปัญหาที่คุณพบให้ครบถ้วน
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{
                mb: 4,
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '1.05rem',
                py: 2,
                background: '#FEE2E2',
                color: '#991B1B',
                border: '2px solid #FECACA'
              }}>
                {error}
              </Alert>
            )}

            {/* Form Grid */}
            <Grid container spacing={3}>
              {/* Description — FIRST so autofill can run */}
              <Grid item xs={12}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#000', mb: 1.5 }}>
                  รายละเอียดของปัญหา <span style={{ color: '#EF4444' }}>*</span>
                  <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 400, color: '#6B7280', ml: 1.5 }}>พิมพ์รายละเอียด แล้วกดปุ่มด้านล่างเพื่อให้ระบบแนะนำหัวข้อ</Typography>
                </Typography>
                <TextField
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setAutofillChecked(false); setAutofillError(''); }}
                  fullWidth multiline rows={4}
                  placeholder="อธิบายปัญหาที่พบโดยละเอียด เช่น: เครื่องปรับอากาศห้อง 301 อาคาร A ไม่ทำงาน"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', '& fieldset': { borderColor: '#D1D5DB', borderWidth: '2px' }, '&:hover fieldset': { borderColor: '#D61514' }, '&.Mui-focused fieldset': { borderColor: '#D61514', borderWidth: '2px' } } }}
                />
                {/* Autofill trigger button */}
                <Button
                  variant="contained"
                  onClick={handleAutofill}
                  disabled={autofillLoading || description.trim().length < 5}
                  startIcon={autofillLoading ? <CircularProgress size={16} color="inherit" /> : null}
                  sx={{
                    mt: 1.5, fontWeight: 700, borderRadius: '12px', px: 3, py: 1,
                    background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #AA020B 0%, #8C0E0E 100%)' },
                    '&.Mui-disabled': { background: '#E5E7EB', color: '#9CA3AF' },
                  }}
                >
                  {autofillLoading ? 'กำลังวิเคราะห์...' : '🔍 ตรวจสอบรายละเอียด'}
                </Button>
                {/* Error / no-match */}
                {autofillError && !autofillLoading && (
                  <Typography sx={{ mt: 1.5, fontSize: '0.9rem', color: autofillError.startsWith('เกิด') ? '#B91C1C' : '#5F3B10', fontWeight: 600 }}>
                    ⚠️ {autofillError}
                  </Typography>
                )}
                <Typography sx={{ mt: 1.5, fontSize: '0.78rem', color: '#6B7280', fontStyle: 'italic' }}>
                  หมายเหตุ: กรณีระบบแนะนำไม่ตรงกับที่คุณต้องการ คุณสามารถเลือกเองได้หรือแจ้งปัญหาเพิ่ม
                </Typography>
                {/* Auto-filled result box — hidden */}
              </Grid>
              <Grid item xs={6} md={4}>
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#000', mb: 1.5 }}>
                    หัวข้อปัญหา <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                </Box>
                <FormControl fullWidth disabled={!autofillChecked}>
                  <Select
                    value={topic}
                    onChange={(e) => { setTopic(e.target.value); setIssue(''); }}
                    sx={{
                      borderRadius: '14px',
                      fontSize: '1.05rem',
                      height: '56px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D1D5DB',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D61514',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D61514',
                        borderWidth: '2px',
                      }
                    }}
                    displayEmpty
                  >
                    <MenuItem value="" disabled><em style={{ color: '#9CA3AF', fontSize: '1rem' }}>-- เลือกหัวข้อ --</em></MenuItem>
                    {topicOptions.map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: '1.05rem' }}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Issue */}
              <Grid item xs={6} md={4}>
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#000', mb: 1.5 }}>
                    ปัญหาที่พบ <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                </Box>
                <FormControl fullWidth disabled={!autofillChecked || !topic}>
                  <Select
                    value={issue}
                    onChange={(e) => handleIssueChange(e.target.value)}
                    sx={{
                      borderRadius: '14px',
                      fontSize: '1.05rem',
                      height: '56px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: !topic ? '#E5E7EB' : '#D1D5DB',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: topic ? '#D61514' : '#E5E7EB',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#D61514',
                        borderWidth: '2px',
                      }
                    }}
                    displayEmpty
                  >
                    <MenuItem value="" disabled><em style={{ color: '#9CA3AF', fontSize: '1rem' }}>-- เลือกปัญหา --</em></MenuItem>
                    {issueOptions.map((i) => (
                      <MenuItem key={i.id || i.label} value={i.label} sx={{ fontSize: '1.05rem' }}>{i.label}</MenuItem>
                    ))}
                    {topic && (
                      <MenuItem value="__custom__" sx={{ fontSize: '1rem', fontWeight: 600, color: '#D61514', borderTop: '1px solid #eee', mt: 0.5, pt: 1 }}>
                        ➕ ปัญหาไม่อยู่ในรายการ (แจ้งเพิ่ม)
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                {!autofillChecked ? (
                  <Typography sx={{ fontSize: '0.9rem', color: '#999', mt: 1 }}>
                    (ตรวจสอบรายละเอียดก่อน)
                  </Typography>
                ) : !topic ? (
                  <Typography sx={{ fontSize: '0.9rem', color: '#999', mt: 1 }}>
                    (เลือกหัวข้อก่อน)
                  </Typography>
                ) : null}
              </Grid>

              {/* Custom issue input — shown when user selects "ปัญหาไม่อยู่ในรายการ" */}
              {issue === '__custom__' && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2.5, border: '2px solid #D61514', borderRadius: '14px', bgcolor: 'rgba(214,21,20,0.03)' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#D61514', mb: 1 }}>
                      💡 แจ้งปัญหาใหม่เพื่อให้ผู้ดูแลระบบพิจารณา
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1.5 }}>
                      ระบุชื่อปัญหาที่คุณพบ — ผู้ดูแลระบบจะพิจารณาและเพิ่มเข้าระบบหากเหมาะสม
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <TextField
                        value={customIssueText}
                        onChange={(e) => { setCustomIssueText(e.target.value); setCustomIssueError(''); setCustomIssueSubmitted(false); }}
                        placeholder="เช่น โต๊ะเก้าอี้ในห้องเรียนชำรุด"
                        size="small"
                        sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        disabled={customIssueSubmitted}
                        error={Boolean(customIssueError)}
                        helperText={customIssueError}
                      />
                      {!customIssueSubmitted ? (
                        <Button
                          variant="contained"
                          onClick={handleSubmitCustomIssue}
                          disabled={customIssueSubmitting || !customIssueText.trim()}
                          size="small"
                          sx={{ borderRadius: '10px', fontWeight: 700, background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)', px: 2.5 }}
                        >
                          {customIssueSubmitting ? 'กำลังส่ง...' : 'ส่งเพื่อพิจารณา'}
                        </Button>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#16a34a' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>✅ ส่งแล้ว รอแอดมินพิจารณา</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Urgency — auto-filled from issue, read-only */}
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#000', mb: 1.5 }}>
                    ระดับความเร่งด่วน
                  </Typography>
                </Box>
                <Box sx={{
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  borderRadius: '14px',
                  border: '2px solid #E5E7EB',
                  bgcolor: '#F9FAFB',
                  gap: 1,
                }}>
                  {urgency ? (
                    <>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>
                        {urgency === 'ฉุกเฉิน' ? '🔴' : urgency === 'สูง' ? '🟠' : urgency === 'ปานกลาง' ? '🟡' : '🟢'}
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem',
                        color: urgency === 'ฉุกเฉิน' ? '#B91C1C' : urgency === 'สูง' ? '#C2410C' : urgency === 'ปานกลาง' ? '#B45309' : '#15803D'
                      }}>
                        {urgency}
                      </Typography>

                    </>
                  ) : (
                    <Typography sx={{ color: '#9CA3AF', fontSize: '1rem' }}>
                      — เลือกปัญหาก่อน —
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Faculty — auto-filled from user account */}
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#000', mb: 1.5 }}>
                  คณะที่สังกัด
                </Typography>
                <Box sx={{ p: 1.5, bgcolor: '#F3F4F6', borderRadius: 2, border: '1px solid #E5E7EB', height: '56px', display: 'flex', alignItems: 'center' }}>
                  {userFaculty ? (
                    <Chip label={userFaculty} sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 700 }} />
                  ) : (
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>— ไม่ได้ระบุคณะในบัญชีผู้ใช้ —</Typography>
                  )}
                </Box>
              </Grid>

              {/* Date */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#000', mb: 1.5 }}>
                    วันที่เกิดเหตุ <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                </Box>
                <TextField
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  inputProps={{ max: new Date().toISOString().split('T')[0] }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-input': {
                      fontSize: '1.05rem',
                      padding: '14px 12px',
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      height: '56px',
                      '& fieldset': {
                        borderColor: '#D1D5DB',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#D61514',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#D61514',
                        borderWidth: '2px',
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon sx={{ color: '#D61514', mr: 1.5, fontSize: '1.3rem' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#000', mb: 1.5 }}>
                    สถานที่เกิดเหตุ <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                </Box>
                <TextField
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                  placeholder="เช่น: อาคารวิทยาศาสตร์ ชั้น 3"
                  sx={{
                    '& .MuiOutlinedInput-input': {
                      fontSize: '1.05rem',
                      padding: '14px 12px',
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      height: '56px',
                      '& fieldset': {
                        borderColor: '#D1D5DB',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: '#D61514',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#D61514',
                        borderWidth: '2px',
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PlaceIcon sx={{ color: '#D61514', mr: 1.5, fontSize: '1.3rem' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Image Upload — optional */}
              <Grid item xs={12}>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#000', mb: 1.5 }}>
                  รูปภาพหลักฐาน <Typography component="span" sx={{ fontWeight: 400, color: '#6B7280', fontSize: '0.85rem' }}>(ไม่บังคับ)</Typography>
                </Typography>
                <Box
                  component="label"
                  htmlFor="report-img-upload"
                  sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed', borderColor: imagePreviewUrl ? '#D61514' : '#D1D5DB',
                    borderRadius: '14px', p: 3, cursor: 'pointer', background: imagePreviewUrl ? 'rgba(122,30,30,0.04)' : '#FAFAFA',
                    '&:hover': { borderColor: '#D61514', background: 'rgba(122,30,30,0.04)' },
                    minHeight: 120,
                  }}
                >
                  {imagePreviewUrl ? (
                    <Box sx={{ position: 'relative', width: '100%', textAlign: 'center' }}>
                      <Box component="img" src={imagePreviewUrl} alt="preview" sx={{ maxHeight: 200, maxWidth: '100%', borderRadius: '10px', objectFit: 'contain' }} />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#D61514', fontWeight: 600 }}>
                        คลิกเพื่อเปลี่ยน — หรือ{' '}
                        <Box component="span" onClick={(e) => { e.preventDefault(); setImageBase64(''); setImagePreviewUrl(''); }} sx={{ textDecoration: 'underline', cursor: 'pointer' }}>ลบรูป</Box>
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography sx={{ fontSize: '2rem', mb: 1 }}>📷</Typography>
                      <Typography sx={{ color: '#6B7280', fontSize: '0.9rem' }}>คลิกเพื่อเลือกรูปภาพ (JPG / PNG / WEBP)</Typography>
                    </>
                  )}
                  <input id="report-img-upload" type="file" accept="image/*" hidden onChange={handleImageChange} />
                </Box>
              </Grid>
            </Grid>

            {/* Privacy Notice */}
            <Box sx={{
              background: 'linear-gradient(135deg, rgba(214, 21, 20, 0.08) 0%, rgba(214, 21, 20, 0.04) 100%)',
              border: '2px solid rgba(214, 21, 20, 0.2)',
              borderRadius: '14px',
              p: 3.5,
              mt: 5,
              mb: 5,
            }}>
              <Typography sx={{ color: '#AA020B', fontSize: '1rem', fontWeight: 600, lineHeight: 1.7 }}>
                ข้อมูลและเนื้อหาของเรื่องร้องเรียนของคุณจะถูกเก็บรักษาเป็นความลับและจำกัดสิทธิ์การเข้าถึง
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={resetForm}
                sx={{
                  fontWeight: 700,
                  px: 6,
                  py: 2,
                  fontSize: '1.05rem',
                  borderColor: '#D1D5DB',
                  borderWidth: 2,
                  color: '#666',
                  borderRadius: '12px',
                  flex: { xs: '1 1 100%', sm: 1 },
                  '&:hover': {
                    bgcolor: '#F9FAFB',
                    borderColor: '#D61514',
                    color: '#D61514'
                  }
                }}
              >
                ล้างข้อมูลฟอร์ม
              </Button>
              <Button
                variant="contained"
                onClick={submit}
                sx={{
                  fontWeight: 800,
                  px: 8,
                  py: 2,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 28px rgba(214, 21, 20, 0.4)',
                  flex: { xs: '1 1 100%', sm: 1 },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #AA020B 0%, #AA020B 100%)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 32px rgba(214, 21, 20, 0.5)',
                  }
                }}
              >
                ส่งคำร้องเรียน
              </Button>
            </Box>
          </Box>
        )}
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}

export default ReportPage;
