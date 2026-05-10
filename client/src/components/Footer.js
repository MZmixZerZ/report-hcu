import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export default function Footer() {
  return (
    <Box component="footer" sx={{ background: '#AA020B', color: '#fff', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={1} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <VerifiedUserIcon sx={{ color: '#FFBD00', fontSize: '2rem' }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem', mb: 0.4 }}>
              ระบบรับเรื่องร้องเรียนอย่างเป็นทางการ มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>
              18/18 ถนนบางนา-ตราด กม.18 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540 | โทร. 02 713-8100
            </Typography>
          </Grid>
          <Grid item xs={12} md={3} sx={{ textAlign: { md: 'right' } }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
              © 2568 ระบบจัดการข้อร้องเรียน มฉก.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
