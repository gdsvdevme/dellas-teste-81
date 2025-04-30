
import LoginForm from "@/components/auth/LoginForm";

const Auth = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default Auth;
