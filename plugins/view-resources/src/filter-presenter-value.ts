/** Convert grouped array selections to the values expected by attribute presenters. */
export function getFilterPresenterValue (value: any[], grouped: boolean): any[] {
  return grouped ? Array.from(new Set(value.flatMap((entry) => entry[1]))) : value
}
