import React from 'react';
import { FileText, Image as ImageIcon, Download, ExternalLink } from 'lucide-react';

interface EvidenceViewerProps {
  evidenceUrl?: string | null;
  evidenceName?: string | null;
  evidenceType?: string | null;
  evidenceSize?: number | null;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  evidenceUrl,
  evidenceName,
  evidenceType,
  evidenceSize
}) => {
  if (!evidenceUrl) {
    return (
      <div
        style={{
          padding: '24px',
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.85rem'
        }}
      >
        <FileText size={28} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
        <span>No digital evidence or supporting document attached for this request.</span>
      </div>
    );
  }

  const isImage = evidenceType?.startsWith('image/') ||
    evidenceName?.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ||
    evidenceUrl.startsWith('data:image/');

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#f1f5f9',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isImage ? <ImageIcon size={20} color="#2563eb" /> : <FileText size={20} color="#dc2626" />}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              {evidenceName || 'Supporting_Evidence_Document'}
            </div>
            {evidenceSize && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {formatSize(evidenceSize)} • Verified institutional submission
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={evidenceUrl}
            download={evidenceName || 'document'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            <Download size={13} />
            <span>Save</span>
          </a>
        </div>
      </div>

      {isImage ? (
        <div
          style={{
            maxHeight: '380px',
            overflow: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px'
          }}
        >
          <img
            src={evidenceUrl}
            alt={evidenceName || 'Evidence preview'}
            style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '4px' }}
          />
        </div>
      ) : (
        <div
          style={{
            height: '240px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}
        >
          <FileText size={48} color="#2563eb" opacity={0.7} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>PDF Document: {evidenceName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
              Click below to view or print the original certificate.
            </div>
          </div>
          <a
            href={evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <ExternalLink size={14} />
            <span>Open in Viewer</span>
          </a>
        </div>
      )}
    </div>
  );
};
