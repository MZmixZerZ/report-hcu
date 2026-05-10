import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../api';
import Footer from '../../components/Footer';
import { useAuth } from '../../AuthContext';
import { Box, Container, Typography, Button, Alert, Stepper, Step, StepLabel, Grid, Divider, Paper, Chip, CircularProgress, Card, TextField, Pagination } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import bgHcu from '../../assets/bg-hcu.jpg';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

function CheckStatusPage({ onBack, initialComplaintId }) {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [pages, setPages] = useState({ pending: 1, in_progress: 1, completed: 1 });
  const PAGE_SIZE = 4;

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching complaints for user:', user?.uid);
      const response = await api.get('/complaints');
      console.log('Complaints response:', response.data);
      setComplaints(response.data || []);
    } catch (err) {
      console.error('Fetch complaints failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: err
      });
      setError(`ไม่สามารถโหลดข้อมูลคำร้องได้: ${err.response?.data?.error || err.message}`);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-select complaint from notification click
  useEffect(() => {
    if (initialComplaintId && complaints.length > 0) {
      const found = complaints.find(c => c.id === initialComplaintId);
      if (found) setSelectedComplaint(found);
    }
  }, [initialComplaintId, complaints]);

  useEffect(() => {
    if (user) {
      console.log('User detected in CheckStatusPage, fetching complaints');
      fetchComplaints();
    } else {
      console.log('No user in CheckStatusPage, skipping fetch');
      setError('');
      setComplaints([]);
      setLoading(false);
    }
  }, [user, fetchComplaints]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0) { setReviewError('กรุณาเลือกคะแนน'); return; }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await api.post(`/complaints/${selectedComplaint.id}/review`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccess(true);
      setSelectedComplaint(prev => ({ ...prev, review: { rating: reviewRating, comment: reviewComment, submittedAt: new Date().toISOString() } }));
    } catch (err) {
      setReviewError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const statusTranslation = {
    pending: 'รับเรื่องแล้ว',
    in_progress: 'กำลังดำเนินการ',
    completed: 'ดำเนินการเสร็จสิ้น',
  };

  const statusOrder = ['pending', 'in_progress', 'completed'];

  const getStatusColor = (status) => {
    return status === 'completed' ? '#10B981' :
           status === 'in_progress' ? '#F59E0B' :
           '#6B7280'; // pending
  };

  const statusIndex = selectedComplaint ? ['pending','in_progress','completed'].indexOf(selectedComplaint.status) : -1;

  // List View
  if (!selectedComplaint) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        position: 'relative',
        py: 4,
        '&::before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${bgHcu})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          transform: 'scale(1.06)',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.40)',
          zIndex: 0,
        },
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 3 }}>
          {/* Header */}
          <Box sx={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(30px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <HistoryIcon sx={{ fontSize: '2rem', color: '#D61514' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#D61514' }}>
                  ประวัติการร้องเรียน
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  คำร้องเรียนทั้งหมด: <strong>{complaints.length}</strong> เรื่อง
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ 
              mb: 3,
              borderRadius: '12px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              border: '1px solid #FECACA',
            }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={50} />
              <Typography variant="body2" sx={{ mt: 2, color: '#fff' }}>
                กำลังโหลดข้อมูล...
              </Typography>
            </Box>
          )}

          {/* Empty State */}
          {!loading && complaints.length === 0 && (
            <Box sx={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(30px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              p: 4,
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            }}>
              <Typography variant="h6" sx={{ color: '#999', mb: 1 }}>
                ยังไม่มีคำร้องเรียน
              </Typography>
              <Typography variant="body2" sx={{ color: '#CCC' }}>
                เมื่อคุณส่งคำร้องเรียนแล้ว จะปรากฏในรายการนี้
              </Typography>
            </Box>
          )}

          {/* Complaints grouped by status */}
          {!loading && complaints.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {statusOrder.map((status) => {
                const group = complaints.filter(c => c.status === status);
                if (group.length === 0) return null;
                return (
                  <Box key={status}>
                    {/* Section Header */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 1.5,
                      px: 1,
                    }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getStatusColor(status), flexShrink: 0 }} />
                      <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                        {statusTranslation[status]}
                      </Typography>
                      <Chip
                        label={`${group.length} เรื่อง`}
                        size="small"
                        sx={{ bgcolor: getStatusColor(status), color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    </Box>

                    {/* Grid with Pagination */}
                    {(() => {
                      const currentPage = pages[status] || 1;
                      const pageCount = Math.ceil(group.length / PAGE_SIZE);
                      const pageItems = group.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
                      return (
                        <>
                          <Grid container spacing={2} sx={{ mb: 1.5 }}>
                            {pageItems.map((complaint, idx) => (
                              <Grid item xs={12} sm={6} md={3} key={complaint.id}>
                                <motion.div
                                  initial={{ opacity: 0, y: 22 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: idx * 0.07, ease: 'easeOut' }}
                                  style={{ height: '100%' }}
                                >
                                <Card
                                  onClick={() => setSelectedComplaint(complaint)}
                                  sx={{
                                    cursor: 'pointer',
                                    height: '100%',
                                    background: 'rgba(255, 255, 255, 0.98)',
                                    backdropFilter: 'blur(30px)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      transform: 'translateY(-4px)',
                                      boxShadow: '0 16px 32px rgba(0,0,0,0.18)',
                                      borderColor: getStatusColor(status),
                                    },
                                    display: 'flex',
                                    flexDirection: 'column',
                                  }}
                                >
                                  {/* Status Header */}
                                  <Box sx={{
                                    background: `linear-gradient(135deg, ${getStatusColor(complaint.status)} 0%, ${getStatusColor(complaint.status)}DD 100%)`,
                                    p: 1.5, color: '#fff',
                                  }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Box>
                                        <Typography variant="caption" sx={{ opacity: 0.85 }}>หมายเลขคำร้อง</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                          {complaint.id?.substring(0, 12)}...
                                        </Typography>
                                      </Box>
                                      <Chip
                                        label={statusTranslation[complaint.status]}
                                        size="small"
                                        sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.68rem' }}
                                      />
                                    </Box>
                                  </Box>

                                  {/* Content */}
                                  <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" sx={{
                                      fontWeight: 700, color: '#000', mb: 0.5, fontSize: '0.95rem',
                                      overflow: 'hidden', textOverflow: 'ellipsis',
                                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    }}>
                                      {complaint.topic}
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                      color: '#666', mb: 1.5,
                                      overflow: 'hidden', textOverflow: 'ellipsis',
                                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    }}>
                                      {complaint.issue}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1, mt: 'auto' }}>
                                      <Chip
                                        label={complaint.urgency}
                                        size="small"
                                        sx={{
                                          background: complaint.urgency === 'ฉุกเฉิน' ? '#FEE2E2' :
                                                     complaint.urgency === 'สูง' ? '#FFFCDC' :
                                                     complaint.urgency === 'ปานกลาง' ? '#DBEAFE' : '#D1FAE5',
                                          color: complaint.urgency === 'ฉุกเฉิน' ? '#991B1B' :
                                                 complaint.urgency === 'สูง' ? '#5F3B10' :
                                                 complaint.urgency === 'ปานกลาง' ? '#1E40AF' : '#065F46',
                                          fontWeight: 600, fontSize: '0.7rem',
                                        }}
                                      />
                                      {complaint.feedback?.length > 0 && (
                                        <Chip label={`${complaint.feedback.length} ข้อความ`} size="small"
                                          sx={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 600, fontSize: '0.7rem' }} />
                                      )}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#999' }}>
                                      {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('th-TH') : ''}
                                    </Typography>
                                  </Box>
                                </Card>
                                </motion.div>
                              </Grid>
                            ))}
                          </Grid>
                          {pageCount > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                              <Pagination
                                count={pageCount}
                                page={currentPage}
                                onChange={(_, v) => setPages(prev => ({ ...prev, [status]: v }))}
                                size="small"
                                sx={{
                                  '& .MuiPaginationItem-root': { color: '#fff', fontWeight: 600, borderColor: 'rgba(255,255,255,0.4)' },
                                  '& .Mui-selected': { bgcolor: `${getStatusColor(status)} !important`, color: '#fff', border: 'none' },
                                }}
                              />
                            </Box>
                          )}
                        </>
                      );
                    })()}
                  </Box>
                );
              })}
            </Box>
          )}
        </Container>
      <Footer />
      </Box>
    );
  }

  // Detail View
  const result = selectedComplaint;
  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      py: 4,
      '&::before': {
        content: '""',
        position: 'fixed',
        inset: 0,
        backgroundImage: `url(${bgHcu})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(8px)',
        transform: 'scale(1.06)',
        zIndex: 0,
      },
      '&::after': {
        content: '""',
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.40)',
        zIndex: 0,
      },
    }}>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 3 }}>
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedComplaint(null)}
            sx={{ color: '#fff', fontWeight: 600, textTransform: 'none', mb: 2, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' } }}
          >
            กลับไปประวัติ
          </Button>
          </motion.div>
          {/* Result Card */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
        <Box sx={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(30px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          mb: 3,
        }}>
          {/* Header with Status */}
          <Box sx={{
            background: `linear-gradient(135deg, ${
              statusIndex === 2 ? '#10B981' : 
              statusIndex === 1 ? '#F59E0B' : 
              '#6B7280'
            } 0%, ${
              statusIndex === 2 ? '#059669' : 
              statusIndex === 1 ? '#D97706' : 
              '#4B5563'
            } 100%)`,
            p: 3,
            color: '#fff',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <CheckCircleIcon sx={{ fontSize: '2.5rem' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {statusTranslation[result.status] || result.status}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  อัปเดตล่าสุด: {result.updatedAt ? new Date(result.updatedAt).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ p: 3 }}>
            {/* Basic Info */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>หัวข้อ</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#000' }}>
                  {result.topic}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>ประเภท</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{result.issue}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>หน่วยงานที่รับเรื่อง</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#D61514' }}>
                  {result.assignedDepartment || 'ยังไม่ระบุ'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>ระดับความเร่งด่วน</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 
                  result.urgency === 'ฉุกเฉิน' ? '#EF4444' :
                  result.urgency === 'สูง' ? '#F59E0B' :
                  result.urgency === 'ปานกลาง' ? '#3B82F6' :
                  '#10B981'
                }}>
                  {result.urgency}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>วันที่เกิดเหตุ</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{result.date}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>สถานที่</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{result.location}</Typography>
              </Grid>
              {result.faculty && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>คณะ</Typography>
                  <Chip label={result.faculty} size="small" sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 600, mt: 0.5 }} />
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: '#E5E7EB' }} />

            {/* Progress Stepper */}
            <Box sx={{ my: 3 }}>
              <Typography variant="body2" sx={{ color: '#666', mb: 1.5, fontWeight: 600 }}>
                ขั้นตอนการจัดการเรื่องร้องเรียน
              </Typography>
              <Stepper activeStep={statusIndex} sx={{ py: 0 }}>
                {['รับเรื่องแล้ว','กำลังดำเนินการ','ดำเนินการเสร็จสิ้น'].map((label, idx) => (
                  <Step key={label} completed={statusIndex > idx}>
                    <StepLabel sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }
                    }}>
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: '#E5E7EB' }} />

            {/* Description and Notes */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ color: '#666', mb: 1, fontWeight: 600 }}>
                รายละเอียดคำร้อง
              </Typography>
              <TextField
                value={result.description || ''}
                multiline
                minRows={3}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: 'rgba(214, 21, 20, 0.04)',
                    '& fieldset': { borderColor: '#D61514', borderWidth: '2px' },
                  },
                  '& .MuiOutlinedInput-input': { color: '#333', fontSize: '0.9rem' },
                }}
              />

              {result.note && (
                <>
                  <Typography variant="body2" sx={{ color: '#666', mb: 1, mt: 2, fontWeight: 600 }}>
                    หมายเหตุจากเจ้าหน้าที่
                  </Typography>
                  <Box sx={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    borderLeft: '4px solid #10B981',
                    p: 2,
                    borderRadius: '8px',
                  }}>
                    <Typography variant="body2">
                      {result.note}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Feedback Messages Panel */}
            <Divider sx={{ my: 2.5, borderColor: '#E5E7EB' }} />
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#666', mb: 2, fontWeight: 600 }}>
                ข้อความคืบหน้าจากเจ้าหน้าที่
              </Typography>
              {result.feedback && result.feedback.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {result.feedback.map((msg, idx) => (
                    <Paper
                      key={idx}
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid #E5E7EB',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box>
                          <Chip
                            label={msg.from === 'officer' ? 'เจ้าหน้าที่' : 'ผู้บริหาร'}
                            size="small"
                            sx={{
                              background: msg.from === 'officer' 
                                ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                              color: '#fff',
                              fontWeight: 600,
                              mb: 1,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#999', fontStyle: 'italic' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'ไม่ระบุเวลา'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ 
                        color: '#333',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        mb: msg.proofImage ? 2 : 0,
                      }}>
                        {msg.message}
                      </Typography>
                      {msg.proofImage && (
                        <Box sx={{
                          mt: 1.5,
                          p: 1.5,
                          background: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                        }}>
                          <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 1 }}>
                            รูปภาพแนบประกอบ
                          </Typography>
                          <Box
                            component="img"
                            src={msg.proofImage}
                            alt="หลักฐาน"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: '400px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.9,
                              }
                            }}
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = msg.proofImage;
                              link.download = `proof-${idx}.jpg`;
                              link.click();
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                            คลิกเพื่อดาวน์โหลด
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{
                  background: 'rgba(107, 114, 128, 0.05)',
                  borderLeft: '4px solid #9CA3AF',
                  p: 2.5,
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    ยังไม่มีข้อความคืบหน้า
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                    เจ้าหน้าที่จะส่งข้อความแจ้งคุณเมื่อมีความคืบหน้า
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* ── Review Section (completed only) ── */}
          {result.status === 'completed' && (
            <Box sx={{ p: 3, pt: 0 }}>
              <Divider sx={{ mb: 3, borderColor: '#E5E7EB' }} />
              {result.review ? (
                /* Already reviewed */
                <Box sx={{
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                  border: '2px solid #6EE7B7',
                  borderRadius: '16px',
                  p: 3,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: '1.6rem' }} />
                    <Typography sx={{ fontWeight: 800, color: '#065F46', fontSize: '1rem' }}>
                      ส่งรีวิวแล้ว — ขอบคุณสำหรับความคิดเห็น
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                    {[1,2,3,4,5].map(s => (
                      s <= result.review.rating
                        ? <StarIcon key={s} sx={{ color: '#F59E0B', fontSize: '1.8rem' }} />
                        : <StarBorderIcon key={s} sx={{ color: '#D1D5DB', fontSize: '1.8rem' }} />
                    ))}
                    <Typography sx={{ ml: 1, fontWeight: 700, color: '#374151', alignSelf: 'center' }}>
                      {result.review.rating}/5
                    </Typography>
                  </Box>
                  {result.review.comment && (
                    <Typography sx={{ color: '#374151', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      "{result.review.comment}"
                    </Typography>
                  )}
                </Box>
              ) : (
                /* Review form */
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#D61514', fontSize: '1rem', mb: 0.5 }}>
                    ⭐ รีวิวการทำงานของหน่วยงาน
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
                    แบ่งปันประสบการณ์ของคุณเพื่อช่วยพัฒนาการบริการ
                  </Typography>

                  {/* Star Rating */}
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2.5 }}>
                    {[1,2,3,4,5].map(star => (
                      <Box
                        key={star}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                        onClick={() => setReviewRating(star)}
                        sx={{ cursor: 'pointer', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.2)' } }}
                      >
                        {star <= (reviewHover || reviewRating)
                          ? <StarIcon sx={{ color: '#F59E0B', fontSize: '2.4rem' }} />
                          : <StarBorderIcon sx={{ color: '#D1D5DB', fontSize: '2.4rem' }} />
                        }
                      </Box>
                    ))}
                    {reviewRating > 0 && (
                      <Typography sx={{ ml: 1.5, alignSelf: 'center', fontWeight: 700, color: '#F59E0B', fontSize: '1rem' }}>
                        {['', 'แย่มาก', 'แย่', 'ปานกลาง', 'ดี', 'ดีมาก'][reviewRating]}
                      </Typography>
                    )}
                  </Box>

                  {/* Comment */}
                  <TextField
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': { borderColor: '#D1D5DB' },
                        '&:hover fieldset': { borderColor: '#D61514' },
                        '&.Mui-focused fieldset': { borderColor: '#D61514' },
                      },
                    }}
                  />

                  {reviewError && (
                    <Alert severity="error" sx={{ mb: 1.5, borderRadius: '10px' }}>{reviewError}</Alert>
                  )}
                  {reviewSuccess && (
                    <Alert severity="success" sx={{ mb: 1.5, borderRadius: '10px' }}>ส่งรีวิวเรียบร้อยแล้ว!</Alert>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting || reviewRating === 0}
                    sx={{
                      bgcolor: '#D61514', '&:hover': { bgcolor: '#AA020B' },
                      borderRadius: '10px', fontWeight: 700, px: 3,
                    }}
                  >
                    {reviewSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'ส่งรีวิว'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
          </motion.div>
      </Container>
      <Footer />
    </Box>
  );
}

export default CheckStatusPage;

