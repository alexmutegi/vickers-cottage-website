import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import './BarcodeScanner.css'

/**
 * BarcodeScanner
 * Opens the device camera, decodes barcodes/QR codes in real-time,
 * and calls onScan(text) on a successful read.
 *
 * Props:
 *   onScan(text)  — called with the decoded barcode string
 *   onClose()     — called when the user dismisses the scanner
 */
export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const scannedRef = useRef(false) // prevent duplicate triggers

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    // List available cameras
    BrowserMultiFormatReader.listVideoInputDevices()
      .then(ds => {
        setDevices(ds)
        // Prefer rear camera on mobile
        const rear = ds.find(d => /back|rear|environment/i.test(d.label))
        const chosen = rear || ds[0]
        setSelectedDevice(chosen?.deviceId || null)
      })
      .catch(() => setError('Cannot access camera — please allow camera permission in your browser.'))

    return () => {
      reader.reset()
    }
  }, [])

  // Start/restart scanning whenever the selected device changes
  useEffect(() => {
    if (!selectedDevice || !videoRef.current) return
    scannedRef.current = false

    readerRef.current.decodeFromVideoDevice(
      selectedDevice,
      videoRef.current,
      (result, err) => {
        if (result && !scannedRef.current) {
          scannedRef.current = true
          setScanning(false)
          onScan(result.getText())
        }
        if (err && err.name !== 'NotFoundException') {
          // NotFoundException fires on every empty frame — suppress it
          console.warn('Scan error:', err.message)
        }
      }
    ).catch(e => setError(`Camera error: ${e.message}`))
  }, [selectedDevice, onScan])

  const switchCamera = () => {
    readerRef.current?.reset()
    scannedRef.current = false
    const currentIdx = devices.findIndex(d => d.deviceId === selectedDevice)
    const next = devices[(currentIdx + 1) % devices.length]
    setSelectedDevice(next?.deviceId)
    setScanning(true)
  }

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div className="scanner-modal" onClick={e => e.stopPropagation()}>
        <div className="scanner-header">
          <h2>📷 Scan Barcode</h2>
          <button className="scanner-close" onClick={onClose}>✕</button>
        </div>

        {error ? (
          <div className="scanner-error">
            <div className="scanner-error-icon">📵</div>
            <p>{error}</p>
            <button className="btn-outline" onClick={onClose}>Close</button>
          </div>
        ) : (
          <div className="scanner-body">
            <div className="scanner-viewport">
              <video ref={videoRef} className="scanner-video" autoPlay playsInline muted />
              {scanning && (
                <div className="scanner-aim">
                  <div className="scanner-aim-line" />
                </div>
              )}
              {!scanning && (
                <div className="scanner-success">
                  <span>✅ Scanned!</span>
                </div>
              )}
            </div>

            <p className="scanner-hint">
              Point camera at a product barcode or QR code
            </p>

            <div className="scanner-actions">
              {devices.length > 1 && (
                <button className="btn-outline" onClick={switchCamera}>
                  🔄 Switch Camera
                </button>
              )}
              <button className="btn-primary" onClick={onClose}>Cancel</button>
            </div>

            {devices.length === 0 && (
              <div className="loading-box"><div className="spinner" /> Initialising camera…</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
