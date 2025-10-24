import * as React from "react"
import { View, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { ArrowLeft, ArrowRight } from "lucide-react-native"

import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button"

type CarouselApi = {
  scrollTo: (index: number) => void
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

type CarouselOptions = {
  align?: "start" | "center" | "end"
  loop?: boolean
}

type CarouselProps = {
  opts?: CarouselOptions
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
  children: React.ReactNode
  className?: string
}

type CarouselContextProps = {
  currentIndex: number
  totalSlides: number
  scrollTo: (index: number) => void
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  View,
  React.ComponentProps<typeof View> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [totalSlides, setTotalSlides] = React.useState(0)
    const scrollViewRef = React.useRef<ScrollView>(null)
    const { width: screenWidth } = Dimensions.get('window')

    const canScrollPrev = currentIndex > 0
    const canScrollNext = currentIndex < totalSlides - 1

    const scrollTo = React.useCallback((index: number) => {
      if (scrollViewRef.current) {
        const offset = index * screenWidth
        scrollViewRef.current.scrollTo({ x: offset, animated: true })
        setCurrentIndex(index)
      }
    }, [screenWidth])

    const scrollPrev = React.useCallback(() => {
      if (canScrollPrev) {
        scrollTo(currentIndex - 1)
      }
    }, [canScrollPrev, currentIndex, scrollTo])

    const scrollNext = React.useCallback(() => {
      if (canScrollNext) {
        scrollTo(currentIndex + 1)
      }
    }, [canScrollNext, currentIndex, scrollTo])

    const handleScroll = React.useCallback((event: any) => {
      const offset = event.nativeEvent.contentOffset.x
      const index = Math.round(offset / screenWidth)
      setCurrentIndex(index)
    }, [screenWidth])

    const contextValue: CarouselContextProps = {
      currentIndex,
      totalSlides,
      scrollTo,
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
      orientation,
      opts,
      children,
      className,
    }

    React.useEffect(() => {
      const childrenArray = React.Children.toArray(children)
      setTotalSlides(childrenArray.length)
    }, [children])

    React.useEffect(() => {
      if (setApi) {
        setApi({
          scrollTo,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        })
      }
    }, [scrollTo, scrollPrev, scrollNext, canScrollPrev, canScrollNext, setApi])

    return (
      <CarouselContext.Provider value={contextValue}>
        <View
          ref={ref}
          className={cn("relative", className)}
          {...props}
        >
          <ScrollView
            ref={scrollViewRef}
            horizontal={orientation === "horizontal"}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            pagingEnabled
            onScroll={handleScroll}
            scrollEventThrottle={16}
            className="w-full"
          >
            {React.Children.map(children, (child, index) => (
              <View 
                key={index} 
                className="flex-1"
                style={{ width: screenWidth }}
              >
                {child}
              </View>
            ))}
          </ScrollView>
        </View>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <View
      ref={ref}
      className={cn(
        "flex",
        orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
        className
      )}
      {...props}
    />
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  View,
  React.ComponentProps<typeof View>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <View
      ref={ref}
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  TouchableOpacity,
  React.ComponentProps<typeof TouchableOpacity>
>(({ className, ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <TouchableOpacity
      ref={ref}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
        orientation === "horizontal" ? "-left-12" : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      onPress={scrollPrev}
      disabled={!canScrollPrev}
      activeOpacity={0.7}
      {...props}
    >
      <ArrowLeft size={16} color="#6b7280" />
    </TouchableOpacity>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  TouchableOpacity,
  React.ComponentProps<typeof TouchableOpacity>
>(({ className, ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <TouchableOpacity
      ref={ref}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
        orientation === "horizontal" ? "-right-12" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      onPress={scrollNext}
      disabled={!canScrollNext}
      activeOpacity={0.7}
      {...props}
    >
      <ArrowRight size={16} color="#6b7280" />
    </TouchableOpacity>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
