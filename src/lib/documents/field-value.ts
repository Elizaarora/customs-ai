export function fieldValue(fields: { name: string; value: string }[], name: string): string | undefined {
  return fields.find((field) => field.name === name)?.value;
}
