// components/ui/carousel.tsx
"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import type { EmblaOptionsType, EmblaPluginType } from "embla-carousel";
import { ArrowLeft, ArrowRight } from "@/utils/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Types pour le contexte Carousel
 */
interface CarouselContextType {
  carouselRef: (emblaRoot: HTMLElement | null) => void;
  api: UseEmblaCarouselType[1] | undefined;
  opts: EmblaOptionsType | undefined;
  orientation: "horizontal" | "vertical";
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

/**
 * Props pour le composant Carousel principal
 */
interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation du carousel */
  orientation?: "horizontal" | "vertical";
  /** Options Embla Carousel */
  opts?: EmblaOptionsType;
  /** Callback pour définir l'API Embla */
  setApi?: (api: UseEmblaCarouselType[1]) => void;
  /** Plugins Embla */
  plugins?: EmblaPluginType[];
}

/**
 * Props pour les sous-composants
 */
interface CarouselContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CarouselPreviousProps extends React.ComponentProps<typeof Button> {
  variant?:
    | "outline"
    | "default"
    | "destructive"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}
interface CarouselNextProps extends React.ComponentProps<typeof Button> {
  variant?:
    | "outline"
    | "default"
    | "destructive"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Context pour partager l'état du carousel
 */
const CarouselContext = React.createContext<CarouselContextType | null>(null);

/**
 * Hook pour accéder au contexte du carousel
 *
 * @throws {Error} Si utilisé en dehors d'un composant Carousel
 */
function useCarousel(): CarouselContextType {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

/**
 * Composant Carousel principal avec gestion d'état et navigation clavier
 *
 * @example
 * ```tsx
 * <Carousel className="w-full max-w-lg" opts={{ loop: true }}>
 *   <CarouselContent>
 *     <CarouselItem>
 *       <div className="p-1">Slide 1</div>
 *     </CarouselItem>
 *     <CarouselItem>
 *       <div className="p-1">Slide 2</div>
 *     </CarouselItem>
 *   </CarouselContent>
 *   <CarouselPrevious />
 *   <CarouselNext />
 * </Carousel>
 * ```
 */
const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    );

    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    /**
     * Callback pour mettre à jour l'état des boutons de navigation
     */
    const onSelect = React.useCallback((api: UseEmblaCarouselType[1]) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    }, []);

    /**
     * Naviguer vers la slide précédente
     */
    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    /**
     * Naviguer vers la slide suivante
     */
    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    /**
     * Gestion de la navigation clavier
     */
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          if (orientation === "horizontal") {
            scrollPrev();
          }
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          if (orientation === "horizontal") {
            scrollNext();
          }
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          if (orientation === "vertical") {
            scrollPrev();
          }
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          if (orientation === "vertical") {
            scrollNext();
          }
        }
      },
      [scrollPrev, scrollNext, orientation]
    );

    /**
     * Effet pour définir l'API si un callback est fourni
     */
    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    /**
     * Effet pour configurer les listeners d'événements
     */
    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api?.off("select", onSelect);
        api?.off("reInit", onSelect);
      };
    }, [api, onSelect]);

    /**
     * Valeur du contexte
     */
    const contextValue: CarouselContextType = {
      carouselRef,
      api,
      opts,
      orientation:
        orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    };

    return (
      <CarouselContext.Provider value={contextValue}>
        <div
          ref={ref}
          onKeyDown={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          aria-label="Carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

/**
 * Conteneur pour les éléments du carousel
 */
const CarouselContent = React.forwardRef<HTMLDivElement, CarouselContentProps>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn(
            "flex",
            orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CarouselContent.displayName = "CarouselContent";

/**
 * Élément individuel du carousel
 */
const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full",
          orientation === "horizontal" ? "pl-4" : "pt-4",
          className
        )}
        {...props}
      />
    );
  }
);
CarouselItem.displayName = "CarouselItem";

/**
 * Bouton de navigation précédent
 */
const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  CarouselPreviousProps
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      aria-label="Previous slide"
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

/**
 * Bouton de navigation suivant
 */
const CarouselNext = React.forwardRef<HTMLButtonElement, CarouselNextProps>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-right-12 top-1/2 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
          className
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        aria-label="Next slide"
        {...props}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  }
);
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
};

export type {
  CarouselProps,
  CarouselContentProps,
  CarouselItemProps,
  CarouselPreviousProps,
  CarouselNextProps,
  CarouselContextType,
};
