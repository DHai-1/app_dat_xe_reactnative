type MapboxRuntime = {
  setAccessToken: (token: string) => Promise<unknown>;
  setTelemetryEnabled: (enabled: boolean) => void;
};

export async function initializeMapbox(sdk: MapboxRuntime, token: string | undefined): Promise<boolean> {
  const publicToken = token?.trim();
  if (!publicToken || !/^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(publicToken)) return false;
  await sdk.setAccessToken(publicToken);
  sdk.setTelemetryEnabled(false);
  return true;
}
