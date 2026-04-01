import LoginForm from "../components/admin/LoginForm";


export default function LoginPage({ searchParams }) {
  const type = searchParams?.type || "admin";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm initialType={type} />
    </div>
  );
}