import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BillingPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/billing/orders', { replace: true });
  }, [navigate]);
  return null;
}
