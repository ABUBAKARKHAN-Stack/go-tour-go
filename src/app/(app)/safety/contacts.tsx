import { Pencil, Trash2, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton, IconButton } from '@/components/app-button';
import { Card, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/states';
import { useContactActions, useTrustedContacts } from '@/features/safety/api';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import type { TrustedContact } from '@/lib/types';
import { tx } from '@/lib/i18n';

export default function TrustedContactsScreen() {
  const contacts = useTrustedContacts();
  const actions = useContactActions();
  const [editing, setEditing] = useState<Partial<TrustedContact> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!editing) return;
    setError(null);
    actions.save.mutate(
      { id: editing.id, name: editing.name ?? '', phone: editing.phone ?? '', relationship: editing.relationship ?? '' },
      { onSuccess: () => setEditing(null), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <Screen back title={tx('Trusted contacts')} subtitle={tx('They receive your SOS via WhatsApp')} keyboard>
      {editing ? (
        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground">{editing.id ? tx('Edit contact') : tx('New contact')}</Text>
          {error ? <InlineError message={error} /> : null}
          <TextField label={tx('Name')} value={editing.name ?? ''} onChangeText={(name) => setEditing({ ...editing, name })} placeholder={tx('Ammi')} />
          <TextField
            label={tx('WhatsApp number')}
            value={editing.phone ?? ''}
            onChangeText={(phone) => setEditing({ ...editing, phone })}
            keyboardType="phone-pad"
            placeholder="+92 300 1234567"
            hint={tx('Include the country code. Local 03xx numbers are converted to +92.')}
          />
          <TextField label={tx('Relationship (optional)')} value={editing.relationship ?? ''} onChangeText={(relationship) => setEditing({ ...editing, relationship })} placeholder={tx('Mother, friend...')} />
          <View className="flex-row gap-2">
            <AppButton label={tx('Cancel')} variant="outline" onPress={() => setEditing(null)} className="flex-1" />
            <AppButton label={tx('Save')} variant="accent" loading={actions.save.isPending} onPress={save} className="flex-1" />
          </View>
        </Card>
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
              <Text className="text-base font-semibold text-foreground">{c.name}</Text>
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
