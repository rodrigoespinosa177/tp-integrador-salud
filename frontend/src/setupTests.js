import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Después de cada test, limpia lo que se renderizó
afterEach(() => cleanup());
