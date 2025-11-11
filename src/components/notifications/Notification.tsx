import { createContext, ReactNode, useContext, useState } from "react";

export interface Notification {
    id: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';
    read: boolean;
    createdAt: Date;
    keepForever?: boolean;
}

export type NotificationCreate = Omit<Notification, "id" | "createdAt" | "read">;

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: NotificationCreate) => void;
    markAsRead: (id: string) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) throw Error('useNotificationContext can only used within a NotificationProvider');

    return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = ({ message, type, keepForever = false }: NotificationCreate) => {
        setNotifications([
            ...notifications,
            {
                id: crypto.randomUUID(),
                createdAt: new Date(),
                read: false,
                ...{ message, type, keepForever }
            }
        ])
    }

    const markAsRead = (id: string) => {
        const notifications_ = notifications.map((notif) => {
            if (notif.id === id) {
                return {
                    ...notif,
                    read: true
                }
            }
            return notif;
        });

        setNotifications(notifications_);
    }

    const removeNotification = (id: string) => {
        const notifications_ = notifications.filter((notif) => notif.id !== id);
        setNotifications(notifications_);
    }

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    )

}

export function NotificationsList() {
    const { notifications } = useNotifications();

    if (notifications.length === 0) return null;

    return (
        <div className="p-1 m-0 bottom-16 left-6 fixed">
            <ul className="list-none flex flex-col gap-2 rounded-sm">
                {notifications.map((notif) => (
                    <li key={notif.id} className="">
                        <NotificationItem notification={notif} />
                    </li>
                ))}
            </ul>
        </div>
    )
}

function NotificationItem({ notification }: { notification: Notification }) {
    return (
        <div className="">
            <p>{notification.message}</p>
        </div>
    )
}