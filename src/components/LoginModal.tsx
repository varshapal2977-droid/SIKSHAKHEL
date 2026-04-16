import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import gsap from 'gsap';
import Login from './Login';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Animate backdrop in
      gsap.to(backdropRef.current, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.3,
        ease: 'power2.out',
      });

      // Animate modal in (scale + fade)
      gsap.to(modalRef.current, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.4,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
      });

      // Animate inner card with scale
      if (modalRef.current?.querySelector('div')) {
        gsap.from(modalRef.current.querySelector('div'), {
          scale: 0.95,
          duration: 0.4,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
        });
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Animate backdrop out
      gsap.to(backdropRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
      });

      // Animate modal out
      gsap.to(modalRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
      });

      // Restore body scroll
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 opacity-0 pointer-events-none"
        onClick={handleBackdropClick}
      />

      {/* Modal - Centered in viewport */}
      <div
        ref={modalRef}
        className="fixed inset-0 flex items-center justify-center z-50 opacity-0 pointer-events-none p-4"
      >
        <div className="relative w-full max-w-lg">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all hover:rotate-90 z-10 shadow-lg shadow-rose-500/20 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Login form container */}
          <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-[2rem] border border-white/10 p-10 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -ml-16 -mb-16" />
            
            <div className="relative z-10">
              <Login />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
