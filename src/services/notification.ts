export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showNotification(title: string, body: string): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/vite.svg',
    });
  }
}

export function scheduleReminder(taskTitle: string, dueTime: string): void {
  const due = new Date(dueTime);
  const now = new Date();
  const reminderTime = new Date(due.getTime() - 15 * 60 * 1000); // 15 min before

  if (reminderTime > now) {
    const delay = reminderTime.getTime() - now.getTime();
    setTimeout(() => {
      showNotification('Molofu4 Reminder', `${taskTitle} is due in 15 minutes`);
    }, delay);
  }
}
