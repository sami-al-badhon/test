'use client';
import React from 'react';
import { sendNotification } from '@/app/actions';
import { useState, useEffect } from 'react';

const Page = () => {
  const [isLoadingMsg, setIsLoadingMsg] = useState(false);
  const [message, setMessage] = useState('');
  async function sendTestNotification() {
    setIsLoadingMsg(true);
    const res = await sendNotification(message);
    if (res.success) {
      setMessage('');
      setIsLoadingMsg(false);
    } else {
      alert('Failed to send notification');
      setIsLoadingMsg(false);
    }
  }
  return <div></div>;
};

export default Page;
