import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import DiagnosticMCQ from './DiagnosticMCQ';
import MicroTeachThenCheck from './MicroTeachThenCheck';
import DrillSet from './DrillSet';
import AppliedFreeResponse from './AppliedFreeResponse';
import ErrorReversal from './ErrorReversal';
import { COLORS } from '@/components/theme/colors';

/**
 * Routes to the correct unit component based on unit_type
 *
 * Unit types:
 * - diagnostic_mcq: Multiple choice diagnostic question
 * - micro_teach_then_check: Short teach followed by check question
 * - drill_set: Repetitive practice drills
 * - applied_free_response: Open-ended applied question
 * - error_reversal: Fixes misconceptions by showing errors to identify
 */

const UNIT_COMPONENTS = {
  diagnostic_mcq: DiagnosticMCQ,
  micro_teach_then_check: MicroTeachThenCheck,
  drill_set: DrillSet,
  applied_free_response: AppliedFreeResponse,
  error_reversal: ErrorReversal,
};

export default function UnitRouter({ unit, onSubmit, loading }) {
  if (!unit) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading unit...</Text>
      </View>
    );
  }

  const unitType = unit.unit_type || unit.type;
  const UnitComponent = UNIT_COMPONENTS[unitType];

  if (!UnitComponent) {
    // Fallback for unknown unit types - try to render as MCQ
    console.warn(`Unknown unit type: ${unitType}, falling back to DiagnosticMCQ`);
    return (
      <DiagnosticMCQ
        unit={unit}
        onSubmit={onSubmit}
        loading={loading}
      />
    );
  }

  return (
    <UnitComponent
      unit={unit}
      onSubmit={onSubmit}
      loading={loading}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
});
