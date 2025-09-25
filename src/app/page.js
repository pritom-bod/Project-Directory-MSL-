"use client";
import { useEffect, useState } from "react";

const SHEETS = {
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
  "Lead",
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
  "Lead",
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
  ProposalPrep: proposalPreparationFields,
  EoiPrep: eoiPreparationFields,
  EoiEval: eoiEvaluationFields,
  ProposalEval: proposalEvaluationFields,
};

const dateFields = ["Deadline", "Clarification Deadline"];

function formatDate(raw) {
  let date;
  if (typeof raw === "string" && raw.startsWith("Date(")) {
    const match = raw.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      date = new Date(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
  } else {
    date = new Date(raw);
  }
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return raw || "";
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { cache: "no-store", mode: "cors" });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error! Status: ${res.status}, Details: ${errorText}`);
      }
      const text = await res.text();
      const parsedText = text.substr(47).slice(0, -2);
      const json = JSON.parse(parsedText);
      if (!json.table || !json.table.rows || !json.table.cols) {
        throw new Error("Invalid response: No table data found");
      }
      return json;
    } catch (err) {
      console.error("Fetch attempt failed:", {
        attempt: i + 1,
        message: err.message || "Unknown error",
        stack: err.stack || "No stack trace",
        rawError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
      });
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
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
  const [view, setView] = useState("menu");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sortByDeadline, setSortByDeadline] = useState(false);
  const [sortByCountry, setSortByCountry] = useState(false);

  // Restore state from URL on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedView = urlParams.get('view');
    const savedSheet = urlParams.get('sheet');
    const savedRow = urlParams.get('row');

    if (savedView && savedView !== 'menu') {
      setView(savedView);
      if (savedSheet) {
        setActiveSheet(savedSheet);
      }
      if (savedRow && savedView === 'detail') {
        try {
          const rowData = JSON.parse(decodeURIComponent(savedRow));
          setSelectedRow(rowData);
        } catch (e) {
          console.error('Failed to parse saved row data');
        }
      }
    }
    setIsInitialLoad(false);
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      const urlParams = new URLSearchParams(window.location.search);
      const savedView = urlParams.get('view');
      const savedSheet = urlParams.get('sheet');
      const savedRow = urlParams.get('row');

      if (savedView) {
        setView(savedView);
        if (savedSheet) {
          setActiveSheet(savedSheet);
        }
        if (savedRow && savedView === 'detail') {
          try {
            const rowData = JSON.parse(decodeURIComponent(savedRow));
            setSelectedRow(rowData);
          } catch (e) {
            console.error('Failed to parse saved row data');
          }
        } else {
          setSelectedRow(null);
        }
      } else {
        setView("menu");
        setActiveSheet(null);
        setData([]);
        setSelectedRow(null);
        setSortByDeadline(false);
        setSortByCountry(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!activeSheet || isInitialLoad) return;
    const fetchSheet = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = SHEETS[activeSheet];
        if (!url) {
          throw new Error("Invalid sheet tab selected");
        }
        const json = await fetchWithRetry(url);
        const headers = json.table.cols.map((c) => c.label || "").map((h) => h.trim());
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
        }).filter((row) => Object.values(row).some((val) => val !== ""));
        setData(rows);
      } catch (err) {
        console.error("Error fetching sheet data:", {
          message: err.message || "Unknown error",
          url: SHEETS[activeSheet] || "Unknown URL",
          activeSheet,
          stack: err.stack || "No stack trace",
          rawError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        });
        setError(
          `Failed to load data: ${err.message || "Unknown error"}. Ensure the sheet is shared with &apos;Anyone with the link&apos; (Viewer) and verify tab names.`
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSheet();
    const interval = setInterval(fetchSheet, 30000);
    return () => clearInterval(interval);
  }, [activeSheet, isInitialLoad]);

  const handleButtonClick = (key) => {
    setActiveSheet(key);
    setView("table");
    setSelectedRow(null);
    setSortByDeadline(false);
    setSortByCountry(false);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('view', 'table');
    newUrl.searchParams.set('sheet', key);
    newUrl.searchParams.delete('row');
    window.history.pushState({}, '', newUrl);
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setView("detail");
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('view', 'detail');
    newUrl.searchParams.set('sheet', activeSheet);
    newUrl.searchParams.set('row', encodeURIComponent(JSON.stringify(row)));
    window.history.pushState({}, '', newUrl);
  };

  const handleBack = () => {
    if (view === "detail") {
      setView("table");
      setSelectedRow(null);
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('view', 'table');
      newUrl.searchParams.delete('row');
      window.history.pushState({}, '', newUrl);
    } else if (view === "table") {
      setView("menu");
      setActiveSheet(null);
      setData([]);
      setSelectedRow(null);
      setSortByDeadline(false);
      setSortByCountry(false);
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('view');
      newUrl.searchParams.delete('sheet');
      newUrl.searchParams.delete('row');
      window.history.pushState({}, '', newUrl);
    }
  };

  const handleSortByDeadline = () => {
    setSortByDeadline(!sortByDeadline);
    setSortByCountry(false);
  };

  const handleSortByCountry = () => {
    setSortByCountry(!sortByCountry);
    setSortByDeadline(false);
  };

  const buttonLabels = {
    ProposalPrep: "Proposal Preparation",
    EoiPrep: "EOI Preparation",
    EoiEval: "EOI Evaluation",
    ProposalEval: "Proposal Evaluation",
  };

  const currentFields = fieldLabelsMap[activeSheet] || allFields;

  // Sort data based on active sorting state
  const today = new Date();
  const sortedData = sortByDeadline
    ? [...data].sort((a, b) => {
        const dateA = new Date(a["Deadline"].split(" ").reverse().join("-"));
        const dateB = new Date(b["Deadline"].split(" ").reverse().join("-"));
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        const diffA = Math.abs(dateA - today);
        const diffB = Math.abs(dateB - today);
        return diffA - diffB;
      })
    : sortByCountry
    ? [...data].sort((a, b) => {
        const countryA = a["Country"].split(",")[0]?.trim() || "";
        const countryB = b["Country"].split(",")[0]?.trim() || "";
        if (!countryA) return 1;
        if (!countryB) return -1;
        const firstLetterA = countryA.charAt(0).toLowerCase();
        const firstLetterB = countryB.charAt(0).toLowerCase();
        return firstLetterA.localeCompare(firstLetterB);
      })
    : data;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {(view === "table" || view === "detail") && activeSheet && (
        <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50 py-2">
          <div className="max-w-7xl mx-auto px-2 flex items-center justify-between">
            <div className="flex items-center">
              <img src="max.png" alt="Logo" className="h-12 mr-2" />
            </div>
            <button
              onClick={handleBack}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-red-800 text-white hover:bg-red-900 focus:outline-none transition-all duration-200 shadow-md font-medium text-sm mx-2"
            >
              <span className="text-sm">←</span>
              <span className="hidden sm:inline">Back</span>
              <span className="sm:hidden text-xs">Back</span>
            </button>
          </div>
        </nav>
      )}

      {(view === "table" || view === "detail") && activeSheet && (
        <div className="bg-gray-100 text-gray-700 text-center py-1 fixed top-16 left-0 w-full z-40">
          <span className="text-sm font-medium">
            Current Section: {buttonLabels[activeSheet]}
          </span>
        </div>
      )}

      <div>
        {view === "menu" && (
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-2 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <img src="max.png" alt="Logo" className="h-12" />
                <div className="flex-grow flex items-center justify-center">
                  <h1 className="text-xl ml-9 text-center font-bold text-blue-900 dark:text-blue-800">
                    Project
                    <span className="text-red-700 dark:text-red-800"> Dashboard</span>
                  </h1>
                </div>
              </div>
            </div>
          </header>
        )}

        {view === "menu" && (
          <div className="max-w-7xl mx-auto px-2 py-6 flex flex-wrap justify-center gap-7">
            {Object.keys(SHEETS).map((key) => (
              <button
                key={key}
                onClick={() => handleButtonClick(key)}
                className="px-6 py-3 rounded-lg font-medium text-l transition-all duration-200 bg-blue-900 text-white hover:bg-blue-950 shadow-sm w-full min-w-[200px] mx-2"
              >
                {buttonLabels[key]}
              </button>
            ))}
          </div>
        )}

        {view === "table" && (
          <main className="max-w-7xl mx-auto px-2 py-4 pt-32">
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 text-sm">Loading data...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 mx-2">
                <div className="flex items-start">
                  <span className="text-red-600 mr-2 flex-shrink-0">⚠️</span>
                  <p className="text-red-800 text-sm flex-1">{error}</p>
                </div>
                <p className="text-red-700 text-xs mt-2">Ensure the sheet is shared with &apos;Anyone with the link&apos; (Viewer) and verify tab names.</p>
              </div>
            )}
            {!loading && !error && data.length === 0 && (
              <div className="text-center py-12 mx-2">
                <p className="text-gray-500 text-lg">No data available for this sheet.</p>
              </div>
            )}
            {!loading && !error && data.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-2">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[300px]">
                    <thead className="bg-blue-900 text-white sticky top-0 z-40"><tr>
                      <th className="px-2 py-2 text-left text-xs font-semibold whitespace-nowrap">
                        Project Name
                      </th>
                      <th
                        onClick={handleSortByDeadline}
                        className="px-2 py-2 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-blue-950 transition-colors"
                      >
                        Deadline {sortByDeadline ? "↓" : ""}
                      </th>
                      <th
                        onClick={handleSortByCountry}
                        className="px-2 py-2 text-left text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-blue-950 transition-colors"
                      >
                        Country {sortByCountry ? "↓" : ""}
                      </th>
                    </tr></thead>
                    <tbody>
                      {sortedData.map((item, i) => (
                        <tr
                          key={i}
                          onClick={() => handleRowClick(item)}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-2 py-2 text-gray-800 text-sm whitespace-normal break-words flex-grow max-w-[60%]">
                            {item["Project Name"]}
                          </td>
                          <td className="px-2 py-2 text-gray-600 text-sm whitespace-nowrap flex-shrink-0 w-[20%]">
                            {item["Deadline"]}
                          </td>
                          <td className="px-2 py-2 text-gray-600 text-sm w-[20%]">
                            <div className="flex flex-col gap-1">
                              {item["Country"]
                                .split(",")
                                .map((country, index) => (
                                  <span key={index} className="block">
                                    {country.trim()}
                                  </span>
                                ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        )}

        {view === "detail" && selectedRow && (
          <main className="max-w-7xl mx-auto px-2 py-4 pt-32">
            <div className="bg-white rounded-xl shadow-lg p-4 mx-2">
              <h2 className="text-xl text-center ml-28 font-bold text-red-800 mb-4">Project Details</h2>
              <div className="space-y-4">
                {currentFields.map((label) => (
                  <div key={label} className="flex flex-col space-y-1 mx-2">
                    <span className="font-medium whitespace-nowrap text-blue-800 text-m">
                      {label}:
                    </span>
                    <span className="text-gray-700 flex-1 break-words hyphens-auto text-sm">
                      {String(selectedRow[label] || "")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}