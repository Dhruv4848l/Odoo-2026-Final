import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read?: boolean;
}

export interface RealtimeEvent {
  type: 'ATTENDANCE_UPDATE' | 'TIMEOFF_UPDATE' | 'PAYROLL_UPDATE' | 'EMPLOYEE_UPDATE' | 'NOTIFICATION';
  action?: string;
  payload?: any;
  notification?: Omit<RealtimeNotification, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: string;
  };
  timestamp?: string;
}

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocket(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    clients.add(ws);
    const ip = req.socket.remoteAddress || 'unknown';
    console.log(`[WebSocket] Client connected from ${ip}. Total active clients: ${clients.size}`);

    // Send initial welcome & connection confirmation
    const welcomeMsg = JSON.stringify({
      type: 'CONNECTED',
      message: 'PeoplePay360 Real-Time WebSocket Connected',
      timestamp: new Date().toISOString(),
      activeClients: clients.size,
    });
    ws.send(welcomeMsg);

    // Setup heartbeat
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch {
        // Ignore non-JSON
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected. Remaining clients: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err.message);
      clients.delete(ws);
    });
  });

  // 30s heartbeat interval to prune dead connections
  const interval = setInterval(() => {
    if (!wss) return;
    for (const ws of clients) {
      if ((ws as any).isAlive === false) {
        clients.delete(ws);
        ws.terminate();
        continue;
      }
      (ws as any).isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('⚡ [WebSocket] Real-time engine mounted at /ws');
  return wss;
}

/**
 * Broadcast an event to all connected clients.
 */
export function broadcastEvent(event: RealtimeEvent): void {
  const timestamp = event.timestamp || new Date().toISOString();
  
  const envelope: RealtimeEvent = {
    ...event,
    timestamp,
  };

  if (event.notification) {
    envelope.notification = {
      id: event.notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: event.notification.timestamp || timestamp,
      ...event.notification,
    };
  }

  const payloadString = JSON.stringify(envelope);

  let sentCount = 0;
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payloadString);
        sentCount++;
      } catch (err: any) {
        console.error('[WebSocket] Broadcast error:', err.message);
      }
    }
  }

  console.log(`[WebSocket] Broadcasted ${event.type} to ${sentCount} client(s). Title: ${event.notification?.title || 'N/A'}`);
}
