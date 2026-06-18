import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import api from '../../api';
import Sidebar from '../../components/Sidebar';
import NotificationBell from '../../components/NotificationBell';
import {
  Box, Container, Typography, Select, MenuItem, Button, CircularProgress,
  Grid, Card, Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  TextField, Paper, Tabs, Tab, Divider, Alert, Pagination,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import TimerIcon from '@mui/icons-material/Timer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const STATUS_CONFIG = [
  { status: 'pending',     label: 'รับเรื่องแล้ว',    color: '#f59e0b' },
  { status: 'in_progress', label: 'กำลังดำเนินการ',   color: '#10b981' },
  { status: 'completed',   label: 'เสร็จสิ้น',        color: '#22c55e' },
];

const calcDuration = (startIso, endIso) => {
  const ms = (endIso ? new Date(endIso) : new Date()) - new Date(startIso);
  if (ms < 0 || !startIso) return '-';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hrs = Math.floor((totalMin % 1440) / 60);
  const min = totalMin % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (hrs > 0) parts.push(`${hrs} ชม.`);
  if (min > 0 || parts.length === 0) parts.push(`${min} นาที`);
  return parts.join(' ');
};


function OfficerSystem({ initialMode = 'dashboard' }) {
  const navigate = useNavigate();
  const { user, logout, userDepartment, userMajor } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState(initialMode);
  useEffect(() => {
    const titles = {
      dashboard: 'แดชบอร์ดเจ้าหน้าที่ | ระบบร้องเรียน มฉก.',
      list: 'รายการเรื่องร้องเรียน | ระบบร้องเรียน มฉก.',
    };
    document.title = titles[viewMode] || 'เจ้าหน้าที่ | ระบบร้องเรียน มฉก.';
  }, [viewMode]);
  const [tabIndex, setTabIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [listPage, setListPage] = useState(1);
  const PAGE_SIZE = 4;

  const officerName = user?.displayName || user?.email || 'เจ้าหน้าที่';
  const officerDept = userDepartment;   // หน่วยงานหลัก
  const officerSubDept = userMajor;     // หน่วยงานย่อย

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('fetch complaints error', err);
    } finally {
      setLoading(false);
    }
  };


  const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxWidth = 1200;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result); r.onerror = reject;
          r.readAsDataURL(blob);
        }, 'image/jpeg', 0.7);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });

  const handleUpdate = async () => {
    if (!selected) return;
    const hasMessage = feedbackText.trim().length > 0;
    const hasStatusChange = pendingStatus && pendingStatus !== selected.status;
    if (!hasMessage && !hasStatusChange) return;
    setUpdating(true);
    try {
      let proofImageURL;
      if (proofFile) proofImageURL = await compressImage(proofFile);
      const payload = { officerName, assignedDepartment: selected.assignedDepartment };
      if (hasMessage) { payload.feedbackMessage = feedbackText.trim(); payload.proofImageURL = proofImageURL; }
      if (hasStatusChange) { payload.status = pendingStatus; }
      await api.put(`/complaints/${selected.id}`, payload);
      setFeedbackText(''); setProofFile(null);
      if (hasStatusChange) setSelected(prev => ({ ...prev, status: pendingStatus }));
      fetchComplaints();
    } catch (err) {
      console.error('update error', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.complaintId) return;
    try {
      const res = await api.get(`/complaints/${notif.complaintId}`);
      const c = res.data;
      setSelected(c);
      setPendingStatus(c.status);
      setFeedbackText('');
      setProofFile(null);
    } catch (err) { console.error('notif click error', err); }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);
  useEffect(() => {
    if (initialMode && initialMode !== viewMode) setViewMode(initialMode);
  }, [initialMode, viewMode]);

  const handleNavigate = (key) => {
    setViewMode(key);
    navigate(key === 'dashboard' ? '/officer/dashboard' : '/officer/list');
  };

  const statusCounts = complaints.reduce((acc, c) => {
    // normalize unknown statuses (e.g. legacy 'submitted') → pending
    const s = STATUS_CONFIG.find(x => x.status === c.status) ? c.status : 'pending';
    acc[s] = (acc[s] || 0) + 1; return acc;
  }, {});
  const totalCount = complaints.length;

  const completedItems = complaints.filter(c => c.status === 'completed' && c.createdAt && c.updatedAt);
  const avgMs = completedItems.length > 0
    ? completedItems.reduce((sum, c) => sum + (new Date(c.updatedAt) - new Date(c.createdAt)), 0) / completedItems.length
    : 0;
  const avgDuration = avgMs > 0 ? calcDuration(new Date(Date.now() - avgMs).toISOString()) : '-';

  const URGENCY_ORDER = { 'ฉุกเฉิน': 4, 'สูง': 3, 'ปานกลาง': 2, 'ต่ำ': 1 };

  const currentTabStatus = STATUS_CONFIG[tabIndex]?.status;
  // normalize: treat any unknown status (e.g. legacy 'submitted') as 'pending'
  const normalizeStatus = (s) => STATUS_CONFIG.find(x => x.status === s) ? s : 'pending';

  // Dashboard computed extras
  const emergencyPending = complaints.filter(c => c.urgency === 'ฉุกเฉิน' && normalizeStatus(c.status) !== 'completed');
  const priorityQueue = [...complaints]
    .filter(c => normalizeStatus(c.status) !== 'completed')
    .sort((a, b) => (URGENCY_ORDER[b.urgency] || 0) - (URGENCY_ORDER[a.urgency] || 0))
    .slice(0, 5);
  const allActivity = complaints
    .flatMap(c => (c.activityLog || []).map(log => ({ ...log, topic: c.topic, cid: c.id })))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekNew = complaints.filter(c => c.createdAt && new Date(c.createdAt) >= weekAgo).length;
  const weekDone = complaints.filter(c => c.status === 'completed' && c.updatedAt && new Date(c.updatedAt) >= weekAgo).length;

  const tabComplaints = complaints
    .filter(c => normalizeStatus(c.status) === currentTabStatus)
    .sort((a, b) => (URGENCY_ORDER[b.urgency] || 0) - (URGENCY_ORDER[a.urgency] || 0));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8F9FA' }}>
      <Sidebar
        items={[
          { text: 'แดชบอร์ด', icon: <HomeIcon />, key: 'dashboard' },
          { text: 'รายการคำร้อง', icon: <HomeIcon />, key: 'list' },
        ]}
        current={viewMode}
        onNavigate={handleNavigate}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Gold Header */}
        <Box sx={{ background: '#FFBD00', py: 1.5, px: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, background: '#D61514', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFBD00', fontWeight: 900, fontSize: '1.1rem', fontFamily: 'serif' }}>官</Box>
                <Box>
                  <Typography sx={{ color: '#AA020B', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>ระบบรับเรื่องร้องเรียน</Typography>
                  <Typography sx={{ color: '#D61514', fontSize: '0.7rem', fontWeight: 600 }}>มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#AA020B', fontWeight: 600 }}>{officerName}</Typography>
                <NotificationBell iconColor="#AA020B" onNotifClick={handleNotifClick} />
                <Button onClick={logout} sx={{ color: '#AA020B', fontWeight: 700, border: '1px solid rgba(90,18,18,0.3)', px: 2, '&:hover': { background: 'rgba(90,18,18,0.1)' } }}>ออกจากระบบ</Button>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3, flex: 1, px: { xs: 2, md: 4 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2C3E50', mb: 0.5 }}>
              {viewMode === 'dashboard' ? 'Dashboard' : 'รายการคำร้อง'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#7F8C8D' }}>คำร้องทั้งหมด: <strong>{totalCount}</strong> เรื่อง</Typography>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: 'center', mt: 8 }}><CircularProgress size={50} /></Box>
          ) : viewMode === 'dashboard' ? (
            <Box>

              {/* Emergency Alert Banner */}
              {emergencyPending.length > 0 && (
                <Box sx={{
                  bgcolor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '14px',
                  p: 2, mb: 2.5, display: 'flex', alignItems: 'center', gap: 2,
                  animation: 'alertpulse 2s infinite',
                  '@keyframes alertpulse': {
                    '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.25)' },
                    '50%':      { boxShadow: '0 0 0 10px rgba(239,68,68,0)' },
                  },
                }}>
                  <WarningAmberIcon sx={{ color: '#EF4444', fontSize: '2rem', flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={800} color="#991B1B" fontSize="0.95rem">
                      ⚠️ มี {emergencyPending.length} เรื่องฉุกเฉินรอดำเนินการ
                    </Typography>
                    <Typography fontSize="0.8rem" color="#B91C1C">กรุณาดำเนินการโดยด่วน</Typography>
                  </Box>
                  <Button size="small" variant="contained"
                    onClick={() => { setViewMode('list'); setTabIndex(0); navigate('/officer/list'); }}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' }, borderRadius: '8px', fontWeight: 700, flexShrink: 0 }}
                  >ดูทันที</Button>
                </Box>
              )}

              {/* KPI Row */}
              <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                {[
                  { label: 'รับเรื่องแล้ว',    value: statusCounts.pending     || 0, color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'กำลังดำเนินการ',   value: statusCounts.in_progress || 0, color: '#3B82F6', bg: '#EFF6FF' },
                  { label: 'เสร็จสิ้น',         value: statusCounts.completed   || 0, color: '#10B981', bg: '#ECFDF5' },
                  { label: 'ฉุกเฉินค้างอยู่',  value: emergencyPending.length,       color: '#EF4444', bg: '#FEF2F2' },
                ].map(({ label, value, color, bg }) => (
                  <Grid size={{ xs: 6, md: 3 }} key={label}>
                    <Card sx={{ p: 3, borderLeft: `5px solid ${color}`, bgcolor: bg, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', borderRadius: '14px' }}>
                      <Typography fontSize="0.88rem" fontWeight={700} color="#6B7280" mb={0.75}>{label}</Typography>
                      <Typography fontSize="2.8rem" fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
                      <Typography fontSize="0.78rem" color="#9CA3AF" mt={0.75}>
                        {totalCount > 0 ? `${Math.round((value / totalCount) * 100)}%` : '0%'} ของทั้งหมด
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* ROW 2 */}
              <Grid container spacing={2.5} sx={{ mb: 2.5 }} alignItems="stretch">

                {/* COL A: Priority Queue */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card sx={{ borderRadius: '16px', p: 3, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <Typography fontWeight={800} fontSize="1.05rem" color="#D61514" sx={{ mb: 2 }}>
                      🚨 ต้องดำเนินการเร่งด่วน
                    </Typography>
                    {priorityQueue.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: '2.5rem', color: '#10B981', mb: 1 }} />
                        <Typography color="#10B981" fontWeight={700}>ไม่มีเรื่องค้างอยู่ 🎉</Typography>
                      </Box>
                    ) : priorityQueue.map((c, idx) => {
                      const urgColor = { 'ฉุกเฉิน': '#EF4444', 'สูง': '#F59E0B', 'ปานกลาง': '#3B82F6', 'ต่ำ': '#10B981' };
                      const urgBg   = { 'ฉุกเฉิน': '#FEF2F2', 'สูง': '#FFFBEB', 'ปานกลาง': '#EFF6FF', 'ต่ำ': '#ECFDF5' };
                      const dur = calcDuration(c.createdAt, null);
                      return (
                        <Box key={c.id || idx}
                          onClick={() => { setSelected(c); setPendingStatus(c.status); setFeedbackText(''); setProofFile(null); }}
                          sx={{
                            p: 1.5, mb: 1, borderRadius: '10px',
                            bgcolor: urgBg[c.urgency] || '#F9FAFB',
                            border: `1px solid ${urgColor[c.urgency] || '#E5E7EB'}`,
                            display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                            transition: 'transform 0.15s',
                            '&:hover': { transform: 'translateX(4px)' },
                          }}
                        >
                          <Chip label={c.urgency} size="small"
                            sx={{ bgcolor: urgColor[c.urgency], color: '#fff', fontWeight: 700, fontSize: '0.65rem', height: 20, flexShrink: 0 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontSize="0.85rem" fontWeight={700} color="#111"
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.topic}
                            </Typography>
                            <Typography fontSize="0.75rem" color="#6B7280"
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.issue}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                              <TimerIcon sx={{ fontSize: '0.7rem', color: '#F59E0B' }} />
                              <Typography fontSize="0.7rem" color="#F59E0B" fontWeight={600}>{dur}</Typography>
                              {c.faculty && <Typography fontSize="0.7rem" color="#9CA3AF">| {c.faculty}</Typography>}
                            </Box>
                          </Box>
                          <ArrowForwardIcon sx={{ fontSize: '1rem', color: '#9CA3AF', flexShrink: 0 }} />
                        </Box>
                      );
                    })}
                  </Card>
                </Grid>

                {/* COL B: Progress bars */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ borderRadius: '16px', p: 3, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <Typography fontWeight={800} fontSize="1.05rem" color="#D61514" sx={{ mb: 2.5 }}>
                      📊 ความคืบหน้าภาพรวม
                    </Typography>
                    {[
                      { label: 'รับเรื่องแล้ว',  count: statusCounts.pending     || 0, color: '#F59E0B' },
                      { label: 'กำลังดำเนินการ', count: statusCounts.in_progress || 0, color: '#3B82F6' },
                      { label: 'เสร็จสิ้น',       count: statusCounts.completed   || 0, color: '#10B981' },
                    ].map(({ label, count, color }) => {
                      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                      return (
                        <Box key={label} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography fontSize="0.8rem" fontWeight={600} color="#444">{label}</Typography>
                            <Typography fontSize="0.8rem" fontWeight={700} color={color}>{count} ({pct}%)</Typography>
                          </Box>
                          <Box sx={{ height: 12, borderRadius: 4, bgcolor: '#F3F4F6', overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: color, borderRadius: 4, minWidth: pct > 0 ? 8 : 0, transition: 'width 0.6s ease' }} />
                          </Box>
                        </Box>
                      );
                    })}
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontSize="0.88rem" color="#6B7280">🔥 อัตราเรื่องเร่งด่วน</Typography>
                      <Typography fontSize="1.3rem" fontWeight={800} color="#EF4444">
                        {totalCount > 0 ? Math.round((complaints.filter(c => c.urgency === 'ฉุกเฉิน' || c.urgency === 'สูง').length / totalCount) * 100) : 0}%
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                {/* COL C: Avg Time + Officer Info */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
                    <Card sx={{ borderRadius: '16px', p: 3, textAlign: 'center', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                      <TimerIcon sx={{ color: '#10B981', fontSize: '2.5rem', mb: 1 }} />
                      <Typography fontSize="0.85rem" color="#6B7280" fontWeight={600}>เวลาเฉลี่ยดำเนินการเสร็จ</Typography>
                      <Typography fontSize="1.7rem" fontWeight={800} color="#10B981" lineHeight={1.2} mt={0.75}>{avgDuration}</Typography>
                    </Card>
                    <Card sx={{ borderRadius: '16px', p: 3, flex: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                      <Typography fontSize="0.95rem" fontWeight={700} color="#D61514" mb={2}>👤 ข้อมูลเจ้าหน้าที่</Typography>
                      <Typography fontSize="0.88rem" color="#374151" mb={0.75}><strong>ชื่อ:</strong> {officerName}</Typography>
                      {officerDept    && <Typography fontSize="0.88rem" color="#374151" mb={0.75}><strong>หน่วยงาน:</strong> {officerDept}</Typography>}
                      {officerSubDept && <Typography fontSize="0.88rem" color="#374151"><strong>ย่อย:</strong> {officerSubDept}</Typography>}
                    </Card>
                  </Box>
                </Grid>

              </Grid>

              {/* ROW 3: Activity + Weekly */}
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Card sx={{ borderRadius: '16px', p: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <Typography fontWeight={800} fontSize="1.05rem" color="#D61514" sx={{ mb: 2 }}>🕐 กิจกรรมล่าสุด</Typography>
                    {allActivity.length === 0 ? (
                      <Typography color="#9CA3AF" fontSize="0.85rem" textAlign="center" py={3}>ยังไม่มีกิจกรรม</Typography>
                    ) : allActivity.map((log, idx) => {
                      const sConf = STATUS_CONFIG.find(s => s.status === log.toStatus);
                      return (
                        <Box key={idx} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: sConf?.color || '#9CA3AF', mt: 0.5, flexShrink: 0 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography fontSize="0.82rem" fontWeight={600} color="#111"
                              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.topic}
                            </Typography>
                            <Typography fontSize="0.75rem" color="#6B7280">
                              {log.officerName || 'ระบบ'} → {sConf?.label || log.toStatus}
                            </Typography>
                          </Box>
                          <Typography fontSize="0.72rem" color="#9CA3AF" flexShrink={0}>
                            {log.at ? new Date(log.at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card sx={{ borderRadius: '16px', p: 3, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <Typography fontWeight={800} fontSize="1.05rem" color="#D61514" sx={{ mb: 2 }}>📅 สรุปรายสัปดาห์</Typography>
                    {[
                      { label: 'รับเรื่องใหม่',    value: weekNew,  color: '#F59E0B' },
                      { label: 'ปิดเรื่องสำเร็จ',  value: weekDone, color: '#10B981' },
                      { label: 'ค้างอยู่ทั้งหมด',  value: (statusCounts.pending || 0) + (statusCounts.in_progress || 0), color: '#6B7280' },
                    ].map(({ label, value, color }) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                          <Typography fontSize="0.95rem" color="#444" fontWeight={500}>{label}</Typography>
                        </Box>
                        <Typography fontSize="1.5rem" fontWeight={800} color={color}>{value}</Typography>
                      </Box>
                    ))}
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography fontSize="0.78rem" color="#6B7280">อัตราปิดงานสัปดาห์นี้</Typography>
                        <Typography fontSize="0.78rem" fontWeight={700} color="#10B981">
                          {weekNew > 0 ? Math.round((weekDone / weekNew) * 100) : 0}%
                        </Typography>
                      </Box>
                      <Box sx={{ height: 12, borderRadius: 4, bgcolor: '#F3F4F6', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', borderRadius: 4, bgcolor: '#10B981', width: `${weekNew > 0 ? Math.round((weekDone / weekNew) * 100) : 0}%`, transition: 'width 0.6s ease' }} />
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

            </Box>
          ) : (
            <Box>
              <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                <Tabs
                  value={tabIndex}
                  onChange={(_, v) => setTabIndex(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    bgcolor: '#fff',
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', minHeight: 52 },
                    '& .Mui-selected': { color: '#5E72E4' },
                    '& .MuiTabs-indicator': { bgcolor: '#5E72E4', height: 3 },
                  }}
                >
                  {STATUS_CONFIG.map((s) => (
                    <Tab
                      key={s.status}
                      onClick={() => setListPage(1)}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                          {s.label}
                          <Chip label={statusCounts[s.status] || 0} size="small" sx={{ bgcolor: s.color, color: '#fff', fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                        </Box>
                      }
                    />
                  ))}
                </Tabs>
              </Paper>

              {tabComplaints.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: 2, border: '1px solid #E5E7EB' }}>
                  <Typography variant="body1" sx={{ color: '#9CA3AF' }}>ไม่มีคำร้องในสถานะนี้</Typography>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#7F8C8D' }}>
                      แสดง {Math.min((listPage - 1) * PAGE_SIZE + 1, tabComplaints.length)}–{Math.min(listPage * PAGE_SIZE, tabComplaints.length)} จาก {tabComplaints.length} เรื่อง
                    </Typography>
                    <Pagination
                      count={Math.ceil(tabComplaints.length / PAGE_SIZE)}
                      page={listPage}
                      onChange={(_, v) => setListPage(v)}
                      color="primary"
                      size="small"
                      sx={{ '& .MuiPaginationItem-root': { fontWeight: 600 }, '& .Mui-selected': { bgcolor: '#5E72E4 !important', color: '#fff' } }}
                    />
                  </Box>
                  <Grid container spacing={2}>
                    {tabComplaints.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE).map((c) => {
                    const conf = STATUS_CONFIG.find(s => s.status === c.status) || STATUS_CONFIG.find(s => s.status === 'pending');
                    const isOngoing = c.status !== 'completed';
                    const duration = calcDuration(c.createdAt, isOngoing ? null : c.updatedAt);
                    const urgEmoji = { 'ฉุกเฉิน': '🔴', 'สูง': '🟠', 'ปานกลาง': '🟡', 'ต่ำ': '🟢' };
                    const urgBg = { 'ฉุกเฉิน': '#FEE2E2', 'สูง': '#FFEDD5', 'ปานกลาง': '#FEF9C3', 'ต่ำ': '#DCFCE7' };
                    const urgColor = { 'ฉุกเฉิน': '#991B1B', 'สูง': '#9A3412', 'ปานกลาง': '#854D0E', 'ต่ำ': '#166534' };
                    return (
                      <Grid size={{ xs: 12, md: 6, lg: 4 }} key={c.id}>
                        <Card
                          sx={{ cursor: 'pointer', p: 2.5, borderLeft: `4px solid ${conf.color}`, transition: 'all 0.2s', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.12)', transform: 'translateY(-3px)' }, height: '100%', display: 'flex', flexDirection: 'column' }}
                          onClick={() => { setSelected(c); setPendingStatus(c.status); setFeedbackText(''); setProofFile(null); }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2C3E50', flex: 1, fontSize: '1rem' }}>{c.topic}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Chip label={conf.label} size="small" sx={{ bgcolor: conf.color, color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
                              {c.urgency && (
                                <Chip label={`${urgEmoji[c.urgency] || ''} ${c.urgency}`} size="small" sx={{ bgcolor: urgBg[c.urgency] || '#F3F4F6', color: urgColor[c.urgency] || '#374151', fontWeight: 700, fontSize: '0.7rem' }} />
                              )}
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#7F8C8D', mb: 1.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {c.issue}
                          </Typography>
                          {c.faculty && (
                            <Box sx={{ mb: 0.5 }}>
                              <Chip label={c.faculty} size="small" sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 600, fontSize: '0.7rem' }} />
                            </Box>
                          )}
                          {c.handledByName && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <AssignmentIndIcon sx={{ fontSize: '0.85rem', color: '#5E72E4' }} />
                              <Typography variant="caption" sx={{ color: '#5E72E4', fontWeight: 600 }}>{c.handledByName}</Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimerIcon sx={{ fontSize: '0.8rem', color: isOngoing ? '#f59e0b' : '#22c55e' }} />
                              <Typography variant="caption" sx={{ color: isOngoing ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>{duration}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString('th-TH') : ''}
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
                  {Math.ceil(tabComplaints.length / PAGE_SIZE) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={Math.ceil(tabComplaints.length / PAGE_SIZE)}
                        page={listPage}
                        onChange={(_, v) => { setListPage(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        color="primary"
                        showFirstButton
                        showLastButton
                        sx={{ '& .MuiPaginationItem-root': { fontWeight: 600 }, '& .Mui-selected': { bgcolor: '#5E72E4 !important', color: '#fff' } }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Container>
      </Box>

      <Dialog
        open={Boolean(selected)}
        onClose={() => { setSelected(null); setPendingStatus(''); setFeedbackText(''); setProofFile(null); }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: selected ? STATUS_CONFIG.find(s => s.status === selected.status)?.color : '#5E72E4', color: '#fff', fontWeight: 700 }}>
          รายละเอียดคำร้อง — {selected && STATUS_CONFIG.find(s => s.status === selected.status)?.label}
        </DialogTitle>
        <DialogContent dividers>
          {selected && (() => {
            const duration = calcDuration(selected.createdAt, selected.status === 'completed' ? selected.updatedAt : null);
            const order = STATUS_CONFIG.map(s => s.status);
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Paper sx={{ p: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>⏱ เวลาดำเนินการ</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#059669' }}>{duration}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>📅 วันที่แจ้ง</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#2C3E50' }}>
                        {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('th-TH') : '-'}
                      </Typography>
                    </Box>
                    {selected.handledByName && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>👤 เจ้าหน้าที่รับเรื่อง</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#5E72E4' }}>{selected.handledByName}</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>หัวข้อ</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selected.topic}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>ประเภท</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selected.issue}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>คณะ</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selected.faculty || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>ความเร่งด่วน</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selected.urgency}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: '#9CA3AF' }}>สถานที่</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selected.location || '-'}</Typography>
                  </Grid>
                </Grid>

                <Box sx={{ p: 1.5, bgcolor: '#F3F4F6', borderRadius: 2, border: '1px solid #E5E7EB' }}>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 0.5 }}>
                    หน่วยงานที่รับเรื่อง
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: selected?.assignedDepartment ? '#5E72E4' : '#9CA3AF' }}>
                    {selected?.assignedDepartment || '— ไม่พบคีย์เวิร์ดที่ตรงกัน —'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>รายละเอียด</Typography>
                  <Typography variant="body1">{selected.description || '-'}</Typography>
                </Box>

                {selected.imageBase64 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      📎 รูปภาพที่ผู้แจ้งแนบมา
                    </Typography>
                    <Box
                      sx={{
                        border: '2px solid #E5E7EB',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        bgcolor: '#F9FAFB',
                        p: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Box
                        component="img"
                        src={selected.imageBase64}
                        alt="รูปแนบจากผู้แจ้ง"
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 400,
                          objectFit: 'contain',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'block',
                          mx: 'auto',
                        }}
                        onClick={() => window.open(selected.imageBase64, '_blank')}
                      />
                      <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5, display: 'block' }}>
                        คลิกรูปเพื่อดูขนาดเต็ม
                      </Typography>
                    </Box>
                  </Box>
                )}

                {selected.status === 'pending' && (
                  <Alert severity="info" sx={{ fontWeight: 600 }}>เรื่องนี้อยู่ในคิวของหน่วยงานคุณ — เปลี่ยนสถานะเพื่อเริ่มดำเนินการ</Alert>
                )}

                <Divider />

                {selected.feedback?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>ประวัติการสื่อสาร</Typography>
                    {selected.feedback.map((fb, idx) => (
                      <Box key={idx} sx={{ bgcolor: '#F9FAFB', borderRadius: 2, p: 1.5, mb: 1, borderLeft: '3px solid #5E72E4' }}>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                          {new Date(fb.createdAt).toLocaleString('th-TH')} — {fb.from}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>{fb.message}</Typography>
                        {fb.proofImage && <img src={fb.proofImage} alt="proof" style={{ maxWidth: '100%', maxHeight: 200, marginTop: 8, borderRadius: 4 }} />}
                      </Box>
                    ))}
                  </Box>
                )}

                {selected.activityLog?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>บันทึกกิจกรรม</Typography>
                    {selected.activityLog.map((log, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 1.5, mb: 0.75, alignItems: 'flex-start' }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_CONFIG.find(s => s.status === log.toStatus)?.color || '#9CA3AF', mt: 0.7, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: '#2C3E50', fontWeight: 600 }}>
                            {log.officerName || 'ระบบ'} → {STATUS_CONFIG.find(s => s.status === log.toStatus)?.label || log.toStatus}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                            {log.at ? new Date(log.at).toLocaleString('th-TH') : ''}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {selected.status !== 'completed' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>ส่งข้อความให้ผู้แจ้ง</Typography>
                    <TextField
                      multiline rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="กรอกข้อความ..."
                      fullWidth size="small" sx={{ mb: 1 }}
                    />
                    <Button variant="outlined" component="label" size="small">
                      อัปโหลดรูปหลักฐาน
                      <input type="file" hidden accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0])} />
                    </Button>
                    {proofFile && <Typography variant="caption" sx={{ ml: 1 }}>{proofFile.name}</Typography>}
                  </Box>
                )}

                {selected.status !== 'completed' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>เปลี่ยนสถานะ</Typography>
                    <Select
                      value={pendingStatus || selected.status}
                      onChange={(e) => setPendingStatus(e.target.value)}
                      size="small" fullWidth
                      MenuProps={{ disablePortal: true }}
                    >
                      <MenuItem value={selected.status} disabled>
                        {STATUS_CONFIG.find(s => s.status === selected.status)?.label} (ปัจจุบัน)
                      </MenuItem>
                      {STATUS_CONFIG
                        .filter(s => order.indexOf(s.status) > order.indexOf(selected.status))
                        .map(s => <MenuItem key={s.status} value={s.status}>{s.label}</MenuItem>)}
                    </Select>
                  </Box>
                )}

                {selected.status === 'completed' && (
                  <Alert severity="success">ดำเนินการเสร็จสิ้นแล้ว</Alert>
                )}

                {/* Review Card */}
                {selected.status === 'completed' && (
                  <Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      รีวิวจากผู้แจ้ง
                    </Typography>
                    {selected.review ? (
                      <Box sx={{
                        background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                        border: '2px solid #6EE7B7',
                        borderRadius: '14px',
                        p: 2.5,
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Box sx={{ display: 'flex', gap: 0.25 }}>
                            {[1,2,3,4,5].map(s => (
                              s <= selected.review.rating
                                ? <StarIcon key={s} sx={{ color: '#F59E0B', fontSize: '1.6rem' }} />
                                : <StarBorderIcon key={s} sx={{ color: '#D1D5DB', fontSize: '1.6rem' }} />
                            ))}
                          </Box>
                          <Typography sx={{ fontWeight: 800, color: '#065F46', fontSize: '1.1rem' }}>
                            {selected.review.rating}/5
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', ml: 'auto' }}>
                            {selected.review.submittedAt ? new Date(selected.review.submittedAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </Typography>
                        </Box>
                        {selected.review.comment ? (
                          <Typography sx={{ color: '#374151', fontSize: '0.9rem', fontStyle: 'italic', borderLeft: '3px solid #10B981', pl: 1.5 }}>
                            “{selected.review.comment}”
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>ไม่มีข้อคิดเห็นเพิ่มเติม</Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ bgcolor: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '12px', p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>ผู้แจ้งยังไม่ได้ส่งรีวิว</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setSelected(null)} color="inherit">ปิด</Button>
          {selected?.status !== 'completed' && (
            <Button
              variant="contained"
              onClick={handleUpdate}
              disabled={updating || (!feedbackText.trim() && (!pendingStatus || pendingStatus === selected?.status))}
              sx={{ bgcolor: '#D61514', '&:hover': { bgcolor: '#AA020B' } }}
            >
              {updating ? 'กำลังอัพเดต...' : 'อัพเดต'}
            </Button>
          )}
          <Button onClick={fetchComplaints} variant="outlined">รีเฟรช</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OfficerSystem;