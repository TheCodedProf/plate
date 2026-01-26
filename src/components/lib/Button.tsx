export function Button({
  children,
  onClick,
  disabled,
  type,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  type?: "danger" | "success";
}) {
  return (
    <button
      className={
        "rounded " +
        (type == "danger"
          ? "not-disabled:hover:bg-ctp-red not-disabled:hover:text-ctp-base"
          : type == "success"
            ? "not-disabled:hover:bg-ctp-green not-disabled:hover:text-ctp-base"
            : "hover:bg-ctp-surface2") +
        " bg-ctp-surface1 text-ctp-text px-2 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
      }
      onClick={onClick}
      disabled={disabled ?? false}
    >
      {children}
    </button>
  );
}
