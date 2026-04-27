import LoginForm from "../components/admin/LoginForm";


export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const type = params?.type || "admin";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm initialType={type} />
    </div>
  );
}