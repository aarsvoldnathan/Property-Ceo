import { Link } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../src/auth';
import { DueRow } from '../src/components/DueRow';
import { Tile } from '../src/components/Tile';
import { Button, SectionTitle } from '../src/components/ui';
import { getDueList, getRecentLogs } from '../src/maintenance';
import { useStore } from '../src/store';
import { colors, radius, spacing } from '../src/theme';
import { KIND_LABELS } from '../src/types';

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export default function Dashboard() {
  const { ready, properties, tasks, logs, refresh } = useStore();
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const now = new Date();
  const due = getDueList(properties, tasks, now);
  const overdue = due.filter((d) => d.status === 'overdue');
  const dueSoon = due.filter((d) => d.status === 'dueSoon');
  const recent = getRecentLogs(logs, now, 30);
  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? 'Unknown';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await refresh();
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={styles.tiles}>
        <Tile label="Properties" value={properties.length} color={colors.text} />
        <Tile label="Overdue" value={overdue.length} color={colors.danger} />
        <Tile label="Due soon" value={dueSoon.length} color={colors.warn} />
      </View>

      <View style={styles.section}>
        <SectionTitle>Properties</SectionTitle>
        {properties.length === 0 ? (
          <Empty text="No properties yet. Add your home or a rental to get started." />
        ) : (
          properties.map((p) => (
            <Link key={p.id} href={{ pathname: '/property/[id]', params: { id: p.id } }} asChild>
              <Pressable style={styles.propertyRow}>
                <Text style={styles.propertyName}>{p.name}</Text>
                <Text style={styles.propertyMeta}>
                  {KIND_LABELS[p.kind]}
                  {p.address ? ` · ${p.address}` : ''}
                </Text>
              </Pressable>
            </Link>
          ))
        )}
        <Link href="/property/new" asChild>
          <Pressable style={styles.addButton}>
            <Text style={styles.addText}>+ Add property</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.section}>
        <SectionTitle>Maintenance due</SectionTitle>
        {due.length === 0 ? (
          <Empty text="Nothing due. Everything is up to date." />
        ) : (
          due.map((d) => <DueRow key={d.task.id} item={d} />)
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle>Maintenance done (last 30 days)</SectionTitle>
        {recent.length === 0 ? (
          <Empty text="No services logged in the last 30 days." />
        ) : (
          recent.map((l) => (
            <View key={l.id} style={styles.logRow}>
              <Text style={styles.logTask}>{l.taskName}</Text>
              <Text style={styles.logMeta}>{propertyName(l.propertyId)}</Text>
              <Text style={styles.logMeta}>
                {l.performedBy ? `${l.performedBy} · ` : ''}
                {new Date(l.performedAt).toLocaleDateString()}
                {l.cost !== null ? ` · $${l.cost.toFixed(2)}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      <Button label="Sign out" kind="secondary" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.lg * 2 },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  empty: { color: colors.muted, fontSize: 15, paddingVertical: spacing.sm },
  propertyRow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
  },
  propertyName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  propertyMeta: { color: colors.muted, fontSize: 14, marginTop: 2 },
  addButton: {
    minHeight: 52,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  logRow: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderLeftColor: colors.ok,
    borderRadius: radius,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logTask: { color: colors.text, fontSize: 17, fontWeight: '700' },
  logMeta: { color: colors.muted, fontSize: 14, marginTop: 2 },
});
