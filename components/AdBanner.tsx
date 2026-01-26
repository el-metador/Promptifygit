import React from 'react';
import { Ad } from '../types';
import { Button } from './Button';

interface AdBannerProps {
  ad: Ad;
}

export const AdBanner: React.FC<AdBannerProps> = ({ ad }) => {
  const handleClick = () => {
    if (ad.link) {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="my-6 relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800">
      <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 text-[8px] font-bold text-zinc-400 uppercase rounded backdrop-blur-sm z-10">
        Promoted
      </div>
      <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/3 h-32 sm:h-auto relative">
               <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent sm:bg-gradient-to-r" />
          </div>
          <div className="p-4 sm:w-2/3 flex flex-col justify-center">
            <h4 className="font-bold text-white text-lg leading-tight mb-1">{ad.title}</h4>
            <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{ad.description}</p>
            <Button variant="outline" size="sm" className="self-start" onClick={handleClick}>
              {ad.cta}
            </Button>
          </div>
      </div>
    </div>
  );
};
