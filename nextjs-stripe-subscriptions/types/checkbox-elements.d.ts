// JSX typing for the Checkbox Elements web component (https://checkbox.site/docs/elements).
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type CheckboxDisclosureAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  'publishable-key'?: string;
  'merchant-name'?: string;
  amount?: string;
  currency?: string;
  interval?: string;
  'trial-days'?: string;
  'cancel-url'?: string;
  'cancel-timing'?: 'period_end' | 'immediately';
  'customer-reference'?: string;
  'record-consent'?: 'submit' | 'change' | 'manual';
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'checkbox-disclosure': CheckboxDisclosureAttributes;
    }
  }
}
