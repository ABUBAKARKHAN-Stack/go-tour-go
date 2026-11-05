import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { TextField, type FieldProps } from '@/components/form';

type Props<T extends FieldValues> = Omit<FieldProps, 'value' | 'onChangeText' | 'error'> & {
  control: Control<T, any, any>;
  name: FieldPath<T>;
  /** Applied to each keystroke, e.g. lower-casing a username. */
  transform?: (text: string) => string;
};

/** TextField bound to a React Hook Form field; shows the field's validation message. */
export function FormTextField<T extends FieldValues>({ control, name, transform, onBlur, ...props }: Props<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <TextField
      {...props}
      value={(field.value as string | null | undefined) ?? ''}
      onChangeText={(text) => field.onChange(transform ? transform(text) : text)}
      onBlur={(e) => {
        field.onBlur();
        onBlur?.(e);
      }}
      error={fieldState.error?.message ?? null}
    />
  );
}
