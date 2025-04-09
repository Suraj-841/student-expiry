// === Styled FRONTEND (React + Tailwind + Toaster + Dark Mode Toggle + Filters) === //

// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentCard from './components/StudentCard';
import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  const [students, setStudents] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchStudents = async () => {
    const res = await axios.get('http://localhost:8000/students');
    setStudents(res.data);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleUpdate = async (seatNo, name) => {
    const newDate = prompt('Enter new expiry date (e.g., 01 May 2025):');
    if (newDate) {
      await axios.post('http://localhost:8000/update-expiry', {
        seat_no: seatNo,
        name: name,
        new_expiry: newDate
      });
      toast.success(`Expiry updated for ${name}`);
      fetchStudents();
    }
  };

  const handleReplace = async (seatNo) => {
    const name = prompt("Enter new student name (type 'Vacant' to mark empty):");
    if (!name) return;

    if (name.trim().toLowerCase() === "vacant") {
      await axios.post("http://localhost:8000/replace-student", {
        seat_no: seatNo,
        name: "Vacant",
        day_type: "",
        charge: 0,
        start_date: "",
        expiry_date: "",
        status: ""
      });
      toast(`Seat ${seatNo} vacated`);
      fetchStudents();
      return;
    }

    const dayType = prompt("Enter day type (Full Day / Half Day):");
    const charge = parseInt(prompt("Enter charge (800 or 500):"), 10);
    const start = prompt("Enter start date (e.g., 01 April):");
    const expiry = prompt("Enter expiry date (e.g., 01 May 2025):");
    const status = prompt("Enter status (e.g., pending, Done, etc.):");

    if (name && dayType && charge && start && expiry && status) {
      await axios.post("http://localhost:8000/replace-student", {
        seat_no: seatNo,
        name,
        day_type: dayType,
        charge,
        start_date: start,
        expiry_date: expiry,
        status,
      });
      toast.success(`New student ${name} assigned to seat ${seatNo}`);
      fetchStudents();
    }
  };

  const handleVacate = async (seatNo) => {
    await axios.post("http://localhost:8000/replace-student", {
      seat_no: seatNo,
      name: "Vacant",
      day_type: "",
      charge: 0,
      start_date: "",
      expiry_date: "",
      status: ""
    });
    toast(`Seat ${seatNo} marked vacant`);
    fetchStudents();
  };

  const filteredStudents = students.filter((s) => {
    if (filter === "vacant") return s.Name.toLowerCase() === "vacant";
    if (filter === "pending") return s.Status.toLowerCase() === "pending";
    return true;
  });

  return (
    <div className={darkMode ? "dark bg-gray-900 text-white min-h-screen p-6" : "bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen p-6"}>
      <Toaster />
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-4xl font-extrabold text-blue-900 dark:text-white drop-shadow-sm mx-auto flex items-center">
          Student Membership Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-white rounded-md px-3 py-1 shadow"
          >
            <option value="all">All</option>
            <option value="vacant">Vacant</option>
            <option value="pending">Pending</option>
          </select>
          <button
            className="ml-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-screen-xl mx-auto">
        {filteredStudents.map(s => (
          <StudentCard
            key={s["Seat No"]}
            student={s}
            onUpdate={() => handleUpdate(s["Seat No"], s["Name"])}
            onReplace={handleReplace}
            onVacate={handleVacate}
          />
        ))}
      </div>
    </div>
  );
}





// git remote add origin https://github.com/Suraj-841/student-expiry.git