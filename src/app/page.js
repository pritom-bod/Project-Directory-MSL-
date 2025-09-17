"use client";
import { useEffect, useState } from "react";

const SHEETS = {
  //Home: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=0",
  ProposalPrep: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=1334009693",
  EoiPrep: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=1699098666",
  EoiEval: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=767379216",
  ProposalEval: "https://docs.google.com/spreadsheets/d/1jAH2IlhBqZCwRBVJRogC-YX1v9sVxW1iWI_jy3azv_8/gviz/tq?tqx=out:json&gid=1529072389",
};

const allFields = [
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

const proposalPreparationFields = [
  "Project Name",
  "Year",
  "Country",
  "Sector",
  "Donor Name",
  "Client Name",
  "Partner",
  "Deadline",
  "Project Code",
  "Assigned To",
  "Budget",
  "Duration",
  "Selection method",
  "Submission Prep (RFP)",
  "CV Stat. (RFP)",
  "Financial (RFP)",
  "Compliance (RFP)",
  "Challenges",
  "Comments (RFP)",
];

const eoiPreparationFields = [
  "Project Name",
  "Country",
  "Sector",
  "Donor Name",
  "Client Name",
  "Partner",
  "Deadline",
  "Project Code",
  "Assigned To",
  "Budget",
  "Duration",
  "Selection method",
  "Partner Stat (EoI)",
  "Bio-data Stat (EoI)",
  "Submission Prep (EoI)",
  "Challenges (EoI)",
  "Comments (EoI)",
];

const eoiEvaluationFields = [
  "Project Name",
  "Country",
  "Donor Name",
  "Client Name",
  "Lead",
  "Partner",
  "Deadline",
  "Project Code",
  "Assigned To",
  "Selection method",
  "EoI Evaluation Status",
];

const proposalEvaluationFields = [
  "Project Name",
  "Country",
  "Sector",
  "Donor Name",
  "Client Name",
  "Lead",
  "Partner",
  "Deadline",
  "Project Code",
  "Assigned To",
  "Selection method",
  "RFP Evaluation",
];

const fieldLabelsMap = {
  Home: allFields,
  ProposalPrep: proposalPreparationFields,
  EoiPrep: eoiPreparationFields,
  EoiEval: eoiEvaluationFields,
  ProposalEval: proposalEvaluationFields,
};

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

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { cache: 'no-store', mode: 'cors' });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error! Status: ${res.status}, Details: ${errorText}`);
      }
      const text = await res.text();
      const parsedText = text.substr(47).slice(0, -2);
      const json = JSON.parse(parsedText);
      if (!json.table || !json.table.rows || !json.table.cols) {
        throw new Error('Invalid response: No table data found');
      }
      return json;
    } catch (err) {
      console.error('Fetch attempt failed:', {
        attempt: i + 1,
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        rawError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
      });
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

export default function Home() {
  const [activeSheet, setActiveSheet] = useState(null);
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [view, setView] = useState('menu'); // 'menu', 'table', 'detail'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeSheet) return;
    const fetchSheet = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = SHEETS[activeSheet];
        if (!url) {
          throw new Error('Invalid sheet tab selected');
        }
        const json = await fetchWithRetry(url);
        const headers = json.table.cols.map((c) => c.label || '').map(h => h.trim());
        const rows = json.table.rows.map((r) => {
          const rowData = {};
          const fieldLabels = fieldLabelsMap[activeSheet] || allFields;
          fieldLabels.forEach((label) => {
            const index = headers.findIndex((h) => h.toLowerCase() === label.toLowerCase());
            rowData[label] = index !== -1 ? r.c[index]?.v || "" : "";
            if (dateFields.includes(label)) {
              rowData[label] = formatDate(rowData[label]);
            }
          });
          return rowData;
        }).filter(row => Object.values(row).some(val => val !== ""));
        setData(rows);
      } catch (err) {
        console.error('Error fetching sheet data:', {
          message: err.message || 'Unknown error',
          url: SHEETS[activeSheet] || 'Unknown URL',
          activeSheet,
          stack: err.stack || 'No stack trace',
          rawError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        });
        setError(`Failed to load data: ${err.message || 'Unknown error'}. Ensure the sheet is shared with 'Anyone with the link' (Viewer) and verify tab names.`);
      } finally {
        setLoading(false);
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

  const currentFields = fieldLabelsMap[activeSheet] || allFields;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 dark:text-blue-800">
              Maxwell
              <span className="text-red-700 dark:text-red-800"> Stamp</span>
              <span className="font-bold text-blue-900 dark:text-blue-800"> LTD.</span>
            </h1>
          </div>
          {(view === 'table' || view === 'detail') && (
            <button
              onClick={handleBack}
              className="flex items-center space-x-1 sm:space-x-2 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-red-800 text-white hover:bg-red-900 focus:outline-none transition-all duration-200 shadow-md font-medium text-xs sm:text-sm"
            >
              <span className="text-sm sm:text-base lg:text-lg">←</span>
              <span className="hidden sm:inline">Back</span>
              <span className="sm:hidden text-xs">Back</span>
            </button>
          )}
        </div>
      </header>
      {/* Menu View (Buttons) */}
      {view === 'menu' && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {Object.keys(SHEETS).map((key) => (
            <button
              key={key}
              onClick={() => handleButtonClick(key)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 bg-blue-900 text-white hover:bg-blue-950 shadow-sm w-full sm:w-auto min-w-[200px] sm:min-w-0"
            >
              {buttonLabels[key]}
            </button>
          ))}
        </div>
      )}
      {/* Table View */}
      {view === 'table' && (
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600 mx-auto mb-3 sm:mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Loading data...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start sm:items-center">
                <span className="text-red-600 mr-2 flex-shrink-0">⚠️</span>
                <p className="text-red-800 text-sm sm:text-base flex-1">{error}</p>
              </div>
              <p className="text-red-700 text-xs sm:text-sm mt-2">Ensure the sheet is shared with 'Anyone with the link' (Viewer) and verify tab names.</p>
            </div>
          )}
          {!loading && !error && data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg sm:text-lg">No data available for this sheet.</p>
            </div>
          )}
          {!loading && !error && data.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[300px]">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Project Name</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Deadline</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr
                        key={i}
                        onClick={() => handleRowClick(item)}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-gray-800 text-sm whitespace-normal break-words max-w-[150px] sm:max-w-none">{item["Project Name"]}</td>
                        <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-gray-600 text-sm whitespace-nowrap">{item["Deadline"]}</td>
                        <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-gray-600 text-sm whitespace-nowrap">{item["Country"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      )}
      {/* Detail View */}
      {view === 'detail' && selectedRow && (
  <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Project Details: {selectedRow["Project Name"]}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto">
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        {currentFields.map((label) => (
          <div key={label} className="flex items-start sm:items-center space-x-2 min-w-0">
            <span className="text-indigo-600 font-medium whitespace-nowrap flex-shrink-0 text-sm sm:text-base min-w-fit">
              {label}:
            </span>
            <span className="text-gray-700 flex-1 text-sm sm:text-base break-words hyphens-none">
              {selectedRow[label]}
            </span>
          </div>
        ))}
      </div>
    </div>
  </main>
      )}
    </div>
  );
}