import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Box, 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton,
  Paper,
  Collapse,
  TableContainer,
  Chip,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  Alert,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import ListIcon from '@mui/icons-material/List';
import SchoolIcon from '@mui/icons-material/School';
import TuneIcon from '@mui/icons-material/Tune';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import NotificationBell from '../../components/NotificationBell';

const FACULTY_MAJORS = {
  'คณะกายภาพบำบัด': ['สาขาวิชากายภาพบำบัด'],
  'คณะการแพทย์แผนจีน': ['การแพทย์แผนจีนบัณฑิต'],
  'คณะเทคนิคการแพทย์': ['สาขาวิชาเทคนิคการแพทย์'],
  'คณะนิติศาสตร์': ['สาขาวิชานิติศาสตร์'],
  'คณะนิเทศศาสตร์': ['กลุ่มวิชาชีพนวัตกรรมการสื่อสารดิจิทัล','กลุ่มวิชาชีพศิลปกรรมสร้างสรรค์','กลุ่มวิชาชีพศิลปะการแสดง','กลุ่มวิชาชีพดนตรีและการขับร้อง'],
  'คณะบริหารธุรกิจ': ['หลักสูตรบัญชีบัณฑิต','วิชาเอกการจัดการและการเป็นผู้ประกอบการ','วิชาเอกการตลาด','วิชาเอกการจัดการธุรกิจระหว่างประเทศ','วิชาเอกธุรกิจดิจิทัล','สาขาวิชาการจัดการโลจิสติกส์และโซ่อุปทาน','สาขาวิชาธุรกิจจีน (หลักสูตรพหุวิทยาการ)','สาขาวิชาการจัดการอุตสาหกรรม (ป.โท)','สาขาวิชาธุรกิจดิจิทัล (ป.โท)'],
  'คณะพยาบาลศาสตร์': ['หลักสูตรพยาบาลศาสตรบัณฑิต','สาขาวิชาการพยาบาลเวชปฏิบัติชุมชน (ป.โท)'],
  'คณะเภสัชศาสตร์': ['หลักสูตรเภสัชศาสตรบัณฑิต (Doctor of Pharmacy)'],
  'คณะวิทยาศาสตร์และเทคโนโลยี': ['สาขาวิชาวิทยาการคอมพิวเตอร์','สาขาวิชาวิทยาศาสตร์การแพทย์','สาขาวิชาปัญญาประดิษฐ์','สาขาวิชาวิทยาการหุ่นยนต์สุขภาพ (หลักสูตรพหุวิทยาการ) (หลักสูตรนานาชาติ)'],
  'คณะศิลปศาสตร์': ['สาขาวิชาภาษาอังกฤษ','สาขาวิชาภาษาอังกฤษและภาษาจีน','สาขาวิชาการสื่อสารภาษาไทยเป็นภาษาที่สอง'],
  'คณะสังคมสงเคราะห์ศาสตร์และสวัสดิการสังคม': ['หลักสูตรสังคมสงเคราะห์ศาสตรบัณฑิต','สาขาวิชาการบริหารสวัสดิการสังคม (ป.โท)','สาขาวิชาการบริหารสวัสดิการสังคม (ป.เอก)'],
  'คณะสาธารณสุขศาสตร์ และสิ่งแวดล้อม': ['สาขาวิชาการจัดการเวชระเบียนและเวชสถิติโรงพยาบาล','สาขาวิชาอาชีวอนามัยและความปลอดภัย','สาขาวิชาสาธารณสุขชุมชน','สาขาวิชาการบริการทางการแพทย์','สาขาวิชาการจัดการและบรรเทาสาธารณภัย'],
  'วิทยาลัยจีนศึกษา': ['สาขาวิชาภาษาจีนธุรกิจ','สาขาวิชาภาษาและวัฒนธรรมจีน','สาขาวิชาจีนศึกษา','สาขาวิชาการสอนภาษาจีน','สาขาวิชาภาษาจีนเพื่อการสื่อสารเชิงธุรกิจ'],
};

const STAFF_DEPARTMENTS = [
  { name: 'กองกลาง', subDepartments: [] },
  { name: 'กองคลัง', subDepartments: [] },
  { name: 'กองทรัพยากรบุคคล', subDepartments: [] },
  { name: 'กองแผนและพัฒนา', subDepartments: [] },
  { name: 'กองพัสดุ', subDepartments: [] },
  { name: 'กองอาคารสถานที่', subDepartments: [] },
  { name: 'ศูนย์ดิจิทัลเพื่อการศึกษา', subDepartments: ['สำนักงานเลขานุการ','แผนกสนับสนุนการเรียนการสอนออนไลน์','แผนกบริการคอมพิวเตอร์'] },
  { name: 'ศูนย์บรรณสารสนเทศ', subDepartments: [] },
  { name: 'ศูนย์วัฒนธรรม', subDepartments: [] },
  { name: 'ศูนย์หนังสือ มฉก.', subDepartments: [] },
  { name: 'ศูนย์แต้จิ๋ววิทยา', subDepartments: [] },
  { name: 'สำนักทะเบียนและประมวลผล', subDepartments: [] },
  { name: 'สำนักพัฒนานักศึกษา', subDepartments: [] },
  { name: 'สำนักพัฒนาวิชาการ', subDepartments: ['แผนกหลักสูตรและมาตรฐานการศึกษา','แผนกวิจัยและพัฒนางานวิชาการ','ศูนย์สหกิจศึกษา'] },
];


