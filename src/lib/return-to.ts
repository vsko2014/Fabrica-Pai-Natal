export type SafeReturnTo =
  | "/prendas"
  | "/ofertas"
  | "/prendas/nova"
  | "/prendas/nova?kind=offer";

export function getSafeReturnTo(value?: string): SafeReturnTo {
  if (value === "/ofertas") return value;
  if (value === "/prendas/nova?kind=offer") return value;
  if (value === "/prendas/nova") {
    return value;
  }
  return "/prendas";
}
