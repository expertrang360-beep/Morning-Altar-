import { motion } from 'motion/react';

export function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 bg-theme-bg flex flex-col items-center justify-center z-[9999] overflow-hidden"
    >
      <div className="relative flex flex-col items-center">
        {/* Glowing background behind the book */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1.5 }}
          transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-theme-accent/10 blur-[60px] rounded-full"
        />
        
        {/* The Bible Icon Animation */}
        <div className="relative z-10 text-theme-accent mb-8 flex items-center justify-center" style={{ perspective: "1000px" }}>
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.5)] overflow-visible"
          >
            {/* Left Page */}
            <motion.path 
              d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.4 }}
              style={{ transformOrigin: "12px 0px" }}
            />
            {/* Right Page */}
            <motion.path 
              d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.4 }}
              style={{ transformOrigin: "12px 0px" }}
            />
            {/* Center line/spine */}
            <motion.line
              x1="12" y1="7" x2="12" y2="21"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            />
          </svg>
          
          {/* Light beam coming out of the book */}
          <motion.div
            initial={{ opacity: 0, height: 0, y: 0 }}
            animate={{ opacity: [0, 0.8, 0], height: 160, y: -80 }}
            transition={{ delay: 0.8, duration: 2, ease: "easeOut" }}
            className="absolute top-[40%] left-1/2 -translate-x-1/2 w-20 bg-gradient-to-t from-theme-accent/40 to-transparent blur-xl pointer-events-none"
            style={{ transformOrigin: "bottom center" }}
          />
        </div>

        {/* App Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-center relative z-10"
        >
          <h1 className="text-4xl font-bold tracking-tight text-theme-text mb-3">Morning Altar</h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.5, duration: 0.8, ease: "easeInOut" }}
            className="h-[1px] bg-theme-accent/50 mx-auto mb-3"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="text-theme-accent/80 tracking-[0.3em] uppercase text-[10px] font-bold"
          >
            Prepare Your Heart
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
