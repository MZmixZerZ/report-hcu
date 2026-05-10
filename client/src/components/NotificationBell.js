// ─────────────────────────────────────────────────────────────────────────────
// components/NotificationBell.js — กระดิ่งแจ้งเตือน (real-time)
//
// รับฟังการแจ้งเตือนจาก Firestore เรียลไทม์ 2 ช่องทาง:
//   1. แจ้งเจาะจุด (recipientId = uid) — ทุก role
//   2. แจ้งตาม role (recipientRole) — เฉพาะ officer/admin
//
// Props:
//   iconColor   — สี icon กระดิ่ง (default: '#AA020B')
//   onNotifClick — callback(notif) เมื่อคลิกรายการแจ้ง
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useRef } from 'react';
import {
  collection, query, where, onSnapshot, doc, updateDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import {
  Badge, IconButton, Popover, List, ListItem, ListItemText,
  Typography, Box, Divider, Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

function NotificationBell({ iconColor = '#AA020B', onNotifClick }) {
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null); // null = popover ปิด | element = popover เปิด

  // ref เก็บรายการล่าสุดจากทั้ง  2 listener เพื่อรวมกันและสั่งโดยไม่เกิดซ้ำ
  const uidNotifsRef  = useRef([]);
  const roleNotifsRef = useRef([]);

  // รวมรายการจากทั้งสอง listener เรียงจากใหม่ไปเก่า + กรองรายการซ้ำ
  const mergeSorted = () => {
    const seen = new Set();
    return [...uidNotifsRef.current, ...roleNotifsRef.current]
      .filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  useEffect(() => {
    if (!user || !userRole) return;

    const toItem = (d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date(d.data().createdAt || 0),
    });

    // Listener 1: แจ้งเจาะจุดสำหรับ user คนนี้
    const q1 = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
    );
    const unsub1 = onSnapshot(q1, snap => {
      uidNotifsRef.current = snap.docs.map(toItem);
      setNotifications(mergeSorted());
    }, (err) => console.error('[NotificationBell] q1 error:', err));

    // Listener 2: แจ้งตาม role — เฉพาะ officer/admin เท่านั้น
    let unsub2 = () => {};
    if (userRole === 'officer' || userRole === 'admin') {
      const q2 = query(
        collection(db, 'notifications'),
        where('recipientRole', '==', userRole),
      );
      unsub2 = onSnapshot(q2, snap => {
        roleNotifsRef.current = snap.docs.map(toItem);
        setNotifications(mergeSorted());
      }, (err) => console.error('[NotificationBell] q2 error:', err));
    }

    return () => { unsub1(); unsub2(); };
  }, [user, userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // นับจำนวนการแจ้งที่ยังไม่อ่าน (แสดงบน badge สีแดง)
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notifId) => {
    try { await updateDoc(doc(db, 'notifications', notifId), { read: true }); }
    catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (e) { console.error(e); }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'เมื่อกี้';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <IconButton onClick={(e) => { const t = e.currentTarget; t.blur(); setAnchorEl(t); }} sx={{ color: iconColor }}>
        <Badge badgeContent={unreadCount || null} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 340, maxHeight: 440, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 700, color: '#D61514', fontSize: '0.95rem' }}>
            🔔 การแจ้งเตือน
            {unreadCount > 0 && (
              <Box component="span" sx={{ ml: 1, bgcolor: '#D61514', color: '#fff', borderRadius: '12px', px: 0.8, py: 0.1, fontSize: '0.72rem', fontWeight: 800 }}>
                {unreadCount}
              </Box>
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllRead} sx={{ fontSize: '0.75rem', color: '#888', textTransform: 'none', minWidth: 0 }}>
              อ่านทั้งหมด
            </Button>
          )}
        </Box>

        {/* List */}
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#bbb' }}>
              <Typography sx={{ fontSize: '2rem', mb: 1 }}>🔕</Typography>
              <Typography variant="body2">ไม่มีการแจ้งเตือน</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {notifications.slice(0, 30).map((n, idx) => (
                <React.Fragment key={n.id}>
                  <ListItem
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                      if (onNotifClick) { onNotifClick(n); setAnchorEl(null); }
                    }}
                    sx={{
                      bgcolor: n.read ? 'transparent' : 'rgba(214,21,20,0.05)',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(214,21,20,0.08)' },
                      alignItems: 'flex-start',
                      py: 1.2, px: 2,
                    }}
                  >
                    <Box sx={{ mr: 1.5, mt: 0.4, fontSize: '1.1rem', flexShrink: 0 }}>
                      {n.type === 'new_complaint' ? '📋' : n.type === 'complaint_update' ? '🔄' : '💡'}
                    </Box>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: n.read ? 500 : 700, fontSize: '0.88rem', color: '#111', lineHeight: 1.4 }}>
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" sx={{ color: '#555', display: 'block' }}>{n.body}</Typography>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>{formatTime(n.createdAt)}</Typography>
                        </>
                      }
                    />
                    {!n.read && (
                      <Box sx={{ width: 8, height: 8, bgcolor: '#D61514', borderRadius: '50%', mt: 0.8, flexShrink: 0 }} />
                    )}
                  </ListItem>
                  {idx < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}

export default NotificationBell;
