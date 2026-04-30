import { useState, useRef, ClipboardEvent, ChangeEvent, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import {  AlertCircle } from 'lucide-react';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export default function OTPInput({ 
  length = 6, 
  onComplete, 
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);


  // Handle Input Change
  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Only take the last character
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (value && index < length - 1) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    // Check completion
    const finalCode = newOtp.join("");
    if (finalCode.length === length) {
      onComplete(finalCode);
    }
  };

  // Handle Key Down (Backspace)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle Paste
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").trim();
    if (isNaN(Number(data))) return;

    const pasteData = data.substring(0, length).split("");
    const newOtp = [...otp];
    
    pasteData.forEach((char, index) => {
      if (index < length) {
        newOtp[index] = char;
      }
    });

    setOtp(newOtp);
    const lastIndex = Math.min(pasteData.length, length - 1);
    setActiveInput(lastIndex);
    inputRefs.current[lastIndex]?.focus();

    if (newOtp.join("").length === length) {
      onComplete(newOtp.join(""));
    }
  };



  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
      <div className="flex justify-between items-center w-full px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Xác thực 2FA</span>
        </div>
        
      </div>

      <div className="flex gap-2.5 md:gap-3 justify-center w-full">
        {otp.map((digit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <input
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              onFocus={() => setActiveInput(index)}
              className={`
                w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-black rounded-2xl
                bg-white/5 border-2 transition-all duration-300 outline-none
                ${activeInput === index 
                  ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] bg-white/10" 
                  : "border-white/10 hover:border-white/20"}
                ${digit ? "text-white" : "text-slate-500"}
              `}
              autoFocus={index === 0}
            />
            {activeInput === index && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute -bottom-1 left-3 right-3 h-0.5 bg-indigo-500 rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
      

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 w-full">
          <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Nhập mã 6 chữ số từ ứng dụng xác thực (Google Authenticator) hoặc mã dự phòng của bạn để tiếp tục.
          </p>
        </div>
      </div>
    </div>
  );
}
