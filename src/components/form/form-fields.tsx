import type { Ref } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { PasswordField, TextField, type TextFieldProps, type TextInputRef } from '@/components/ui/text-field';

/** Props shared by the form-bound fields: the form's control, the field name and the input's own props. */
type FormFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'> & {
  control: Control<T>;
  name: Path<T>;
  ref?: Ref<TextInputRef>;
};

/**
 * TextField bound to react-hook-form. Validation messages are translation keys (see features/auth/schemas.ts), so
 * the error is translated here.
 */
export function FormTextField<T extends FieldValues>({ control, name, ref, ...props }: FormFieldProps<T>) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          ref={ref}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message && t(fieldState.error.message)}
          {...props}
        />
      )}
    />
  );
}

/** PasswordField (lock icon, show/hide toggle) bound to react-hook-form. */
export function FormPasswordField<T extends FieldValues>({
  control,
  name,
  ref,
  ...props
}: Omit<FormFieldProps<T>, 'secureTextEntry' | 'trailing'>) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PasswordField
          ref={ref}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message && t(fieldState.error.message)}
          {...props}
        />
      )}
    />
  );
}
