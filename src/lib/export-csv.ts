export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
