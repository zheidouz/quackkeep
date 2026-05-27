import { useState, useRef, useEffect, useCallback } from 'react';

const PIN_STORAGE_KEY = 'QUACKKEEP_PIN_v1';
const DEFAULT_PIN = '1234';

export function getStoredPin(): string {
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
}

export function setStoredPin(pin: string): void {
  localStorage.setItem(PIN_STORAGE_KEY, pin);
}

interface Props {
  open: boolean;
  mode: 'unlock' | 'set' | 'change';
  onSuccess: () => void;
  onClose: () => void;
}

export default function PinModal({ open, mode, onSuccess, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [newPin, setNewPin] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  // Sync dialog open state
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      resetState();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const resetState = () => {
    setPin(['', '', '', '']);
    setError('');
    setCurrentPin(['', '', '', '']);
    setStep('current');
    setNewPin('');
  };

  // Focus first empty input
  useEffect(() => {
    if (!open) return;
    const emptyIndex = pin.findIndex((d) => !d);
    const idx = emptyIndex === -1 ? 3 : emptyIndex;
    setTimeout(() => inputRefs.current[idx]?.focus(), 50);
  }, [pin, open]);

  const handleDigit = (value: string, index: number) => {
    if (value.length > 1) return; // prevent paste
    const newPinArr = [...pin];
    newPinArr[index] = value;
    setPin(newPinArr);
    setError('');

    // Auto-advance to next digit
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all 4 digits filled
    const entered = newPinArr.join('');
    if (entered.length === 4) {
      handleSubmit(entered);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Go back to previous input
      const newPinArr = [...pin];
      newPinArr[index - 1] = '';
      setPin(newPinArr);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (enteredPin: string) => {
    if (mode === 'unlock') {
      if (enteredPin === getStoredPin()) {
        setPin(['', '', '', '']);
        onSuccess();
      } else {
        setError('Incorrect PIN');
        setPin(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } else if (mode === 'set') {
      setStoredPin(enteredPin);
      setPin(['', '', '', '']);
      onSuccess();
    } else if (mode === 'change') {
      if (step === 'current') {
        if (enteredPin === getStoredPin()) {
          setCurrentPin(['', '', '', '']);
          setPin(['', '', '', '']);
          setStep('new');
          setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } else {
          setError('Incorrect current PIN');
          setPin(['', '', '', '']);
          setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
      } else if (step === 'new') {
        setNewPin(enteredPin);
        setPin(['', '', '', '']);
        setStep('confirm');
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else if (step === 'confirm') {
        if (enteredPin === newPin) {
          setStoredPin(enteredPin);
          setPin(['', '', '', '']);
          onSuccess();
        } else {
          setError('PINs do not match');
          setPin(['', '', '', '']);
          setNewPin('');
          setStep('new');
          setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
      }
    }
  };

  const getTitle = () => {
    if (mode === 'unlock') return 'Enter PIN';
    if (mode === 'set') return 'Set New PIN';
    if (mode === 'change') {
      if (step === 'current') return 'Enter Current PIN';
      if (step === 'new') return 'Enter New PIN';
      return 'Confirm New PIN';
    }
    return 'PIN';
  };

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === dialogRef.current) onClose();
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdrop}
      className="backdrop:bg-homestead-green/60 border-2 border-homestead-green rounded-2xl w-full max-w-xs p-6 bg-homestead-beige select-none focus:outline-none shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-homestead-green pb-2 mb-4">
        <h3 className="font-bold text-md text-homestead-green flex items-center space-x-2">
          <span>🔒</span> <span>{getTitle()}</span>
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-homestead-green flex items-center justify-center font-bold text-xs cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex justify-center gap-3 mb-4">
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigit(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="w-12 h-14 text-center text-2xl font-black bg-white border-2 border-homestead-green rounded-xl focus:outline-none focus:border-homestead-terracotta"
            autoComplete="off"
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-600 font-semibold mb-2">{error}</p>
      )}

      <p className="text-center text-xs text-homestead-green/60">
        {mode === 'change' && step === 'confirm'
          ? 'Re-enter your new PIN'
          : 'Enter 4-digit PIN'}
      </p>
    </dialog>
  );
}
