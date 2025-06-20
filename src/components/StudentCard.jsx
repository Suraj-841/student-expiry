import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircleIcon, ExclamationCircleIcon, UserIcon, ClockIcon, CurrencyRupeeIcon, CalendarIcon, PhoneIcon } from "@heroicons/react/24/solid";

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

  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [due, setDue] = useState(undefined);
  // Dropdown state
  const [selectedAction, setSelectedAction] = useState("");

  // Fetch due amount for this student on mount
  React.useEffect(() => {
    const fetchDue = async () => {
      try {
        const API_BASE = process.env.NODE_ENV === 'development'
          ? 'http://127.0.0.1:8000'
          : 'https://backend-4xju.onrender.com';
        const res = await axios.get(`${API_BASE}/students`);
        const dueObj = res.data.find(d => d["Seat No"] === seat);
        setDue(dueObj ? dueObj["Due"] : 0);
      } catch {
        setDue(0);
      }
    };
    fetchDue();
  }, [seat]);

  const whatsappURL = `https://wa.me/91${phone}?text=Hi ${name}, please join our study group: ${whatsappLink}`;
  const sendWhatsapp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!phone || phone.trim() === "") return alert("❌ No phone number available.");
    window.open(whatsappURL, '_blank');
  };

  // Fetch invoice URL if not present
  const fetchInvoiceUrl = async (seatNo) => {
    try {
      const API_BASE = process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:8000'
        : 'https://backend-4xju.onrender.com';
      const res = await fetch(`${API_BASE}/invoice/latest/${seatNo}`);
      if (!res.ok) throw new Error("No invoice found");
      const data = await res.json();
      return data.invoice_url;
    } catch {
      return null;
    }
  };

  // New: Send Invoice PDF to WhatsApp (download PDF, open WhatsApp, show message)
  const sendInvoiceToWhatsapp = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!phone || phone.trim() === "") return alert("❌ No phone number available.");
    setSendingInvoice(true);
    try {
      let invoiceUrl = student["Invoice URL"];
      if (!invoiceUrl) {
        invoiceUrl = await fetchInvoiceUrl(seat);
      }
      if (!invoiceUrl) {
        alert('No invoice found for this student.');
        setSendingInvoice(false);
        return;
      }
      // Download the PDF
      const API_BASE = process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:8000'
        : 'https://backend-4xju.onrender.com';
      const absUrl = invoiceUrl.startsWith('http') ? invoiceUrl : `${API_BASE}${invoiceUrl}`;
      const response = await fetch(absUrl);
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${name.replace(/\s+/g, '_')}_${seat}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      // Open WhatsApp chat
      const waLink = `https://wa.me/91${phone}?text=Hi ${name}, please find your invoice attached.`;
      window.open(waLink, '_blank');
      // Show message to user
      setTimeout(() => {
        alert('Invoice PDF downloaded. Please attach and send it manually via WhatsApp.');
      }, 300);
    } catch (err) {
      alert('Failed to send invoice to WhatsApp');
    }
    setSendingInvoice(false);
  };

  // Add suffix to Seat No. for half-day types
  const seatSuffix =
    day?.toLowerCase() === "morning half"
      ? "A"
      : day?.toLowerCase() === "evening half"
      ? "B"
      : "";

  // Helper: check if student is expired (expiry date < today)
  const isExpired = (() => {
    if (!expiry) return false;
    const today = new Date();
    const exp = new Date(expiry);
    return exp.setHours(0,0,0,0) < today.setHours(0,0,0,0);
  })();

  // Dropdown action handler
  const handleAction = async () => {
    switch (selectedAction) {
      case "vacate":
        onVacate(seat);
        break;
      case "update_expiry":
        onUpdateExpiry(seat, name);
        break;
      case "replace":
        onReplace(seat);
        break;
      case "toggle_status":
        onToggleStatus(seat, status);
        break;
      case "update_phone": {
        const newPhone = prompt("Enter new phone number:", phone || "");
        if (!newPhone || newPhone === phone) return;
        try {
          const API_BASE = process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000'
            : 'https://backend-4xju.onrender.com';
          await axios.post(`${API_BASE}/update-phone`, {
            seat_no: seat,
            new_phone: newPhone
          });
          window.location.reload();
        } catch {
          alert("Failed to update phone number");
        }
        break;
      }
      case "update_charge": {
        const newCharge = prompt("Enter new charge amount:", charge || "");
        if (!newCharge || isNaN(newCharge) || Number(newCharge) === Number(charge)) return;
        try {
          const API_BASE = process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000'
            : 'https://backend-4xju.onrender.com';
          await axios.post(`${API_BASE}/update-charge`, {
            seat_no: seat,
            new_charge: Number(newCharge)
          });
          window.location.reload();
        } catch {
          alert("Failed to update charge");
        }
        break;
      }
      case "update_name": {
        const newName = prompt("Enter new name:", name || "");
        if (!newName || newName === name) return;
        try {
          const API_BASE = process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000'
            : 'https://backend-4xju.onrender.com';
          await axios.post(`${API_BASE}/update-name`, {
            seat_no: seat,
            new_name: newName
          });
          window.location.reload();
        } catch {
          alert("Failed to update name");
        }
        break;
      }
      case "send_whatsapp":
        sendWhatsapp({ preventDefault: () => {}, stopPropagation: () => {} });
        break;
      case "send_invoice":
        sendInvoiceToWhatsapp({ preventDefault: () => {}, stopPropagation: () => {} });
        break;
      case "toggle_day":
        onToggleDayType(seat, day);
        break;
      case "delete":
        if (window.confirm(`Are you sure you want to delete Seat ${seat}?`)) {
          onDelete(seat);
        }
        break;
      default:
        break;
    }
  };

  // Responsive card style: much smaller for mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const cardStyle = {
    fontFamily: 'Inter, sans-serif',
    maxWidth: isMobile ? 340 : 480,
    margin: 'auto',
    transition: 'none',
    boxSizing: 'border-box',
    minHeight: 0,
    padding: isMobile ? '0.5rem' : '1.5rem',
    fontSize: isMobile ? '0.85rem' : '1rem',
    borderRadius: isMobile ? '0.75rem' : '1.5rem',
  };

  return (
    <div
      className={`relative ${isExpired ? 'bg-red-100 dark:bg-red-900' : 'bg-white dark:bg-gray-800'} shadow-xl rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700`}
      style={cardStyle}
    >
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <UserIcon className="h-7 w-7 text-blue-700" />
        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 tracking-tight">
          Seat {student.DisplaySeat || seat}: {name}
        </h2>
        <div className="flex gap-2 flex-wrap">
          {isExpired && (
            <span className="px-2 py-1 rounded bg-red-500 text-white text-xs font-semibold flex items-center gap-1">
              <ExclamationCircleIcon className="h-4 w-4" /> Expired
            </span>
          )}
          {status?.toLowerCase() === 'pending' && !isExpired && (
            <span className="px-2 py-1 rounded bg-yellow-400 text-white text-xs font-semibold flex items-center gap-1">
              <ClockIcon className="h-4 w-4" /> Pending
            </span>
          )}
          {status?.toLowerCase() === 'done' && !isExpired && (
            <span className="px-2 py-1 rounded bg-green-500 text-white text-xs font-semibold flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4" /> Done
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mb-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><PhoneIcon className="h-5 w-5" /><strong>Phone:</strong> {phone || 'N/A'}</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><ClockIcon className="h-5 w-5" /><strong>Day Type:</strong> {day || 'N/A'}</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><CurrencyRupeeIcon className="h-5 w-5" /><strong>Due:</strong> ₹{due !== undefined ? due : (charge ?? 0)}</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><CurrencyRupeeIcon className="h-5 w-5" /><strong>Charge:</strong> ₹{charge || 0}</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><CalendarIcon className="h-5 w-5" /><strong>Start:</strong> {start || 'N/A'}</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><CalendarIcon className="h-5 w-5" /><strong>Expiry:</strong> {expiry || 'N/A'}</div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <select
          className="px-3 py-2 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow"
          value={selectedAction}
          onChange={e => setSelectedAction(e.target.value)}
        >
          <option value="">Select Action</option>
          <option value="vacate">Vacate</option>
          <option value="update_expiry">Update Expiry</option>
          <option value="replace">Replace</option>
          <option value="toggle_status">{status?.toLowerCase() === "pending" ? "Mark Done" : "Mark Pending"}</option>
          <option value="update_phone">Update Phone</option>
          <option value="update_charge">Update Charge</option>
          <option value="update_name">Update Name</option>
          <option value="send_whatsapp">Send WhatsApp</option>
          <option value="send_invoice">Send Invoice PDF to WhatsApp</option>
          <option value="toggle_day">Toggle Day</option>
          <option value="delete">Delete</option>
        </select>
        <button
          className="px-5 py-2 text-base rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-semibold shadow-lg transition"
          disabled={!selectedAction}
          onClick={handleAction}
        >
          Do Action
        </button>
      </div>
    </div>
  );
}

//next->
//add name to invoice
/*
  integrate payment and dashboard
*/