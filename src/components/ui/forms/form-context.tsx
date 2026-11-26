"use client";
// Lets every Form* control find its own error and previous value by `name`,
// without passing props through server-rendered children.
// Provided by <ActionForm>; outside one, controls just use their props.
import { createContext, useContext } from "react";

export type FormStateContextValue = {
  /** Translated error for a field name, if the last submit failed on it. */
  errorFor: (name: string) => string | undefined;
  /** Value the user submitted last time (to refill after an error). */
  valueFor: (name: string) => string | undefined;
};

export const FormStateContext = createContext<FormStateContextValue | null>(null);

/** Error + previous value for a field. Explicit props on the control still win. */
export function useFieldState(name?: string) {
  const ctx = useContext(FormStateContext);
  if (!ctx || !name) return { error: undefined, value: undefined };
  return { error: ctx.errorFor(name), value: ctx.valueFor(name) };
}
