"use client";
import { useEffect, useState } from "react";

const SHEETS = {
  Home: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=0",
  ProposalPrep: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=1334009693",
  EoiPrep: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=1699098666",
  EoiEval: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=767379216",
  ProposalEval: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=1529072389",
};

const fieldLabels = [
  "Project Name",
  "Country",
  "Donor Name",
  "Client Name",
  "Sector",
  "Year",
  "Lead",
  "Lead Status",
  "Partner",
  "Confirmation",
  "Deadline",
  "Process",
  "Status",
  "Project Code",
  "Assigned To",
  "Budget",
  "Duration",
  "Clarification Deadline",
  "Selection method",
  "Technical Score",
  "Financial Score",
  "Position",
  "Comments",
  "Status Selector",
  "Partner Stat (EoI)",
  "Bio-data Stat (EoI)",
  "Submission Prep (EoI)",
  "Challenges (EoI)",
  "Comments (EoI)",
  "EoI Evaluation Status",
  "Submission Prep (RFP)",
  "CV Stat. (RFP)",
  "Financial (RFP)",
  "Compliance (RFP)",
  "Challenges",
  "Comments (RFP)",
  "RFP Evaluation",
];

const dateFields = ["Deadline", "Clarification Deadline"];

function formatDate(raw) {
  let date;
  if (typeof raw === 'string' && raw.startsWith('Date(')) {
    const match = raw.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      date = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
  } else {
    date = new Date(raw);
  }
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return raw || "";
}

export default function Home() {
  const [activeSheet, setActiveSheet] = useState(null);
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [view, setView] = useState('menu'); // 'menu', 'table', 'detail'

  useEffect(() => {
    if (!activeSheet) return;

    const fetchSheet = async () => {
      try {
        const res = await fetch(SHEETS[activeSheet]);
        const text = await res.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));

        const headers = json.table.cols.map((c) => c.label || '').map(h => h.trim());

        const rows = json.table.rows.map((r) => {
          const rowData = {};
          fieldLabels.forEach((label) => {
            const index = headers.findIndex((h) => h.toLowerCase() === label.toLowerCase());
            rowData[label] = index !== -1 ? r.c[index]?.v || "" : "";
            if (dateFields.includes(label)) {
              rowData[label] = formatDate(rowData[label]);
            }
          });
          return rowData;
        });

        setData(rows);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSheet();
    const interval = setInterval(fetchSheet, 30000);
    return () => clearInterval(interval);
  }, [activeSheet]);

  const handleButtonClick = (key) => {
    setActiveSheet(key);
    setView('table');
    setSelectedRow(null);
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setView('detail');
  };

  const handleBack = () => {
    if (view === 'detail') {
      setView('table');
      setSelectedRow(null);
    } else if (view === 'table') {
      setView('menu');
      setActiveSheet(null);
      setData([]);
      setSelectedRow(null);
    }
  };

  const buttonLabels = {
    Home: "All Projects",
    ProposalPrep: "Proposal Preparation",
    EoiPrep: "EOI Preparation",
    EoiEval: "EOI Evaluation",
    ProposalEval: "Proposal Evaluation",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* <img
              src="max.png"
              alt="Maxwell Stampt LTD Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
            /> */}
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-800">
              Maxwell
              <span className="text-red-700 dark:text-red-800"> Stamp</span>
              <span className="font-bold text-blue-900 dark:text-blue-800"> LTD.</span>
            </h1>
          </div>
          {(view === 'table' || view === 'detail') && (
            <button
              onClick={handleBack}
              className="flex items-center space-x-1 sm:space-x-2 px-2 py-1 sm:px-4 sm:py-2 rounded-lg bg-red-800 text-white hover:bg-red-900 focus:outline-none transition-all duration-200 shadow-md font-medium text-xs sm:text-sm"
            >
              <span className="text-base sm:text-lg">←</span>
              <span>Back</span>
            </button>
          )}
        </div>
      </header>

      {/* Menu View (Buttons) */}
      {view === 'menu' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap justify-center gap-4">
          {Object.keys(SHEETS).map((key) => (
            <button
              key={key}
              onClick={() => handleButtonClick(key)}
              className="px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-sm w-full sm:w-auto"
            >
              {buttonLabels[key]}
            </button>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Project Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Deadline</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, i) => (
                    <tr
                      key={i}
                      onClick={() => handleRowClick(item)}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-gray-800">{item["Project Name"]}</td>
                      <td className="px-6 py-4 text-gray-600">{item["Deadline"]}</td>
                      <td className="px-6 py-4 text-gray-600">{item["Country"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* Detail View */}
      {view === 'detail' && selectedRow && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Project Details: {selectedRow["Project Name"]}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldLabels.map((label) => (
                <div key={label} className="flex items-center space-x-2">
                  <span className="text-indigo-600 font-medium">{label}:</span>
                  <span className="text-gray-700">{selectedRow[label]}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}