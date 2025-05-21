import React, { useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { classifyText } from "./lib/classify";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type CellValueChangedEvent,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import { Plus, Trash2, Info } from "lucide-react";
import { Toaster, toast } from "sonner";

ModuleRegistry.registerModules([AllCommunityModule]);

interface RowData {
  message: string;
  category: string;
  confidence: number | null;
  response: string;
  action: string;
  automationStatus?: string;
}

const Theme = themeQuartz.withParams({
  columnBorder: { style: "solid", width: 1 },
  rowBorder: { style: "solid", width: 1 },
});

const DEFAULT_ROWS: RowData[] = [
  {
    message: "",
    category: "",
    confidence: null,
    response: "",
    action: "",
  },
  {
    message: "",
    category: "",
    confidence: null,
    response: "",
    action: "",
  },
  {
    message: "",
    category: "",
    confidence: null,
    response: "",
    action: "",
  },
  {
    message: "",
    category: "",
    confidence: null,
    response: "",
    action: "",
  },
];

const App: React.FC = () => {
  const [rowData, setRowData] = useState<RowData[]>(DEFAULT_ROWS);
  const [gridKey, setGridKey] = useState(0);
  const gridRef = useRef<AgGridReact<RowData>>(null);

  const columnDefs: ColDef<RowData>[] = useMemo(
    () => [
      {
        headerName: "Message",
        field: "message",
        editable: true,
        pinned: "left",
        flex: 1,
        autoHeight: true,
        cellRenderer: (params: ICellRendererParams<RowData>) => {
          return (
            <div
              style={{
                whiteSpace: "normal",
                lineHeight: "1.5",
                padding: "4px",
              }}
            >
              {params.value}
            </div>
          );
        },
        cellEditorParams: {
          style: {
            padding: "0",
            width: "100%",
            height: "100%",
          },
        },
      },
      {
        headerName: "Category",
        field: "category",
      },
      {
        headerName: "Confidence",
        field: "confidence",
        valueFormatter: (params) => {
          if (params.value === null) return "";
          return `${params.value}%`;
        },
      },
      {
        headerName: "Response",
        field: "response",
        minWidth: 300,
        flex: 1,
        autoHeight: true,
        cellStyle: {
          "white-space": "normal",
          "line-height": "1.5",
          padding: "8px",
        },
      },
      {
        headerName: "Action",
        field: "action",
        minWidth: 180,
        flex: 1,
      },
      {
        headerName: "Status",
        field: "automationStatus",
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams<RowData>) => {
          if (
            params.data &&
            typeof params.data.confidence === "number" &&
            params.data.confidence < 75
          ) {
            return <span style={{ color: "red" }}>⚠️ Needs Review</span>;
          }
          if (params.data && typeof params.data.confidence === "number") {
            return <span style={{ color: "green" }}>✓ Automated</span>;
          }
          return "";
        },
      },
    ],
    []
  );

  const handleCellValueChanged = async (
    event: CellValueChangedEvent<RowData>
  ) => {
    if (event.colDef.field === "message") {
      const message = event.data.message;
      let updatedRow: RowData;

      if (!message) {
        updatedRow = {
          ...event.data,
          category: "",
          confidence: 0,
          response: "",
          action: "",
        };
      } else {
        console.log("Processing message:", message);
        const toastId = toast.loading("Processing your message...");
        try {
          const result = await classifyText(message);
          updatedRow = {
            ...event.data,
            ...result,
          };
        } finally {
          toast.dismiss(toastId);
        }
      }

      setRowData((prev) =>
        prev.map((row, idx) => (idx === event.rowIndex ? updatedRow : row))
      );
    }
  };

  const addRow = () => {
    setRowData((prev) => [
      ...prev,
      {
        message: "",
        category: "",
        confidence: null,
        response: "",
        action: "",
      },
    ]);
    toast.success("Row added!");
  };

  const clearAll = () => {
    gridRef?.current?.api.stopEditing();
    const updatedRows = rowData.map((row) => ({
      ...row,
      message: "",
      category: "",
      confidence: null,
      response: "",
      action: "",
    }));

    setRowData(updatedRows);
    setGridKey((k) => k + 1);
    toast.success("All rows cleared!");
  };

  return (
    <>
      <Toaster position="top-center" richColors duration={1100} />
      <div className="min-h-screen  flex flex-col items-center  py-8 px-2">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 text-left">
              <img
                src="/logo.svg"
                alt="The Whole Truth Logo"
                className="h-12 w-auto mr-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={addRow}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white border border-black rounded-md shadow-sm hover:bg-gray-900 transition cursor-pointer"
                aria-label="Add Row"
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Add Row
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black border border-black rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition cursor-pointer"
                aria-label="Clear All"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" /> Clear All
              </button>
            </div>
          </div>

          <div className="w-full rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <AgGridReact
              key={gridKey}
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              theme={Theme}
              singleClickEdit={true}
              onCellValueChanged={handleCellValueChanged}
              domLayout="autoHeight"
              enableCellTextSelection={true}
              suppressHorizontalScroll={false}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true,
                wrapText: true,
              }}
            />
          </div>

          <div className="mb-8 w-full mt-8 max-w-3xl mx-auto bg-white/80 border border-gray-200 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-black" aria-hidden="true" />
              How it works
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 text-base">
              <li>Enter or paste a customer message in the table above.</li>
              <li>
                The system uses AI to automatically classify the message into
                categories like{" "}
                <span className="font-medium text-gray-800">Love</span>,{" "}
                <span className="font-medium text-gray-800">Grievance</span>,{" "}
                <span className="font-medium text-gray-800">
                  Order Information
                </span>
                , and more.
              </li>
              <li>
                It also suggests a brief, actionable response for each message
                and determines the best action type (Email, DM/Comment, or CRM
                Ticket).
              </li>
              <li>
                <span className="font-medium text-gray-800">Review Status</span>{" "}
                column shows how the message will be handled:
                <ul className="list-disc pl-6 mt-1">
                  <li>
                    <span className="text-green-700">✓ Automated</span>: The
                    system is confident and can handle the message
                    automatically.
                  </li>
                  <li>
                    <span className="text-red-700">⚠️ Needs Review</span>: The
                    message is ambiguous or complex and will be flagged for
                    human review.
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        <footer className="w-full border-t border-gray-200 mt-8 py-4 text-center text-sm text-gray-500 bg-white/70 backdrop-blur-sm">
          Demo for The Whole Truth. © 2025
        </footer>
      </div>
    </>
  );
};

export default App;