const URGENCY_OPTIONS = [
  { value: 1, label: 'ต่ำ', color: '#22c55e', emoji: '🟢' },
  { value: 2, label: 'ปานกลาง', color: '#f59e0b', emoji: '🟡' },
  { value: 3, label: 'สูง', color: '#f97316', emoji: '🟠' },
  { value: 4, label: 'ฉุกเฉิน', color: '#ef4444', emoji: '🔴' },
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// PDPA helpers — mask personal data shown in the user table
const maskEmail = (email) => {
  if (!email) return '-';
  const [local, domain] = email.split('@');
  if (!local) return email;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
};

const maskName = (name) => {
  if (!name) return '-';
  const parts = name.trim().split(' ');
  return parts.map((part) => {
    if (part.length <= 1) return part;
    return `${part[0]}${'*'.repeat(Math.min(part.length - 1, 3))}`;
  }).join(' ');
};

function AdminSystem({ onBack }) {
  const { logout } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  useEffect(() => { document.title = 'ผู้ดูแลระบบ (Admin) | ระบบร้องเรียน มฉก.'; }, []);
  const [users, setUsers] = useState([]);
  const [types, setTypes] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, officers: 0, admins: 0, regularUsers: 0, totalTypes: 0 });
  
  // Issues management state
  const [selectedType, setSelectedType] = useState('');
  const [issues, setIssues] = useState([]);
  const [newIssue, setNewIssue] = useState('');
  const [newIssueUrgency, setNewIssueUrgency] = useState(2);

  const [editingIssue, setEditingIssue] = useState(null);
  const [openIssueDialog, setOpenIssueDialog] = useState(false);
  const [issueError, setIssueError] = useState('');
  

  
  // User form state
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'user',
    userType: 'student',
    department: '',
    major: '',
  });
  const [formErrors, setFormErrors] = useState({});

  
  // Type form state
  const [newType, setNewType] = useState('');
  const [newTypeDept, setNewTypeDept] = useState('');
  const [editingType, setEditingType] = useState(null);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [typeError, setTypeError] = useState('');

  // Faculty form state
  const [faculties, setFaculties] = useState([]);
  const [newFaculty, setNewFaculty] = useState('');
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [openFacultyDialog, setOpenFacultyDialog] = useState(false);
  const [facultyError, setFacultyError] = useState('');

  // Department / Conditions state
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [expandedDept, setExpandedDept] = useState(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  // Pending custom issue requests
  const [pendingIssues, setPendingIssues] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [approveDialog, setApproveDialog] = useState(null);
  const [approveUrgency, setApproveUrgency] = useState(2);
  const [approveTypeId, setApproveTypeId] = useState('');

  // Generic confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) => setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });

  const loadTypes = async () => {
    try {
      const res = await api.get('/admin/complaint-types');
      setTypes(res.data);
      setStats(prev => ({ ...prev, totalTypes: res.data.length }));
    } catch (err) {
      console.error('Error loading types:', err);
    }
  };

  const loadFaculties = async () => {
    try {
      const res = await api.get('/admin/faculties');
      setFaculties(res.data);
    } catch (err) {
      console.error('Error loading faculties:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      setDeptLoading(true);
      const res = await api.get('/admin/departments');
      setDepartments(res.data);
    } catch (err) { console.error('Error loading departments:', err); }
    finally { setDeptLoading(false); }
  };

  const handleNotifClick = (notif) => {
    // custom_issue_request → go to "ปัญหารอพิจารณา" tab (index 6)
    if (notif.type === 'custom_issue_request') {
      setTabIndex(6);
    }
  };

  const loadPendingIssues = async () => {
    try {
      setPendingLoading(true);
      const res = await api.get('/admin/custom-issue-requests');
      setPendingIssues(res.data);
    } catch (err) { console.error('Error loading pending issues:', err); }
    finally { setPendingLoading(false); }
  };

  const handleApproveOpen = (item) => {
    setApproveDialog(item);
    setApproveUrgency(2);
    setApproveTypeId(item.typeId || '');
  };

  const handleApproveConfirm = async () => {
    if (!approveDialog) return;
    try {
      setLoading(true);
      await api.post(`/admin/custom-issue-requests/${approveDialog.id}/approve`, {
        urgencyLevel: approveUrgency,
        typeId: approveTypeId,
      });
      setApproveDialog(null);
      loadPendingIssues();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRejectIssue = async (id) => {
    openConfirm('ยืนยันการปฏิเสธ', 'ต้องการปฏิเสธปัญหานี้หรือไม่?', async () => {
    try {
      await api.delete(`/admin/custom-issue-requests/${id}`);
      loadPendingIssues();
    } catch (err) { console.error(err); }
    });
  };

  const handleAddKeyword = async (dept) => {
    const kw = newKeyword.trim();
    if (!kw) return;
    const updated = [...new Set([...(dept.keywords || []), kw])];
    try {
      await api.put(`/admin/departments/${dept.id}`, { keywords: updated });
      setDepartments(prev => prev.map(d => d.id === dept.id ? { ...d, keywords: updated } : d));
      setNewKeyword('');
    } catch (e) { console.error(e); }
  };

  const handleRemoveKeyword = async (dept, kw) => {
    const updated = (dept.keywords || []).filter(k => k !== kw);
    try {
      await api.put(`/admin/departments/${dept.id}`, { keywords: updated });
      setDepartments(prev => prev.map(d => d.id === dept.id ? { ...d, keywords: updated } : d));
    } catch (e) { console.error(e); }
  };

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    try {
      const res = await api.post('/admin/departments', { name: newDeptName.trim(), description: newDeptDesc.trim(), keywords: [] });
      setDepartments(prev => [...prev, res.data]);
      setNewDeptName(''); setNewDeptDesc('');
    } catch (e) { console.error(e); }
  };

  const handleDeleteDept = async (id) => {
    try {
      await api.delete(`/admin/departments/${id}`);
      setDepartments(prev => prev.filter(d => d.id !== id));
      if (expandedDept === id) setExpandedDept(null);
    } catch (e) { console.error(e); }
  };

  const loadIssues = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/complaint-types/${selectedType}/issues`);
      setIssues(res.data);
    } catch (err) {
      console.error('Error loading issues:', err);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    setLoading(true);
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(data);
        const officers = data.filter(u => u.role === 'officer').length;
        const admins = data.filter(u => u.role === 'admin').length;
        const regularUsers = data.filter(u => u.role === 'user').length;
        const facultyUsers = data.filter(u => u.role === 'faculty').length;
        setStats(prev => ({ ...prev, totalUsers: data.length, officers, admins, regularUsers, facultyUsers }));
        setLoading(false);
      },
      (err) => { console.error('Error loading users:', err); setLoading(false); }
    );
    loadTypes();
    loadFaculties();
    loadDepartments();
    loadPendingIssues();
    return () => unsubUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load issues when selected type changes
  useEffect(() => {
    if (selectedType) {
      loadIssues();
    }
  }, [selectedType, loadIssues]);

  // User Management
  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ email: '', displayName: '', role: 'user', userType: 'student', department: '', major: '' });
    setFormErrors({});
    setOpenUserDialog(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      displayName: user.displayName || '',
      role: user.role,
      userType: user.userType || 'student',
      department: user.department || '',
      major: user.major || '',
    });
    setFormErrors({});
    setOpenUserDialog(true);
  };

  const validateUserForm = () => {
    const errors = {};
    if (!editingUser && !formData.email) errors.email = 'Email is required';
    if (!formData.displayName) errors.displayName = 'Display name is required';
    if (!formData.role) errors.role = 'Role is required';
    return errors;
  };

  const handleSaveUser = async () => {
    const errors = validateUserForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, {
          displayName: formData.displayName,
          role: formData.role,
          userType: formData.userType,
          department: formData.department,
          major: formData.major,
        });
      } else {
        await api.post('/admin/users', {
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
          userType: formData.userType,
          department: formData.department,
          major: formData.major,
        });
      }
      setOpenUserDialog(false);
    } catch (err) {
      setFormErrors({ submit: err.response?.data?.error || 'Failed to save user' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    openConfirm('ยืนยันการลบผู้ใช้', 'ต้องการลบผู้ใช้งานนี้หรือไม่? ไม่สามารถย้อนกลับได้', async () => {
      try {
        setLoading(true);
        await api.delete(`/admin/users/${userId}`);
      } catch (err) {
        console.error('Error deleting user:', err);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDeleteMultipleUsers = async () => {
    if (selectedUsers.size === 0) return;
    openConfirm('ยืนยันการลบหลายผู้ใช้', `ต้องการลบผู้ใช้ ${selectedUsers.size} คนนี้หรือไม่? ไม่สามารถย้อนกลับได้`, async () => {
      try {
        setLoading(true);
        for (const userId of selectedUsers) {
          await api.delete(`/admin/users/${userId}`);
        }
        setSelectedUsers(new Set());
      } catch (err) {
        console.error('Error deleting users:', err);
      } finally {
        setLoading(false);
      }
    });
  };

  const toggleUserSelection = (userId) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUsers(newSet);
  };

  const KNOWN_ROLES = ['user', 'faculty', 'executive', 'officer', 'admin'];

  const filteredUsers = users.filter(user => {
    const matchSearch =
      user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchUser.toLowerCase()));
    const matchRole =
      roleFilter === 'all' ? true :
      roleFilter === 'other' ? !KNOWN_ROLES.includes(user.role) :
      user.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Type Management
  const handleAddType = () => {
    setEditingType(null);
    setNewType('');
    setNewTypeDept('');
    setTypeError('');
    setOpenTypeDialog(true);
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setNewType(type.label);
    setNewTypeDept(type.departmentId || '');
    setTypeError('');
    setOpenTypeDialog(true);
  };

  const handleSaveType = async () => {
    if (!newType.trim()) {
      setTypeError('Type name is required');
      return;
    }

    try {
      setLoading(true);
      const selectedDept = departments.find(d => d.id === newTypeDept);
      const payload = {
        label: newType.trim(),
        departmentId: newTypeDept || '',
        departmentName: selectedDept ? selectedDept.name : '',
      };
      if (editingType) {
        await api.put(`/admin/complaint-types/${editingType.id}`, payload);
      } else {
        await api.post('/admin/complaint-types', payload);
      }
      setOpenTypeDialog(false);
      loadTypes();
    } catch (err) {
      setTypeError(err.response?.data?.error || 'Failed to save type');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (typeId) => {
    openConfirm('ยืนยันการลบประเภทคำร้อง', 'ต้องการลบประเภทคำร้องเรียนนี้หรือไม่?', async () => {
      try {
        setLoading(true);
        await api.delete(`/admin/complaint-types/${typeId}`);
        loadTypes();
      } catch (err) {
        console.error('Error deleting type:', err);
      } finally {
        setLoading(false);
      }
    });
  };

  // Issues Management
  const handleAddIssue = () => {
    setEditingIssue(null);
    setNewIssue('');
    setNewIssueUrgency(2);
    setIssueError('');
    setOpenIssueDialog(true);
  };

  const handleEditIssue = (issue) => {
    setEditingIssue(issue);
    setNewIssue(issue.label);
    setNewIssueUrgency(issue.urgencyLevel || 2);
    setIssueError('');
    setOpenIssueDialog(true);
  };

  const handleSaveIssue = async () => {
    if (!newIssue.trim()) {
      setIssueError('Issue name is required');
      return;
    }

    try {
      setLoading(true);
      if (editingIssue) {
        await api.put(`/admin/complaint-types/${selectedType}/issues/${editingIssue.id}`, { label: newIssue.trim(), urgencyLevel: newIssueUrgency });
      } else {
        await api.post(`/admin/complaint-types/${selectedType}/issues`, { label: newIssue.trim(), urgencyLevel: newIssueUrgency });
      }
      setOpenIssueDialog(false);
      loadIssues();
    } catch (err) {
      setIssueError(err.response?.data?.error || 'Failed to save issue');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    openConfirm('ยืนยันการลบปัญหา', 'ต้องการลบปัญหานี้หรือไม่?', async () => {
      try {
        setLoading(true);
        await api.delete(`/admin/complaint-types/${selectedType}/issues/${issueId}`);
        loadIssues();
      } catch (err) {
        console.error('Error deleting issue:', err);
      } finally {
        setLoading(false);
      }
    });
  };

  // Faculty Management
  const handleAddFaculty = () => {
    setEditingFaculty(null);
    setNewFaculty('');
    setFacultyError('');
    setOpenFacultyDialog(true);
  };

  const handleEditFaculty = (fac) => {
    setEditingFaculty(fac);
    setNewFaculty(fac.label);
    setFacultyError('');
    setOpenFacultyDialog(true);
  };

  const handleSaveFaculty = async () => {
    if (!newFaculty.trim()) {
      setFacultyError('กรุณาระบุชื่อคณะ');
      return;
    }
    try {
      setLoading(true);
      if (editingFaculty) {
        await api.put(`/admin/faculties/${editingFaculty.id}`, { label: newFaculty.trim() });
      } else {
        await api.post('/admin/faculties', { label: newFaculty.trim() });
      }
      setOpenFacultyDialog(false);
      loadFaculties();
    } catch (err) {
      setFacultyError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaculty = async (id) => {
    openConfirm('ยืนยันการลบคณะ', 'ต้องการลบคณะนี้ออกจากระบบหรือไม่?', async () => {
      try {
        setLoading(true);
        await api.delete(`/admin/faculties/${id}`);
        loadFaculties();
      } catch (err) {
        console.error('Error deleting faculty:', err);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8F9FA' }}>
      {/* Gold Header */}
      <Box sx={{ background: '#FFBD00', py: 1.5, px: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, background: '#D61514', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFBD00', fontWeight: 900, fontSize: '1.1rem', fontFamily: 'serif' }}>官</Box>
              <Box>
                <Typography sx={{ color: '#AA020B', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>ระบบรับเรื่องร้องเรียน</Typography>
                <Typography sx={{ color: '#D61514', fontSize: '0.7rem', fontWeight: 600 }}>มหาวิทยาลัยหัวเฉียวเฉลิมพระเกียรติ</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ color: '#AA020B', fontWeight: 600, fontSize: '0.9rem' }}>ผู้ดูแลระบบ</Typography>
              <NotificationBell iconColor="#AA020B" onNotifClick={handleNotifClick} />
              <Button onClick={logout} sx={{ color: '#AA020B', fontWeight: 700, border: '1px solid rgba(90,18,18,0.3)', px: 2, '&:hover': { background: 'rgba(90,18,18,0.1)' } }}>ออกจากระบบ</Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Tabs Navigation */}
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Tabs 
            value={tabIndex} 
            onChange={(e, newValue) => setTabIndex(newValue)}
            sx={{
              bgcolor: '#fff',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              },
              '& .Mui-selected': {
                color: '#D61514',
              },
            }}
          >
            <Tab label="Dashboard" icon={<DashboardIcon />} iconPosition="start" />
            <Tab label="Users" icon={<PeopleIcon />} iconPosition="start" />
            <Tab label="Complaint Types" icon={<CategoryIcon />} iconPosition="start" />
            <Tab label="Issues" icon={<ListIcon />} iconPosition="start" />
            <Tab label="คณะ" icon={<SchoolIcon />} iconPosition="start" />
            <Tab label="เงื่อนไขหน่วยงาน" icon={<TuneIcon />} iconPosition="start" />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  ปัญหารอพิจารณา
                  {pendingIssues.filter(i => i.status === 'pending').length > 0 && (
                    <Box component="span" sx={{ bgcolor: '#D61514', color: '#fff', borderRadius: '12px', px: 0.8, fontSize: '0.72rem', fontWeight: 800 }}>
                      {pendingIssues.filter(i => i.status === 'pending').length}
                    </Box>
                  )}
                </Box>
              }
              icon={<HourglassEmptyIcon />}
              iconPosition="start"
            />

          </Tabs>
        </Paper>

        {/* Dashboard Tab */}
        <TabPanel value={tabIndex} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#D61514' }}>
                    {stats.totalUsers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Admins
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#E74C3C' }}>
                    {stats.admins}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Officers
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#3498DB' }}>
                    {stats.officers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Complaint Types
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#2DCC71' }}>
                    {stats.totalTypes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={tabIndex} index={1}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>จัดการผู้ใช้</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddUser}
                sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }}
              >
                เพิ่มผู้ใช้
              </Button>
            </Box>
            {/* Role toggle */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {[
                { value: 'all',       label: 'ทั้งหมด',            count: users.length },
                { value: 'user',      label: 'นักศึกษา/บุคลากร', count: users.filter(u => u.role === 'user').length },
                { value: 'faculty',   label: 'เจ้าหน้าที่คณะ',   count: users.filter(u => u.role === 'faculty').length },
                { value: 'executive', label: 'ผู้บริหาร',        count: users.filter(u => u.role === 'executive').length },
                { value: 'officer',   label: 'เจ้าหน้าที่',    count: users.filter(u => u.role === 'officer').length },
                { value: 'admin',     label: 'ผู้ดูแลระบบ',   count: users.filter(u => u.role === 'admin').length },
                ...(users.filter(u => !['user','faculty','executive','officer','admin'].includes(u.role)).length > 0 ? [{
                  value: 'other', label: 'ไม่ระบุ role',
                  count: users.filter(u => !['user','faculty','executive','officer','admin'].includes(u.role)).length
                }] : []),
              ].map(({ value, label, count }) => (
                <Chip
                  key={value}
                  label={`${label} (${count})`}
                  onClick={() => { setRoleFilter(value); setSelectedUsers(new Set()); }}
                  sx={{
                    fontWeight: 600,
                    cursor: 'pointer',
                    bgcolor: roleFilter === value ? '#D61514' : '#F0F0F0',
                    color: roleFilter === value ? '#fff' : '#555',
                    '&:hover': { bgcolor: roleFilter === value ? '#AA020B' : '#E0E0E0' },
                  }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="ค้นหาด้วย email หรือชื่อ..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
                sx={{ flex: 1, minWidth: '200px' }}
              />
              {selectedUsers.size > 0 && (
                <Button 
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteMultipleUsers}
                >
                  Delete ({selectedUsers.size})
                </Button>
              )}
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#E8ECFF' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>Major</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#333' }}>{maskEmail(user.email)}</TableCell>
                        <TableCell sx={{ color: '#333' }}>{maskName(user.displayName)}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            sx={{
                              bgcolor: user.role === 'admin' ? '#E74C3C' : user.role === 'officer' ? '#3498DB' : '#2DCC71',
                              color: '#fff',
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#666' }}>{user.department || '-'}</TableCell>
                        <TableCell sx={{ color: '#666' }}>{user.major || '-'}</TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(user)}
                            sx={{ color: '#D61514' }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteUser(user.id)}
                            sx={{ color: '#E74C3C' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Complaint Types Tab */}
        <TabPanel value={tabIndex} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Complaint Types Management
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddType}
              sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }}
            >
              Add Type
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#E8ECFF' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>หัวข้อปัญหา</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#D61514' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {types.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4, color: '#999' }}>
                      No complaint types defined
                    </TableCell>
                  </TableRow>
                ) : (
                  types.map((type) => (
                    <TableRow key={type.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                      <TableCell sx={{ color: '#333', fontWeight: 500 }}>{type.label}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditType(type)}
                          sx={{ color: '#D61514' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteType(type.id)}
                          sx={{ color: '#E74C3C' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Issues Tab */}
        <TabPanel value={tabIndex} index={3}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: '200px' }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Select Complaint Type</Typography>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <MenuItem value=""><em>-- Choose a type --</em></MenuItem>
                  {types.map(type => (
                    <MenuItem key={type.id} value={type.id}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedType && (
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleAddIssue}
                  sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }}
                >
                  Add Issue
                </Button>
              )}
            </Box>

            {selectedType ? (

              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#E8ECFF' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>Issue Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>ระดับความเร่งด่วน</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#D61514' }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {issues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#999' }}>
                          No issues defined for this type
                        </TableCell>
                      </TableRow>
                    ) : (
                      issues.map((issue) => {
                        return (
                          <TableRow key={issue.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                            <TableCell sx={{ color: '#333', fontWeight: 500 }}>{issue.label}</TableCell>
                            <TableCell>
                              {(() => {
                                const opt = URGENCY_OPTIONS.find(o => o.value === (issue.urgencyLevel || 2)) || URGENCY_OPTIONS[1];
                                return (
                                  <Chip
                                    label={`${opt.emoji} ${opt.label}`}
                                    size="small"
                                    sx={{ bgcolor: opt.color, color: '#fff', fontWeight: 700 }}
                                  />
                                );
                              })()}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handleEditIssue(issue)} sx={{ color: '#D61514' }}><EditIcon /></IconButton>
                              <IconButton size="small" onClick={() => handleDeleteIssue(issue.id)} sx={{ color: '#E74C3C' }}><DeleteIcon /></IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">Select a complaint type to manage its issues</Alert>
            )}
          </Box>
        </TabPanel>

        {/* Faculties Tab */}
        <TabPanel value={tabIndex} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>จัดการคณะ</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddFaculty}
              sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }}
            >
              เพิ่มคณะ
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#E8ECFF' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>ชื่อคณะ</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#D61514' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faculties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4, color: '#999' }}>ยังไม่มีคณะ</TableCell>
                  </TableRow>
                ) : (
                  faculties.map((fac) => (
                    <TableRow key={fac.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                      <TableCell sx={{ color: '#333', fontWeight: 500 }}>{fac.label}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEditFaculty(fac)} sx={{ color: '#D61514' }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteFaculty(fac.id)} sx={{ color: '#E74C3C' }}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 5 – Department Condition Management */}
        <TabPanel value={tabIndex} index={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#D61514' }}>จัดการเงื่อนไขหน่วยงาน</Typography>
          </Box>

          {/* Create new department */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #E0E0E0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#555' }}>เพิ่มหน่วยงานใหม่</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="ชื่อหน่วยงาน"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDept()}
                sx={{ flex: '1 1 180px' }}
              />
              <TextField
                size="small"
                label="คำอธิบาย (ไม่บังคับ)"
                value={newDeptDesc}
                onChange={(e) => setNewDeptDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDept()}
                sx={{ flex: '2 1 260px' }}
              />
              <Button
                variant="contained"
                onClick={handleCreateDept}
                disabled={!newDeptName.trim()}
                sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)', alignSelf: 'center' }}
              >
                เพิ่ม
              </Button>
            </Box>
          </Paper>

          {/* Department list */}
          {deptLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">กำลังโหลด...</Typography></Box>
          ) : departments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">ยังไม่มีหน่วยงาน กด "โหลดข้อมูลตั้งต้น" เพื่อเริ่มต้น</Typography>
            </Box>
          ) : (
            departments.map((dept) => (
              <Paper key={dept.id} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
                <Box
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 2, py: 1.5, cursor: 'pointer',
                    bgcolor: expandedDept === dept.id ? '#FFF3F3' : '#FAFAFA',
                    '&:hover': { bgcolor: '#FFF3F3' },
                  }}
                  onClick={() => setExpandedDept(prev => prev === dept.id ? null : dept.id)}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: '#D61514' }}>{dept.name}</Typography>
                    {dept.description && <Typography variant="caption" color="text.secondary">{dept.description}</Typography>}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={`${(dept.keywords || []).length} คำ`} size="small" sx={{ bgcolor: '#E8ECFF', color: '#555' }} />
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }} sx={{ color: '#E74C3C' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Collapse in={expandedDept === dept.id}>
                  <Box sx={{ px: 2, py: 2, borderTop: '1px solid #EEE', bgcolor: '#FFF' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#555', mb: 1, display: 'block' }}>คีย์เวิร์ดที่ใช้กำหนดหน่วยงาน</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                      {(dept.keywords || []).length === 0 ? (
                        <Typography variant="caption" color="text.secondary">ยังไม่มีคีย์เวิร์ด</Typography>
                      ) : (
                        (dept.keywords || []).map((kw) => (
                          <Chip
                            key={kw}
                            label={kw}
                            size="small"
                            onDelete={() => handleRemoveKeyword(dept, kw)}
                            sx={{ bgcolor: '#E3F2FD', color: '#1565C0' }}
                          />
                        ))
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="เพิ่มคีย์เวิร์ด..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newKeyword.trim()) handleAddKeyword(dept); }}
                        sx={{ flex: 1 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAddKeyword(dept)}
                        disabled={!newKeyword.trim()}
                        sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }}
                      >
                        เพิ่ม
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Paper>
            ))
          )}
        </TabPanel>

        {/* Tab 6 – Pending Custom Issue Requests */}
        <TabPanel value={tabIndex} index={6}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#D61514' }}>ปัญหาที่ผู้ใช้แจ้งเพิ่ม — รอพิจารณา</Typography>
            <Button size="small" onClick={loadPendingIssues} disabled={pendingLoading} sx={{ color: '#D61514', fontWeight: 600 }}>
              {pendingLoading ? 'โหลด...' : 'รีเฟรช'}
            </Button>
          </Box>
          {pendingLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#D61514' }} /></Box>
          ) : pendingIssues.length === 0 ? (
            <Alert severity="info">ไม่มีปัญหารอดำเนินการ</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#E8ECFF' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>ชื่อปัญหา (จากผู้ใช้)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>หัวข้อ</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }}>สถานะ</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#D61514' }} align="center">การดำเนินการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingIssues.map((item) => {
                    const statusConfig = {
                      pending:  { label: 'รอพิจารณา', color: '#f59e0b' },
                      approved: { label: 'อนุมัติแล้ว', color: '#22c55e' },
                      rejected: { label: 'ปฏิเสธ',     color: '#ef4444' },
                    }[item.status] || { label: item.status, color: '#888' };
                    return (
                      <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                        <TableCell sx={{ color: '#333', fontWeight: 500 }}>{item.customIssueText}</TableCell>
                        <TableCell sx={{ color: '#555' }}>{item.topicLabel || '—'}</TableCell>
                        <TableCell>
                          <Chip label={statusConfig.label} size="small" sx={{ bgcolor: statusConfig.color, color: '#fff', fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="center">
                          {item.status === 'pending' && (
                            <>
                              <Button size="small" variant="contained" onClick={() => handleApproveOpen(item)}
                                sx={{ mr: 1, fontSize: '0.78rem', background: '#22c55e', '&:hover': { background: '#16a34a' } }}>
                                ✔ อนุมัติ
                              </Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => handleRejectIssue(item.id)}
                                sx={{ fontSize: '0.78rem' }}>
                                ✖ ปฏิเสธ
                              </Button>
                            </>
                          )}
                          {item.status !== 'pending' && (
                            <Typography variant="caption" sx={{ color: '#aaa' }}>ดำเนินการแล้ว</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Container>

      {/* Approve Custom Issue Dialog */}
      <Dialog open={Boolean(approveDialog)} onClose={() => setApproveDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#E8ECFF', color: '#D61514' }}>อนุมัติปัญหาใหม่</DialogTitle>
        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #E0E0E0' }}>
            <Typography variant="caption" sx={{ color: '#888' }}>ชื่อปัญหา</Typography>
            <Typography sx={{ fontWeight: 700, color: '#111' }}>{approveDialog?.customIssueText}</Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>หัวข้อ: {approveDialog?.topicLabel || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>หัวข้อปัญหา</Typography>
            <Select fullWidth size="small" value={approveTypeId} onChange={(e) => setApproveTypeId(e.target.value)} displayEmpty sx={{ borderRadius: 2 }} MenuProps={{ disablePortal: true }}>
              <MenuItem value=""><em>-- เลือกหัวข้อ --</em></MenuItem>
              {types.map(t => <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>ระดับความเร่งด่วน</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {URGENCY_OPTIONS.map(opt => (
                <Box key={opt.value} onClick={() => setApproveUrgency(opt.value)}
                  sx={{ flex: 1, textAlign: 'center', py: 0.8, borderRadius: 2, cursor: 'pointer',
                    border: approveUrgency === opt.value ? `2px solid ${opt.color}` : '2px solid #E0E0E0',
                    bgcolor: approveUrgency === opt.value ? opt.color + '22' : '#FAFAFA' }}>
                  <Typography sx={{ fontSize: '1rem' }}>{opt.emoji}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: approveUrgency === opt.value ? opt.color : '#888' }}>{opt.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setApproveDialog(null)} color="inherit">ยกเลิก</Button>
          <Button onClick={handleApproveConfirm} variant="contained" disabled={!approveTypeId || loading}
            sx={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
            {loading ? <CircularProgress size={20} /> : '✔ อนุมัติและเพิ่ม'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Dialog - Create / Edit */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#E8ECFF', color: '#D61514' }}>
          {editingUser ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {formErrors.submit && <Alert severity="error">{formErrors.submit}</Alert>}
          <TextField
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={Boolean(editingUser)}
            error={Boolean(formErrors.email)}
            helperText={formErrors.email}
            fullWidth
          />
          <TextField
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            error={Boolean(formErrors.displayName)}
            helperText={formErrors.displayName}
            fullWidth
          />
          <FormControl fullWidth error={Boolean(formErrors.role)}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Role</Typography>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              MenuProps={{ disablePortal: true }}
            >
              <MenuItem value="user">User (ทั่วไป)</MenuItem>
              <MenuItem value="faculty">เจ้าหน้าที่คณะ (Faculty)</MenuItem>
              <MenuItem value="executive">ผู้บริหาร (Executive)</MenuItem>
              <MenuItem value="officer">Officer (เจ้าหน้าที่)</MenuItem>
              <MenuItem value="admin">ผู้ดูแลระบบ (Admin)</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>ประเภทผู้ใช้</Typography>
            <Select
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value, department: '', major: '' })}
              MenuProps={{ disablePortal: true }}
            >
              <MenuItem value="student">นักศึกษา</MenuItem>
              <MenuItem value="staff">บุคลากร</MenuItem>
            </Select>
          </FormControl>
          {formData.userType === 'student' ? (
            <>
              <FormControl fullWidth>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>คณะ (Department)</Typography>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value, major: '' })}
                  displayEmpty
                  MenuProps={{ disablePortal: true }}
                >
                  <MenuItem value=""><em>-- เลือกคณะ --</em></MenuItem>
                  {Object.keys(FACULTY_MAJORS).map(f => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth disabled={!formData.department}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>สาขาวิชา (Major)</Typography>
                <Select
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  displayEmpty
                  MenuProps={{ disablePortal: true }}
                >
                  <MenuItem value=""><em>{formData.department ? '-- เลือกสาขา --' : '-- เลือกคณะก่อน --'}</em></MenuItem>
                  {(FACULTY_MAJORS[formData.department] || []).map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <FormControl fullWidth>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>หน่วยงาน (Department)</Typography>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value, major: '' })}
                  displayEmpty
                  MenuProps={{ disablePortal: true }}
                >
                  <MenuItem value=""><em>-- เลือกหน่วยงาน --</em></MenuItem>
                  {STAFF_DEPARTMENTS.map(d => (
                    <MenuItem key={d.name} value={d.name}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {(STAFF_DEPARTMENTS.find(d => d.name === formData.department)?.subDepartments || []).length > 0 && (
                <FormControl fullWidth>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>หน่วยงานย่อย</Typography>
                  <Select
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    displayEmpty
                    MenuProps={{ disablePortal: true }}
                  >
                    <MenuItem value=""><em>-- เลือกหน่วยงานย่อย --</em></MenuItem>
                    {(STAFF_DEPARTMENTS.find(d => d.name === formData.department)?.subDepartments || []).map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenUserDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveUser} variant="contained" sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Type Dialog */}
      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#E8ECFF', color: '#D61514' }}>
          {editingType ? 'แก้ไขหัวข้อปัญหา' : 'เพิ่มหัวข้อปัญหา'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {typeError && <Alert severity="error">{typeError}</Alert>}
          <TextField
            fullWidth
            autoFocus
            label="ชื่อหัวข้อปัญหา"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="เช่น สิ่งอำนวยความสะดวกและอาคารสถานที่"
          />
          <FormControl fullWidth>
            <InputLabel>หน่วยงานที่รับผิดชอบ</InputLabel>
            <Select
              value={newTypeDept}
              label="หน่วยงานที่รับผิดชอบ"
              onChange={(e) => setNewTypeDept(e.target.value)}
              MenuProps={{ disablePortal: true }}
            >
              <MenuItem value=""><em>— ไม่ระบุ —</em></MenuItem>
              {departments.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenTypeDialog(false)} color="inherit">ยกเลิก</Button>
          <Button onClick={handleSaveType} variant="contained" sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={openIssueDialog} onClose={() => setOpenIssueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#E8ECFF', color: '#D61514' }}>
          {editingIssue ? 'แก้ไขปัญหา' : 'เพิ่มปัญหา'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {issueError && <Alert severity="error">{issueError}</Alert>}
          <TextField
            fullWidth autoFocus
            label="ชื่อปัญหาที่พบ"
            value={newIssue}
            onChange={(e) => setNewIssue(e.target.value)}
            placeholder="เช่น ไฟฟ้า/แสงสว่างชำรุด"
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#555' }}>ระดับความเร่งด่วน</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {URGENCY_OPTIONS.map(opt => (
                <Box
                  key={opt.value}
                  onClick={() => setNewIssueUrgency(opt.value)}
                  sx={{
                    flex: 1, textAlign: 'center', py: 1, borderRadius: 2, cursor: 'pointer',
                    border: newIssueUrgency === opt.value ? `2px solid ${opt.color}` : '2px solid #E0E0E0',
                    bgcolor: newIssueUrgency === opt.value ? opt.color + '22' : '#FAFAFA',
                    transition: 'all 0.15s',
                  }}
                >
                  <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{opt.emoji}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: newIssueUrgency === opt.value ? opt.color : '#888', mt: 0.3 }}>{opt.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenIssueDialog(false)} color="inherit">ยกเลิก</Button>
          <Button onClick={handleSaveIssue} variant="contained" sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Faculty Dialog */}
      <Dialog open={openFacultyDialog} onClose={() => setOpenFacultyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#E8ECFF', color: '#D61514' }}>
          {editingFaculty ? 'แก้ไขชื่อคณะ' : 'เพิ่มคณะ'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {facultyError && <Alert severity="error" sx={{ mb: 2 }}>{facultyError}</Alert>}
          <TextField
            fullWidth
            label="ชื่อคณะ"
            value={newFaculty}
            onChange={(e) => setNewFaculty(e.target.value)}
            placeholder="เช่น คณะวิศวกรรม"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenFacultyDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveFaculty} variant="contained" sx={{ background: 'linear-gradient(135deg, #D61514 0%, #AA020B 100%)' }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generic Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#D61514' }}>⚠️ {confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#374151', mt: 0.5 }}>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeConfirm} color="inherit" variant="outlined">ยกเลิก</Button>
          <Button
            onClick={async () => { closeConfirm(); if (confirmDialog.onConfirm) await confirmDialog.onConfirm(); }}
            variant="contained"
            sx={{ bgcolor: '#D61514', '&:hover': { bgcolor: '#AA020B' } }}
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminSystem;
