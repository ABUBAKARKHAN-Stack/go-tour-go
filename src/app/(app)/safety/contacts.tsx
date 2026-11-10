import { Pencil, Trash2, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton, IconButton } from '@/components/app-button';
import { Card } from '@/components/form';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/states';
import { useContactActions, useTrustedContacts } from '@/features/safety/api';
import { contactSchema } from '@/features/safety/schemas';
import { serverError, useZodForm } from '@/lib/forms';
import { colors } from '@/lib/theme';
import type { TrustedContact } from '@/lib/types';
import { tx } from '@/lib/i18n';

export default function TrustedContactsScreen() {
  const contacts = useTrustedContacts();
  const actions = useContactActions();
  const [editing, setEditing] = useState<Partial<TrustedContact> | null>(null);

  return (
    <Screen back title={tx('Trusted contacts')} subtitle={tx('They receive your SOS via WhatsApp')} keyboard>
      {editing ? (
        <ContactForm key={editing.id ?? 'new'} contact={editing} saving={actions.save.isPending} onSave={actions.save.mutate} onClose={() => setEditing(null)} />
      ) : (
        <AppButton label={tx('Add trusted contact')} icon={UserPlus} variant="accent" onPress={() => setEditing({})} />
      )}

      {contacts.isLoading ? (
        <LoadingState />
      ) : contacts.isError ? (
        <ErrorState error={contacts.error} onRetry={contacts.refetch} />
      ) : (contacts.data ?? []).length === 0 ? (
        <EmptyState icon={Users} title={tx('No trusted contacts')} message={tx('Add at least one person who should hear from you in an emergency.')} />
      ) : (
        contacts.data!.map((c) => (
          <Card key={c.id} className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-base font-semibold text-heading">{c.name}</Text>
              <Text className="text-sm text-muted-foreground">
                {c.phone}
                {c.relationship ? ` · ${c.relationship}` : ''}
              </Text>
            </View>
            <IconButton icon={Pencil} label={tx('Edit {0}', { 0: c.name })} onPress={() => setEditing(c)} />
            <IconButton
              icon={Trash2}
              label={tx('Delete {0}', { 0: c.name })}
              onPress={() =>
                Alert.alert(tx('Remove {0}?', { 0: c.name }), undefined, [
                  { text: tx('Cancel'), style: 'cancel' },
                  { text: tx('Remove'), style: 'destructive', onPress: () => actions.remove.mutate(c.id) },
                ])
              }
            />
          </Card>
        ))
      )}
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
        {tx('Contacts are private to your account and never shown to other users.')}
      </Text>
    </Screen>
  );
}

type SaveContact = ReturnType<typeof useContactActions>['save']['mutate'];

function ContactForm({ contact, saving, onSave, onClose }: { contact: Partial<TrustedContact>; saving: boolean; onSave: SaveContact; onClose: () => void }) {
  const { control, handleSubmit, setError, setFocus, formState } = useZodForm(contactSchema, {
    defaultValues: { name: contact.name ?? '', phone: contact.phone ?? '', relationship: contact.relationship ?? '' },
  });

  const save = handleSubmit((v) => onSave({ id: contact.id, ...v }, { onSuccess: onClose, onError: (e) => setError('root', serverError(e)) }));

  return (
    <Card className="gap-3">
      <Text className="text-base font-semibold text-heading">{contact.id ? tx('Edit contact') : tx('New contact')}</Text>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <FormTextField control={control} name="name" label={tx('Name')} placeholder={tx('Ammi')} returnKeyType="next" onSubmitEditing={() => setFocus('phone')} />
      <FormTextField
        control={control}
        name="phone"
        label={tx('WhatsApp number')}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="+92 300 1234567"
        hint={tx('Include the country code. Local 03xx numbers are converted to +92.')}
      />
      <FormTextField control={control} name="relationship" label={tx('Relationship (optional)')} placeholder={tx('Mother, friend...')} />
      <View className="flex-row gap-2">
        <AppButton label={tx('Cancel')} variant="outline" onPress={onClose} className="flex-1" />
        <AppButton label={tx('Save')} variant="accent" loading={saving} onPress={save} className="flex-1" />
      </View>
    </Card>
  );
}
