import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { TextField, type FieldProps } from '@/components/form';

type Props<T extends FieldValues> = Omit<FieldProps, 'value' | 'onChangeText' | 'error'> & {
  control: Control<T, any, any>;
  name: FieldPath<T>;
  /** Applied to each keystroke, e.g. lower-casing a username. */
  transform?: (text: string) => string;
  /** Called with the new value after each keystroke (for fields that drive other fields). */
  onValueChange?: (text: string) => void;
  /** Shown instead of the validation message, e.g. "username taken" from a server check. */
  errorOverride?: string | null;
};

/** TextField bound to a React Hook Form field; shows the field's validation message. */
export function FormTextField<T extends FieldValues>({ control, name, transform, onValueChange, errorOverride, onBlur, ...props }: Props<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <TextField
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChangeText={(text) => {
        const value = transform ? transform(text) : text;
        field.onChange(value);
        onValueChange?.(value);
      }}
      onBlur={(e) => {
        field.onBlur();
        onBlur?.(e);
      }}
      error={errorOverride ?? fieldState.error?.message ?? null}
    />
  );
}
