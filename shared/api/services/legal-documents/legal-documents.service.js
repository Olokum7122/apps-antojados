export async function loadLegalDocumentText(path, source) {
  const response = await fetch(path, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`No se pudo cargar ${source}`)
  return response.text()
}
