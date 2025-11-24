import { createContext, useContext, useState } from "react";
import { CircleX } from "lucide-react";
import NotificationIcon from "../NotificationIcon";
import type { ReactNode} from "react";

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
    notifications: Array<Notification>;
    addNotification: (notification: NotificationCreate) => void;
    markAsRead: (id: string) => void;
    removeNotification: (id: string) => void;
    clear: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) throw Error('useNotificationContext can only used within a NotificationProvider');

    return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Array<Notification>>([]);

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

    const clear = () => {
        setNotifications([]);
    }

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, removeNotification, clear }}>
            {children}
        </NotificationContext.Provider>
    )

}

export function NotificationsList() {
    const { notifications } = useNotifications();

    if (notifications.length === 0) return null;

    return (
        <ul className="list-none flex flex-col gap-2 rounded-sm w-full">
            {notifications.map((notif) => (
                <li key={notif.id} className="">
                    <NotificationItem notification={notif} />
                </li>
            ))}
        </ul>
    )
}

function NotificationItem({ notification }: { notification: Notification }) {
    const { removeNotification } = useNotifications();

    return (
        <div role="alert" className={`w-full flex flex-col p-2 border rounded-sm shadow-md alert alert-${notification.type.toLowerCase()} alert-soft`}>
            <div className="flex flex-row justify-end mb-1 w-full">
                <button
                    aria-label="Close notification"
                    className="rounded-sm p-1 cursor-pointer"
                    onClick={() => {
                        removeNotification(notification.id);
                    }}
                >
                    <CircleX size={24} />
                </button>
            </div>
            <div className="flex flex-row items-center">
                <span className="mr-2">
                    <NotificationIcon type={notification.type} />
                </span>
                <p className="font-bold">{notification.message}</p>
            </div>
        </div>
    )
}