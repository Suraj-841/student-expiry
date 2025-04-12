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
  const [whatsappLink, setWhatsappLink] = useState("");
  const [newLink, setNewLink] = useState("");


  useEffect(() => {
    axios.get(`${API_BASE}/whatsapp-link`)
      .then(res => {
        setWhatsappLink(res.data.link);
        setNewLink(res.data.link);
      })
      .catch(() => toast.error("Failed to load WhatsApp link"));
  }, []);

  useEffect(() => {
    const userInput = prompt("Enter access code:");
    if (userInput === ACCESS_CODE) {
      setIsAllowed(true);
    } else {
      alert("❌ Access denied");
      window.location.href = "https://google.com";
    }
  }, []);


  const insertNewCard = async () => {
    const seat_no = prompt("Enter new Seat Number:");
    if (!seat_no) return;
  
    const name = prompt("Enter student name:");
    const day_type = prompt("Enter Day Type (Full Day / Morning Half / Evening Half):");
    const charge = parseInt(prompt("Enter charge:"), 10);
    const start_date = prompt("Enter start date (e.g., 01 April):");
    const phone = prompt("Enter phone number:");
    const status = prompt("Enter status (Pending / Paid / etc):");
  
    try {
      await axios.post(`${API_BASE}/add-student-card`, {
        seat_no,
        name,
        day_type,
        charge,
        start_date,
        phone,
        status
      });
      toast.success(`Seat ${seat_no} inserted`);
      fetchStudents();
    } catch (err) {
      toast.error("Failed to insert new student");
    }
  };
  

  const deleteCard = async (seat_no) => {
    if (!window.confirm(`Are you sure you want to delete Seat ${seat_no}?`)) return;
  
    try {
      await axios.delete(`${API_BASE}/remove-student-card/${seat_no}`);
      toast.success(`Seat ${seat_no} deleted`);
      fetchStudents(); // Refresh the UI
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete seat");
    }
  };
  
  const toggleDayType = async (seat_no, currentType) => {
    let newType = "";
  
    if (currentType.toLowerCase() === "full day") newType = "Morning Half";
    else if (currentType.toLowerCase() === "morning half") newType = "Evening Half";
    else newType = "Full Day";
  
    try {
      await axios.post(`${API_BASE}/update-day-type`, {
        seat_no,
        new_day_type: newType
      });
      toast.success(`Seat ${seat_no} updated to ${newType}`);
      fetchStudents();
    } catch (err) {
      toast.error("Failed to update day type");
    }
  };
  

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

      // 🧠 Sort by Seat No (as string to handle "31_A", "31_B")
      filtered.sort((a, b) => {
        const parseSeat = (seat) => {
          const match = seat.toString().match(/^(\d+)(?:[_-]?([A-Za-z]))?$/);
          const num = match ? parseInt(match[1]) : 0;
          const suffix = match && match[2] ? match[2].toUpperCase() : '';
          return [num, suffix];
        };
      
        const [aNum, aSuffix] = parseSeat(a["Seat No"]);
        const [bNum, bSuffix] = parseSeat(b["Seat No"]);
      
        if (aNum !== bNum) return aNum - bNum;
        return aSuffix.localeCompare(bSuffix);
      });
      

      setStudents(filtered);


    } catch (err) {
      toast.error('Error fetching student data');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filter,dayFilter]);


  const downloadLeftStudentsCSV = async () => {
    try {
      const res = await axios.get(`${API_BASE}/left-students`);
      const leftStudents = res.data;
  
      if (!leftStudents.length) {
        toast.error("No left student records found.");
        return;
      }
  
      const headers = Object.keys(leftStudents[0]).join(",");
      const rows = leftStudents.map(s =>
        Object.values(s).map(val => `"${val ?? ''}"`).join(",")
      );
  
      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "left_students_log.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      toast.success("CSV downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch left student data.");
    }
  };
  


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

        <button
        onClick={downloadLeftStudentsCSV}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        ⬇️ Download Left Students CSV
      </button>

      <button
      onClick={insertNewCard}
      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
    >
      ➕ Insert New Card
    </button>


      <div className="flex items-center gap-2 mt-4">
      <input
        type="text"
        value={newLink}
        onChange={(e) => setNewLink(e.target.value)}
        className="w-full md:w-96 px-4 py-2 rounded border border-gray-300 dark:bg-gray-700 dark:text-white"
        placeholder="Paste new WhatsApp group link"
      />
      <button
        onClick={() => {
          axios.post(`${API_BASE}/whatsapp-link`, { link: newLink })
            .then(() => {
              toast.success("WhatsApp link updated!");
              setWhatsappLink(newLink);
            })
            .catch(() => toast.error("Failed to update link"));
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save
      </button>
    </div>


      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {students.map((student, index) => {
    const seatNo = student["Seat No"];
    const dayType = student["Day Type"]?.toLowerCase();
    const suffix =
      dayType === "morning half" ? "_A" :
      dayType === "evening half" ? "_B" :
      "";

    return (
      <StudentCard
        key={`${seatNo}-${suffix}`}
        student={{ ...student, DisplaySeat: `${seatNo}${suffix}` }}
        onVacate={vacateSeat}
        onUpdateExpiry={() => updateExpiry(seatNo, student["Name"])}
        onReplace={() => replaceStudent(seatNo)}
        onToggleStatus={() => toggleStatus(seatNo, student["Status"])}
        whatsappLink={whatsappLink}
        onToggleDayType={() => toggleDayType(seatNo, student["Day Type"])}
        onDelete={() => deleteCard(seatNo)}
      />
    );
  })}
</div>

    </div>
  );
}
