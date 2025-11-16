import { NotificationType } from "@/lib/types";
import { CircleCheckBig, CircleX, Info, OctagonAlert } from "lucide-react";

interface NotificationIconProps {
    type: NotificationType;
}

export default function NotificationIcon({ type }: NotificationIconProps) {
    switch (type) {
        case 'SUCCESS':
            return <CircleCheckBig className="w-6 h-6" />;
        case 'ERROR':
            return <CircleX className="w-6 h-6" />;
        case 'WARNING':
            return <OctagonAlert className="w-6 h-6" />;
        case 'INFO':
        default:
            return <Info className="w-6 h-6" />;
    }
}