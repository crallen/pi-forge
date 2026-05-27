import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { BorderedLoader } from "@earendil-works/pi-coding-agent";
import { runSubagent, type RunSubagentOptions, type SubagentResult } from "./runner.js";

/**
 * Run a subagent with a full-screen `BorderedLoader` in the main activity area.
 *
 * In interactive sessions the loader replaces the activity area for the duration
 * of the subagent run so the user can see that work is happening and press Escape
 * to cancel. Returns `null` when the user cancels or the session is aborted.
 *
 * In non-interactive (`!ctx.hasUI`) sessions this falls back to a plain
 * `runSubagent` call and never returns `null`.
 */
export async function runSubagentInMainArea(
  ctx: Pick<ExtensionCommandContext, "hasUI" | "ui" | "signal">,
  options: Omit<RunSubagentOptions, "signal">,
  label: string,
): Promise<SubagentResult | null> {
  if (!ctx.hasUI) {
    return runSubagent({ ...options, signal: ctx.signal });
  }

  return ctx.ui.custom<SubagentResult | null>((tui, theme, _kb, done) => {
    const loader = new BorderedLoader(tui, theme, label);
    loader.onAbort = () => done(null);

    const signal =
      ctx.signal ? AbortSignal.any([loader.signal, ctx.signal]) : loader.signal;

    runSubagent({ ...options, signal })
      .then((result) => done(result))
      .catch(() => done(null));

    return loader;
  });
}
