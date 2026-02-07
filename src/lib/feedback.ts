import { env } from '../config/env';

export const getFeedbackUrl = (): string => env.FEEDBACK_URL;

export const openFeedback = (): void => {
  const url = getFeedbackUrl();
  window.open(url, '_blank', 'noopener,noreferrer');
};
