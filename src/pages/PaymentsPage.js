import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:8000'
  : 'https://backend-4xju.onrender.com';

export default function PaymentsPage() {
  const [students, setStudents] = useState([]);
  const [dues, setDues] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterMode, setFilterMode] = useState("date"); // 'date', 'month', 'year'

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [studentsRes, duesRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/students`),
        axios.get(`${API_BASE}/students-with-dues`),
        axios.get(`${API_BASE}/payments`)
      ]);
      setStudents(studentsRes.data);
      setDues(duesRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      toast.error("Failed to load payment data");
    }
    setLoading(false);
  };

  const handleRecordPayment = async (student) => {
    setSelectedStudent(student);
    setAmount("");
    setInvoiceUrl("");
    setWhatsappLink("");
    setPaymentMethod("Cash");
    setRemarks("");
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        seat_no: selectedStudent["Seat No"],
        name: selectedStudent["Name"],
        amount: Number(amount),
        payment_method: paymentMethod,
        remarks: remarks
      };
      // 1. Record payment and wait for backend confirmation
      const response = await fetch(`${API_BASE}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        toast.error("Failed to record payment");
        setSubmitting(false);
        return;
      }
      // 2. Only after payment is confirmed, download the PDF
      const blob = await response.blob();
      // iOS fix: must trigger download in a new user gesture (button click), not in async callback
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        toast.success('Payment recorded. Tap below to download invoice.');
        setInvoiceUrl(window.URL.createObjectURL(blob));
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoice.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }

      // After payment: update expiry if due is 0, refresh students
      // 1. Fetch updated student info
      const studentRes = await axios.get(`${API_BASE}/students`);
      setStudents(studentRes.data);
      // 2. Find this student
      const updated = studentRes.data.find(s => s["Seat No"] === selectedStudent["Seat No"]);
      if (updated && (updated["Due"] ?? 0) === 0) {
        // 3. If due is 0, mark status as Done and update expiry to next month
        const currentExpiry = updated["Expiry Date"];
        let nextExpiry = currentExpiry;
        if (currentExpiry) {
          // Try to parse and add 1 month
          const d = new Date(currentExpiry);
          if (!isNaN(d)) {
            d.setMonth(d.getMonth() + 1);
            // Format as dd MMM yyyy
            const day = String(d.getDate()).padStart(2, '0');
            const month = d.toLocaleString('en-US', { month: 'short' });
            const year = d.getFullYear();
            nextExpiry = `${day} ${month} ${year}`;
            await axios.post(`${API_BASE}/update-expiry`, {
              seat_no: updated["Seat No"],
              name: updated["Name"],
              new_expiry: nextExpiry
            });
          }
        }
        // Also update status to Done
        await axios.post(`${API_BASE}/update-status`, {
          seat_no: updated["Seat No"],
          new_status: "Done"
        });
      }
      toast.success("Payment recorded and invoice downloaded");
      setSelectedStudent(null);
      setAmount("");
      setPaymentMethod("Cash");
      setRemarks("");
      fetchAll(); // Refresh all data
    } catch (err) {
      toast.error("Failed to record payment");
    }
    setSubmitting(false);
  };

  const handleDownloadInvoice = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    }
  };

  const handleShareWhatsApp = async () => {
    if (!invoiceUrl) return;
    try {
      const res = await axios.post(`${API_BASE}/generate-whatsapp-invoice-link`, { invoice_url: invoiceUrl });
      setWhatsappLink(res.data.whatsapp_link);
      window.open(res.data.whatsapp_link, '_blank');
    } catch (err) {
      toast.error("Failed to generate WhatsApp link");
    }
  };

  // New: Filter payments/expenses by date or year using backend endpoints
  const [filterMonth, setFilterMonth] = useState("");

  const filterPaymentsByDate = async () => {
    if (!filterDate) return toast.error("Please enter a date");
    try {
      const res = await axios.get(`${API_BASE}/payments/by-date?date=${filterDate}`);
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to filter payments by date");
    }
  };

  const filterPaymentsByYear = async () => {
    if (!filterYear) return toast.error("Please enter a year");
    try {
      const res = await axios.get(`${API_BASE}/payments/by-year?year=${filterYear}`);
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to filter payments by year");
    }
  };

  const filterPaymentsByMonth = async () => {
    if (!filterMonth || !filterYear) return toast.error("Please enter both month and year");
    try {
      // Use /payments?month=6&year=2025 instead of /payments/by-month
      const res = await axios.get(`${API_BASE}/payments`, {
        params: { month: Number(filterMonth), year: Number(filterYear) }
      });
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to filter payments by month");
    }
  };

  // Filter out students with status 'Vacant' for All Students table
  const filteredStudents = students.filter(s => (s["Status"] || "").toLowerCase() !== "vacant");
  // Only show students with due > 0 for dues table
  const studentsWithDues = dues.filter(s => (s["Due"] ?? 0) > 0 && (s["Status"] || "").toLowerCase() !== "vacant");

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Payment Management</h2>
      {loading ? <div>Loading...</div> : (
        <>
          {/* All Students Table (excluding Vacant) */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">All Students</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-1">Seat No</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Status</th>
                    <th className="border px-2 py-1">Due</th>
                    <th className="border px-2 py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-2">No students</td></tr>
                  )}
                  {filteredStudents.map(s => (
                    <tr key={s["Seat No"]}>
                      <td className="border px-2 py-1">{s["Seat No"]}</td>
                      <td className="border px-2 py-1">{s["Name"]}</td>
                      <td className="border px-2 py-1">{s["Status"]}</td>
                      <td className="border px-2 py-1">{s["Due"] ?? 0}</td>
                      <td className="border px-2 py-1">
                        {(s["Due"] ?? 0) > 0 ? (
                          <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => handleRecordPayment(s)}>
                            Record Payment
                          </button>
                        ) : (
                          <button className="px-2 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed" disabled>
                            No Due
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Record Payment Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-80">
                <h4 className="font-bold mb-2">Record Payment for {selectedStudent["Name"]} (Seat {selectedStudent["Seat No"]})</h4>
                <form onSubmit={submitPayment}>
                  <input
                    type="number"
                    className="border px-2 py-1 w-full mb-2"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                  <select
                    className="border px-2 py-1 w-full mb-2"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                  <input
                    type="text"
                    className="border px-2 py-1 w-full mb-2"
                    placeholder="Remarks (optional)"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
                    <button type="button" className="bg-gray-400 text-white px-3 py-1 rounded" onClick={() => setSelectedStudent(null)} disabled={submitting}>Cancel</button>
                  </div>
                </form>
                {invoiceUrl && (
                  <div className="mt-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded mr-2" onClick={() => {
                      const a = document.createElement('a');
                      a.href = invoiceUrl;
                      a.download = 'invoice.pdf';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(invoiceUrl);
                      setInvoiceUrl("");
                    }}>Download Invoice</button>
                    <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleShareWhatsApp}>Share via WhatsApp</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students with Dues Table (Due > 0, not Vacant) */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Students with Dues</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-red-100">
                    <th className="border px-2 py-1">Seat No</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsWithDues.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-2">No dues</td></tr>
                  )}
                  {studentsWithDues.map(s => (
                    <tr key={s["Seat No"]}>
                      <td className="border px-2 py-1">{s["Seat No"]}</td>
                      <td className="border px-2 py-1">{s["Name"]}</td>
                      <td className="border px-2 py-1">{s["Due"] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Payment History</h3>
            <div className="flex gap-2 mb-2 flex-wrap items-center">
              <select
                className="border px-2 py-1"
                value={filterMode}
                onChange={e => {
                  setFilterMode(e.target.value);
                  setFilterDate("");
                  setFilterMonth("");
                  setFilterYear("");
                }}
              >
                <option value="date">Filter by Date</option>
                <option value="month">Filter by Month</option>
                <option value="year">Filter by Year</option>
              </select>
              {filterMode === "date" && (
                <>
                  <input
                    type="date"
                    className="border px-2 py-1"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  />
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                    onClick={filterPaymentsByDate}
                  >
                    Apply
                  </button>
                </>
              )}
              {filterMode === "month" && (
                <>
                  <input
                    type="number"
                    placeholder="Month (1-12)"
                    className="border px-2 py-1"
                    value={filterMonth}
                    min={1}
                    max={12}
                    onChange={e => setFilterMonth(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Year (e.g. 2025)"
                    className="border px-2 py-1"
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                  />
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    onClick={filterPaymentsByMonth}
                  >
                    Apply
                  </button>
                </>
              )}
              {filterMode === "year" && (
                <>
                  <input
                    type="number"
                    placeholder="Year (e.g. 2025)"
                    className="border px-2 py-1"
                    value={filterYear}
                    onChange={e => setFilterYear(e.target.value)}
                  />
                  <button
                    className="bg-purple-600 text-white px-3 py-1 rounded"
                    onClick={filterPaymentsByYear}
                  >
                    Apply
                  </button>
                </>
              )}
              <button className="bg-gray-400 text-white px-3 py-1 rounded" onClick={fetchAll}>Reset</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Date</th>
                    <th className="border px-2 py-1">Seat No</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-2">No payment records</td></tr>
                  )}
                  {history.map((p, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{p["Date"]}</td>
                      <td className="border px-2 py-1">{p["Seat No"]}</td>
                      <td className="border px-2 py-1">{p["Name"]}</td>
                      <td className="border px-2 py-1">{p["Amount"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
