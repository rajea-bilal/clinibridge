import type { ComponentProps } from "react";

export function Frame(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return (
    <div
      className={
        "rounded-lg border border-gray-200/60 bg-white/50 p-2 shadow-sm dark:border-white/10 dark:bg-white/5" +
        (className ?? "")
      }
      {...rest}
    />
  );
}

export default Frame;
