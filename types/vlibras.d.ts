export {};

declare global {
  interface Window {
    VLibras?: {
      Widget: new (baseUrl: string) => unknown;
    };
  }
}

declare module 'react' {
  interface HTMLAttributes<T> {
    vw?: string | boolean;
    'vw-access-button'?: string | boolean;
    'vw-plugin-wrapper'?: string | boolean;
  }
}
