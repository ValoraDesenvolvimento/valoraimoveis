import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dados da empresa | Equipe",
};

export default function AdminEmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
