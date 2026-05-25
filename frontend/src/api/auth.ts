import { api } from "./client";

export interface AuthUser {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  role: "admin" | "empleado";
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>("/api/auth/login", { email, password });
  return data;
}

export async function register(email: string, password: string, fullName: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>("/api/auth/register", { email, password, fullName });
  return data;
}
