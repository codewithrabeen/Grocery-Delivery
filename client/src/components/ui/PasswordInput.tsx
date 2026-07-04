import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  icon?: ReactNode;
  inputClassName: string;
};

const PasswordInput = ({ icon, inputClassName, className = "", ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOffIcon : EyeIcon;

  return (
    <span className={`relative block ${className}`}>
      {icon}
      <input {...props} type={visible ? "text" : "password"} className={inputClassName} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-app-green focus:outline-none focus:ring-2 focus:ring-app-green focus:ring-offset-1"
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </span>
  );
};

export default PasswordInput;
