"use client";
import { Button } from "@/components/ui/button";
import RegisterModal from "@/components/RegisterModal";
import { useState } from "react"; // Importing modal component

const Navbar = () => {
  const [open, setOpen] = useState(false); // State to manage modal visibility

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-semibold">AttendEase</div>
        <div>
          <Button
            variant="outline"
            className="ml-4 text-black"
            onClick={() => setOpen(true)} // Open modal when clicked
          >
            Register User
          </Button>
        </div>
      </div>
      {/* Pass `open` state to modal to control its visibility */}
      <RegisterModal open={open} setOpen={setOpen} />
    </nav>
  );
};

export default Navbar;
