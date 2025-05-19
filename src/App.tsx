import React, { useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { classifyText } from "./lib/classify";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type CellValueChangedEvent,
  type ColDef,
} from "ag-grid-community";
import { Plus, Trash2, Info } from "lucide-react";
import { Toaster, toast } from "sonner";

ModuleRegistry.registerModules([AllCommunityModule]);

interface RowData {
  message: string;
  category: string;
  confidence: number | null;
  actionableText: string;
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
    actionableText: "",
  },
  {
    message: "",
    category: "",
    confidence: null,
    actionableText: "",
  },
  {
    message: "",
    category: "",
    confidence: null,
    actionableText: "",
  },
  {
    message: "",
    category: "",
    confidence: null,
    actionableText: "",
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
        flex: 2,
      },
      {
        headerName: "Category",
        field: "category",
        flex: 1,
      },
      {
        headerName: "Confidence",
        field: "confidence",
        flex: 1,
      },
      {
        headerName: "Actionable",
        field: "actionableText",
        flex: 3,
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
          actionableText: "",
        };
      } else {
        console.log("classifying", message);
        const result = await classifyText(message);
        updatedRow = {
          ...event.data,
          category: result.category,
          confidence: result.confidence,
          actionableText: result.actionableText,
        };
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
        actionableText: "",
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
      actionableText: "",
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

          <div className="w-full rounded-xl shadow-sm border border-gray-100">
            <AgGridReact
              key={gridKey}
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              theme={Theme}
              singleClickEdit={true}
              onCellValueChanged={handleCellValueChanged}
              domLayout="autoHeight"
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
                It also suggests a brief, actionable response for each message.
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
