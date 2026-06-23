import {
  buildScannerPayloadFromTabbarbases,
  summarizeScannerPayload,
} from '../src/services/dimensions/metadataScanner.js'

const payload = buildScannerPayloadFromTabbarbases()
const wantsJson = process.argv.includes('--json')

if (wantsJson) {
  console.log(JSON.stringify(payload, null, 2))
} else {
  const summary = summarizeScannerPayload(payload)
  console.log(JSON.stringify(summary, null, 2))
}
