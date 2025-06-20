import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000"
    : "https://backend-4xju.onrender.com";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMode, setFilterMode] = useState("date");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async (params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/expenses`, { params });
      setExpenses(res.data);
    } catch {
      toast.error("Failed to load expenses");
    }
    setLoading(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!category || !amount || isNaN(amount) || amount <= 0 || !date) {
      toast.error("Fill all fields correctly");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/expenses`, {
        category,
        amount: Number(amount),
        description,
        date,
      });
      toast.success("Expense added");
      setCategory("");
      setAmount("");
      setDescription("");
      setDate("");
      fetchExpenses();
    } catch {
      toast.error("Failed to add expense");
    }
    setSubmitting(false);
  };

  const filterByDate = async () => {
    if (!filterDate) return toast.error("Select a date");
    let formattedDate = filterDate;
    if (/^\d{2}-\d{2}-\d{4}$/.test(filterDate)) {
      const [day, month, year] = filterDate.split("-");
      formattedDate = `${year}-${month}-${day}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(filterDate)) {
      const [day, month, year] = filterDate.split("/");
      formattedDate = `${year}-${month}-${day}`;
    }
    try {
      const res = await axios.get(`${API_BASE}/expenses/by-date`, {
        params: { date: formattedDate },
      });
      setExpenses(res.data);
    } catch {
      toast.error("Failed to load expenses");
    }
  };
  const filterByMonth = async () => {
    if (!filterMonth || !filterYear) return toast.error("Enter month and year");
    try {
      const res = await axios.get(`${API_BASE}/expenses`, {
        params: { month: filterMonth, year: filterYear },
      });
      setExpenses(res.data);
    } catch {
      toast.error("Failed to load expenses");
    }
  };
  const filterByYear = async () => {
    if (!filterYear) return toast.error("Enter year");
    try {
      const res = await axios.get(`${API_BASE}/expenses`, {
        params: { year: filterYear },
      });
      setExpenses(res.data);
    } catch {
      toast.error("Failed to load expenses");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-blue-50 dark:bg-gray-900 dark:text-white p-2 sm:p-4">
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-blue-800">
          Expense Tracking
        </h2>
        {/* Add Expense Form */}
        <div className="bg-white rounded shadow p-6 mb-8 border border-blue-100">
          <h3 className="text-lg font-semibold mb-3 text-blue-700">
            Add New Expense
          </h3>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleAddExpense}
          >
            <input
              type="text"
              className="border px-3 py-2 rounded focus:outline-blue-400"
              placeholder="Category (e.g. Rent, Utilities)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <input
              type="number"
              className="border px-3 py-2 rounded focus:outline-blue-400"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <input
              type="date"
              className="border px-3 py-2 rounded focus:outline-blue-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <input
              type="text"
              className="border px-3 py-2 rounded focus:outline-blue-400"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="col-span-1 md:col-span-2 flex gap-3 mt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center bg-blue-50 p-4 rounded shadow">
          <select
            className="border px-2 py-1 rounded"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
          >
            <option value="date">By Date</option>
            <option value="month">By Month</option>
            <option value="year">By Year</option>
          </select>
          {filterMode === "date" && (
            <>
              <input
                type="date"
                className="border px-2 py-1 rounded"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={filterByDate}
              >
                Filter by Date
              </button>
            </>
          )}
          {filterMode === "month" && (
            <>
              <input
                type="number"
                placeholder="Month (1-12)"
                className="border px-2 py-1 rounded"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
              <input
                type="number"
                placeholder="Year (e.g. 2025)"
                className="border px-2 py-1 rounded"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              />
              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={filterByMonth}
              >
                Filter by Month
              </button>
            </>
          )}
          {filterMode === "year" && (
            <>
              <input
                type="number"
                placeholder="Year (e.g. 2025)"
                className="border px-2 py-1 rounded"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              />
              <button
                className="bg-purple-600 text-white px-3 py-1 rounded"
                onClick={filterByYear}
              >
                Filter by Year
              </button>
            </>
          )}
          <button
            className="bg-gray-400 text-black px-3 py-1 rounded"
            onClick={() => {
              setFilterDate("");
              setFilterMonth("");
              setFilterYear("");
              fetchExpenses();
            }}
          >
            Reset
          </button>
        </div>
        {/* Expenses Table */}
        <div className="overflow-x-auto rounded-xl shadow bg-white dark:bg-gray-800 mt-4">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-blue-100 dark:bg-gray-700">
              <tr>
                <th className="px-2 py-2 sm:px-4 sm:py-3 font-bold">Date</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 font-bold">Category</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 font-bold">Amount</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 font-bold">Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-2">
                    Loading...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-2">
                    No expense records
                  </td>
                </tr>
              ) : (
                expenses.map((e, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="border px-2 py-1">{e["Date"]}</td>
                    <td className="border px-2 py-1 font-semibold text-blue-700">
                      {e["Category"]}
                    </td>
                    <td className="border px-2 py-1 text-red-700 font-bold">
                      ₹{e["Amount"]}
                    </td>
                    <td className="border px-2 py-1">{e["Description"]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
