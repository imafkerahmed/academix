import { Loader as LoaderIcon } from "lucide-react";

export default function Loader({ className = "" }: { className?: string }) {
  return <LoaderIcon className={`animate-spin ${className}`} />;
}
