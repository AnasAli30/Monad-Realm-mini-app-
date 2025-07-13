import React from 'react';

interface ConfirmEndGameModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
}

const ConfirmEndGameModal: React.FC<ConfirmEndGameModalProps> = ({ open, onClose, onConfirm, message }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0)',
      zIndex: 4000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        minWidth: 320,
        maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 21, fontWeight: 700, color: '#e11d48', marginBottom: 18 }}>
          { 'Are you sure you want to end this game? '}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <button
            onClick={onConfirm}
            style={{
              background: '#e11d48',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
            //   width: '100%',
              padding: '10px 30px',
              fontSize: 17,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #e11d4822',
            }}
          >
            Yes
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#fff',
              color: '#222',
              fontWeight: 600,
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 17,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0001',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEndGameModal; 