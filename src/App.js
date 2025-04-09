// === App.jsx (Full Integration with Backend Features + Dark Mode) ===

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import StudentCard from './components/StudentCard';

const API_BASE = 'https://student-backend.onrender.com';

export default function App() {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);

  const fetchStudents = async () => {
    try {
      let endpoint = `${API_BASE}/students`;
      if (filter === 'expired') endpoint = `${API_BASE}/expired-students`;
      const res = await axios.get(endpoint);

      let filtered = res.data;
      if (filter === 'vacant') {
        filtered = res.data.filter(s => s['Name']?.toLowerCase() === 'vacant');
      }
      setStudents(filtered);
    } catch (err) {
      toast.error('Error fetching student data');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filter]);

  const vacateSeat = async (seat_no) => {
    try {
      await axios.post(`${API_BASE}/replace-student`, {
        seat_no,
        name: 'Vacant',
        day_type: '',
        charge: 0,
        start_date: '',
        phone: '',
        status: ''
      });
      toast.success('Seat vacated');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to vacate');
    }
  };

  const updateExpiry = async (seat_no, name, new_expiry) => {
    try {
      await axios.post(`${API_BASE}/update-expiry`, {
        seat_no,
        name,
        new_expiry
      });
      toast.success('Expiry updated');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update expiry');
    }
  };

  const replaceStudent = async (formData) => {
    try {
      await axios.post(`${API_BASE}/replace-student`, formData);
      toast.success('Student replaced');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to replace');
    }
  };

  return (
    <div className={darkMode ? 'dark bg-gray-900 text-white min-h-screen p-4' : 'bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen p-4'}>
      <Toaster />
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-blue-900 dark:text-white drop-shadow-sm flex mx-auto items-center">Student Dashboard</h1>
        <div className="flex gap-4">
          <select
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-white rounded-md px-3 py-1 shadow"
          >
            <option value="all">All</option>
            <option value="expired">Expired</option>
            <option value="vacant">Vacant</option>
          </select>
          <button
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? '🌞 Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student, index) => (
          <StudentCard
            key={index}
            student={student}
            onVacate={vacateSeat}
            onUpdateExpiry={updateExpiry}
            onReplace={replaceStudent}
          />
        ))}
      </div>
    </div>
  );
}
