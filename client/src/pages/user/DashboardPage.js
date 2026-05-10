import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../AuthContext';
import Footer from '../../components/Footer';
import {
  Box, Container, Typography, Card, Grid, Chip, CircularProgress,
  Alert, LinearProgress, Collapse, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SchoolIcon from '@mui/icons-material/School';

function DashboardPage() {
  const { userRole, userFaculty } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTopic, setExpandedTopic] = useState(null);

  useEffect(() => {
    if (!userRole) return;
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/complaints');
        setComplaints(response.data || []);
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setError('ไม่สามารถโหลดข้อมูลคำร้องเรียน');
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [userRole]);

  // ── Derived stats ──────────────────────────────────
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    completed: complaints.filter(c => c.status === 'completed').length,
    emergency: complaints.filter(c => c.urgency === 'ฉุกเฉิน').length,
  };

  // Monthly data: last 6 months
  const monthlyData = (() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleDateString('th-TH', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), count: 0 });
    }
    complaints.forEach(c => {
      if (!c.createdAt) return;
      const d = new Date(c.createdAt);
      const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (entry) entry.count++;
    });
    return months;
  })();
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);

  // Urgency breakdown
  const urgencyData = [
    { label: 'ฉุกเฉิน', count: complaints.filter(c => c.urgency === 'ฉุกเฉิน').length, color: '#EF4444' },
    { label: 'สูง',     count: complaints.filter(c => c.urgency === 'สูง').length,     color: '#F59E0B' },
    { label: 'ปานกลาง', count: complaints.filter(c => c.urgency === 'ปานกลาง').length, color: '#3B82F6' },
    { label: 'ต่ำ',     count: complaints.filter(c => c.urgency === 'ต่ำ').length,     color: '#10B981' },
  ];

  // Topic ranking
  const topicRank = Object.entries(
    complaints.reduce((acc, c) => { if (c.topic) acc[c.topic] = (acc[c.topic] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const issueRank = Object.entries(
    complaints.reduce((acc, c) => { if (c.issue) acc[c.issue] = (acc[c.issue] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Faculty breakdown (executive only)
  const facultyRank = Object.entries(
    complaints.reduce((acc, c) => {
      const fac = c.faculty || '(ไม่ระบุ)';
      if (!acc[fac]) acc[fac] = { total: 0, pending: 0, inProgress: 0, completed: 0 };
      acc[fac].total++;
      if (c.status === 'pending') acc[fac].pending++;
      if (c.status === 'in_progress') acc[fac].inProgress++;
      if (c.status === 'completed') acc[fac].completed++;
      return acc;
    }, {})
  ).sort((a, b) => b[1].total - a[1].total);

  const issuesForTopic = (topic) =>
    Object.entries(
      complaints.filter(c => c.topic === topic).reduce((acc, c) => {
        if (c.issue) acc[c.issue] = (acc[c.issue] || 0) + 1; return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);

  const maxTopic = topicRank[0]?.[1] || 1;
  const maxIssue = issueRank[0]?.[1] || 1;

  const role = (userRole || '').trim();

  const viewTitle =
    role === 'executive' ? 'ภาพรวมมหาวิทยาลัย' :
    role === 'faculty' ? `ภาพรวม ${userFaculty || 'คณะ'}` : 'แดชบอร์ดของฉัน';
  const viewSubtitle =
    role === 'executive' ? 'สถิติรวมคำร้องเรียนทั้งมหาวิทยาลัย' :
    role === 'faculty' ? 'สถิติคำร้องเรียนในคณะ/หน่วยงานของคุณ' : 'ภาพรวมคำร้องเรียนทั้งหมดของคุณ';

  // ── Sub-components ──────────────────────────────────
  const StatCard = ({ icon, label, value, color, pulse }) => (
    <Card sx={{
      background: '#fff', borderRadius: '12px', p: 2,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #F3F4F6', height: '100%',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          background: color, borderRadius: '12px', p: 1.5, color: '#fff', flexShrink: 0,
          ...(pulse && value > 0 ? {
            animation: 'kpipulse 1.6s infinite',
            '@keyframes kpipulse': {
              '0%':   { boxShadow: `0 0 0 0 ${color}70` },
              '70%':  { boxShadow: `0 0 0 9px transparent` },
              '100%': { boxShadow: `0 0 0 0 transparent` },
            },
          } : {}),
        }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ color: '#999', fontSize: '0.8rem', fontWeight: 600, mb: 0.3 }}>{label}</Typography>
          <Typography sx={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
        </Box>
      </Box>
    </Card>
  );

  // SVG Bar Chart (monthly)
  const BarChart = () => {
    const barW = 30;
    const chartH = 80;
    const gapX = 10;
    const paddingLeft = 10;
    const totalW = monthlyData.length * (barW + gapX) - gapX + paddingLeft * 2;
    const peakIdx = monthlyData.reduce((best, m, i) => m.count > monthlyData[best].count ? i : best, 0);
    return (
      <Box sx={{ width: '100%' }}>
        <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 44}`} preserveAspectRatio="xMidYMid meet">
          {monthlyData.map((m, i) => {
            const barH = m.count === 0 ? 0 : Math.max((m.count / maxMonthly) * chartH, 6);
            const x = paddingLeft + i * (barW + gapX);
            const y = chartH - barH;
            const isPeak = i === peakIdx && m.count > 0;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} rx="6"
                  fill={isPeak ? '#D61514' : '#FFBD00'}
                  style={{ transition: 'height 0.5s ease' }}
                />
                {m.count > 0 && (
                  <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="#555" fontWeight="700">{m.count}</text>
                )}
                <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize="10" fill="#888">{m.label}</text>
              </g>
            );
          })}
        </svg>
      </Box>
    );
  };

  // SVG Donut Chart
  const DonutChart = () => {
    const total = urgencyData.reduce((s, d) => s + d.count, 0);
    if (total === 0) return <Typography color="#999" textAlign="center" py={4}>ยังไม่มีข้อมูล</Typography>;
    const r = 58;
    const cx = 75; const cy = 75;
    const circ = 2 * Math.PI * r;
    const critical = urgencyData[0].count + urgencyData[1].count;
    let cumPct = 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <svg width="150" height="150">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="22" />
            {urgencyData.filter(d => d.count > 0).map((d, i) => {
              const pct = d.count / total;
              const dash = pct * circ;
              const rot = cumPct * 360 - 90;
              cumPct += pct;
              return (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                  stroke={d.color} strokeWidth="22"
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={0}
                  style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${rot}deg)`, transition: 'stroke-dasharray 0.5s ease' }}
                />
              );
            })}
          </svg>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#D61514', lineHeight: 1 }}>
              {Math.round((critical / total) * 100)}%
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: '#999', fontWeight: 600, lineHeight: 1.2 }}>เร่งด่วน</Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, minWidth: 100 }}>
          {urgencyData.map(d => (
            <Box key={d.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{d.label}</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: d.color }}>{d.count}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <CircularProgress sx={{ color: '#D61514' }} />
    </Box>
  );

  const isAdvanced = role === 'faculty' || role === 'executive';
  const kpiCount = isAdvanced ? 5 : 4;
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Box sx={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Container maxWidth="xl" sx={{ pb: 3, pt: 2.5 }}>

        {/* Page Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#D61514', mb: 0.5 }}>{viewTitle}</Typography>
          <Typography variant="body2" sx={{ color: '#999' }}>{viewSubtitle}</Typography>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

        {/* ── ZONE 1: KPI Cards ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${kpiCount}, 1fr)` },
          gap: 2,
          mb: 2,
        }}>
          <StatCard icon={<AssignmentIcon sx={{ fontSize: 26 }} />} label="ทั้งหมด"          value={stats.total}     color="#D61514" />
          <StatCard icon={<AccessTimeIcon  sx={{ fontSize: 26 }} />} label="รับเรื่องแล้ว"   value={stats.pending}   color="#6B7280" />
          <StatCard icon={<PriorityHighIcon sx={{ fontSize: 26 }} />} label="กำลังดำเนินการ" value={stats.inProgress} color="#F59E0B" />
          <StatCard icon={<CheckCircleIcon  sx={{ fontSize: 26 }} />} label="เสร็จสิ้น"       value={stats.completed}  color="#10B981" />
          {isAdvanced && (
            <StatCard icon={<WarningAmberIcon sx={{ fontSize: 26 }} />} label="ฉุกเฉิน" value={stats.emergency} color="#EF4444" pulse />
          )}
        </Box>

        {/* ── USER ROLE: Custom Dashboard ── */}
        {!isAdvanced && (
          <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">
            {/* Bar Chart */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '12px', p: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
                <Typography fontWeight={800} fontSize="0.95rem" color="#D61514" sx={{ mb: 1.5 }}>
                  📊 คำร้องเรียนรายเดือน (6 เดือนล่าสุด)
                </Typography>
                <BarChart />
              </Card>
            </Grid>

            {/* Urgency Donut */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '12px', p: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
                <Typography fontWeight={800} fontSize="0.95rem" color="#D61514" sx={{ mb: 1.5 }}>
                  🎯 ระดับความเร่งด่วน
                </Typography>
                <DonutChart />
              </Card>
            </Grid>

            {/* Completion Rate */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: '12px', p: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Typography fontWeight={800} fontSize="0.95rem" color="#D61514" sx={{ mb: 2 }}>
                  ✅ ความคืบหน้าโดยรวม
                </Typography>

                {stats.total === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="#bbb" fontSize="0.9rem">ยังไม่มีคำร้องเรียน</Typography>
                    <Typography color="#ddd" fontSize="0.78rem" mt={0.5}>ส่งเรื่องร้องเรียนเพื่อเริ่มติดตาม</Typography>
                  </Box>
                ) : (
                  <Box>
                    {/* Big Completion Circle */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                        <svg width="120" height="120">
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="14" />
                          <circle cx="60" cy="60" r="52" fill="none"
                            stroke="#10B981" strokeWidth="14"
                            strokeDasharray={`${(completionRate / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                            strokeDashoffset={2 * Math.PI * 52 * 0.25}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 0.8s ease' }}
                          />
                        </svg>
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{completionRate}%</Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: '#999', fontWeight: 600 }}>เสร็จสิ้น</Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Status breakdown bars */}
                    {[
                      { label: 'รับเรื่องแล้ว',   count: stats.pending,    color: '#6B7280', bg: '#F3F4F6' },
                      { label: 'กำลังดำเนินการ', count: stats.inProgress, color: '#F59E0B', bg: '#FFFBEB' },
                      { label: 'เสร็จสิ้น',       count: stats.completed,  color: '#10B981', bg: '#ECFDF5' },
                    ].map(({ label, count, color, bg }) => {
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <Box key={label} sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                              <Typography fontSize="0.8rem" fontWeight={600} color="#555">{label}</Typography>
                            </Box>
                            <Typography fontSize="0.8rem" fontWeight={700} color={color}>{count} ({pct}%)</Typography>
                          </Box>
                          <Box sx={{ height: 8, borderRadius: 4, bgcolor: bg, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', borderRadius: 4, bgcolor: color, width: `${pct}%`, minWidth: pct > 0 ? 6 : 0, transition: 'width 0.6s ease' }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Topic Ranking for user */}
            {stats.total > 0 && topicRank.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: '12px', p: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUpIcon sx={{ color: '#D61514', fontSize: '1.3rem' }} />
                    <Typography fontWeight={800} fontSize="0.95rem" color="#D61514">หัวข้อที่ส่งบ่อย</Typography>
                  </Box>
                  {topicRank.slice(0, 5).map(([topic, count], idx) => (
                    <Box key={topic} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.6 }}>
                        <Box sx={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, bgcolor: idx === 0 ? '#D61514' : idx === 1 ? '#B45309' : '#FFBD00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem' }}>{idx + 1}</Box>
                        <Typography fontWeight={600} fontSize="0.87rem" sx={{ flex: 1 }}>{topic}</Typography>
                        <Chip label={`${count} เรื่อง`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: '0.68rem' }} />
                      </Box>
                      <LinearProgress variant="determinate" value={(count / (topicRank[0]?.[1] || 1)) * 100}
                        sx={{ height: 6, borderRadius: 4, bgcolor: '#F3F4F6', ml: 1, '& .MuiLinearProgress-bar': { bgcolor: idx === 0 ? '#D61514' : '#FFBD00', borderRadius: 4 } }} />
                    </Box>
                  ))}
                </Card>
              </Grid>
            )}

            {/* Issue Ranking for user */}
            {stats.total > 0 && issueRank.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: '12px', p: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                  <Typography fontWeight={800} fontSize="0.95rem" color="#D61514" sx={{ mb: 2 }}>📋 ปัญหาที่ส่งบ่อย</Typography>
                  {issueRank.slice(0, 5).map(([iss, count], idx) => (
                    <Box key={iss} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                        <Typography fontSize="0.85rem" fontWeight={500} sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idx + 1}. {iss}</Typography>
                        <Typography fontSize="0.85rem" fontWeight={800} color="#D61514" flexShrink={0}>{count}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={(count / maxIssue) * 100}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: '#FFBD00', borderRadius: 3 } }} />
                    </Box>
                  ))}
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* ── ZONE 2+3: 3-column unified layout (faculty / executive) ── */}
        {isAdvanced && (
          <Grid container spacing={2} sx={{ mb: 2 }} alignItems="stretch">

            {/* COL A: Topic Ranking (full height) */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: '12px', p: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon sx={{ color: '#D61514', fontSize: '1.3rem' }} />
                  <Box>
                    <Typography fontWeight={800} fontSize="0.95rem" color="#D61514">อันดับหัวข้อที่มีปัญหามากที่สุด</Typography>
                    <Typography variant="caption" color="#999">กดหัวข้อเพื่อดูรายละเอียดปัญหาย่อย</Typography>
                  </Box>
                </Box>
                {topicRank.length === 0 ? (
                  <Typography color="#999" textAlign="center" py={4}>ยังไม่มีข้อมูล</Typography>
                ) : topicRank.map(([topic, count], idx) => {
                  const isExpanded = expandedTopic === topic;
                  return (
                    <Box key={topic} sx={{ mb: 1.5 }}>
                      <Box onClick={() => setExpandedTopic(isExpanded ? null : topic)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75, cursor: 'pointer', borderRadius: '10px', p: 1, '&:hover': { bgcolor: '#FEF2F2' } }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, bgcolor: idx === 0 ? '#D61514' : idx === 1 ? '#B45309' : idx === 2 ? '#78716C' : '#FFBD00', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem' }}>{idx + 1}</Box>
                        <Typography fontWeight={600} fontSize="0.88rem" sx={{ flex: 1 }}>{topic}</Typography>
                        <Chip label={`${count} เรื่อง`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: '0.68rem' }} />
                        {isExpanded ? <KeyboardArrowUpIcon fontSize="small" sx={{ color: '#999' }} /> : <KeyboardArrowDownIcon fontSize="small" sx={{ color: '#999' }} />}
                      </Box>
                      <LinearProgress variant="determinate" value={(count / maxTopic) * 100}
                        sx={{ height: 6, borderRadius: 4, bgcolor: '#F3F4F6', ml: 1, '& .MuiLinearProgress-bar': { bgcolor: idx === 0 ? '#D61514' : '#FFBD00', borderRadius: 4 } }} />
                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 1, ml: 1, pl: 2, borderLeft: '3px solid #FFBD00', py: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#666', fontWeight: 700, display: 'block', mb: 0.5 }}>ปัญหาในหัวข้อนี้:</Typography>
                          {issuesForTopic(topic).map(([iss, cnt]) => (
                            <Box key={iss} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                              <Typography variant="body2" color="#333">• {iss}</Typography>
                              <Typography variant="body2" fontWeight={700} color="#D61514">{cnt} เรื่อง</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Card>
            </Grid>

            {/* COL B: Bar chart (top) + Issue ranking (bottom) */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                <Card sx={{ borderRadius: '12px', p: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                  <Typography fontWeight={800} fontSize="0.95rem" color="#D61514" sx={{ mb: 1.5 }}>
                    📊 คำร้องเรียนรายเดือน (6 เดือนล่าสุด)
                  </Typography>
                  <BarChart />
                </Card>
                <Card sx={{ borderRadius: '12px', p: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: 1 }}>
                  <Typography fontWeight={800} fontSize="0.95rem" color="#D61514" sx={{ mb: 1.5 }}>📋 อันดับปัญหาที่พบมากที่สุด</Typography>
                  {issueRank.length === 0 ? (
                    <Typography color="#999" textAlign="center" py={2}>ยังไม่มีข้อมูล</Typography>
                  ) : issueRank.map(([iss, count], idx) => (
                    <Box key={iss} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                        <Typography fontSize="0.85rem" fontWeight={500} sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idx + 1}. {iss}</Typography>
                        <Typography fontSize="0.85rem" fontWeight={800} color="#D61514" flexShrink={0}>{count}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={(count / maxIssue) * 100}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: '#FFBD00', borderRadius: 3 } }} />
                    </Box>
                  ))}
                </Card>
              </Box>
            </Grid>

            {/* COL C: Donut chart (top) + Faculty table (bottom) */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                <Card sx={{ borderRadius: '12px', p: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                  <Typography fontWeight={800} fontSize="0.95rem" color="#D61514" sx={{ mb: 1.5 }}>
                    🎯 ระดับความเร่งด่วน
                  </Typography>
                  <DonutChart />
                </Card>
                {role === 'executive' && (
                  <Card sx={{ borderRadius: '12px', p: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <SchoolIcon sx={{ color: '#D61514', fontSize: '1.2rem' }} />
                      <Typography fontWeight={800} fontSize="0.95rem" color="#D61514">สถิติตามคณะ/หน่วยงาน</Typography>
                    </Box>
                    {facultyRank.length === 0 ? (
                      <Typography color="#999" textAlign="center" py={2}>ยังไม่มีข้อมูล</Typography>
                    ) : (
                      <Box sx={{ overflowX: 'auto' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, color: '#555', fontSize: '0.78rem', pl: 0 }}>คณะ/หน่วยงาน</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: '#D61514', fontSize: '0.78rem' }}>ทั้งหมด</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: '#6B7280', fontSize: '0.78rem' }}>รอ</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.78rem' }}>กำลัง</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, color: '#10B981', fontSize: '0.78rem' }}>เสร็จ</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {facultyRank.slice(0, 8).map(([fac, data], idx) => (
                              <TableRow key={fac} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: '#FEF2F2' } }}>
                                <TableCell sx={{ pl: 0, fontSize: '0.82rem', fontWeight: 500, maxWidth: 140 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontWeight: 700, color: idx === 0 ? '#D61514' : '#bbb', fontSize: '0.75rem', minWidth: 16 }}>{idx + 1}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fac}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={data.total} size="small" sx={{ bgcolor: '#FEE2E2', color: '#991B1B', fontWeight: 800, fontSize: '0.72rem', height: 20 }} />
                                </TableCell>
                                <TableCell align="center"><Typography fontSize="0.82rem" color="#6B7280" fontWeight={600}>{data.pending}</Typography></TableCell>
                                <TableCell align="center"><Typography fontSize="0.82rem" color="#F59E0B" fontWeight={600}>{data.inProgress}</Typography></TableCell>
                                <TableCell align="center"><Typography fontSize="0.82rem" color="#10B981" fontWeight={600}>{data.completed}</Typography></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    )}
                  </Card>
                )}
                {role === 'faculty' && (
                  <Card sx={{ borderRadius: '12px', p: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: 1 }}>
                    <Typography fontWeight={800} fontSize="0.95rem" color="#D61514" sx={{ mb: 2 }}>
                      📈 สถานะภาพรวมคณะ
                    </Typography>
                    {stats.total === 0 ? (
                      <Typography color="#999" textAlign="center" py={2}>ยังไม่มีข้อมูล</Typography>
                    ) : (
                      <Box>
                        {[
                          { label: 'รับเรื่องแล้ว', count: stats.pending,    color: '#6B7280', bg: '#F3F4F6' },
                          { label: 'กำลังดำเนินการ', count: stats.inProgress, color: '#FFBD00', bg: '#FFFBEB' },
                          { label: 'เสร็จสิ้น',      count: stats.completed,  color: '#10B981', bg: '#ECFDF5' },
                        ].map(({ label, count, color, bg }) => {
                          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                          return (
                            <Box key={label} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                                  <Typography fontSize="0.82rem" fontWeight={600} color="#444">{label}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography fontSize="0.82rem" fontWeight={700} color={color}>{count} เรื่อง</Typography>
                                  <Typography fontSize="0.75rem" color="#aaa">({pct}%)</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ height: 10, borderRadius: 5, bgcolor: bg, overflow: 'hidden' }}>
                                <Box sx={{
                                  height: '100%', borderRadius: 5, bgcolor: color,
                                  width: `${pct}%`, minWidth: pct > 0 ? 8 : 0,
                                  transition: 'width 0.6s ease',
                                }} />
                              </Box>
                            </Box>
                          );
                        })}
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography fontSize="0.78rem" color="#aaa">อัตราแก้ไขสำเร็จ</Typography>
                          <Typography fontSize="1.1rem" fontWeight={800} color="#10B981">
                            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Card>
                )}
              </Box>
            </Grid>

          </Grid>
        )}

      </Container>
      <Footer />
    </Box>
  );
}

export default DashboardPage;
