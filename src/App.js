// === App.jsx (Full Integration with Backend Features + Dark Mode) ===

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import StudentCard from './components/StudentCard';

const API_BASE = 'https://backend-4xju.onrender.com';
const ACCESS_CODE = "Suraj@123"; 


export default function App() {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");

  useEffect(() => {
    const userInput = prompt("Enter access code:");
    if (userInput === ACCESS_CODE) {
      setIsAllowed(true);
    } else {
      alert("❌ Access denied");
      window.location.href = "https://google.com";
    }
  }, []);
  const fetchStudents = async () => {
    try {
      let endpoint = `${API_BASE}/students`;
      if (filter === 'expired') endpoint = `${API_BASE}/expired-students`;
      const res = await axios.get(endpoint);


      let filtered = res.data;

      // Status-based filter
      if (filter === 'vacant') {
        filtered = filtered.filter(s => s['Name']?.toLowerCase() === 'vacant');
      }
      if (filter === 'expired') {
        // Already handled by endpoint
      }

      // Day Type-based filter
      if (dayFilter !== 'all') {
        const matchType = {
          full: 'full day',
          morning: 'morning half',
          evening: 'evening half'
        }[dayFilter];
        filtered = filtered.filter(s => (s['Day Type'] || '').toLowerCase() === matchType);
      }

      setStudents(filtered);


    } catch (err) {
      toast.error('Error fetching student data');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filter,dayFilter]);

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
      toast.success(`Seat ${seat_no} vacated`);
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to vacate');
    }
  };
  
  const updateExpiry = async (seat_no, name) => {
    const new_expiry = prompt(`Enter new expiry date for ${name} (e.g., 01 May 2025):`);
    if (!new_expiry) return;
    try {
      await axios.post(`${API_BASE}/update-expiry`, {
        seat_no,
        name,
        new_expiry
      });
      toast.success(`Expiry updated for ${name}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update expiry');
    }
  };

  const toggleStatus = async (seat_no, currentStatus) => {
    const newStatus = currentStatus.toLowerCase() === "pending" ? "Done" : "Pending";
  
    try {
      await axios.post(`${API_BASE}/update-status`, {
        seat_no,
        new_status: newStatus,
      });
      toast.success(`Seat ${seat_no} marked ${newStatus}`);
      fetchStudents();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };
  
  
  const replaceStudent = async (seat_no) => {
    const name = prompt("Enter student name (or type 'Vacant'):");
    if (!name) return;
  
    if (name.toLowerCase() === 'vacant') return vacateSeat(seat_no);
  
    const day_type = prompt("Enter Day Type (Full Day / Half Day):");
    const charge = parseInt(prompt("Enter charge (800 or 500):"), 10);
    const start_date = prompt("Enter start date (e.g., 01 April):");
    const phone = prompt("Enter phone number:");
    const status = prompt("Enter status (Pending / Paid / etc):");
  
    if (!day_type || isNaN(charge) || !start_date || !status) {
      toast.error("All fields must be filled correctly.");
      return;
    }
  
    try {
      await axios.post(`${API_BASE}/replace-student`, {
        seat_no,
        name,
        day_type,
        charge,
        start_date,
        phone,
        status
      });
      toast.success(`Student ${name} added to seat ${seat_no}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to replace student');
    }
  };
  

  if (!isAllowed) return null; 
  return (
    <div className={darkMode ? 'dark bg-gray-900 text-white min-h-screen p-4' : 'bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen p-4'}>
      <Toaster />
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-blue-900 dark:text-white drop-shadow-sm flex mx-auto items-center">Student Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
        <select
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-white rounded-md px-3 py-1 shadow"
        >
          <option value="all">All Status</option>
          <option value="expired">Expired</option>
          <option value="vacant">Vacant</option>
        </select>

        <select
          onChange={(e) => setDayFilter(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-white rounded-md px-3 py-1 shadow"
        >
          <option value="all">All Day Types</option>
          <option value="full">Full Day</option>
          <option value="morning">Morning Half</option>
          <option value="evening">Evening Half</option>
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
            onUpdateExpiry={() => updateExpiry(student["Seat No"], student["Name"])}
            onReplace={() => replaceStudent(student["Seat No"])}
            onToggleStatus={() => toggleStatus(student["Seat No"], student["Status"])}
          />
        ))}
      </div>
    </div>
  );
}
