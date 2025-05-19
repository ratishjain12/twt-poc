import React from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyCellProps {
  value: string;
}

const CopyCell: React.FC<CopyCellProps> = ({ value }) => {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      toast.success("Message copied!");
    }
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="truncate max-w-[200px]">{value}</span>
      {value && (
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded cursor-pointer hover:bg-gray-100 focus:outline-none"
          aria-label="Copy message"
        >
          <Copy
            className="w-4 h-4 text-gray-400 group-hover:text-black"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};

export default CopyCell;
