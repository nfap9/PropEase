import { redirect } from 'next/navigation';

export default function UtilitiesHistoryPage() {
  redirect('/utilities?tab=history');
}
