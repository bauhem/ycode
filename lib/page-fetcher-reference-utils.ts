export function mergeNestedReferenceValues(
  targetValues: Record<string, unknown>,
  nestedValues: Record<string, unknown>,
  currentPath: string
): void {
  for (const [key, value] of Object.entries(nestedValues)) {
    if (!key.startsWith(`${currentPath}.`)) continue;
    targetValues[key] = value;
  }
}
