import React, { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { classifyText } from "./lib/classify";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type CellValueChangedEvent,
  type ColDef,
} from "ag-grid-community";

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
  };

  const clearAll = () => {
    setRowData(DEFAULT_ROWS);
  };

  return (
    <div style={{ padding: "12px" }}>
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          justifyContent: "end",
          gap: "10px",
        }}
      >
        <button
          onClick={addRow}
          style={{
            padding: "12px 16px",
            backgroundColor: "#fff",
            color: "#000",
            border: "1px solid #ccc",
            borderRadius: "6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            cursor: "pointer",
          }}
        >
          Add Row
        </button>
        <button
          onClick={clearAll}
          style={{
            padding: "6px 16px",
            backgroundColor: "#fff",
            color: "#000",
            border: "1px solid #ccc",
            borderRadius: "6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            cursor: "pointer",
          }}
        >
          Clear All
        </button>
      </div>

      <div
        className="ag-theme-alpine"
        style={{ width: "100%", height: "auto" }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          theme={Theme}
          onCellValueChanged={handleCellValueChanged}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
};

export default App;
