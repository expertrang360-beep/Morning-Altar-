import { useEffect, useRef } from 'react';
import { UserData } from '../types';

export function useDailyReminder(userData: UserData) {
  const lastNotifiedDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userData.onboarded || !userData.devotionTime) return;

    // Check if notifications are supported and granted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const checkTime = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;
      
      const todayString = now.toDateString();

      // If it's the exact minute of the devotion time and we haven't notified today
      if (currentTimeString === userData.devotionTime && lastNotifiedDateRef.current !== todayString) {
        
        // Show notification
        const notification = new Notification("Morning Altar", {
          body: "It's time for your daily devotion and Bible study.",
          icon: "/icon.png", // Optional: add an icon if available
          badge: "/badge.png", // Optional
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        lastNotifiedDateRef.current = todayString;
      }
    };

    // Check immediately
    checkTime();

    // Then check every minute (at the top of the minute for precision)
    const now = new Date();
    const delayToNextMinute = (60 - now.getSeconds()) * 1000;
    
    let intervalId: number;
    
    const timeoutId = setTimeout(() => {
      checkTime();
      intervalId = window.setInterval(checkTime, 60000);
    }, delayToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [userData.onboarded, userData.devotionTime]);
}
