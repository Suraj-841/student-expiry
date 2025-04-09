// === StudentCard.jsx (Styled with Dark Mode Support + Actions) ===

import React from 'react';
import QRCode from 'react-qr-code';

export default function StudentCard({ student, onVacate, onUpdateExpiry, onReplace,onToggleStatus }) {
  const {
    "Seat No": seat,
    "Name": name,
    "Day Type": day,
    "Charge": charge,
    "Start Date": start,
    "Expiry Date": expiry,
    "Status": status,
    "Phone": phone,
  } = student;

  const groupLink = ` https://chat.whatsapp.com/FKCO18MfPgREEKOfimn3MD`;
  const whatsappURL = `https://wa.me/91${phone}?text=Hi ${name}, please join our study group: ${groupLink}`;
  const sendWhatsapp = () => {
    if (!phone || phone.trim() === "") return alert("❌ No phone number available.");
    window.open(whatsappURL, '_blank');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 transition hover:shadow-xl">
      <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-2">Seat {seat}: {name}</h2>
      <p className="text-sm mb-1"><strong>📞 Phone:</strong> {phone || 'N/A'}</p>
      <p className="text-sm mb-1"><strong>🕓 Day Type:</strong> {day || 'N/A'}</p>
      <p className="text-sm mb-1"><strong>💰 Charge:</strong> ₹{charge || 0}</p>
      <p className="text-sm mb-1"><strong>📅 Start:</strong> {start || 'N/A'}</p>
      <p className="text-sm mb-1"><strong>📆 Expiry:</strong> {expiry || 'N/A'}</p>
      <p className="text-sm mb-3">
        <strong>Status:</strong>{" "}
        <span className={`font-bold ${status?.toLowerCase() === 'pending' ? 'text-red-500' : 'text-green-600'}`}>
          {status || 'N/A'}
        </span>
      </p>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => onVacate(seat)}
          className="px-3 py-1 text-sm rounded bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          Vacate
        </button>
        <button
          onClick={() => onUpdateExpiry(seat, name)}
          className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          Update Expiry
        </button>
        <button
          onClick={() => onReplace(seat)}
          className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white"
        >
          Replace
        </button>
        <button
          onClick={() => onToggleStatus(seat, status)}
          className={`px-3 py-1 text-sm rounded ${
            status?.toLowerCase() === "pending" ? "bg-green-600" : "bg-red-600"
          } hover:opacity-90 text-white`}
        >
          {status?.toLowerCase() === "pending" ? "Mark Done" : "Mark Pending"}
        </button>

        {phone && phone.trim() !== "" && (
          <>
            <button
              onClick={sendWhatsapp}
              className="px-3 py-1 text-sm rounded bg-teal-600 hover:bg-teal-700 text-white"
            >
              📤 Send WhatsApp
            </button>
            <div className="mt-2 bg-white p-2 rounded shadow-sm">
              <QRCode value={whatsappURL} size={80} />
            </div>
          </>
        )}


      </div>
    </div>
  );
}
