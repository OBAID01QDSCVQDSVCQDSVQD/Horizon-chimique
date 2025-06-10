'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function AppointmentPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dates: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dates: formData.dates,
        userId,
      }),
    });
  };
} 