import { Button } from "@/components/ui/button";
import { FaPlay, FaStop } from "react-icons/fa";

function ActionButtons() {
  return (
    <div className="p-6 bg-gray-200 rounded-lg shadow-lg flex justify-center items-center space-x-6">
      <Button
        variant="outline"
        className="flex items-center space-x-2 px-6 py-3 text-lg font-semibold bg-blue-100 hover:bg-blue-200 focus:ring-2 ring-blue-500"
      >
        <FaPlay className="text-blue-500" />
        <span>Start Duty</span>
      </Button>
      <Button
        variant="destructive"
        className="flex items-center space-x-2 px-6 py-3 text-lg font-semibold bg-red-100 hover:bg-red-200 focus:ring-2 ring-red-500"
      >
        <FaStop className="text-red-500" />
        <span>End Duty</span>
      </Button>
    </div>
  );
}

export default ActionButtons;
