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
// studio on 3123, the studio's Render button on 3124, command-line renders on 3125.
Config.setStudioPort(3123);
// The studio keeps its render server open, so command-line renders use their own port.
Config.setRendererPort(process.argv.includes("studio") ? 3124 : 3125);
