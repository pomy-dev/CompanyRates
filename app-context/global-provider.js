import { AuthProvider } from "./auth-context";

export default function GlobalContextProvider({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}