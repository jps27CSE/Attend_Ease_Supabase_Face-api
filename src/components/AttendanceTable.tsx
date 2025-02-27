import { Button } from "@/components/ui/button";

const AttendanceTable = () => {
  const data = [
    {
      username: "John Doe",
      date: "2025-02-25",
      startTime: "09:00 AM",
      endTime: "05:00 PM",
      status: "Present",
    },
    {
      username: "Jane Smith",
      date: "2025-02-25",
      startTime: "10:00 AM",
      endTime: "06:00 PM",
      status: "Absent",
    },
    // Add more data rows as needed
  ];

  // Function to calculate duty time (hours worked)
  const calculateDutyTime = (startTime, endTime) => {
    const start = new Date(`01/01/2000 ${startTime}`);
    const end = new Date(`01/01/2000 ${endTime}`);
    const diff = (end - start) / (1000 * 60 * 60); // Difference in hours
    return `${diff.toFixed(2)} hours`;
  };

  return (
    <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
      <table className="min-w-full table-auto">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="px-6 py-3 font-semibold text-sm text-left">
              Username
            </th>
            <th className="px-6 py-3 font-semibold text-sm text-left">Date</th>
            <th className="px-6 py-3 font-semibold text-sm text-left">
              Start Time
            </th>
            <th className="px-6 py-3 font-semibold text-sm text-left">
              End Time
            </th>
            <th className="px-6 py-3 font-semibold text-sm text-left">
              Duty Time
            </th>
            <th className="px-6 py-3 font-semibold text-sm text-left">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {data.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="px-6 py-4 text-sm text-left">{item.username}</td>
              <td className="px-6 py-4 text-sm text-left">{item.date}</td>
              <td className="px-6 py-4 text-sm text-left">{item.startTime}</td>
              <td className="px-6 py-4 text-sm text-left">{item.endTime}</td>
              <td className="px-6 py-4 text-sm text-left">
                {calculateDutyTime(item.startTime, item.endTime)}
              </td>
              <td className="px-6 py-4 text-sm text-left">
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    item.status === "Present"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
