import { SettingsLayout } from '@/components/layout/settings-layout';

export default function SettingsLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
