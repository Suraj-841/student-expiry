// === StudentCard Component === //

// frontend/src/components/StudentCard.jsx
import React from 'react';

export default function StudentCard({ student, onUpdate, onReplace, onVacate }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-600 rounded-2xl shadow-lg p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{student.Name}</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Seat: <span className="font-medium text-gray-700 dark:text-white">{student["Seat No"]}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Status: <span className="font-medium text-gray-700 dark:text-white">{student.Status}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Expiry: <span className="font-medium text-gray-700 dark:text-white">{student["Expiry Date"]}</span>
        </p>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={onUpdate}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-150"
        >
          📅 Update Expiry
        </button>
        <button
          onClick={() => onReplace(student["Seat No"])}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-lg transition duration-150"
        >
          🔄 Replace
        </button>
        <button
          onClick={() => onVacate(student["Seat No"])}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition duration-150"
        >
          ❌ Vacate
        </button>
      </div>
    </div>
  );
}