/**
 * Builds multipart/form-data in the shape ASP.NET Core [FromForm] binding expects.
 * - Blob/File values are appended as files (with a filename).
 * - Arrays of objects are appended as Name[0].field, Name[1].field ...
 * - null/undefined/'' are skipped.
 */
export function toFormData(obj: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(obj)) append(fd, key, value);
  return fd;
}

function append(fd: FormData, key: string, value: unknown): void {
  if (value === null || value === undefined || value === '') return;
  if (value instanceof Blob) {
    const name = value instanceof File ? value.name : `${key}.${extFor(value.type)}`;
    fd.append(key, value, name);
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => {
      if (item !== null && typeof item === 'object' && !(item instanceof Blob)) {
        for (const [k, v] of Object.entries(item)) append(fd, `${key}[${i}].${k}`, v);
      } else {
        append(fd, `${key}[${i}]`, item);
      }
    });
  } else {
    fd.append(key, String(value));
  }
}

function extFor(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}
