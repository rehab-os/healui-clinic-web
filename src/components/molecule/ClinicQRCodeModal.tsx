'use client';

import React, { useRef } from 'react';
import { X, Download, Printer, Copy, QrCode, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ClinicQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicName: string;
  clinicCode: string;
}

const ClinicQRCodeModal: React.FC<ClinicQRCodeModalProps> = ({
  isOpen,
  onClose,
  clinicName,
  clinicCode,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // Generate registration URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const registrationUrl = `${baseUrl}/register/${clinicCode}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    // Create canvas from SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);

      // Download
      const link = document.createElement('a');
      link.download = `${clinicCode}-qr-code.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${clinicName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 8px;
              color: #1e5f79;
            }
            .code {
              font-size: 14px;
              color: #666;
              margin-bottom: 24px;
            }
            .qr-container {
              margin: 20px 0;
            }
            .instructions {
              font-size: 16px;
              color: #333;
              margin-top: 24px;
              max-width: 300px;
            }
            .url {
              font-size: 12px;
              color: #888;
              margin-top: 16px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${clinicName}</h1>
            <p class="code">Clinic Code: ${clinicCode}</p>
            <div class="qr-container">
              ${svgData}
            </div>
            <p class="instructions">Scan this QR code with your phone camera to register as a new patient</p>
            <p class="url">${registrationUrl}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-[#1e5f79]" />
            <h2 className="text-lg font-semibold text-gray-900">Patient Registration QR</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Clinic Info */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">{clinicName}</h3>
            <p className="text-sm text-gray-500">Code: {clinicCode}</p>
          </div>

          {/* QR Code */}
          <div
            ref={qrRef}
            className="bg-white p-6 rounded-xl border-2 border-gray-100 flex items-center justify-center mb-6"
          >
            <QRCodeSVG
              value={registrationUrl}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#1e5f79"
            />
          </div>

          {/* URL */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500 mb-1">Registration URL</p>
            <p className="text-sm text-gray-700 break-all font-mono">{registrationUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleDownload}
              className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="h-5 w-5 text-gray-600 mb-1" />
              <span className="text-xs text-gray-600">Download</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Printer className="h-5 w-5 text-gray-600 mb-1" />
              <span className="text-xs text-gray-600">Print</span>
            </button>

            <button
              onClick={handleCopyUrl}
              className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 text-green-600 mb-1" />
                  <span className="text-xs text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 text-gray-600 mb-1" />
                  <span className="text-xs text-gray-600">Copy URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-700 text-center">
            Display this QR code at your reception desk for patients to scan and self-register.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClinicQRCodeModal;
