import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { env } from '../config/env';
import { captureMessage } from './monitoring';

const formatMetric = (metric: Metric): Record<string, unknown> => ({
  id: metric.id,
  name: metric.name,
  value: metric.value,
  rating: metric.rating,
  delta: metric.delta,
  navigationType: metric.navigationType,
});

const reportMetric = (metric: Metric): void => {
  const payload = formatMetric(metric);

  if (env.IS_DEV) {
    console.info('[WebVitals]', payload);
    return;
  }

  captureMessage(`Web Vitals: ${metric.name}`, payload);
};

export const initWebVitals = (): void => {
  onCLS(reportMetric);
  onFCP(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
};
