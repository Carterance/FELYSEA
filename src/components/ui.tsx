import { InputHTMLAttributes, ButtonHTMLAttributes } from "react";

export function RitualPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-surface px-8 py-10">
      {children}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm text-foreground-muted"
      >
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-foreground-muted/60 outline-none transition-colors focus:border-accent " +
        (props.className ?? "")
      }
    />
  );
}

export function PrimaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-md bg-accent px-4 py-2.5 font-medium text-[#1b1420] transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 " +
        (props.className ?? "")
      }
    />
  );
}
