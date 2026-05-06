export function FinlyLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="#10b981"/>
      {/* F — traço vertical */}
      <rect x="9" y="9" width="3" height="14" rx="1.5" fill="white"/>
      {/* F — barra superior */}
      <rect x="9" y="9" width="12" height="3" rx="1.5" fill="white"/>
      {/* F — barra do meio */}
      <rect x="9" y="15.5" width="8" height="3" rx="1.5" fill="white"/>
      {/* seta crescente no canto superior direito */}
      <path d="M22 14 L26 9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M22.5 9 L26 9 L26 12.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
