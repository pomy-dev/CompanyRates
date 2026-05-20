"use client";

import React, { useRef } from "react";
import {
  FileSpreadsheet, Printer
} from "lucide-react";
import * as XLSX from 'xlsx';

export default function ReportGenerator({
  title,
  children,
  filename = "report",
  subtitle = "",
  activeReport,
  filteredRatings,
  filteredSuggestions,
  selectedPeriod
}) {
  const contentRef = useRef(null);
  const handlePrint = () => {
    if (!contentRef.current) return;

    // Get HTML content
    const printContents = contentRef.current.innerHTML;

    // Open new window
    const printWindow = window.open("", "_blank", "width=900,height=650");

    if (!printWindow) {
      alert("Please allow popups for printing.");
      return;
    }

    // Build printable document
    printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #000;
            background: #fff;
          }

          .report-container {
            max-width: 1000px;
            margin: auto;
          }

          h1, h2, h3, h4, h5 {
            margin: 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          table, th, td {
            border: 1px solid #ccc;
          }

          th, td {
            padding: 8px;
            text-align: left;
          }

          img {
            max-width: 100%;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <div class="report-container">
          ${printContents}
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);

    printWindow.document.close();
  };

  const handleExcel = async (reportType) => {
    let data = [];
    let filename = `${reportType}-report`;

    if (reportType === "total") {
      data = filteredRatings.map((r) => ({
        Date: new Date(r.created_at).toLocaleDateString(),
        User: r.user?.full_name || r.user?.name || "Anonymous",
        Service_Point: r.service_point,
        Average_Score:
          r.averageScore ||
          (
            r.criteria?.reduce(
              (sum, c) => sum + Number(c.score || 0),
              0
            ) / (r.criteria?.length || 1)
          ).toFixed(1),
      }));
    } else if (reportType === "low" || reportType === "high") {
      const items =
        reportType === "low"
          ? filteredRatings.flatMap(
            (r) =>
              r.criteria?.filter(
                (c) => Number(c.score) <= 3
              ) || []
          )
          : filteredRatings.flatMap(
            (r) =>
              r.criteria?.filter(
                (c) => Number(c.score) >= 4
              ) || []
          );

      data = items.map((item) => ({
        Date: new Date(
          item.date || filteredRatings[0]?.created_at
        ).toLocaleDateString(),
        User: item.userName || "Anonymous",
        Service_Point: item.servicePoint,
        Criteria: item.name || item.title,
        Score: item.score,
      }));
    } else if (reportType === "suggestions") {
      data = filteredSuggestions.map((s) => ({
        Date: new Date(s.date).toLocaleDateString(),
        User: s.username,
        Service_Point: getServicePointByRatingId(
          s.rating_id
        ),
        Suggestion: s.suggestion,
      }));
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto column width
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...data.map((row) =>
          String(row[key] || "").length
        )
      ) + 5,
    }));

    ws["!cols"] = colWidths;

    // Lock ALL cells
    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({
          r: R,
          c: C,
        });

        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          protection: {
            locked: true,
          },
        };
      }
    }

    // Protect sheet
    ws["!protect"] = {
      password: "12345", // Change password here
      selectLockedCells: true,
      selectUnlockedCells: false,
    };

    // Create workbook
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Report"
    );

    // Export file
    XLSX.writeFile(
      wb,
      `${filename}-${selectedPeriod}.xlsx`,
      {
        compression: true,
      }
    );
  };

  // const handleExcel = async (reportType) => {
  //   let data = [];
  //   let filename = `${reportType}-report`;

  //   if (reportType === 'total') {
  //     data = filteredRatings.map(r => ({
  //       Date: new Date(r.created_at).toLocaleDateString(),
  //       User: r.user?.full_name || r.user?.name || "Anonymous",
  //       Service_Point: r.service_point,
  //       Average_Score: r.averageScore ||
  //         (r.criteria?.reduce((sum, c) => sum + Number(c.score || 0), 0) / (r.criteria?.length || 1)).toFixed(1),
  //     }));
  //   } else if (reportType === 'low' || reportType === 'high') {
  //     const items = reportType === 'low'
  //       ? filteredRatings.flatMap(r => r.criteria?.filter(c => Number(c.score) <= 3) || [])
  //       : filteredRatings.flatMap(r => r.criteria?.filter(c => Number(c.score) >= 4) || []);

  //     data = items.map(item => ({
  //       Date: new Date(item.date || filteredRatings[0]?.created_at).toLocaleDateString(),
  //       User: item.userName || "Anonymous",
  //       Service_Point: item.servicePoint,
  //       Criteria: item.name || item.title,
  //       Score: item.score,
  //     }));
  //   } else if (reportType === 'suggestions') {
  //     data = filteredSuggestions.map(s => ({
  //       Date: new Date(s.date).toLocaleDateString(),
  //       User: s.username,
  //       Service_Point: getServicePointByRatingId(s.rating_id),
  //       Suggestion: s.suggestion,
  //     }));
  //   }

  //   const ws = XLSX.utils.json_to_sheet(data);
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Report");
  //   XLSX.writeFile(wb, `${filename}-${selectedPeriod}.xlsx`);
  // };

  return (
    <>
      <div className="print:hidden flex gap-3 mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
        >
          <Printer className="w-4 h-4" /> Print Report
        </button>

        <button
          onClick={() => handleExcel(activeReport)}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition"
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
      </div>

      <div ref={contentRef} className="print:block space-y-4">
        <div className="report-container bg-white p-8 text-black max-w-4xl mx-auto border border-gray-200">
          <div className="text-center border-b pb-6 mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{title}</h1>
            {subtitle && <p className="text-lg text-gray-600 mb-2">{subtitle}</p>}
            <p className="text-gray-600">
              Generated on: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
            </p>
          </div>

          <div className="print-content">
            {children}
          </div>

          <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
            Your Company Feedback System • Confidential Report
          </div>
        </div>
      </div>
    </>
  );
}