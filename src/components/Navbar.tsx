import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-semibold">AttendEase</div>
        <div>
          <Button variant="outline" className="ml-4 text-black">
            Register User
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
