'use client';

import React, { useEffect, useState } from 'react';
import { Badge, Button, Card } from '@/components/ui/primitives';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminSettingsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  function load() {
    fetch('/api/admin/notifications')
      .then((r) => r.json())
      .then((d: { notifications?: NotificationRow[] }) => setNotifications(d.notifications ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-dark">Уведомления и настройки / Settings</h1>

      <Card className="p-6">
        <h2 className="font-serif text-2xl text-dark">Центр уведомлений</h2>
        <div className="mt-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className="flex flex-col justify-between gap-3 rounded-lg border border-sand p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={n.is_read ? 'outline' : 'mocha'}>{n.type}</Badge>
                    <p className="font-medium text-dark">{n.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-mocha">{n.message}</p>
                </div>
                {!n.is_read ? (
                  <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                    Прочитано
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-mocha">Уведомлений пока нет.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
