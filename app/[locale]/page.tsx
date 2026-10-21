import { Header } from "@/components/header";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <Header locale={locale} />
      <h1>Hệ thống lớn</h1>
    </>
  );
}
