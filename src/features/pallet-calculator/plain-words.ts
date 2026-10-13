export function layoutName(name: string) {
  return (
    (
      {
        "Straight grid": "Simple rows",
        "Rotated grid": "Rows turned sideways",
        "Mixed columns": "Some items turned sideways",
        "Mixed rows": "Some rows turned sideways",
      } as Record<string, string>
    )[name] ?? name
  );
}
export function limitName(name: string) {
  return (
    (
      {
        Height: "Height limit",
        Weight: "Weight limit",
        "Layer limit": "Layer limit",
      } as Record<string, string>
    )[name] ?? name
  );
}
