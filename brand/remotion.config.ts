/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);

// The Al-Bayan website dev server uses port 3000. Keep Remotion off it:
// studio on 3123, render server (CLI renders and the studio's Render button) on 3124.
Config.setStudioPort(3123);
Config.setRendererPort(3124);
