import React from 'react';
import { Home } from 'lucide-react';
import { Button } from './Button';

interface NotFoundProps {
    onHome: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onHome }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <h1 className="text-[120px] font-black text-zinc-900 leading-none select-none">404</h1>
      <div className="-mt-12 mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Page Not Found</h2>
        <p className="text-zinc-500 max-w-xs mx-auto">
          The prompt you are looking for has been deleted or never existed in this timeline.
        </p>
      </div>
      <Button onClick={onHome} variant="primary">
        <Home className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
    </div>
  );
};