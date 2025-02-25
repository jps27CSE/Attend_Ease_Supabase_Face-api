import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function UserInfo() {
  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Employee Info</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Name:</strong> John Doe
        </p>
        <p>
          <strong>Role:</strong> Software Engineer
        </p>
      </CardContent>
    </Card>
  );
}

export default UserInfo;
