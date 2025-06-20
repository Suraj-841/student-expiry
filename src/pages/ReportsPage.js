import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API_BASE = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:8000'
  : 'https://backend-4xju.onrender.com';

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Payment and Expense filter modes
  const [paymentFilterMode, setPaymentFilterMode] = useState("date");
  const [expenseFilterMode, setExpenseFilterMode] = useState("date");
  // Payment filter values
  const [paymentFilterDate, setPaymentFilterDate] = useState("");
  const [paymentFilterMonth, setPaymentFilterMonth] = useState("");
  const [paymentFilterYear, setPaymentFilterYear] = useState("");
  // Expense filter values
  const [expenseFilterDate, setExpenseFilterDate] = useState("");
  const [expenseFilterMonth, setExpenseFilterMonth] = useState("");
  const [expenseFilterYear, setExpenseFilterYear] = useState("");

  // Filter payments by date (below the period selector)
  const [filterDate, setFilterDate] = useState("");
  const filterPaymentsByDate = async () => {
    if (!filterDate) return toast.error("Please select a date");
    try {
      const res = await axios.get(`${API_BASE}/payments/by-date?date=${filterDate}`);
      setPayments(res.data);
    } catch (err) {
      toast.error("Failed to filter payments by date");
    }
  };

  // Add filter for expenses by date (below the payments by date filter)
  const [filterExpenseDate, setFilterExpenseDate] = useState("");
  const filterExpensesByDate = async () => {
    if (!filterExpenseDate) return toast.error("Please select a date");
    try {
      const res = await axios.get(`${API_BASE}/expenses/by-date?date=${filterExpenseDate}`);
      setExpenses(res.data);
    } catch (err) {
      toast.error("Failed to filter expenses by date");
    }
  };

  // Fetch dashboard totals (total_collected, total_expenses) from new endpoint
  const fetchDashboardTotals = async (month, year) => {
    try {
      let params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      const res = await axios.get(`${API_BASE}/dashboard-totals`, { params });
      setTotalCollected(res.data.total_collected ?? 0);
      setTotalExpenses(res.data.total_expenses ?? 0);
    } catch (err) {
      toast.error("Failed to load dashboard totals");
    }
  };

  useEffect(() => {
    fetchAll();
    // Fetch dashboard totals for selected period
    if (period === "month") {
      fetchDashboardTotals(selectedMonth, selectedYear);
    } else if (period === "year") {
      fetchDashboardTotals(undefined, selectedYear);
    } else {
      fetchDashboardTotals();
    }
  }, [period, selectedMonth, selectedYear, selectedDate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      let params = {};
      if (period === "month") {
        params = { month: selectedMonth, year: selectedYear };
      } else if (period === "year") {
        params = { year: selectedYear };
      } else if (period === "day" && selectedDate) {
        params = { date: selectedDate };
      }
      const [paymentsRes, expensesRes, netProfitRes] = await Promise.all([
        axios.get(`${API_BASE}/payments`, { params }),
        axios.get(`${API_BASE}/expenses`, { params }),
        axios.get(`${API_BASE}/net-profit`, { params })
      ]);
      setPayments(paymentsRes.data);
      setExpenses(expensesRes.data);
      setNetProfit(netProfitRes.data.net_profit ?? 0);
    } catch (err) {
      toast.error("Failed to load report data");
    }
    setLoading(false);
  };

  const handleDownload = async (type, customParams) => {
    try {
      let params = customParams || {};
      const url = `${API_BASE}/report/financial-${type}`;
      const res = await axios.get(url, { params, responseType: 'blob' });
      const blob = new Blob([res.data], { type: type === 'csv' ? 'text/csv' : 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `financial_report.${type}`;
      link.click();
    } catch (err) {
      toast.error(`Failed to download ${type.toUpperCase()} report`);
    }
  };

  // Filtered tables
  const filteredPayments = payments.filter(p => {
    if (!search) return true;
    return (
      (p["Name"] || "").toLowerCase().includes(search.toLowerCase()) ||
      (p["Seat No"] || "").toString().includes(search) ||
      (p["Payment Method"] || "").toLowerCase().includes(search.toLowerCase())
    );
  });
  const filteredExpenses = expenses.filter(e => {
    if (!search) return true;
    return (
      (e["Category"] || "").toLowerCase().includes(search.toLowerCase()) ||
      (e["Description"] || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  // Chart data
  const paymentsChartData = payments.map(p => ({
    date: p["Date"],
    amount: p["Amount"]
  }));
  const expensesChartData = expenses.map(e => ({
    date: e["Date"],
    amount: e["Amount"]
  }));

  // Calculate current month payments and expenses sum from table data
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const sumPaymentsCurrentMonth = payments
    .filter(p => {
      if (!p["Date"]) return false;
      const d = new Date(p["Date"]);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + (Number(p["Amount"]) || 0), 0);
  const sumExpensesCurrentMonth = expenses
    .filter(e => {
      if (!e["Date"]) return false;
      const d = new Date(e["Date"]);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + (Number(e["Amount"]) || 0), 0);
  const monthlyIncome = sumPaymentsCurrentMonth - sumExpensesCurrentMonth;

  // Payment filter handlers
  const filterPayments = async () => {
    try {
      if (paymentFilterMode === "date" && paymentFilterDate) {
        const res = await axios.get(`${API_BASE}/payments/by-date?date=${paymentFilterDate}`);
        setPayments(res.data);
      } else if (paymentFilterMode === "month" && paymentFilterMonth && paymentFilterYear) {
        // Use /payments?month=6&year=2025 instead of /payments/by-month
        const res = await axios.get(`${API_BASE}/payments`, { params: { month: Number(paymentFilterMonth), year: Number(paymentFilterYear) } });
        setPayments(res.data);
      } else if (paymentFilterMode === "year" && paymentFilterYear) {
        const res = await axios.get(`${API_BASE}/payments/by-year?year=${paymentFilterYear}`);
        setPayments(res.data);
      } else {
        toast.error("Please fill all filter fields");
      }
    } catch {
      toast.error("Failed to filter payments");
    }
  };
  // Expense filter handlers
  const filterExpenses = async () => {
    try {
      if (expenseFilterMode === "date" && expenseFilterDate) {
        const res = await axios.get(`${API_BASE}/expenses/by-date?date=${expenseFilterDate}`);
        setExpenses(res.data);
      } else if (expenseFilterMode === "month" && expenseFilterMonth && expenseFilterYear) {
        // Use /expenses?month=6&year=2025 instead of /expenses/by-month
        const res = await axios.get(`${API_BASE}/expenses`, { params: { month: Number(expenseFilterMonth), year: Number(expenseFilterYear) } });
        setExpenses(res.data);
      } else if (expenseFilterMode === "year" && expenseFilterYear) {
        const res = await axios.get(`${API_BASE}/expenses/by-year?year=${expenseFilterYear}`);
        setExpenses(res.data);
      } else {
        toast.error("Please fill all filter fields");
      }
    } catch {
      toast.error("Failed to filter expenses");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-blue-50 dark:bg-gray-900 dark:text-white p-2 sm:p-4">
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Financial Analytics & Reports</h2>
        {/* Date/Period Selector + Download/Refresh/Search */}
        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded"
              onClick={() => {
                let params = {};
                if (paymentFilterMode === "date" && paymentFilterDate) {
                  params = { date: paymentFilterDate };
                } else if (paymentFilterMode === "month" && paymentFilterMonth && paymentFilterYear) {
                  params = { month: Number(paymentFilterMonth), year: Number(paymentFilterYear) };
                } else if (paymentFilterMode === "year" && paymentFilterYear) {
                  params = { year: paymentFilterYear };
                } else if (period === "month") {
                  params = { month: selectedMonth, year: selectedYear };
                } else if (period === "year") {
                  params = { year: selectedYear };
                } else if (period === "day" && selectedDate) {
                  params = { date: selectedDate };
                }
                handleDownload('csv', params);
              }}
            >
              Download CSV
            </button>
            <button
              className="bg-purple-600 text-white px-3 py-1 rounded"
              onClick={() => {
                let params = {};
                if (paymentFilterMode === "date" && paymentFilterDate) {
                  params = { date: paymentFilterDate };
                } else if (paymentFilterMode === "month" && paymentFilterMonth && paymentFilterYear) {
                  params = { month: Number(paymentFilterMonth), year: Number(paymentFilterYear) };
                } else if (paymentFilterMode === "year" && paymentFilterYear) {
                  params = { year: paymentFilterYear };
                } else if (period === "month") {
                  params = { month: selectedMonth, year: selectedYear };
                } else if (period === "year") {
                  params = { year: selectedYear };
                } else if (period === "day" && selectedDate) {
                  params = { date: selectedDate };
                }
                handleDownload('pdf', params);
              }}
            >
              Download PDF
            </button>
          </div>
        </div>
        {/* Payments Filter Section */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-semibold">Payments:</span>
          <select value={paymentFilterMode} onChange={e => setPaymentFilterMode(e.target.value)} className="border px-2 py-1 rounded">
            <option value="date">By Date</option>
            <option value="month">By Month</option>
            <option value="year">By Year</option>
          </select>
          {paymentFilterMode === "date" && (
            <>
              <input type="date" value={paymentFilterDate} onChange={e => setPaymentFilterDate(e.target.value)} className="border px-2 py-1 rounded" />
              <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={filterPayments}>Filter</button>
            </>
          )}
          {paymentFilterMode === "month" && (
            <>
              <input type="number" placeholder="Month (1-12)" value={paymentFilterMonth} onChange={e => setPaymentFilterMonth(e.target.value)} className="border px-2 py-1 rounded" />
              <input type="number" placeholder="Year (e.g. 2025)" value={paymentFilterYear} onChange={e => setPaymentFilterYear(e.target.value)} className="border px-2 py-1 rounded" />
              <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={filterPayments}>Filter</button>
            </>
          )}
          {paymentFilterMode === "year" && (
            <>
              <input type="number" placeholder="Year (e.g. 2025)" value={paymentFilterYear} onChange={e => setPaymentFilterYear(e.target.value)} className="border px-2 py-1 rounded" />
              <button className="bg-purple-600 text-white px-3 py-1 rounded" onClick={filterPayments}>Filter</button>
            </>
          )}
          <button className="bg-gray-400 text-black px-3 py-1 rounded" onClick={() => { setPaymentFilterDate(""); setPaymentFilterMonth(""); setPaymentFilterYear(""); fetchAll(); }}>Reset</button>
        </div>
        {/* Expenses Filter Section */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="font-semibold">Expenses:</span>
          <select value={expenseFilterMode} onChange={e => setExpenseFilterMode(e.target.value)} className="border px-2 py-1 rounded">
            <option value="date">By Date</option>
            <option value="month">By Month</option>
            <option value="year">By Year</option>
          </select>
          {expenseFilterMode === "date" && (
            <>
              <input type="date" value={expenseFilterDate} onChange={e => setExpenseFilterDate(e.target.value)} className="border px-2 py-1 rounded" />
              <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={filterExpenses}>Filter</button>
            </>
          )}
          {expenseFilterMode === "month" && (
            <>
              <input type="number" placeholder="Month (1-12)" value={expenseFilterMonth} onChange={e => setExpenseFilterMonth(e.target.value)} className="border px-2 py-1 rounded" />
              <input type="number" placeholder="Year (e.g. 2025)" value={expenseFilterYear} onChange={e => setExpenseFilterYear(e.target.value)} className="border px-2 py-1 rounded" />
              <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={filterExpenses}>Filter</button>
            </>
          )}
          {expenseFilterMode === "year" && (
            <>
              <input type="number" placeholder="Year (e.g. 2025)" value={expenseFilterYear} onChange={e => setExpenseFilterYear(e.target.value)} className="border px-2 py-1 rounded" />
              <button className="bg-purple-600 text-white px-3 py-1 rounded" onClick={filterExpenses}>Filter</button>
            </>
          )}
          <button className="bg-gray-400 text-black px-3 py-1 rounded" onClick={() => { setExpenseFilterDate(""); setExpenseFilterMonth(""); setExpenseFilterYear(""); fetchAll(); }}>Reset</button>
        </div>
        {/* Summary Cards */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded shadow min-w-[180px]">
            <div className="text-sm text-gray-600">Total Collected</div>
            <div className="text-2xl font-bold text-green-800">₹{totalCollected}</div>
          </div>
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded shadow min-w-[180px]">
            <div className="text-sm text-gray-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-800">₹{totalExpenses}</div>
          </div>
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded shadow min-w-[180px]">
            <div className="text-sm text-gray-600">Net Profit/Loss</div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>₹{netProfit}</div>
          </div>
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-2">Payments Trend</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentsChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#2563eb" name="Payments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-2">Expenses Trend</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={expensesChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#dc2626" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Monthly Income Summary */}
        <div className="mb-8 flex flex-col items-center">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow min-w-[220px]">
            <div className="text-sm text-gray-600">Monthly Income (Current Month)</div>
            <div className="text-lg font-bold text-yellow-800">
              Income: ₹{sumPaymentsCurrentMonth} &nbsp; | &nbsp; Expenses: ₹{sumExpensesCurrentMonth} &nbsp; | &nbsp; Net: ₹{monthlyIncome}
            </div>
          </div>
        </div>
        {/* Detailed Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Payments Table</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Date</th>
                    <th className="border px-2 py-1">Seat No</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Amount</th>
                    <th className="border px-2 py-1">Method</th>
                    <th className="border px-2 py-1">Remarks</th>
                    <th className="border px-2 py-1">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-2">No payment records</td></tr>
                  )}
                  {filteredPayments.map((p, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{p["Date"]}</td>
                      <td className="border px-2 py-1">{p["Seat No"]}</td>
                      <td className="border px-2 py-1">{p["Name"]}</td>
                      <td className="border px-2 py-1">{p["Amount"]}</td>
                      <td className="border px-2 py-1">{p["Payment Method"]}</td>
                      <td className="border px-2 py-1">{p["Remarks"]}</td>
                      <td className="border px-2 py-1">
                        {p["Invoice URL"] ? (
                          <a
                            href={p["Invoice URL"].startsWith("http") ? p["Invoice URL"] : `${API_BASE}${p["Invoice URL"]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            Download
                          </a>
                        ) : ("-")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Expenses Table</h4>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1">Date</th>
                      <th className="border px-2 py-1">Category</th>
                      <th className="border px-2 py-1">Amount</th>
                      <th className="border px-2 py-1">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-2">No expense records</td></tr>
                    )}
                    {filteredExpenses.map((e, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{e["Date"]}</td>
                        <td className="border px-2 py-1">{e["Category"]}</td>
                        <td className="border px-2 py-1">{e["Amount"]}</td>
                        <td className="border px-2 py-1">{e["Description"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
