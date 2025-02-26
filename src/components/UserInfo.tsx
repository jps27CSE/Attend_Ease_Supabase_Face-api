import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function UserInfo({ user }) {
  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Employee Info</CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <>
            <p>
              <strong>Name:</strong> {user.username}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </>
        ) : (
          <p>No employee data available.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default UserInfo;
