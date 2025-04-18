import React from 'react';

export default function StudentCard({
  student,
  onVacate,
  onUpdateExpiry,
  onReplace,
  onToggleStatus,
  whatsappLink,
  onToggleDayType,
  onDelete
}) {
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

  const whatsappURL = `https://wa.me/91${phone}?text=Hi ${name}, please join our study group: ${whatsappLink}`;
  const sendWhatsapp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!phone || phone.trim() === "") return alert("❌ No phone number available.");
    window.open(whatsappURL, '_blank');
  };

  // Add suffix to Seat No. for half-day types
  const seatSuffix =
    day?.toLowerCase() === "morning half"
      ? "A"
      : day?.toLowerCase() === "evening half"
      ? "B"
      : "";

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 transition hover:shadow-xl">
    <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-2">
      Seat {student.DisplaySeat || seat}: {name}
    </h2>
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
          type="button"
          onClick={(e) => { e.preventDefault(); onVacate(seat); }}
          className="px-3 py-1 text-sm rounded bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          Vacate
        </button>

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onUpdateExpiry(seat, name); }}
          className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          Update Expiry
        </button>

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onReplace(seat); }}
          className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white"
        >
          Replace
        </button>

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onToggleStatus(seat, status); }}
          className={`px-3 py-1 text-sm rounded ${
            status?.toLowerCase() === "pending" ? "bg-green-600" : "bg-red-600"
          } hover:opacity-90 text-white`}
        >
          {status?.toLowerCase() === "pending" ? "Mark Done" : "Mark Pending"}
        </button>

        {phone && phone.trim() !== "" && (
          <button
            type="button"
            onClick={sendWhatsapp}
            className="px-3 py-1 text-sm rounded bg-teal-600 hover:bg-teal-700 text-white"
          >
            📤 Send WhatsApp
          </button>
        )}

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onToggleDayType(seat, day); }}
          className="px-3 py-1 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white"
        >
          Toggle Day
        </button>

        <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (window.confirm(`Are you sure you want to delete Seat ${seat}?`)) {
            onDelete(seat);
          }
        }}
        className="px-3 py-1 text-sm rounded bg-red-700 hover:bg-red-800 text-white"
      >
        ❌ Delete
      </button>



      </div>
    </div>
  );
}
