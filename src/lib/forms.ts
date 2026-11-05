import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldValues, type Resolver, type UseFormProps } from 'react-hook-form';
import type { z } from 'zod';

import { errorMessage } from '@/lib/errors';

type Schema = z.ZodType<FieldValues, FieldValues>;

/**
 * React Hook Form with a Zod schema. Fields are validated when they lose
 * focus and then on every change, so errors appear once the traveller has
 * had a go and disappear as soon as the value is fixed. Submitted values are
 * the schema's parsed output (trimmed, lower-cased and so on).
 */
export function useZodForm<S extends Schema>(schema: S, options?: Omit<UseFormProps<z.input<S>, unknown, z.output<S>>, 'resolver'>) {
  // zodResolver infers types from a concrete schema; through this generic the cast restores them.
  const resolver = zodResolver(schema) as unknown as Resolver<z.input<S>, unknown, z.output<S>>;
  return useForm<z.input<S>, unknown, z.output<S>>({ mode: 'onTouched', ...options, resolver });
}

/** Message for the form-level error (shown above the fields) from a failed request. */
export function serverError(error: unknown, fallback?: string) {
  return { type: 'server', message: errorMessage(error, fallback) };
}
