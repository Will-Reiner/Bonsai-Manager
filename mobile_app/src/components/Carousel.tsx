import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ViewToken } from 'react-native';
import { theme } from '../constants/theme';

interface CarouselProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  autoPlayInterval?: number;
  keyExtractor: (item: T, index: number) => string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH - theme.spacing.md * 2;

function Carousel<T>({ data, renderItem, autoPlayInterval = 3000, keyExtractor }: CarouselProps<T>) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  useEffect(() => {
    if (data.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % data.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data.length, autoPlayInterval]);

  if (data.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => (
          <View style={{ width: ITEM_WIDTH, marginHorizontal: theme.spacing.md }}>
            {renderItem(item, index)}
          </View>
        )}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + theme.spacing.md * 2,
          offset: (ITEM_WIDTH + theme.spacing.md * 2) * index,
          index,
        })}
        snapToInterval={ITEM_WIDTH + theme.spacing.md * 2}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      {data.length > 1 && (
        <View style={styles.dotsContainer}>
          {data.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.lightGray,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default Carousel;
