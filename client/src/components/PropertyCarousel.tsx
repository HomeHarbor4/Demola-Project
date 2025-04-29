import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Property } from '@shared/schema';
import PropertyCard from './PropertyCard';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './styles/PropertyCarousel.css';

interface PropertyCarouselProps {
  properties: Property[];
  onOpenModal?: (property: Property) => void;
}

export default function PropertyCarousel({ properties, onOpenModal }: PropertyCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    loop: true,
    dragFree: false,
    slidesToScroll: 2,
    containScroll: 'trimSnaps' 
  });
  
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true);
  
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    // Since we have loop enabled, we always want to show navigation buttons
    setPrevBtnEnabled(true);
    setNextBtnEnabled(true);
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    onSelect();
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);
  
  // If no properties, don't render
  if (!properties?.length) return null;

  return (
    <div className="relative embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {properties.map((property) => (
            <div 
              key={property.id} 
              className="embla__slide min-w-0"
            >
              <PropertyCard 
                property={property} 
                onOpenModal={onOpenModal} 
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute inset-y-0 left-4 flex items-center z-10">
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md ${
            !prevBtnEnabled ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          onClick={scrollPrev}
          disabled={!prevBtnEnabled}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute inset-y-0 right-4 flex items-center z-10">
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md ${
            !nextBtnEnabled ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          onClick={scrollNext}
          disabled={!nextBtnEnabled}
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}