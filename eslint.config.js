import raycastConfig from "@raycast/eslint-config";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig([...raycastConfig, reactHooks.configs.flat.recommended]);
