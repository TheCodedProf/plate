export function Button({
  children,
  disabled,
  onClick,
  type,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
  type?: "danger" | "success";
}) {
  let extraClasses: string;
  switch (type) {
    case "danger":
      extraClasses =
        "not-disabled:hover:bg-ctp-red not-disabled:hover:text-ctp-base";
      break;
    case "success":
      extraClasses =
        "not-disabled:hover:bg-ctp-green not-disabled:hover:text-ctp-base";
      break;
    default:
      extraClasses = "hover:bg-ctp-surface2";
      break;
  }
  return (
    <button
      className={
        "rounded " +
        extraClasses +
        " bg-ctp-surface1 text-ctp-text flex cursor-pointer items-center justify-center px-2 disabled:cursor-not-allowed"
      }
      disabled={disabled ?? false}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    >
      {children}
    </button>
  );
}
