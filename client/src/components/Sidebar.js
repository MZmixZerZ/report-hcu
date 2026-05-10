import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box, Divider } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';

// narrow permanent drawer that collapses off-screen on very small devices
const drawerWidth = 200;

function Sidebar({ onNavigate, current, items: customItems, onLogout, userRole }) {
  const getDefaultItems = (role) => {
    const base = [
      { text: 'หน้าหลัก', icon: <HomeIcon />, key: 'home' },
      { text: 'แดชบอร์ด', icon: <DashboardIcon />, key: 'dashboard' },
    ];
    // executive and faculty see dashboard but cannot file reports themselves
    if (role === 'user') {
      base.push({ text: 'แจ้งเรื่อง', icon: <ReportProblemIcon />, key: 'report' });
    }
    base.push({ text: 'ตรวจสอบ', icon: <SearchIcon />, key: 'check' });
    base.push({ text: 'เกี่ยวกับ', icon: <InfoIcon />, key: 'about' });
    return base;
  };
  const items = customItems || getDefaultItems(userRole);

  return (
    <Drawer
      variant="permanent"
      sx={{
        // hide on extra‑small screens and use a smaller width otherwise
        width: { xs: 0, sm: drawerWidth },
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: { xs: 0, sm: drawerWidth },
          boxSizing: 'border-box',
          overflowX: 'hidden',
        },
      }}
    >
      <List sx={{ pt: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.key}
            selected={current === item.key}
            onClick={() => onNavigate(item.key)}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {item.text}
                </Typography>
              }
            />
          </ListItemButton>
        ))}
      </List>
      {onLogout && (
        <Box sx={{ mt: 'auto', pb: 1 }}>
          <Divider />
          <ListItemButton onClick={onLogout} sx={{ py: 1.5, color: '#D61514' }}>
            <ListItemIcon sx={{ minWidth: 40, color: '#D61514' }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary={<Typography variant="body1" sx={{ fontWeight: 500 }}>ออกจากระบบ</Typography>} />
          </ListItemButton>
        </Box>
      )}
    </Drawer>
  );
}

export default Sidebar;
